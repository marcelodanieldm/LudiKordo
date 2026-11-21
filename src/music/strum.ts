/**
 * Rasgueo (lógica pura): patrones de púa en corcheas, cuándo cae cada golpe y
 * cómo suena un acorde rasgueado en los ejemplos.
 *
 * Un patrón tiene 8 casillas por compás de 4/4 (una por corchea):
 * 'D' = púa hacia abajo, 'U' = hacia arriba, '-' = la mano sigue el movimiento
 * pero no toca las cuerdas.
 */
import { midiToFreq } from './notes';
import { NOTE_GATE, PLAYBACK_OCTAVE_UP, type ScheduledNote } from './listen';

export type Stroke = 'D' | 'U' | '-';
export const EIGHTHS_PER_BAR = 8;
/**
 * Compases de 3/4 y 6/8 (criolla, ADR 0010): 6 corcheas por compás. El tempo sigue
 * en negras, así que un compás de 6 corcheas dura 3 pulsos; 3/4 y 6/8 se distinguen
 * por los acentos (la batería y el patrón), no por la cuenta.
 */
export const SIX_PER_BAR = 6;

/** Corcheas por compás de un patrón (8 en 4/4; 6 en 3/4 y 6/8). */
export const slotsOf = (pattern: Stroke[]) => pattern.length;
/** Pulsos (negras) por compás de un patrón: 4 o 3. */
export const barBeatsOf = (pattern: Stroke[]) => pattern.length / 2;

/** Negras hacia abajo: un golpe por pulso. */
export const QUARTERS: Stroke[] = ['D', '-', 'D', '-', 'D', '-', 'D', '-'];
/** Corcheas abajo-arriba, sin parar. */
export const EIGHTHS: Stroke[] = ['D', 'U', 'D', 'U', 'D', 'U', 'D', 'U'];
/** El patrón de balada: abajo, abajo-arriba, arriba-abajo-arriba. */
export const BALLAD: Stroke[] = ['D', '-', 'D', 'U', '-', 'U', 'D', 'U'];
/** Blancas: un golpe cada dos pulsos (para los primeros cambios). */
export const HALVES: Stroke[] = ['D', '-', '-', '-', 'D', '-', '-', '-'];
/** Corcheas todas hacia abajo (palm mute): más parejas y con más peso. */
export const DOWN_EIGHTHS: Stroke[] = ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D'];
/** Redondas: un golpe por compás. */
export const WHOLES: Stroke[] = ['D', '-', '-', '-', '-', '-', '-', '-'];

// ───────────── 3/4 y 6/8 (6 corcheas por compás) ─────────────

/** 6/8: dos golpes por compás, en el 1 y en el 4 (dos pulsos de negra con punto). */
export const SIX8_PULSE: Stroke[] = ['D', '-', '-', 'D', '-', '-'];
/** Zamba: abajo en el 1, abajo-arriba en el 3, abajo en el 5 (el 4 queda en el aire). */
export const ZAMBA: Stroke[] = ['D', '-', 'D', 'U', 'D', '-'];
/** Chacarera: más empuje, con el arriba del final que lleva al compás siguiente. */
export const CHACARERA: Stroke[] = ['D', '-', 'D', 'U', 'D', 'U'];
/** Vals (3/4): un golpe por pulso, el primero más fuerte. */
export const VALS: Stroke[] = ['D', '-', 'D', '-', 'D', '-'];
/** Milonga (4/4): las 8 corcheas agrupadas 3 + 3 + 2. */
export const MILONGA: Stroke[] = ['D', '-', '-', 'D', '-', '-', 'D', '-'];
/** Comping de jazz (charleston): el 1 y el «y» del 2. */
export const CHARLESTON: Stroke[] = ['D', '-', '-', 'U', '-', '-', '-', '-'];
/** Bossa nova con los dedos: el 1, el «y» del 2 y el «y» del 3 (sincopado). */
export const BOSSA_FINGERS: Stroke[] = ['D', '-', '-', 'U', '-', 'U', '-', '-'];

/**
 * Un patrón es válido si tiene 8 casillas y la púa alterna (abajo en los pulsos,
 * arriba entre pulsos), o si todo va hacia abajo (sin ningún golpe hacia arriba).
 */
export function isValidPattern(p: Stroke[]): boolean {
  if (p.length !== EIGHTHS_PER_BAR && p.length !== SIX_PER_BAR) return false;
  if (!p.includes('U')) return p.some((s) => s === 'D');
  return p.every((s, i) => s === '-' || (i % 2 === 0 ? s === 'D' : s === 'U'));
}

export interface StrokeTime {
  timeMs: number;
  dir: 'D' | 'U';
  /** Compás (desde 0) y corchea dentro del compás (0–7). */
  bar: number;
  eighth: number;
}

