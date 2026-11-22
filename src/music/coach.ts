/**
 * Devolución al final de la práctica en vivo: un titular según las estrellas y
 * hasta tres consejos, empezando por el error que más pesó (notas perdidas, notas
 * equivocadas, tiempo). Lógica pura: devuelve claves de i18n (`ui.drills.coach.*`)
 * con sus parámetros; la pantalla solo las traduce.
 */
import type { InstrumentProfile, InstrumentString } from '../instruments/profiles';
import type { ScoreEvent } from '../content/types';

export type Verdicts = Record<'hit' | 'early' | 'late' | 'wrong' | 'miss', number>;

export interface CoachInput {
  category: string;
  stars: number;
  accuracy: number;
  counts: Verdicts;
  /** Desvío medio de los aciertos en ms (+ = tarde), o null si no hubo aciertos. */
  meanOffset: number | null;
  bpm: number;
  /** Tempos del selector, de menor a mayor (el primero es el lento). */
  tempos: number[];
  /** Tempo que se acaba de desbloquear con 3 estrellas. */
  unlocked?: number;
  improv?: { notes: number; inScale: number; required: number };
  /** Sin micrófono: no hubo puntaje. */
  unscored?: boolean;
}

export interface CoachTip {
  key: string;
  params?: Record<string, number>;
}

export interface Coaching {
  headline: string;
  tips: CoachTip[];
}

/** Desvío medio a partir del cual se habla de adelantarse o atrasarse (igual que antes en la pantalla). */
export const RUSH_DRAG_MS = 25;
export const MISS_SHARE = 0.25;
export const WRONG_SHARE = 0.15;
export const UNSTEADY_SHARE = 0.3;
export const SLOWER_BELOW = 0.6;
export const IN_SCALE_OK = 0.7;
export const MAX_TIPS = 3;

const P = 'ui.drills.coach.';

export function coach(input: CoachInput): Coaching {
  const categoryTip: CoachTip = { key: `${P}cat.${input.category}` };
  if (input.unscored) return { headline: `${P}unscored`, tips: [categoryTip] };

  const headline = `${P}headline.${Math.max(0, Math.min(3, Math.round(input.stars)))}`;
  const tips: CoachTip[] = [];
  const slowest = input.tempos[0] ?? input.bpm;
  const fastest = input.tempos[input.tempos.length - 1] ?? input.bpm;

  if (input.improv) {
    const { notes, inScale, required } = input.improv;
    if (notes < required) tips.push({ key: `${P}improvFew`, params: { n: notes, required } });
    if (notes > 0 && inScale < IN_SCALE_OK) tips.push({ key: `${P}improvOutside`, params: { percent: Math.round(inScale * 100) } });
    if (tips.length === 0) tips.push({ key: `${P}improvTarget` });
  } else {
    const c = input.counts;
    const total = c.hit + c.early + c.late + c.wrong + c.miss;
    if (total > 0) {
      if (c.miss / total >= MISS_SHARE) tips.push({ key: `${P}misses`, params: { n: c.miss } });
      if (c.wrong / total >= WRONG_SHARE) tips.push({ key: `${P}wrong`, params: { n: c.wrong } });
      const off = input.meanOffset;
      if (off !== null && off < -RUSH_DRAG_MS) tips.push({ key: `${P}rushing` });
      else if (off !== null && off > RUSH_DRAG_MS) tips.push({ key: `${P}dragging` });
      else if ((c.early + c.late) / total >= UNSTEADY_SHARE) tips.push({ key: `${P}unsteady` });
    }
    if (input.accuracy < SLOWER_BELOW && input.bpm > slowest) tips.push({ key: `${P}slower`, params: { bpm: slowest } });
  }

  if (input.stars >= 3) {
    if (input.unlocked) tips.unshift({ key: `${P}faster`, params: { bpm: input.unlocked } });
    else if (input.bpm >= fastest) tips.unshift({ key: `${P}mastered` });
  }

  const out = tips.slice(0, MAX_TIPS - 1);
  out.push(categoryTip);
  return { headline, tips: out };
}

/**
 * Frase de ejemplo para la improvisación: la escala en la primera posición
 * (trastes 0 a 4), subiendo desde la nota más grave que pertenece a la escala,
 * y bajando de vuelta hasta la tónica: hasta `count - 1` notas, en dos compases de 4.
 */
export function improvExample(scale: readonly number[], strings: InstrumentProfile['strings'], count = 8): ScoreEvent[] {
  const pcs = new Set(scale.map((p) => ((p % 12) + 12) % 12));
  const seen = new Set<number>();
  const up: { s: InstrumentString; fret: number; midi: number }[] = [];
  const ordered = [...strings].sort((a, b) => a.openMidi - b.openMidi);
  for (const s of ordered) {
    for (let fret = 0; fret <= 4; fret++) {
      const midi = s.openMidi + fret;
      if (pcs.has(midi % 12) && !seen.has(midi)) {
        seen.add(midi);
        up.push({ s, fret, midi });
      }
    }
  }
  up.sort((a, b) => a.midi - b.midi);
  if (up.length === 0) return [];
  // Empieza en la tónica (la primera clase de altura de la escala) si está en la posición.
  const root = ((scale[0] % 12) + 12) % 12;
  const from = Math.max(0, up.findIndex((n) => n.midi % 12 === root));
  const half = Math.ceil(count / 2);
  const rise = up.slice(from, from + half);
  const fall = rise.slice(0, -1).reverse();
  const phrase = [...rise, ...fall].slice(0, count - 1);
  // La última nota (la tónica, al volver) dura dos tiempos: la frase llena dos compases de 4.
  return phrase.map((n, i) => ({ string: n.s.id, fret: n.fret, beats: i === phrase.length - 1 ? 2 : 1 }));
}
