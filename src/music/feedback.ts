/**
 * Explicación previa y devolución de los ejercicios con el instrumento.
 *
 * - `howTo*`: qué hay que hacer, en 2 a 4 renglones armados con los datos del
 *   ejercicio (tempo, cuerdas, trastes, figuras, patrón de rasgueo, escala).
 * - `*Feedback`: al terminar, qué salió bien o mal y un máximo de 3 consejos
 *   concretos, del más importante al menos.
 *
 * Lógica pura: devuelve claves de `ui.exercise.howTo.*` y `ui.exercise.tip.*`
 * con sus parámetros; la pantalla las traduce (y pone el nombre de las notas).
 */
import type { NoteVerdict } from './live';
import type { Stroke } from './strum';

export interface Tip {
  key: string;
  params?: Record<string, string | number>;
}

export const MAX_TIPS = 3;
/** Un desvío medio mayor que esto (ms) es una tendencia a adelantarse o atrasarse. */
export const TENDENCY_MS = 35;

// ───────────── Explicación previa ─────────────

interface NoteLike {
  string: string;
  fret: number;
  beats?: number;
}
interface EventLike {
  beats: number;
  rest?: boolean;
  string?: string;
  fret?: number;
}

/** «6, 5 y 4» → números de cuerda (de grave a aguda) y rango de trastes de unas notas. */
export function whereOf(notes: NoteLike[], stringNumber: (id: string) => number): { strings: number[]; from: number; to: number } {
  const strings = [...new Set(notes.map((n) => stringNumber(n.string)))].sort((a, b) => b - a);
  const frets = notes.map((n) => n.fret);
  return { strings, from: Math.min(...frets), to: Math.max(...frets) };
}

export function howToPlayAlong(
  ex: { bpm: number | null; notes: NoteLike[]; score?: EventLike[]; beatsPerBar?: number },
  stringNumber: (id: string) => number,
): Tip[] {
  const tips: Tip[] = [];
  const events: EventLike[] = ex.score ?? ex.notes.map((n) => ({ ...n, beats: n.beats ?? 1 }));
  if (ex.bpm === null) {
    tips.push({ key: 'howTo.untimed', params: { count: ex.notes.length } });
  } else {
    tips.push({ key: (ex.beatsPerBar ?? 4) === 3 ? 'howTo.timed3' : 'howTo.timed', params: { bpm: ex.bpm, count: ex.notes.length } });
  }
  const w = whereOf(ex.notes, stringNumber);
  tips.push({ key: w.from === w.to ? 'howTo.whereOne' : 'howTo.where', params: { strings: w.strings.join(', '), from: w.from, to: w.to } });
  if (ex.bpm !== null) {
    if (events.some((e) => e.beats < 1)) tips.push({ key: 'howTo.eighths' });
    if (events.some((e) => e.rest)) tips.push({ key: 'howTo.rests' });
    else if (events.some((e) => e.beats >= 2)) tips.push({ key: 'howTo.long' });
  }
  return tips;
}

/** El patrón contado: «1 ↓ · y · · 2 ↓ · y ↑ …» (la «y» va traducida en `and`). */
export function countPattern(pattern: Stroke[], and: string): string {
  const arrow = { D: '↓', U: '↑', '-': '·' } as const;
  return pattern.map((s, i) => `${i % 2 === 0 ? i / 2 + 1 : and} ${arrow[s]}`).join('  ');
}

export function howToStrum(ex: { bpm: number; chords: string[]; pattern: Stroke[] }, and: string): Tip[] {
  const tips: Tip[] = [
    { key: 'howTo.strum', params: { chords: ex.chords.join(' – '), bpm: ex.bpm, bars: ex.chords.length } },
    { key: 'howTo.pattern', params: { pattern: countPattern(ex.pattern, and) } },
  ];
  if (ex.pattern.includes('-')) tips.push({ key: 'howTo.air' });
  if (ex.pattern.includes('U')) tips.push({ key: 'howTo.up' });
  return tips;
}

export function howToImprovise(ex: { minNotes: number; loops: number; targets?: number[][] }, scaleNames: string): Tip[] {
  const tips: Tip[] = [
    { key: 'howTo.improv', params: { scale: scaleNames } },
    { key: 'howTo.improvCount', params: { count: ex.minNotes, loops: ex.loops } },
  ];
  if (ex.targets && ex.targets.length > 0) tips.push({ key: 'howTo.targets' });
  return tips;
}

// ───────────── Devolución: notas a tempo ─────────────

export type Counts = Record<'hit' | 'early' | 'late' | 'wrong' | 'miss', number>;

export interface NoteProblem {
  /** Índice de la nota (sin silencios). */
  index: number;
  /** Compás, desde 1. */
  bar: number;
  verdict: Exclude<NoteVerdict, 'pending' | 'hit'>;
  expected: number;
  played: number | null;
}

