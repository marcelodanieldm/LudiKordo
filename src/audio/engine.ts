/**
 * Audio de baja latencia con react-native-audio-api (API estilo Web Audio):
 * metrónomo con tiempos programados y tonos de referencia para el oído.
 */
import { AudioContext } from 'react-native-audio-api';
import { IS_GUITAR } from '../instruments/current';
import { peakGain, ringSec, voiceFor, type Tone, type Voice } from '../music/timbre';
import type { DrumHit } from '../music/drums';

let ctx: AudioContext | null = null;
function context(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  // Algunos Android crean el contexto suspendido hasta el primer gesto: lo despertamos.
  // `resume` no está en todas las versiones de los tipos de react-native-audio-api.
  const c = ctx as AudioContext & { state?: string; resume?: () => Promise<void> };
  if (c.state === 'suspended') void c.resume?.().catch(() => undefined);
  return ctx;
}

/**
 * El parlante de un teléfono casi no reproduce las notas del bajo (41–98 Hz al aire).
 * Los tonos sueltos del bajo suenan una octava arriba, igual que los ejemplos
 * (src/music/listen.ts), con un timbre con armónicos que el parlante sí reproduce.
 */
const BASS_TONE_UP = 2;

/** Tiempo actual del reloj de audio, en ms. Sirve para medir ataques. */
export function nowMs(): number {
  return context().currentTime * 1000;
}

function click(at: number, accent: boolean) {
  const c = context();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.frequency.value = accent ? 1600 : 1000;
  gain.gain.setValueAtTime(0.6, at);
  gain.gain.exponentialRampToValueAtTime(0.001, at + 0.05);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(at);
  osc.stop(at + 0.06);
}

export interface MetronomeHandle {
  /** Momento (ms, reloj de audio) del primer pulso después de la cuenta. */
  startMs: number;
  stop: () => void;
}

/**
 * Programa los clics del metrónomo por adelantado (evita el jitter de los timers
 * de JavaScript). La cuenta (`countIn`) siempre suena; de los `beats` siguientes
 * solo suenan los primeros `audibleBeats` (por defecto todos), para entrenar el
 * pulso interno.
 */
export function startMetronome(bpm: number, beats: number, countIn = 4, beatsPerBar = 4, audibleBeats = beats): MetronomeHandle {
  const c = context();
  const step = 60 / bpm;
  const t0 = c.currentTime + 0.15;
  const total = countIn + Math.min(beats, audibleBeats);
  for (let i = 0; i < total; i++) click(t0 + i * step, i % beatsPerBar === 0);
  let stopped = false;
  return {
    startMs: (t0 + countIn * step) * 1000,
    stop: () => {
      if (stopped) return;
      stopped = true;
      // Cerrar y recrear el contexto corta los clics ya programados.
      void c.close();
      if (ctx === c) ctx = null;
    },
  };
}

/**
 * Programa una nota con un timbre (src/music/timbre.ts): un oscilador por
 * parcial, todos por la misma envolvente. Devuelve cuánto suena, en segundos.
 */
/** Bend y vibrato de una nota de ejemplo. */
interface PitchMod {
  bendCents?: number;
  vibratoCents?: number;
  /** Desafinación fija (la copia del chorus). */
  detuneCents?: number;
}

/** Velocidad del vibrato de los ejemplos (oscilaciones por segundo). */
const VIBRATO_HZ = 5.5;

function scheduleVoice(c: AudioContext, freq: number, at: number, durSec: number, voice: Voice, level = 1, mod: PitchMod = {}): number {
  const ring = ringSec(voice, durSec);
  const gain = c.createGain();
  // Normalizado: la suma de parciales nunca pasa de ~0,5, como el tono de siempre.
  const peak = (0.5 / Math.max(0.5, peakGain(voice))) * peakGain(voice) * level;
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(peak, at + voice.attack);
  if (voice.envelope === 'sustain') {
    // Baja suave al nivel de sostenido, se mantiene y recién al final se apaga (sin escalones que hagan clic).
    const level = peak * Math.max(0.05, voice.sustain);
    const settle = Math.min(at + voice.attack + 0.05, at + ring * 0.7);
    gain.gain.linearRampToValueAtTime(level, settle);
    gain.gain.setValueAtTime(level, Math.max(settle, at + ring * 0.7));
  }
  gain.gain.exponentialRampToValueAtTime(0.001, at + ring);
  gain.connect(c.destination);
  const total = peakGain(voice);
  for (const p of voice.partials) {
    const osc = c.createOscillator();
    const pg = c.createGain();
    osc.type = p.type;
    // Desafinación aplicada a la frecuencia (no todas las versiones exponen `detune`).
    const f = freq * Math.pow(2, (p.detune + (mod.detuneCents ?? 0)) / 1200);
    osc.frequency.value = f;
    // Bend: sube en el primer tercio y se sostiene. Vibrato: oscila desde la mitad.
    const bentF = mod.bendCents ? f * Math.pow(2, mod.bendCents / 1200) : f;
    if (mod.bendCents) {
      osc.frequency.setValueAtTime(f, at + Math.min(0.08, ring * 0.15));
      osc.frequency.linearRampToValueAtTime(bentF, at + ring * 0.35);
    }
    if (mod.vibratoCents) {
      const from = at + ring * 0.4;
      const step = 1 / VIBRATO_HZ / 2;
      osc.frequency.setValueAtTime(bentF, from);
      for (let t = from + step, k = 0; t < at + ring; t += step, k++) {
        osc.frequency.linearRampToValueAtTime(bentF * Math.pow(2, ((k % 2 === 0 ? 1 : -1) * mod.vibratoCents) / 1200), t);
      }
    }
    pg.gain.value = p.gain / total;
    osc.connect(pg);
    pg.connect(gain);
    osc.start(at);
    osc.stop(at + ring + 0.02);
  }
  return ring;
}

