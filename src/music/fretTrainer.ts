/**
 * Entrenador del mástil (lógica pura): «¿dónde está esta nota en esta cuerda?»
 * durante un minuto. Las notas que más fallas o más tardas aparecen más seguido.
 * Se contesta tocando el diapasón de la pantalla o tocando el instrumento.
 */
import type { InstrumentString, StringId } from '../instruments/profiles';

export const ROUND_MS = 60_000;
/** Respuestas lentas (ms) cuentan como «a repasar» aunque sean correctas. */
export const SLOW_MS = 4000;

export type ScopeId = 'low' | 'twelve' | 'all';

export interface Scope {
  id: ScopeId;
  /** Último traste que entra (desde el 0, la cuerda al aire). */
  frets: number;
  /** Solo notas naturales (sin sostenidos ni bemoles). */
  naturals: boolean;
}

/** Tres etapas, como en los mejores entrenadores: primeros trastes, hasta el 12 y con alteraciones. */
export const SCOPES: Scope[] = [
  { id: 'low', frets: 5, naturals: true },
  { id: 'twelve', frets: 12, naturals: true },
  { id: 'all', frets: 12, naturals: false },
];

const NATURAL_PCS = new Set([0, 2, 4, 5, 7, 9, 11]);
const pcOf = (m: number) => ((m % 12) + 12) % 12;

export interface Question {
  string: StringId;
  pc: number;
}

/** Estadística por pregunta («cuerda:clase de altura»): aciertos, errores y respuestas lentas. */
export type Stats = Record<string, { right: number; wrong: number; slow: number }>;
export const keyOf = (q: Question) => `${q.string}:${q.pc}`;

/** Todas las preguntas de una etapa para estas cuerdas. */
export function questionsFor(scope: Scope, strings: readonly InstrumentString[]): Question[] {
  const out: Question[] = [];
  for (const s of strings) {
    const pcs = new Set<number>();
    for (let f = 0; f <= scope.frets; f++) pcs.add(pcOf(s.openMidi + f));
    for (const pc of [...pcs].sort((a, b) => a - b)) if (!scope.naturals || NATURAL_PCS.has(pc)) out.push({ string: s.id, pc });
  }
  return out;
}

/** Peso de una pregunta: las nuevas y las falladas o lentas pesan más. */
export function weightOf(stats: Stats, q: Question): number {
  const st = stats[keyOf(q)];
  if (!st) return 3;
  return 1 + (3 * (st.wrong + st.slow)) / (st.right + st.wrong + 1);
}

/**
 * La próxima pregunta: al azar con peso, nunca la misma que la anterior.
 * `rand` devuelve un número en [0, 1) (inyectable para las pruebas).
 */
export function nextQuestion(pool: Question[], stats: Stats, prev: Question | null, rand: () => number = Math.random): Question {
  const options = pool.length > 1 && prev ? pool.filter((q) => keyOf(q) !== keyOf(prev)) : pool;
  const weights = options.map((q) => weightOf(stats, q));
  let r = rand() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < options.length; i++) {
    r -= weights[i];
    if (r < 0) return options[i];
  }
  return options[options.length - 1];
}

/** Trastes de la cuerda (dentro de la etapa) donde está la nota pedida. */
export function answersOf(q: Question, scope: Scope, strings: readonly InstrumentString[]): number[] {
  const s = strings.find((x) => x.id === q.string);
  if (!s) return [];
  return Array.from({ length: scope.frets + 1 }, (_, f) => f).filter((f) => pcOf(s.openMidi + f) === q.pc);
}

/** ¿El toque en pantalla (cuerda y traste) contesta la pregunta? */
export function isTapRight(q: Question, string: StringId, fret: number, scope: Scope, strings: readonly InstrumentString[]): boolean {
  return string === q.string && answersOf(q, scope, strings).includes(fret);
}

/**
 * ¿La nota oída (MIDI) contesta la pregunta? Tiene que ser la altura exacta de
 * alguna de las posiciones en esa cuerda: la misma nota una octava más arriba
 * o en otra cuerda no cuenta como «encontrada en esta cuerda».
 */
export function isHeardRight(q: Question, midi: number, scope: Scope, strings: readonly InstrumentString[]): boolean {
  const s = strings.find((x) => x.id === q.string);
  return !!s && answersOf(q, scope, strings).some((f) => s.openMidi + f === midi);
}

/** Suma una respuesta a la estadística. */
export function record(stats: Stats, q: Question, right: boolean, ms: number): Stats {
  const k = keyOf(q);
  const cur = stats[k] ?? { right: 0, wrong: 0, slow: 0 };
  return { ...stats, [k]: { right: cur.right + (right ? 1 : 0), wrong: cur.wrong + (right ? 0 : 1), slow: cur.slow + (right && ms > SLOW_MS ? 1 : 0) } };
}

/** Las preguntas a repasar: con más errores y lentitud, las peores primero. */
export function weakest(stats: Stats, max = 3): Question[] {
  return Object.entries(stats)
    .map(([k, st]) => ({ k, score: st.wrong * 2 + st.slow - st.right * 0.5 }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(({ k }) => {
      const [string, pc] = k.split(':');
      return { string: string as StringId, pc: Number(pc) };
    });
}

export interface RoundResult {
  right: number;
  wrong: number;
  /** Tiempo medio por acierto (ms), o 0 sin aciertos. */
  meanMs: number;
}

export interface TrainerFeedback {
  headline: 'first' | 'record' | 'good' | 'keepGoing';
  /** Consejos (ui.fretTrainer.tip.*): referencias del mástil, no trucos de memoria sueltos. */
  tips: string[];
}

/**
 * Devolución de una ronda: el titular compara con el récord; los consejos son
 * las referencias que más ayudan según lo que costó (los trastes 5 y 12, las
 * octavas, los medios tonos naturales) y el instrumento.
 */
export function trainerFeedback(r: RoundResult, previousBest: number, hadHistory: boolean, scope: Scope, weak: Question[], instrument: 'bass' | 'guitar' | 'nylon'): TrainerFeedback {
  const accuracy = r.right / Math.max(1, r.right + r.wrong);
  const headline = !hadHistory ? 'first' : r.right > previousBest ? 'record' : accuracy >= 0.85 ? 'good' : 'keepGoing';
  const tips: string[] = [];
  if (accuracy < 0.7) tips.push('naturals');
  if (scope.frets > 5 && (weak.length > 0 || r.meanMs > SLOW_MS)) tips.push('twelve');
  tips.push(instrument === 'bass' ? 'fifthBass' : 'fifthGuitar');
  if (scope.frets > 5) tips.push('octave');
  if (!scope.naturals) tips.push('sharps');
  if (r.meanMs > SLOW_MS) tips.push('sayIt');
  return { headline, tips: [...new Set(tips)].slice(0, 3) };
}
