/**
 * Acordes abiertos de guitarra para los diagramas (lógica pura).
 *
 * `frets` y `fingers` van de la 6.ª cuerda (Mi grave) a la 1.ª (Mi aguda):
 * traste -1 = la cuerda no suena (X), 0 = al aire (O). Dedo 0 = sin dedo.
 */
import { GUITAR, midiOn, type StringId } from '../instruments/profiles';

export type ChordId = 'Em' | 'E' | 'Am' | 'A' | 'C' | 'G' | 'D' | 'Dm';

export interface ChordShape {
  frets: readonly [number, number, number, number, number, number];
  fingers: readonly [number, number, number, number, number, number];
  /** Clase de altura de la tónica (0 = Do) y si es menor. */
  root: number;
  minor: boolean;
}

export const CHORDS: Record<ChordId, ChordShape> = {
  Em: { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], root: 4, minor: true },
  E: { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], root: 4, minor: false },
  Am: { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], root: 9, minor: true },
  A: { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], root: 9, minor: false },
  C: { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], root: 0, minor: false },
  G: { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3], root: 7, minor: false },
  D: { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], root: 2, minor: false },
  Dm: { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], root: 2, minor: true },
};

/** Las notas (MIDI) que suenan al rasguear el acorde, de grave a agudo. */
export function chordMidi(id: ChordId): number[] {
  const shape = CHORDS[id];
  return GUITAR.strings.flatMap((s, i) => (shape.frets[i] < 0 ? [] : [midiOn(GUITAR, s.id as StringId, shape.frets[i])]));
}

/** Clases de altura que debe tener el acorde: tónica, tercera (mayor o menor) y quinta. */
export function triadPitchClasses(id: ChordId): number[] {
  const { root, minor } = CHORDS[id];
  return [root, (root + (minor ? 3 : 4)) % 12, (root + 7) % 12];
}
