/**
 * Entrenador de ritmo (lógica pura): cuatro compases para leer y tocar con el
 * clic, en una grilla de corcheas («1 y 2 y 3 y 4 y»). Se toca en la pantalla o
 * en el instrumento (el micrófono oye los ataques) y se mide cada nota: a
 * tiempo, adelantada, atrasada, perdida o de más.
 */
import type { Beats } from '../content/types';
import { scoreTiming } from './scoring';

export type RhythmEvent = { beats: Beats; rest?: true };
export type Bar = RhythmEvent[];
export type RhythmLevel = 1 | 2 | 3;

export const BARS_PER_ROUND = 4;
export const BEATS_PER_BAR = 4;
export const TEMPOS = [60, 70, 80, 90, 100] as const;
/** Desvío medio (ms) a partir del cual decimos «te adelantas» o «te atrasas». */
export const LEAN_MS = 25;

const n = (beats: Beats): RhythmEvent => ({ beats });
const r = (beats: Beats): RhythmEvent => ({ beats, rest: true });

/**
 * Compases por nivel. 1: negras, blancas y silencios de negra. 2: entran las
 * corcheas. 3: contratiempos (silencio de corchea y nota en el «y»).
 */
export const BAR_POOL: Record<RhythmLevel, Bar[]> = {
  1: [
    [n(1), n(1), n(1), n(1)],
    [n(2), n(1), n(1)],
    [n(1), n(1), n(2)],
    [n(1), r(1), n(1), r(1)],
    [n(2), n(2)],
    [n(1), n(1), r(1), n(1)],
    [r(1), n(1), n(1), n(1)],
    [n(4)],
  ],
  2: [
    [n(0.5), n(0.5), n(1), n(1), n(1)],
    [n(1), n(0.5), n(0.5), n(1), n(1)],
    [n(1), n(1), n(0.5), n(0.5), n(1)],
    [n(0.5), n(0.5), n(0.5), n(0.5), n(2)],
    [n(1), n(0.5), n(0.5), n(0.5), n(0.5), n(1)],
    [n(2), n(0.5), n(0.5), n(1)],
    [n(0.5), n(0.5), n(1), r(1), n(1)],
  ],
  3: [
    [n(1), r(0.5), n(0.5), n(1), n(1)],
    [r(0.5), n(0.5), n(1), n(1), n(1)],
    [n(0.5), n(1), n(0.5), n(1), n(1)],
    [n(1), n(1), r(0.5), n(0.5), n(1)],
    [n(0.5), n(0.5), r(0.5), n(0.5), n(1), n(1)],
    [n(1), r(0.5), n(0.5), r(0.5), n(0.5), n(1)],
  ],
};

/** Los compases de un nivel incluyen los de los niveles anteriores (repaso). */
export function poolFor(level: RhythmLevel): Bar[] {
  return ([1, 2, 3] as const).filter((l) => l <= level).flatMap((l) => BAR_POOL[l]);
}

/**
 * Una ronda: cuatro compases al azar, sin repetir el anterior; al menos uno
 * es del nivel elegido (para que la ronda practique lo nuevo).
 */
export function makeRound(level: RhythmLevel, rand: () => number = Math.random): Bar[] {
  const pool = poolFor(level);
  const fresh = BAR_POOL[level];
  const pick = (list: Bar[], not?: Bar) => {
    const options = list.filter((b) => b !== not);
    return options[Math.min(options.length - 1, Math.floor(rand() * options.length))];
  };
  const bars: Bar[] = [];
  const freshAt = Math.min(BARS_PER_ROUND - 1, Math.floor(rand() * BARS_PER_ROUND));
  for (let i = 0; i < BARS_PER_ROUND; i++) bars.push(pick(i === freshAt ? fresh : pool, bars[i - 1]));
  return bars;
}

/** Pulsos (desde el inicio, en negras) en que empieza cada nota (los silencios no). */
export function attackBeats(bars: Bar[]): number[] {
  const out: number[] = [];
  let at = 0;
  for (const bar of bars) {
    for (const e of bar) {
      if (!e.rest) out.push(at);
      at += e.beats;
    }
  }
  return out;
}

/** La grilla de corcheas de un compás: qué celda empieza nota, cuál la continúa y cuál es silencio. */
export type Cell = 'start' | 'hold' | 'rest';
export function cellsOf(bar: Bar): Cell[] {
  const cells: Cell[] = [];
  for (const e of bar) {
    const len = e.beats * 2;
    for (let k = 0; k < len; k++) cells.push(e.rest ? 'rest' : k === 0 ? 'start' : 'hold');
  }
  return cells;
}