/** Toca un tono de referencia (oído, afinación). En guitarra, con timbre de eléctrica limpia. */
export function playTone(freq: number, durationSec = 1.2, delaySec = 0, tone?: Tone): Promise<void> {
  const c = context();
  const at = c.currentTime + 0.05 + delaySec;
  scheduleVoice(c, IS_GUITAR ? freq : freq * BASS_TONE_UP, at, durationSec, tone || IS_GUITAR ? voiceFor(tone, IS_GUITAR) : voiceFor(undefined, false));
  return new Promise((resolve) => setTimeout(resolve, (0.05 + delaySec + durationSec) * 1000));
}


/** Toca varios tonos en secuencia, con una pausa corta entre ellos (y el timbre de cada uno, si se indica). */
export async function playTones(freqs: number[], timbres?: Tone[]): Promise<void> {
  for (let i = 0; i < freqs.length; i++) await playTone(freqs[i], 1, 0.15, timbres?.[i]);
}

export interface SequenceHandle {
  stop: () => void;
  /** Momento (ms, reloj de audio) en que empieza a sonar el ejemplo: el 0 de `startSec`. */
  startMs: number;
}

/**
 * Toca un ejemplo sonoro ya calculado (src/music/listen.ts), con clic opcional.
 * Todo queda programado en el reloj de audio; `stop` lo corta de inmediato.
 */
let activeSequence: { stop: () => void; onInterrupt?: () => void } | null = null;

/** Corta el ejemplo sonoro que esté sonando, si hay uno (por ejemplo, al empezar una toma). */
export function stopActiveSequence(): void {
  if (!activeSequence) return;
  const prev = activeSequence;
  activeSequence = null;
  prev.stop();
  prev.onInterrupt?.();
}

export function playSequence(
  notes: { freq: number; startSec: number; durSec: number; tone?: Tone; bendCents?: number; vibratoCents?: number; detuneCents?: number; level?: number }[],
  clickBeats?: { bpm: number; beats: number },
  /** Se llama si otro ejemplo empieza y corta a este. */
  onInterrupt?: () => void,
  /** Timbre (guitarra: limpio, crunch…). Por defecto, el del instrumento. */
  tone?: Tone,
): SequenceHandle {
  // Un solo ejemplo a la vez: el anterior se corta y se entera.
  stopActiveSequence();
  const c = context();
  const t0 = c.currentTime + 0.15;
  if (clickBeats) {
    const step = 60 / clickBeats.bpm;
    for (let i = 0; i < clickBeats.beats; i++) click(t0 + i * step, i % 4 === 0);
  }
  const voice = voiceFor(tone, IS_GUITAR);
  // Una nota puede traer su propio timbre (corcheas apagadas dentro de un riff con crunch).
  // Ecos, reverb y pista de acompañamiento traen su propio volumen (`level`).
  for (const n of notes) scheduleVoice(c, n.freq, t0 + n.startSec, n.durSec, n.tone ? voiceFor(n.tone, IS_GUITAR) : voice, n.level ?? 1, n);
  let stopped = false;
  const handle = {
    onInterrupt,
    stop: () => {
      if (stopped) return;
      stopped = true;
      if (activeSequence === handle) activeSequence = null;
      // Igual que el metrónomo: cerrar su propio contexto corta lo ya programado.
      void c.close();
      if (ctx === c) ctx = null;
    },
  };
  activeSequence = handle;
  return { stop: handle.stop, startMs: t0 * 1000 };
}

// ───────────── Acompañamiento de la práctica ─────────────

/** Frecuencias metálicas (las de las cajas de ritmo clásicas, más agudas) para hi-hat, ride y el chasquido de la caja. */
const METAL_HZ = [1642, 2435, 2957, 4182, 4320, 6400];

type OscillatorKind = 'sine' | 'square' | 'triangle' | 'sawtooth';

function hitGain(c: AudioContext, at: number, peak: number, decay: number) {
  const g = c.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(peak, at + 0.002);
  g.gain.exponentialRampToValueAtTime(0.001, at + decay);
  g.connect(c.destination);
  return g;
}