/** Cuándo tiene que sonar cada golpe del ejercicio. */
export function strokeTimes(pattern: Stroke[], bars: number, bpm: number, startMs = 0): StrokeTime[] {
  const eighthMs = 60000 / bpm / 2;
  const out: StrokeTime[] = [];
  for (let bar = 0; bar < bars; bar++) {
    pattern.forEach((s, eighth) => {
      if (s !== '-') out.push({ timeMs: startMs + (bar * pattern.length + eighth) * eighthMs, dir: s, bar, eighth });
    });
  }
  return out;
}

/** Corchea actual (desde 0) a partir del tiempo, o -1 durante la cuenta. */
export function eighthAt(nowMs: number, startMs: number, bpm: number): number {
  if (nowMs < startMs) return -1;
  return Math.floor((nowMs - startMs) / (60000 / bpm / 2));
}

/** Separación entre cuerdas al rasguear (un rasgueo real no es instantáneo). */
export const STRUM_SPREAD_SEC = 0.014;

/**
 * Notas de un ejemplo rasgueado: `chords` trae las notas MIDI de cada compás
 * (de grave a agudo). Hacia abajo suenan todas de grave a agudo; hacia arriba,
 * solo las 3 más agudas y de aguda a grave, como con la púa de verdad.
 */
export function strumSchedule(chords: number[][], pattern: Stroke[], bpm: number, offsetBeats = 0): ScheduledNote[] {
  const eighthSec = 60 / bpm / 2;
  const out: ScheduledNote[] = [];
  const hits = strokeTimes(pattern, chords.length, bpm, 0);
  hits.forEach((h, i) => {
    const next = hits[i + 1];
    const start = offsetBeats * 2 * eighthSec + h.timeMs / 1000;
    const end = next ? offsetBeats * 2 * eighthSec + next.timeMs / 1000 : (offsetBeats * 2 + chords.length * pattern.length) * eighthSec;
    const notes = chords[h.bar];
    const ordered = h.dir === 'D' ? notes : notes.slice(-3).reverse();
    ordered.forEach((midi, k) => {
      out.push({
        freq: midiToFreq(midi + PLAYBACK_OCTAVE_UP),
        startSec: start + k * STRUM_SPREAD_SEC,
        durSec: Math.max(0.08, (end - start) * NOTE_GATE - k * STRUM_SPREAD_SEC),
      });
    });
  });
  return out;
}

// ───────────── Puntaje del rasgueo ─────────────

export interface Attack {
  timeMs: number;
  /** Energía del golpe (RMS del cuadro). */
  rms: number;
}

/** Cuánto más fuerte que lo que entró durante la cuenta tiene que ser un golpe para contar. */
export const CLICK_MARGIN = 1.5;

/**
 * Descarta lo que probablemente sea el clic del metrónomo colándose por el
 * micrófono: durante la cuenta previa el alumno no toca, así que lo que se oye
 * ahí mide cuánto entra el clic. Después solo cuentan los golpes más fuertes
 * que eso. Sin nada en la cuenta (auriculares), no se descarta nada.
 */
export function filterClicks(attacks: Attack[], startMs: number, countInMs: number): Attack[] {
  const during = attacks.filter((a) => a.timeMs >= startMs - countInMs && a.timeMs < startMs - 40);
  const floor = during.reduce((m, a) => Math.max(m, a.rms), 0);
  return attacks.filter((a) => a.timeMs >= startMs - 40 && (floor === 0 || a.rms > floor * CLICK_MARGIN));
}

export interface StrumScore {
  hits: number;
  total: number;
  /** Golpes donde el patrón pedía mano al aire. */
  extras: number;
  accuracy: number;
}

/**
 * Golpes a tiempo y golpes de más. Un golpe sin pareja que cae cerca de una
 * casilla '-' (mano al aire) cuenta en contra: así se evalúan los golpes al
 * aire del patrón y no sirve rasguear corcheas sin parar.
 */
export function scoreStrum(pattern: Stroke[], bars: number, bpm: number, startMs: number, times: number[], toleranceMs: number): StrumScore {
  const expected = strokeTimes(pattern, bars, bpm, startMs);
  const used = new Set<number>();
  let hits = 0;
  for (const e of expected) {
    let best = -1;
    let bestDist = Infinity;
    times.forEach((t, j) => {
      if (used.has(j)) return;
      const d = Math.abs(t - e.timeMs);
      if (d < bestDist) {
        bestDist = d;
        best = j;
      }
    });
    if (best >= 0 && bestDist <= toleranceMs) {
      used.add(best);
      hits += 1;
    }
  }
  const eighthMs = 60000 / bpm / 2;
  let extras = 0;
  times.forEach((t, j) => {
    if (used.has(j)) return;
    const slot = Math.round((t - startMs) / eighthMs);
    if (slot < 0 || slot >= bars * pattern.length) return;
    if (Math.abs(t - (startMs + slot * eighthMs)) > toleranceMs) return;
    if (pattern[slot % pattern.length] === '-') extras += 1;
  });
  const total = expected.length;
  return { hits, total, extras, accuracy: total ? hits / (total + extras) : 0 };
}
