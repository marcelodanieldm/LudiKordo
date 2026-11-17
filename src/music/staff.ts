/**
 * Pentagrama en clave de fa (lógica pura): dónde va cada nota, líneas
 * adicionales, plicas, silencios, compases y renglones.
 *
 * El bajo es un instrumento transpositor: se escribe una octava más arriba de
 * lo que suena. Así la cuerda Mi al aire (E1) se escribe como E2, en la primera
 * línea adicional debajo del pentagrama.
 */
import { midiAt } from './notes';
import type { Beats, ScoreEvent } from '../content/types';

export const BEATS_PER_BAR = 4;
/** Octava que se suma al escribir: el bajo suena 8 abajo de lo escrito. */
export const WRITTEN_OCTAVE_UP = 12;

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
export type Letter = (typeof LETTERS)[number];
/** Clase de altura → letra y sostenido (se escribe con sostenidos, como en el resto de la app). */
const SPELLING: [Letter, boolean][] = [
  ['C', false], ['C', true], ['D', false], ['D', true], ['E', false], ['F', false],
  ['F', true], ['G', false], ['G', true], ['A', false], ['A', true], ['B', false],
];

export interface Spelled {
  letter: Letter;
  sharp: boolean;
  /** Octava científica (C4 = do central). */
  octave: number;
}

export function spell(midi: number): Spelled {
  const pc = ((midi % 12) + 12) % 12;
  const [letter, sharp] = SPELLING[pc];
  return { letter, sharp, octave: Math.floor(midi / 12) - 1 };
}

/** Altura escrita (MIDI) de una nota del bajo. */
export function writtenMidi(string: Parameters<typeof midiAt>[0], fret: number): number {
  return midiAt(string, fret) + WRITTEN_OCTAVE_UP;
}

/** Sol 2 (G2), la línea de abajo en clave de fa. */
const BOTTOM_LINE_STEP = 2 * 7 + LETTERS.indexOf('G');

/**
 * Posición en el pentagrama: 0 = 1.ª línea (abajo), 1 = 1.er espacio, … 8 = 5.ª línea.
 * Negativos, debajo; mayores que 8, arriba.
 */
export function staffPos(written: number): number {
  const s = spell(written);
  return s.octave * 7 + LETTERS.indexOf(s.letter) - BOTTOM_LINE_STEP;
}

/** Líneas adicionales que necesita una nota, como posiciones (pares). */
export function ledgerLines(pos: number): number[] {
  const out: number[] = [];
  for (let p = -2; p >= pos; p -= 2) out.push(p);
  for (let p = 10; p <= pos; p += 2) out.push(p);
  return out;
}

/** Plica hacia arriba debajo de la línea del medio (Re 3), hacia abajo desde ahí. */
export function stemUp(pos: number): boolean {
  return pos < 4;
}

export type NoteFigure = 'whole' | 'half' | 'quarter' | 'eighth';
export function figureOfBeats(beats: Beats): NoteFigure {
  return beats === 4 ? 'whole' : beats === 2 ? 'half' : beats === 1 ? 'quarter' : 'eighth';
}

export function isRest(e: ScoreEvent): e is { rest: true; beats: Beats } {
  return 'rest' in e;
}

export function totalBeats(events: ScoreEvent[]): number {
  return events.reduce((a, e) => a + e.beats, 0);
}

/** Compases completos y ninguna figura que cruce la barra. */
export function scoreBarsComplete(events: ScoreEvent[]): boolean {
  if (events.length === 0 || totalBeats(events) % BEATS_PER_BAR !== 0) return false;
  let beat = 0;
  for (const e of events) {
    const inBar = beat % BEATS_PER_BAR;
    if (inBar + e.beats > BEATS_PER_BAR) return false;
    beat += e.beats;
  }
  return true;
}

export interface PlacedEvent {
  event: ScoreEvent;
  startBeat: number;
  bar: number;
  /** Solo notas: posición, sostenido y plica. */
  pos?: number;
  sharp?: boolean;
  stemUp?: boolean;
  /** Índice de la otra corchea con la que comparte barra (pares en el mismo pulso). */
  beamWith?: number;
  /** Posición (en medias líneas) donde termina la plica; en corcheas unidas, la misma para las dos. */
  stemTip?: number;
}

/** Largo de una plica: 3 espacios y medio. */
export const STEM_POS = 7;

export function placeScore(events: ScoreEvent[]): PlacedEvent[] {
  let beat = 0;
  const placed: PlacedEvent[] = events.map((e) => {
    const p: PlacedEvent = { event: e, startBeat: beat, bar: Math.floor(beat / BEATS_PER_BAR) };
    if (!isRest(e)) {
      const w = writtenMidi(e.string, e.fret);
      p.pos = staffPos(w);
      p.sharp = spell(w).sharp;
      p.stemUp = stemUp(p.pos);
      p.stemTip = p.stemUp ? p.pos + STEM_POS : p.pos - STEM_POS;
    }
    beat += e.beats;
    return p;
  });
  // Dos corcheas que llenan un mismo pulso van unidas por una barra.
  for (let i = 0; i + 1 < placed.length; i++) {
    const a = placed[i];
    const b = placed[i + 1];
    if (a.event.beats === 0.5 && b.event.beats === 0.5 && !isRest(a.event) && !isRest(b.event) && Number.isInteger(a.startBeat)) {
      a.beamWith = i + 1;
      b.beamWith = i;
      // Plica común: la decide la nota más lejos de la línea del medio.
      const up = Math.abs(a.pos! - 4) >= Math.abs(b.pos! - 4) ? a.stemUp! : b.stemUp!;
      a.stemUp = up;
      b.stemUp = up;
      // La barra queda a una altura común: ninguna plica más corta que lo normal.
      const tip = up ? Math.max(a.pos!, b.pos!) + STEM_POS : Math.min(a.pos!, b.pos!) - STEM_POS;
      a.stemTip = tip;
      b.stemTip = tip;
      i++;
    }
  }
  return placed;
}

/** Ancho fijo de la clave al comienzo de cada renglón. */
export const CLEF_W = 46;
/** Ancho mínimo de un pulso: entran dos corcheas, la segunda con sostenido. */
export const MIN_STAFF_BEAT_W = 44;

export interface ScoreLayout {
  barsPerRow: number;
  rows: number;
  beatW: number;
  width: number;
  /** Por evento: renglón y x de la cabeza. */
  items: { row: number; x: number }[];
}

/** Reparte compases enteros en renglones según el ancho disponible. */
export function layoutScore(events: ScoreEvent[], width: number): ScoreLayout {
  const placed = placeScore(events);
  const bars = Math.max(1, Math.ceil(totalBeats(events) / BEATS_PER_BAR));
  const usable = Math.max(0, width - CLEF_W - 8);
  const barsPerRow = Math.max(1, Math.min(bars, Math.floor(usable / (BEATS_PER_BAR * MIN_STAFF_BEAT_W))));
  const rows = Math.ceil(bars / barsPerRow);
  const beatW = Math.max(MIN_STAFF_BEAT_W, usable / (barsPerRow * BEATS_PER_BAR));
  const items = placed.map((p) => {
    const row = Math.floor(p.bar / barsPerRow);
    const beatInRow = p.startBeat - row * barsPerRow * BEATS_PER_BAR;
    return { row, x: CLEF_W + beatInRow * beatW + beatW * 0.45 };
  });
  return { barsPerRow, rows, beatW, width: CLEF_W + barsPerRow * BEATS_PER_BAR * beatW + 8, items };
}
