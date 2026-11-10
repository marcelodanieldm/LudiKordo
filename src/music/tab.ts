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
