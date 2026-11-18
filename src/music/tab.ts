/**
 * Tablatura (lógica pura): compases, posición de cada nota y figura rítmica.
 * 4/4 con redondas, blancas, negras y corcheas, y silencios (la guitarra usa
 * tablatura también para las partituras con corcheas y silencios).
 */
import type { ScoreEvent, TabNote } from '../content/types';

export const BEATS_PER_BAR = 4;

export type Figure = 'whole' | 'half' | 'quarter' | 'eighth';

export function figureOf(beats: number): Figure {
  return beats >= 4 ? 'whole' : beats >= 2 ? 'half' : beats >= 1 ? 'quarter' : 'eighth';
}

/** Un evento de tablatura: nota de `TabNote` o cualquier evento de partitura (con corcheas y silencios). */
export type TabEvent = TabNote | ScoreEvent;

export function isTabRest(e: TabEvent): e is { rest: true; beats: ScoreEvent['beats'] } {
  return 'rest' in e;
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
export function placeNotes(notes: TabNote[]): PlacedNote[];
export function placeNotes<T extends { beats: number }>(notes: T[]): (T & { startBeat: number; bar: number; beatInBar: number })[];
export function placeNotes<T extends { beats: number }>(notes: T[]) {
  let beat = 0;
  return notes.map((n) => {
    const placed = { ...n, startBeat: beat, bar: Math.floor(beat / BEATS_PER_BAR), beatInBar: beat % BEATS_PER_BAR };
    beat += n.beats;
    return placed;
  });
}

export function totalBeats(notes: TabEvent[]): number {
  return notes.reduce((a, n) => a + n.beats, 0);
}

/**
 * Comprueba que la tablatura esté bien escrita: compases completos y ninguna
 * nota que cruce la barra de compás.
 */
export function barsAreComplete(notes: TabEvent[]): boolean {
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
/** Con corcheas, dos notas por pulso: hace falta más lugar. */
export const MIN_BEAT_W_EIGHTHS = 40;

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
export function layoutTab(notes: TabEvent[], width: number): TabLayout {
  const placed = placeNotes(notes);
  const bars = placed.length ? placed[placed.length - 1].bar + 1 : 0;
  const usable = width - TAB_LABEL_W - 8;
  const minBeat = notes.some((n) => n.beats < 1) ? MIN_BEAT_W_EIGHTHS : MIN_BEAT_W;
  const barsPerRow = Math.max(1, Math.floor(usable / (BEATS_PER_BAR * minBeat)));
  const beatW = Math.max(minBeat, usable / (barsPerRow * BEATS_PER_BAR));
  const rows = Math.ceil(bars / barsPerRow);
  return {
    barsPerRow,
    rows,
    beatW,
    barsInRow: Array.from({ length: rows }, (_, r) => Math.min(barsPerRow, bars - r * barsPerRow)),
    notes: placed.map((n) => {
      const beatInRow = (n.bar % barsPerRow) * BEATS_PER_BAR + n.beatInBar;
      // Una corchea ocupa medio pulso: se centra en su mitad.
      return { row: Math.floor(n.bar / barsPerRow), x: TAB_LABEL_W + beatInRow * beatW + (Math.min(1, n.beats) * beatW) / 2 };
    }),
    width: Math.max(width, TAB_LABEL_W + 8 + barsPerRow * BEATS_PER_BAR * beatW),
  };
}
