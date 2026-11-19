/**
 * Evaluación en vivo (lógica pura): cada ataque que detecta el micrófono se
 * compara al instante con la nota esperada más cercana, y las notas que pasan
 * sin tocarse se marcan como perdidas. El resultado final usa las mismas
 * tolerancias que el play-along.
 */
import { centsOff } from './notes';
import { PITCH_TOLERANCE_CENTS, TIMING_TOLERANCE_MS, type DetectedNote } from './scoring';

export type LiveVerdict = 'hit' | 'early' | 'late' | 'wrongNote' | 'miss';

export interface LiveTarget {
  timeMs: number;
  midi: number;
}

export interface LiveState {
  targets: LiveTarget[];
  /** Resultado de cada nota esperada; null = todavía no se juzgó. */
  verdicts: (LiveVerdict | null)[];
  streak: number;
  bestStreak: number;
}

/** Margen para decir «bien» en vez de «un poco antes / después» (dentro de la tolerancia). */
export const TIGHT_MS = 60;
/**
 * Frecuencias por encima de esto no son del bajo (el acompañamiento que se
 * cuela por el parlante): se ignoran en lugar de contarlas como error. Cada
 * ejercicio usa un tope más bajo con `maxHzFor`.
 */
export const BASS_MAX_HZ = 330;
/**
 * El aviso de una nota llega tarde (latencia de entrada, ventanas del detector
 * y el puente a JavaScript): antes de dar una nota por perdida se espera esto.
 */
export const LIVE_DETECTION_DELAY_MS = 350;

/**
 * Tope de frecuencia de un ejercicio: su nota más aguda una octava arriba (el
 * teléfono a veces oye la octava del Mi grave) más 3 semitonos.
 */
export function maxHzFor(targets: LiveTarget[]): number {
  const top = Math.max(...targets.map((t) => t.midi));
  return Math.min(BASS_MAX_HZ, 440 * Math.pow(2, (top + 15 - 69) / 12));
}

/** Diferencia de altura aceptada: dentro de la tolerancia, o la misma nota una octava arriba (el teléfono capta mal el Mi grave). */
function pitchMatches(freq: number, midi: number, toleranceCents: number): boolean {
  const c = centsOff(freq, midi);
  return Math.abs(c) <= toleranceCents || Math.abs(c - 1200) <= toleranceCents;
}

export function initLive(targets: LiveTarget[]): LiveState {
  return { targets, verdicts: targets.map(() => null), streak: 0, bestStreak: 0 };
}

function withVerdict(s: LiveState, i: number, v: LiveVerdict): LiveState {
  const verdicts = s.verdicts.slice();
  verdicts[i] = v;
  const good = v === 'hit' || v === 'early' || v === 'late';
  const streak = good ? s.streak + 1 : 0;
  return { ...s, verdicts, streak, bestStreak: Math.max(s.bestStreak, streak) };
}

/**
 * Juzga un ataque: la nota pendiente más cercana en el tiempo dentro de la
 * tolerancia. Si la altura coincide, acierto (a tiempo, antes o después); si no,
 * nota equivocada. Un ataque que no cae cerca de ninguna nota pendiente, o que
 * no es del registro del bajo, no cambia nada.
 */
export function judgeOnset(
  s: LiveState,
  n: DetectedNote,
  toleranceMs = TIMING_TOLERANCE_MS,
  toleranceCents = PITCH_TOLERANCE_CENTS,
  maxHz = BASS_MAX_HZ,
): { state: LiveState; index: number | null; verdict: LiveVerdict | null } {
  if (n.freq > maxHz || n.freq <= 0) return { state: s, index: null, verdict: null };
  let best = -1;
  let bestDist = Infinity;
  s.targets.forEach((t, i) => {
    // Una nota marcada «otra nota» todavía puede corregirse con un ataque afinado
    // (justo después del ataque el detector puede reportar la altura anterior).
    const open = s.verdicts[i] === null || (s.verdicts[i] === 'wrongNote' && pitchMatches(n.freq, t.midi, toleranceCents));
    if (!open) return;
    const d = Math.abs(n.timeMs - t.timeMs);
    if (d <= toleranceMs && d < bestDist) {
      best = i;
      bestDist = d;
    }
  });
  if (best === -1) return { state: s, index: null, verdict: null };
  const t = s.targets[best];
  let verdict: LiveVerdict;
  if (!pitchMatches(n.freq, t.midi, toleranceCents)) verdict = 'wrongNote';
  else if (Math.abs(n.timeMs - t.timeMs) <= TIGHT_MS) verdict = 'hit';
  else verdict = n.timeMs < t.timeMs ? 'early' : 'late';
  return { state: withVerdict(s, best, verdict), index: best, verdict };
}

/**
 * Marca como perdidas las notas cuyo tiempo ya pasó sin un ataque, esperando
 * lo que tarda en llegar el aviso del micrófono.
 */
export function expireMissed(
  s: LiveState,
  nowMs: number,
  toleranceMs = TIMING_TOLERANCE_MS,
  detectionDelayMs = LIVE_DETECTION_DELAY_MS,
): { state: LiveState; missed: number[] } {
  let state = s;
  const missed: number[] = [];
  s.targets.forEach((t, i) => {
    if (state.verdicts[i] === null && nowMs - detectionDelayMs > t.timeMs + toleranceMs) {
      state = withVerdict(state, i, 'miss');
      missed.push(i);
    }
  });
  return { state, missed };
}

export interface LiveStats {
  judged: number;
  hits: number;
  /** Aciertos sobre notas juzgadas hasta ahora (0–1). */
  accuracy: number;
  early: number;
  late: number;
  wrong: number;
  missed: number;
}

export function liveStats(s: LiveState): LiveStats {
  const v = s.verdicts.filter((x): x is LiveVerdict => x !== null);
  const hits = v.filter((x) => x === 'hit' || x === 'early' || x === 'late').length;
  return {
    judged: v.length,
    hits,
    accuracy: v.length ? hits / v.length : 0,
    early: v.filter((x) => x === 'early').length,
    late: v.filter((x) => x === 'late').length,
    wrong: v.filter((x) => x === 'wrongNote').length,
    missed: v.filter((x) => x === 'miss').length,
  };
}

/** Consejo al terminar: lo que más se repitió. */
export function liveAdvice(st: LiveStats): 'great' | 'early' | 'late' | 'wrongNotes' | 'missing' {
  if (st.judged === 0 || (st.missed >= Math.max(st.wrong, st.early, st.late) && st.missed > st.judged * 0.3)) return 'missing';
  if (st.accuracy >= 0.85 && st.early + st.late <= st.hits * 0.3) return 'great';
  const top = Math.max(st.early, st.late, st.wrong);
  if (top === st.wrong) return 'wrongNotes';
  return st.early >= st.late ? 'early' : 'late';
}
