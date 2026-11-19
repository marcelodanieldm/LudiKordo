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

export function judgeLive(
  targets: LiveTarget[],
  detected: DetectedNote[],
  nowMs: number,
  toleranceMs = TIMING_TOLERANCE_MS,
  toleranceCents = PITCH_TOLERANCE_CENTS,
): LiveState {
  const used = new Set<number>();
  const verdicts: NoteVerdict[] = [];
  const offsets: (number | null)[] = [];
  const played: (number | null)[] = [];
  let last = -1;
  targets.forEach((t, i) => {
    let best = -1;
    let bestDist = Infinity;
    detected.forEach((d, j) => {
      if (used.has(j) || Math.abs(centsOff(d.freq, t.midi)) > toleranceCents) return;
      const dist = Math.abs(d.timeMs - t.timeMs);
      if (dist <= toleranceMs && dist < bestDist) {
        best = j;
        bestDist = dist;
      }
    });
    if (best >= 0) {
      used.add(best);
      const off = detected[best].timeMs - t.timeMs;
      verdicts.push(Math.abs(off) <= ON_TIME_MS ? 'hit' : off < 0 ? 'early' : 'late');
      offsets.push(off);
      played.push(null);
      last = i;
      return;
    }
    if (nowMs <= t.timeMs + toleranceMs) {
      verdicts.push('pending');
      offsets.push(null);
      played.push(null);
      return;
    }
    // Ventana cerrada sin la nota correcta: ¿hubo otro ataque cerca?
    let wrong = -1;
    let wrongDist = Infinity;
    detected.forEach((d, j) => {
      if (used.has(j)) return;
      const dist = Math.abs(d.timeMs - t.timeMs);
      if (dist <= toleranceMs && dist < wrongDist) {
        wrong = j;
        wrongDist = dist;
      }
    });
    if (wrong >= 0) used.add(wrong);
    verdicts.push(wrong >= 0 ? 'wrong' : 'miss');
    offsets.push(null);
    played.push(wrong >= 0 ? Math.round(freqToMidi(detected[wrong].freq)) : null);
    last = i;
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

/** Lo que el bombo puede «sonar» en el micrófono, después del golpe. */
export const KICK_WINDOW_MS = 150;

/**
 * Saca lo que el micrófono oyó del acompañamiento: notas de la pista con la misma
 * altura justo después de sonar (ver `filterBacking`) y ataques graves justo
 * después de un golpe de bombo que no sean ninguna de las notas del ejercicio.
 */
export function cleanDetections(detected: DetectedNote[], backing: BackingNote[], kicksMs: number[], targetMidis: ReadonlySet<number>): DetectedNote[] {
  return filterBacking(detected, backing).filter((d) => {
    const midi = Math.round(freqToMidi(d.freq));
    if (targetMidis.has(midi)) return true;
    return !kicksMs.some((k) => d.timeMs >= k - 20 && d.timeMs <= k + KICK_WINDOW_MS);
  });
}
