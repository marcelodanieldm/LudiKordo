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

/** Negras hacia abajo: un golpe por pulso. */
export const QUARTERS: Stroke[] = ['D', '-', 'D', '-', 'D', '-', 'D', '-'];
/** Corcheas abajo-arriba, sin parar. */
export const EIGHTHS: Stroke[] = ['D', 'U', 'D', 'U', 'D', 'U', 'D', 'U'];
/** El patrón de balada: abajo, abajo-arriba, arriba-abajo-arriba. */
export const BALLAD: Stroke[] = ['D', '-', 'D', 'U', '-', 'U', 'D', 'U'];
/** Blancas: un golpe cada dos pulsos (para los primeros cambios). */
export const HALVES: Stroke[] = ['D', '-', '-', '-', 'D', '-', '-', '-'];
/** Redondas: un golpe por compás. */
export const WHOLES: Stroke[] = ['D', '-', '-', '-', '-', '-', '-', '-'];

/** Un patrón es válido si tiene 8 casillas y la púa alterna: abajo en los pulsos, arriba entre pulsos. */
export function isValidPattern(p: Stroke[]): boolean {
  return p.length === EIGHTHS_PER_BAR && p.every((s, i) => s === '-' || (i % 2 === 0 ? s === 'D' : s === 'U'));
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
      if (s !== '-') out.push({ timeMs: startMs + (bar * EIGHTHS_PER_BAR + eighth) * eighthMs, dir: s, bar, eighth });
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
    const end = next ? offsetBeats * 2 * eighthSec + next.timeMs / 1000 : (offsetBeats * 2 + chords.length * EIGHTHS_PER_BAR) * eighthSec;
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