/** Oscilador conectado directo al volumen del golpe (sin un nodo de volumen propio). */
function osc(c: AudioContext, type: OscillatorKind, freq: number, at: number, dur: number, out: ReturnType<AudioContext['createGain']>) {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  o.connect(out);
  o.start(at);
  o.stop(at + dur + 0.02);
  return o;
}

/** Un golpe de batería, solo con osciladores (no hace falta ruido ni filtros). */
function scheduleDrum(c: AudioContext, kind: DrumHit['kind'], at: number, level: number) {
  if (kind === 'kick') {
    // Seno que cae de 150 a 45 Hz: el «bum».
    const out = hitGain(c, at, 0.9 * level, 0.35);
    const o = osc(c, 'sine', 150, at, 0.35, out);
    o.frequency.setValueAtTime(150, at);
    o.frequency.exponentialRampToValueAtTime(45, at + 0.12);
    return;
  }
  if (kind === 'snare') {
    // Cuerpo (dos tonos) más chasquido metálico corto.
    const body = hitGain(c, at, 0.3 * level, 0.12);
    osc(c, 'triangle', 185, at, 0.12, body);
    osc(c, 'triangle', 330, at, 0.12, body);
    const snap = hitGain(c, at, (0.12 * level) / METAL_HZ.length, 0.16);
    for (const f of METAL_HZ) osc(c, 'square', f * 0.9, at, 0.16, snap);
    return;
  }
  if (kind === 'rim') {
    // Aro: un «toc» corto y agudo.
    const out = hitGain(c, at, 0.35 * level, 0.04);
    osc(c, 'triangle', 1700, at, 0.04, out);
    osc(c, 'square', 820, at, 0.04, out);
    return;
  }
  const decay = kind === 'hat' ? 0.05 : 0.45;
  const out = hitGain(c, at, ((kind === 'hat' ? 0.09 : 0.06) * level) / METAL_HZ.length, decay);
  for (const f of METAL_HZ) osc(c, 'square', kind === 'ride' ? f * 1.4 : f * 2, at, decay, out);
}

export interface JamHandle {
  /** Momento (ms, reloj de audio) del primer pulso después de la cuenta. */
  startMs: number;
  stop: () => void;
}

/** Cuánto se programa por adelantado: lo justo para no cortarse, sin crear miles de nodos de golpe. */
const JAM_HORIZON_SEC = 2;
const JAM_REFILL_MS = 400;

/**
 * Toca el acompañamiento de la práctica (src/music/jam.ts) con su cuenta previa:
 * clics en la cuenta y, si no hay batería, también durante la música para no
 * perder el pulso. Corta cualquier ejemplo que esté sonando. Programa de a dos
 * segundos (un timer rellena), así una toma larga no crea miles de nodos al empezar
 * ni desfasa el arranque.
 */
export function startJam(jam: { notes: { freq: number; startSec: number; durSec: number; tone?: Tone; level?: number }[]; drums: DrumHit[]; bpm: number; countIn: number; bodyBeats: number }): JamHandle {
  stopActiveSequence();
  const c = context();
  const t0 = c.currentTime + 0.25;
  const step = 60 / jam.bpm;
  const voice = voiceFor(undefined, IS_GUITAR);
  const clicks = jam.countIn + (jam.drums.length ? 0 : jam.bodyBeats);
  type Ev = { at: number; play: () => void };
  const events: Ev[] = [
    ...Array.from({ length: clicks }, (_, i) => ({ at: i * step, play: () => click(t0 + i * step, i % 4 === 0) })),
    ...jam.notes.map((n) => ({ at: n.startSec, play: () => void scheduleVoice(c, n.freq, t0 + n.startSec, n.durSec, n.tone ? voiceFor(n.tone, IS_GUITAR) : voice, n.level ?? 1) })),
    ...jam.drums.map((d) => ({ at: d.startSec, play: () => scheduleDrum(c, d.kind, t0 + d.startSec, d.level) })),
  ].sort((a, b) => a.at - b.at);
  let next = 0;
  const fill = () => {
    try {
      const horizon = c.currentTime - t0 + JAM_HORIZON_SEC;
      while (next < events.length && events[next].at <= horizon) events[next++].play();
    } catch {
      // El contexto se cerró desde otro lado (otro sonido de la app): no queda nada por programar.
      next = events.length;
    }
  };
  fill();
  const timer = setInterval(() => {
    fill();
    if (next >= events.length) clearInterval(timer);
  }, JAM_REFILL_MS);
  let stopped = false;
  return {
    startMs: (t0 + jam.countIn * step) * 1000,
    stop: () => {
      if (stopped) return;
      stopped = true;
      clearInterval(timer);
      // Cerrar el contexto corta lo ya programado; si otro ya lo cerró, no pasa nada.
      Promise.resolve(c.close()).catch(() => undefined);
      if (ctx === c) ctx = null;
    },
  };
}