export interface TimedFeedback {
  counts: Counts;
  /** Hasta 3 notas con problemas: primero las equivocadas y perdidas, después las más corridas. */
  problems: NoteProblem[];
  tips: Tip[];
}

/** Compás más difícil (desde 1): el que juntó más notas equivocadas o perdidas; undefined si ninguno juntó 2. */
export function worstBar(misses: number[]): number | undefined {
  let best = -1;
  misses.forEach((m, i) => {
    if (m >= 2 && (best < 0 || m > misses[best])) best = i;
  });
  return best < 0 ? undefined : best + 1;
}

export function timedFeedback(input: {
  verdicts: NoteVerdict[];
  offsets: (number | null)[];
  played: (number | null)[];
  targets: number[];
  /** Pulso donde empieza cada nota (sin silencios). */
  startBeats: number[];
  beatsPerBar: number;
  accuracy: number;
  stars: number;
}): TimedFeedback {
  const { verdicts, offsets, played, targets, startBeats, beatsPerBar, accuracy, stars } = input;
  const counts: Counts = { hit: 0, early: 0, late: 0, wrong: 0, miss: 0 };
  for (const v of verdicts) if (v !== 'pending') counts[v]++;
  const total = verdicts.length;
  const barOf = (i: number) => Math.floor((startBeats[i] ?? 0) / beatsPerBar + 1e-9);
  const bars = total ? barOf(total - 1) + 1 : 0;
  const missesByBar = Array.from({ length: bars }, () => 0);
  verdicts.forEach((v, i) => {
    if (v === 'wrong' || v === 'miss') missesByBar[barOf(i)]++;
  });

  const problems: NoteProblem[] = [];
  const add = (i: number) =>
    problems.push({ index: i, bar: barOf(i) + 1, verdict: verdicts[i] as NoteProblem['verdict'], expected: targets[i], played: played[i] ?? null });
  verdicts.forEach((v, i) => {
    if ((v === 'wrong' || v === 'miss') && problems.length < MAX_TIPS) add(i);
  });
  const shifted = verdicts
    .map((v, i) => ({ v, i, off: Math.abs(offsets[i] ?? 0) }))
    .filter((x) => x.v === 'early' || x.v === 'late')
    .sort((a, b) => b.off - a.off);
  for (const x of shifted) if (problems.length < MAX_TIPS) add(x.i);
  problems.sort((a, b) => a.index - b.index);

  const tips: Tip[] = [];
  if (stars === 3) tips.push({ key: 'tip.great' });
  if (total && counts.miss / total >= 0.3) tips.push({ key: 'tip.miss', params: { n: counts.miss } });
  if (counts.wrong >= 2) tips.push({ key: 'tip.wrong', params: { n: counts.wrong } });
  if (counts.late >= 2 && counts.late >= 2 * counts.early) tips.push({ key: 'tip.late', params: { n: counts.late } });
  else if (counts.early >= 2 && counts.early >= 2 * counts.late) tips.push({ key: 'tip.early', params: { n: counts.early } });
  const bar = bars > 1 ? worstBar(missesByBar) : undefined;
  if (bar !== undefined) tips.push({ key: 'tip.bar', params: { bar } });
  if (accuracy < 0.5) tips.push({ key: 'tip.listenFirst' });
  if (tips.length === 0) tips.push({ key: 'tip.almost' });
  return { counts, problems, tips: tips.slice(0, MAX_TIPS) };
}

// ───────────── Devolución: notas sin tempo ─────────────

export interface UntimedNoteStat {
  /** Cuánto tardó en sonar afinada (ms). */
  ms: number;
  /** Desvío típico mientras no estaba afinada (cents, + = alta); null si salió enseguida. */
  cents: number | null;
}

export interface UntimedFeedback {
  /** La nota que más costó, si costó claramente más que las demás. */
  hardest?: number;
  tips: Tip[];
}

