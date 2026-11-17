/**
 * Audio de baja latencia con react-native-audio-api (API estilo Web Audio):
 * metrónomo con tiempos programados y tonos de referencia para el oído.
 */
import { AudioContext } from 'react-native-audio-api';

let ctx: AudioContext | null = null;
function context(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

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

/** Toca un tono suave de referencia (oído, afinación). */
export function playTone(freq: number, durationSec = 1.2, delaySec = 0): Promise<void> {
  const c = context();
  const at = c.currentTime + 0.05 + delaySec;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(0.5, at + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, at + durationSec);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(at);
  osc.stop(at + durationSec);
  return new Promise((resolve) => setTimeout(resolve, (0.05 + delaySec + durationSec) * 1000));
}

/** Toca varios tonos en secuencia, con una pausa corta entre ellos. */
export async function playTones(freqs: number[]): Promise<void> {
  for (const f of freqs) await playTone(f, 1, 0.15);
}

export interface SequenceHandle {
  stop: () => void;
}

/**
 * Toca un ejemplo sonoro ya calculado (src/music/listen.ts), con clic opcional.
 * Todo queda programado en el reloj de audio; `stop` lo corta de inmediato.
 */
let activeSequence: { stop: () => void; onInterrupt?: () => void } | null = null;

export function playSequence(
  notes: { freq: number; startSec: number; durSec: number }[],
  clickBeats?: { bpm: number; beats: number },
  /** Se llama si otro ejemplo empieza y corta a este. */
  onInterrupt?: () => void,
): SequenceHandle {
  // Un solo ejemplo a la vez: el anterior se corta y se entera.
  if (activeSequence) {
    const prev = activeSequence;
    activeSequence = null;
    prev.stop();
    prev.onInterrupt?.();
  }
  const c = context();
  const t0 = c.currentTime + 0.15;
  if (clickBeats) {
    const step = 60 / clickBeats.bpm;
    for (let i = 0; i < clickBeats.beats; i++) click(t0 + i * step, i % 4 === 0);
  }
  for (const n of notes) {
    const at = t0 + n.startSec;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'triangle';
    osc.frequency.value = n.freq;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.45, at + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, at + Math.max(0.08, n.durSec));
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(at);
    osc.stop(at + Math.max(0.08, n.durSec) + 0.02);
  }
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
  return { stop: handle.stop };
}
