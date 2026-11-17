/**
 * Tablatura (lógica pura): compases, posición de cada nota y figura rítmica.
 * Solo 4/4 con redondas, blancas y negras (nivel 1).
 */
import type { TabNote } from '../content/types';

export const BEATS_PER_BAR = 4;

export type Figure = 'whole' | 'half' | 'quarter';

export function figureOf(beats: TabNote['beats']): Figure {
  return beats === 4 ? 'whole' : beats === 2 ? 'half' : 'quarter';
}

export interface PlacedNote extends TabNote {
  /** Pulso donde empieza, desde 0. */
  startBeat: number;
  /** Compás (desde 0). */
  bar: number;
  /** Pulso dentro del compás (0–3), para contar «1 2 3 4». */
  beatInBar: number;
}

/** Ubica cada nota en el tiempo. */
export function placeNotes(notes: TabNote[]): PlacedNote[] {
  let beat = 0;
  return notes.map((n) => {
    const placed = { ...n, startBeat: beat, bar: Math.floor(beat / BEATS_PER_BAR), beatInBar: beat % BEATS_PER_BAR };
    beat += n.beats;
    return placed;
  });
}

export function totalBeats(notes: TabNote[]): number {
  return notes.reduce((a, n) => a + n.beats, 0);
}

/**
 * Comprueba que la tablatura esté bien escrita: compases completos y ninguna
 * nota que cruce la barra de compás.
 */
export function barsAreComplete(notes: TabNote[]): boolean {
  if (notes.length === 0 || totalBeats(notes) % BEATS_PER_BAR !== 0) return false;
  return placeNotes(notes).every((n) => n.beatInBar + n.beats <= BEATS_PER_BAR);
}

/** Cómo se cuenta en voz alta cada nota: «1», «1 2», «1 2 3 4»… según dónde cae. */
export function countFor(note: PlacedNote): number[] {
  return Array.from({ length: note.beats }, (_, i) => note.beatInBar + i + 1);
}

export const TAB_LABEL_W = 26;
/** Ancho mínimo de un pulso: entra la caja de una nota actual con traste de dos cifras. */
export const MIN_BEAT_W = 30;

export interface TabLayout {
  barsPerRow: number;
  rows: number;
  beatW: number;
  /** Para cada nota: renglón y x del centro. */
  notes: { row: number; x: number }[];
  /** Compases de cada renglón. */
  barsInRow: number[];
  /** Ancho total que hace falta (mayor que el disponible si no entra ni un compás). */
  width: number;
}

/**
 * Reparte la tablatura en renglones de compases enteros. Si ni un compás entra
 * con pulsos de MIN_BEAT_W, se usa un compás por renglón con el ancho mínimo y
 * `width` indica cuánto hace falta (el componente desplaza en horizontal).
 */
export function layoutTab(notes: TabNote[], width: number): TabLayout {
  const placed = placeNotes(notes);
  const bars = placed.length ? placed[placed.length - 1].bar + 1 : 0;
  const usable = width - TAB_LABEL_W - 8;
  const barsPerRow = Math.max(1, Math.floor(usable / (BEATS_PER_BAR * MIN_BEAT_W)));
  const beatW = Math.max(MIN_BEAT_W, usable / (barsPerRow * BEATS_PER_BAR));
  const rows = Math.ceil(bars / barsPerRow);
  return {
    barsPerRow,
    rows,
    beatW,
    barsInRow: Array.from({ length: rows }, (_, r) => Math.min(barsPerRow, bars - r * barsPerRow)),
    notes: placed.map((n) => {
      const beatInRow = (n.bar % barsPerRow) * BEATS_PER_BAR + n.beatInBar;
      return { row: Math.floor(n.bar / barsPerRow), x: TAB_LABEL_W + beatInRow * beatW + beatW / 2 };
    }),
    width: Math.max(width, TAB_LABEL_W + 8 + barsPerRow * BEATS_PER_BAR * beatW),
  };
}
