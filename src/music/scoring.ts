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
  /** Índice del ataque real emparejado con cada nota esperada, null si ninguno. */
  matched: (number | null)[];
}

/** Tiempos esperados (ms) para `count` notas a un tempo, con `perBeat` notas por pulso. */
export function expectedTimes(count: number, bpm: number, startMs = 0, perBeat = 1): number[] {
  const step = 60000 / bpm / perBeat;
  return Array.from({ length: count }, (_, i) => startMs + i * step);
}

/** Tiempos de ataque (ms) de notas con duraciones en pulsos: cada una empieza cuando termina la anterior. */
export function noteTimes(beats: number[], bpm: number, startMs = 0): number[] {
  const step = 60000 / bpm;
  let at = 0;
  return beats.map((b) => {
    const t = startMs + at * step;
    at += b;
    return t;
  });
}

/** Índice de la nota que suena en `elapsedMs` (−1 antes de empezar). */
export function noteIndexAt(times: number[], nowMs: number): number {
  let i = -1;
  while (i + 1 < times.length && times[i + 1] <= nowMs) i += 1;
  return i;
}

/**
 * Empareja cada tiempo esperado con el ataque real más cercano todavía libre.
 * Un ataque solo puede usarse una vez.
 */
export function scoreTiming(expected: number[], actual: number[], toleranceMs = TIMING_TOLERANCE_MS): TimingResult {
  const used = new Set<number>();
  const matched: (number | null)[] = expected.map((e) => {
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
    return best;
  });
  const offsets = matched.map((j, i) => (j === null ? null : actual[j] - expected[i]));
  const hits = offsets.filter((o) => o !== null).length;
  return { hits, total: expected.length, accuracy: expected.length ? hits / expected.length : 0, offsets, matched };
}

/** Igual que scoreTiming, pero además la nota tiene que ser la correcta. */
export function scorePlayAlong(
  targets: { timeMs: number; midi: number }[],
  detected: DetectedNote[],
  toleranceMs = TIMING_TOLERANCE_MS,
  toleranceCents = PITCH_TOLERANCE_CENTS,
): TimingResult {
  const used = new Set<number>();
  const matched: (number | null)[] = targets.map((t) => {
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
    return best;
  });
  const offsets = matched.map((j, i) => (j === null ? null : detected[j].timeMs - targets[i].timeMs));
  const hits = offsets.filter((o) => o !== null).length;
  return { hits, total: targets.length, accuracy: targets.length ? hits / targets.length : 0, offsets, matched };
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

export interface TempoResult extends TimingResult {
  /**
   * Cuánto se corrió el pulso sin clic respecto de cómo tocaba con clic (ms,
   * + = tarde). Comparar con la propia parte con clic descuenta la latencia del
   * audio y de la pantalla. null si no hubo toques sin clic.
   */
  driftMs: number | null;
}

/** Media de los números que no son null, o null si no hay ninguno. */
function mean(xs: (number | null)[]): number | null {
  const v = xs.filter((x): x is number => x !== null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

/**
 * Entrenador de tempo: con clic se exige la tolerancia de tocar la pantalla;
 * sin clic, la de tocar el instrumento, porque el alumno lleva el pulso solo.
 * El desvío de la parte sin clic se mide contra el toque más cercano a cada
 * pulso (hasta medio pulso), aunque esté fuera de tolerancia, para que apurarse
 * mucho no parezca «pulso firme».
 */
export function scoreTempoTrainer(expected: number[], taps: number[], audibleBeats: number): TempoResult {
  const withClick = scoreTiming(expected.slice(0, audibleBeats), taps, TAP_TOLERANCE_MS);
  const usedIdx = new Set(withClick.matched.filter((j): j is number => j !== null));
  const remaining = taps.filter((_, j) => !usedIdx.has(j));
  const silentExpected = expected.slice(audibleBeats);
  const silent = scoreTiming(silentExpected, remaining, TIMING_TOLERANCE_MS);
  const halfBeat = expected.length > 1 ? (expected[1] - expected[0]) / 2 : 500;
  const loose = scoreTiming(silentExpected, remaining, halfBeat);
  const silentMean = mean(loose.offsets);
  const clickMean = mean(withClick.offsets) ?? 0;
  const offsets = [...withClick.offsets, ...silent.offsets];
  const hits = withClick.hits + silent.hits;
  return {
    hits,
    total: expected.length,
    accuracy: expected.length ? hits / expected.length : 0,
    offsets,
    matched: [...withClick.matched, ...silent.matched],
    driftMs: silentMean === null ? null : silentMean - clickMean,
  };
}

/** Consejo según el desvío: más de 25 ms antes o después; «missing» si no marcó sin clic. */
export function driftAdvice(driftMs: number | null): 'early' | 'late' | 'steady' | 'missing' {
  if (driftMs === null) return 'missing';
  if (driftMs < -25) return 'early';
  if (driftMs > 25) return 'late';
  return 'steady';
}