export interface RhythmResult {
  hits: number;
  total: number;
  /** Toques que no corresponden a ninguna nota (en silencios o de más). */
  extras: number;
  /** Aciertos sobre (notas + toques de más), 0 a 1. */
  accuracy: number;
  /** Desvío medio de los aciertos (ms, + = tarde). */
  meanOffset: number;
  /** Notas perdidas que caían en el «y» (contratiempo) y en el pulso. */
  missedOff: number;
  missedOn: number;
  /** Cómo salió cada nota, en orden: para pintarla en la grilla. */
  marks: Mark[];
}

export type Mark = 'ok' | 'early' | 'late' | 'miss';
/** Desvío (ms) desde el que una nota acertada se marca como adelantada o atrasada. */
export const MARK_MS = 40;

/**
 * Evalúa los toques contra las notas. Cada toque se usa una vez; los que sobran
 * son «de más» y bajan la precisión (tocar en los silencios también es un error).
 */
export function gradeRhythm(bars: Bar[], bpm: number, startMs: number, taps: number[], toleranceMs: number): RhythmResult {
  const beats = attackBeats(bars);
  const step = 60000 / bpm;
  const expected = beats.map((b) => startMs + b * step);
  // Toques antes del primer pulso (con su margen) o después del final no cuentan: son la cuenta o el cierre.
  const end = startMs + BARS_PER_ROUND * BEATS_PER_BAR * step;
  const inside = taps.filter((t) => t >= startMs - toleranceMs && t <= end);
  const res = scoreTiming(expected, inside, toleranceMs);
  const extras = inside.length - res.hits;
  const offs = res.offsets.filter((o): o is number => o !== null);
  let missedOff = 0;
  let missedOn = 0;
  res.offsets.forEach((o, i) => {
    if (o !== null) return;
    if (Math.abs(beats[i] - Math.round(beats[i])) > 1e-6) missedOff += 1;
    else missedOn += 1;
  });
  return {
    hits: res.hits,
    total: res.total,
    extras,
    accuracy: res.hits / Math.max(1, res.total + extras),
    meanOffset: offs.length ? offs.reduce((a, b) => a + b, 0) / offs.length : 0,
    missedOff,
    missedOn,
    marks: res.offsets.map((o) => (o === null ? 'miss' : o < -MARK_MS ? 'early' : o > MARK_MS ? 'late' : 'ok')),
  };
}

/** Porcentaje que se guarda y se muestra. */
export const percentOf = (r: RhythmResult) => Math.round(r.accuracy * 100);

export interface RhythmFeedback {
  headline: 'great' | 'good' | 'keepGoing';
  /** Claves ui.rhythmTrainer.tip.*: tiempo, contratiempos, silencios y la mano. */
  tips: string[];
  /** Tempo sugerido para la ronda siguiente. */
  nextBpm: number;
}

/**
 * Devolución: primero el error que más pesó (adelantarse o atrasarse, los «y»,
 * tocar en los silencios) y siempre un consejo para la mano según el instrumento.
 * Con 90 % o más se sugiere subir el tempo; con menos de 60 %, bajarlo.
 */
export function rhythmFeedback(res: RhythmResult, bpm: number, instrument: 'bass' | 'guitar' | 'nylon'): RhythmFeedback {
  const pct = res.accuracy;
  const headline = pct >= 0.9 ? 'great' : pct >= 0.7 ? 'good' : 'keepGoing';
  const tips: string[] = [];
  if (res.meanOffset < -LEAN_MS) tips.push('rushing');
  else if (res.meanOffset > LEAN_MS) tips.push('dragging');
  if (res.missedOff > res.missedOn && res.missedOff > 0) tips.push('countAnd');
  if (res.extras > 0) tips.push(instrument === 'bass' ? 'restsBass' : instrument === 'nylon' ? 'restsNylon' : 'restsGuitar');
  tips.push(instrument === 'bass' ? 'handBass' : instrument === 'nylon' ? 'handNylon' : 'handGuitar');
  const i = TEMPOS.indexOf(bpm as (typeof TEMPOS)[number]);
  const nextBpm = pct >= 0.9 && i >= 0 && i < TEMPOS.length - 1 ? TEMPOS[i + 1] : pct < 0.6 && i > 0 ? TEMPOS[i - 1] : bpm;
  return { headline, tips: tips.slice(0, 3), nextBpm };
}
