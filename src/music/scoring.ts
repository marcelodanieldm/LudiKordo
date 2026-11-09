/**
 * Evaluación de ejercicios: aciertos de ritmo y de nota, estrellas y XP.
 * Reglas del documento de producto: nota correcta dentro de ±50 cents,
 * a tiempo dentro de ±80 ms (±60 ms en los ejercicios de tocar la pantalla).
 */
import { centsOff } from './notes';

export const PITCH_TOLERANCE_CENTS = 50;
export const TIMING_TOLERANCE_MS = 80;
export const TAP_TOLERANCE_MS = 60;

export interface DetectedNote {
  /** Momento del ataque, en ms desde el inicio del ejercicio. */
  timeMs: number;
  freq: number;
}

export interface TimingResult {
  hits: number;
  total: number;
  accuracy: number;
  /** Desvío de cada nota esperada (ms, + = tarde), null si no se tocó. */
  offsets: (number | null)[];
}

/** Tiempos esperados (ms) para `count` notas a un tempo, con `perBeat` notas por pulso. */
export function expectedTimes(count: number, bpm: number, startMs = 0, perBeat = 1): number[] {
  const step = 60000 / bpm / perBeat;
  return Array.from({ length: count }, (_, i) => startMs + i * step);
}

/**
 * Empareja cada tiempo esperado con el ataque real más cercano todavía libre.
 * Un ataque solo puede usarse una vez.
 */
export function scoreTiming(expected: number[], actual: number[], toleranceMs = TIMING_TOLERANCE_MS): TimingResult {
  const used = new Set<number>();
  const offsets: (number | null)[] = expected.map((e) => {
    let best = -1;
    let bestDist = Infinity;
    actual.forEach((a, j) => {
      if (used.has(j)) return;
      const dist = Math.abs(a - e);
      if (dist < bestDist) {
        bestDist = dist;
        best = j;
      }
    });
    if (best === -1 || bestDist > toleranceMs) return null;
    used.add(best);
    return actual[best] - e;
  });
  const hits = offsets.filter((o) => o !== null).length;
  return { hits, total: expected.length, accuracy: expected.length ? hits / expected.length : 0, offsets };
}

/** Igual que scoreTiming, pero además la nota tiene que ser la correcta. */
export function scorePlayAlong(
  targets: { timeMs: number; midi: number }[],
  detected: DetectedNote[],
  toleranceMs = TIMING_TOLERANCE_MS,
  toleranceCents = PITCH_TOLERANCE_CENTS,
): TimingResult {
  const used = new Set<number>();
  const offsets = targets.map((t) => {
    let best = -1;
    let bestDist = Infinity;
    detected.forEach((d, j) => {
      if (used.has(j)) return;
      if (Math.abs(centsOff(d.freq, t.midi)) > toleranceCents) return;
      const dist = Math.abs(d.timeMs - t.timeMs);
      if (dist < bestDist) {
        bestDist = dist;
        best = j;
      }
    });
    if (best === -1 || bestDist > toleranceMs) return null;
    used.add(best);
    return detected[best].timeMs - t.timeMs;
  });
  const hits = offsets.filter((o) => o !== null).length;
  return { hits, total: targets.length, accuracy: targets.length ? hits / targets.length : 0, offsets };
}

/**
 * Estrellas de 0 a 3. Alcanzar el criterio de dominio de la lección da 3.
 * Con 1 estrella la lección ya cuenta como completada.
 */
export function starsFor(accuracy: number, mastery = 0.8): 0 | 1 | 2 | 3 {
  if (accuracy >= mastery) return 3;
  if (accuracy >= mastery - 0.2) return 2;
  if (accuracy >= 0.4) return 1;
  return 0;
}

export const XP_PER_EXERCISE = 10;
export const XP_PER_STAR = 5;
export const XP_CHECKPOINT = 50;

export function xpFor(stars: number, isCheckpoint = false): number {
  return XP_PER_EXERCISE + XP_PER_STAR * stars + (isCheckpoint ? XP_CHECKPOINT : 0);
}
