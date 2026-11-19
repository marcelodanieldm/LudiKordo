/**
 * Evaluación en vivo de la práctica (lógica pura): cada nota esperada recibe un
 * veredicto apenas se puede decidir, mientras el alumno sigue tocando.
 * - Si ya llegó la nota correcta cerca de su tiempo: acierto (a tiempo, antes o tarde).
 * - Si se cerró su ventana sin la nota correcta: nota equivocada (si hubo un ataque) o perdida.
 */
import { centsOff, freqToMidi } from './notes';
import { PITCH_TOLERANCE_CENTS, TIMING_TOLERANCE_MS, type DetectedNote } from './scoring';
import { filterBacking, type BackingNote } from './improv';

export type NoteVerdict = 'pending' | 'hit' | 'early' | 'late' | 'wrong' | 'miss';

/** Dentro de este margen la nota cuenta como «a tiempo»; hasta la tolerancia, «antes» o «tarde» (igual suma). */
export const ON_TIME_MS = 40;

export interface LiveTarget {
  timeMs: number;
  midi: number;
}

export interface LiveState {
  verdicts: NoteVerdict[];
  /** Desvío de cada acierto (ms, + = tarde). */
  offsets: (number | null)[];
  /** Nota que sonó en lugar de la esperada (veredicto 'wrong'). */
  played: (number | null)[];
  decided: number;
  hits: number;
  /** Aciertos sobre notas ya decididas (0–1). */
  accuracy: number;
  streak: number;
  bestStreak: number;
  /** Última nota decidida, para mostrar su veredicto grande (−1 si ninguna). */
  last: number;
}

export const isHit = (v: NoteVerdict) => v === 'hit' || v === 'early' || v === 'late';

/**
 * Lo que tarda una nota en llegar del micrófono a la app (búfer del detector y
 * puente nativo). Una nota sin tocar recién se da por perdida pasado este margen,
 * para que no aparezca «perdida» y un instante después «acierto».
 */
export const DETECTOR_LATENCY_MS = 250;

export function judgeLive(
  targets: LiveTarget[],
  detected: DetectedNote[],
  nowMs: number,
  toleranceMs = TIMING_TOLERANCE_MS,
  toleranceCents = PITCH_TOLERANCE_CENTS,
): LiveState {
  const used = new Set<number>();
  const verdicts: NoteVerdict[] = targets.map(() => 'pending');
  const offsets: (number | null)[] = targets.map(() => null);
  const played: (number | null)[] = targets.map(() => null);
  const near = (d: DetectedNote, t: LiveTarget) => Math.abs(d.timeMs - t.timeMs) <= toleranceMs;
  const sameNote = (d: DetectedNote, t: LiveTarget) => Math.abs(centsOff(d.freq, t.midi)) <= toleranceCents;
  // 1.ª pasada: aciertos (nota correcta cerca de su tiempo), en orden.
  targets.forEach((t, i) => {
    let best = -1;
    let bestDist = Infinity;
    detected.forEach((d, j) => {
      if (used.has(j) || !sameNote(d, t) || !near(d, t)) return;
      const dist = Math.abs(d.timeMs - t.timeMs);
      if (dist < bestDist) {
        best = j;
        bestDist = dist;
      }
    });
    if (best < 0) return;
    used.add(best);
    const off = detected[best].timeMs - t.timeMs;
    verdicts[i] = Math.abs(off) <= ON_TIME_MS ? 'hit' : off < 0 ? 'early' : 'late';
    offsets[i] = off;
  });
  // 2.ª pasada: las que ya no pueden llegar son equivocadas (hubo otro ataque) o perdidas.
  // Un ataque que es la nota correcta de otra nota cercana no cuenta como «equivocada» de esta.
  targets.forEach((t, i) => {
    if (verdicts[i] !== 'pending' || nowMs <= t.timeMs + toleranceMs + DETECTOR_LATENCY_MS) return;
    let wrong = -1;
    let wrongDist = Infinity;
    detected.forEach((d, j) => {
      if (used.has(j) || !near(d, t)) return;
      if (targets.some((o, k) => k !== i && sameNote(d, o) && near(d, o))) return;
      const dist = Math.abs(d.timeMs - t.timeMs);
      if (dist < wrongDist) {
        wrong = j;
        wrongDist = dist;
      }
    });
    if (wrong >= 0) used.add(wrong);
    verdicts[i] = wrong >= 0 ? 'wrong' : 'miss';
    played[i] = wrong >= 0 ? Math.round(freqToMidi(detected[wrong].freq)) : null;
  });
  let last = -1;
  verdicts.forEach((v, i) => {
    if (v !== 'pending') last = i;
  });
  let streak = 0;
  let bestStreak = 0;
  let hits = 0;
  let decided = 0;
  for (const v of verdicts) {
    if (v === 'pending') continue;
    decided++;
    if (isHit(v)) {
      hits++;
      streak++;
      bestStreak = Math.max(bestStreak, streak);
    } else streak = 0;
  }
  return { verdicts, offsets, played, decided, hits, accuracy: decided ? hits / decided : 0, streak, bestStreak, last };
}

/** Lo que un golpe de bombo o de caja puede «sonar» en el micrófono, después del golpe. */
export const DRUM_WINDOW_MS = 150;

/**
 * Saca lo que el micrófono oyó del acompañamiento: notas de la pista con la misma
 * altura justo después de sonar (ver `filterBacking`) y ataques justo después de
 * un golpe de bombo o caja (tienen altura y el detector los toma por notas).
 * Nunca saca una nota que es la que el alumno tenía que tocar en ese momento:
 * la pista suele tocar las mismas notas en el mismo pulso.
 */
export function cleanDetections(detected: DetectedNote[], backing: BackingNote[], drumHitsMs: number[], targets: LiveTarget[] = [], toleranceMs = TIMING_TOLERANCE_MS): DetectedNote[] {
  const expected = (d: DetectedNote) => targets.some((t) => Math.abs(d.timeMs - t.timeMs) <= toleranceMs && Math.abs(centsOff(d.freq, t.midi)) <= PITCH_TOLERANCE_CENTS);
  const kept = new Set(filterBacking(detected, backing));
  return detected.filter((d) => {
    if (expected(d)) return true;
    if (!kept.has(d)) return false;
    return !drumHitsMs.some((k) => d.timeMs >= k - 20 && d.timeMs <= k + DRUM_WINDOW_MS);
  });
}