/** Mediana (sin modificar el arreglo). */
const median = (xs: number[]) => {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export function untimedFeedback(stats: UntimedNoteStat[]): UntimedFeedback {
  const tips: Tip[] = [];
  const times = stats.map((s) => s.ms);
  const mid = median(times);
  let hardest: number | undefined;
  times.forEach((ms, i) => {
    if (ms >= 3000 && ms >= 2 * mid && (hardest === undefined || ms > times[hardest])) hardest = i;
  });
  if (hardest !== undefined) {
    tips.push({ key: 'tip.hardestNote', params: { index: hardest } });
    const c = stats[hardest].cents;
    if (c !== null && c > 20) tips.push({ key: 'tip.sharp' });
    else if (c !== null && c < -20) tips.push({ key: 'tip.flat' });
  } else {
    const off = stats.map((s) => s.cents).filter((c): c is number => c !== null);
    const typical = median(off);
    if (off.length >= Math.max(2, stats.length / 3) && typical > 20) tips.push({ key: 'tip.sharp' });
    else if (off.length >= Math.max(2, stats.length / 3) && typical < -20) tips.push({ key: 'tip.flat' });
  }
  if (tips.length === 0) tips.push({ key: mid <= 1500 ? 'tip.untimedGreat' : 'tip.untimedFlow' });
  return { hardest, tips: tips.slice(0, MAX_TIPS) };
}

// ───────────── Devolución: rasgueo ─────────────

export interface StrumFeedback {
  tips: Tip[];
  missed: number;
  extras: number;
}

export function strumFeedback(input: {
  hits: number;
  total: number;
  extras: number;
  /** Desvío medio de los golpes acertados (ms, + = tarde); null si no hubo. */
  meanOffsetMs: number | null;
  /** Golpes que faltaron en cada compás. */
  missedByBar: number[];
  accuracy: number;
  stars: number;
}): StrumFeedback {
  const { hits, total, extras, meanOffsetMs, missedByBar, accuracy, stars } = input;
  const missed = total - hits;
  const tips: Tip[] = [];
  if (stars === 3) tips.push({ key: 'tip.great' });
  if (missed >= 2) tips.push({ key: 'tip.strumMissed', params: { n: missed } });
  if (extras >= 2) tips.push({ key: 'tip.strumExtras', params: { n: extras } });
  if (meanOffsetMs !== null && meanOffsetMs > TENDENCY_MS) tips.push({ key: 'tip.strumLate' });
  else if (meanOffsetMs !== null && meanOffsetMs < -TENDENCY_MS) tips.push({ key: 'tip.strumEarly' });
  const bar = missedByBar.length > 1 ? worstBar(missedByBar) : undefined;
  if (bar !== undefined) tips.push({ key: 'tip.bar', params: { bar } });
  if (accuracy < 0.5) tips.push({ key: 'tip.listenFirst' });
  if (tips.length === 0) tips.push({ key: 'tip.almost' });
  return { tips: tips.slice(0, MAX_TIPS), missed, extras };
}

// ───────────── Devolución: improvisación ─────────────

export function improvFeedback(r: { notes: number; inScale: number; distinct: number; targetHits: number; targetTotal: number }, minNotes: number, stars: number): Tip[] {
  const tips: Tip[] = [];
  if (stars === 3) tips.push({ key: 'tip.improvGreat' });
  if (r.notes < minNotes) tips.push({ key: 'tip.improvFew', params: { count: minNotes } });
  if (r.notes > 0 && r.inScale < 0.8) tips.push({ key: 'tip.improvOut' });
  if (r.targetTotal > 0 && r.targetHits / r.targetTotal < 0.5) tips.push({ key: 'tip.improvTargets' });
  if (r.notes >= minNotes && r.distinct < 4) tips.push({ key: 'tip.improvVariety' });
  if (tips.length === 0) tips.push({ key: 'tip.improvMore' });
  return tips.slice(0, MAX_TIPS);
}

// ───────────── Vibrato y bend ─────────────

export function howToVibrato(ex: { seconds: number; minDepthCents: number }, nylon: boolean): Tip[] {
  return [
    { key: 'howTo.vibrato', params: { seconds: ex.seconds } },
    { key: nylon ? 'howTo.vibratoNylon' : 'howTo.vibratoBend' },
    { key: 'howTo.vibratoSteady' },
  ];
}

export function vibratoFeedback(o: { rateHz: number; depthCents: number; irregularity: number } | null, minDepthCents: number, rate: { min: number; max: number }, maxIrregularity: number, stars: number): Tip[] {
  if (!o) return [{ key: 'tip.vibratoNone' }];
  const tips: Tip[] = [];
  if (stars === 3) tips.push({ key: 'tip.great' });
  if (o.depthCents < minDepthCents) tips.push({ key: 'tip.vibratoNarrow', params: { depth: Math.round(o.depthCents), min: minDepthCents } });
  if (o.rateHz < rate.min) tips.push({ key: 'tip.vibratoSlow' });
  else if (o.rateHz > rate.max) tips.push({ key: 'tip.vibratoFast' });
  if (o.irregularity > maxIrregularity) tips.push({ key: 'tip.vibratoIrregular' });
  if (tips.length === 0) tips.push({ key: 'tip.almost' });
  return tips.slice(0, MAX_TIPS);
}

export function howToBend(ex: { semitones: number; reps: number; release?: boolean }): Tip[] {
  const tips: Tip[] = [
    { key: ex.semitones >= 2 ? 'howTo.bendWhole' : 'howTo.bendHalf', params: { reps: ex.reps } },
    { key: 'howTo.bendFingers' },
  ];
  if (ex.release) tips.push({ key: 'howTo.bendRelease' });
  return tips;
}

export function bendFeedback(reps: number, total: number, stars: number): Tip[] {
  if (stars === 3) return [{ key: 'tip.great' }];
  if (reps === 0) return [{ key: 'tip.bendNone' }, { key: 'tip.bendFingers' }];
  return [{ key: 'tip.bendShort', params: { reps, total } }, { key: 'tip.bendFingers' }];
}
