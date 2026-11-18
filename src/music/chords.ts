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

// ───────────── Diagramas en grilla: acordes, power chords y cajas de escala ─────────────

/** Formas que se dibujan como diagrama vertical (como un acorde). */
export type DiagramId = ChordId | 'power-6' | 'power-5' | 'penta-a' | BarreId | 'octave';

export interface GridDot {
  /** 0 = 6.ª cuerda (Mi grave) … 5 = 1.ª (Mi aguda). */
  string: number;
  /** Traste real (no relativo a la grilla). */
  fret: number;
  /** Dedo que pisa (1–4). */
  finger: number;
  /** Tónica: se pinta distinta. */
  root?: boolean;
}

export interface GridDiagram {
  name: string;
  /** Cejilla: el dedo 1 acostado sobre varias cuerdas en un traste (índices de cuerda 0 = 6.ª). */
  barre?: { fret: number; from: number; to: number };
  /** Primer traste que muestra la grilla (1 = con cejuela). */
  startFret: number;
  dots: GridDot[];
  /** Arriba de cada cuerda: 'x' no suena, 'o' al aire, null nada. */
  marks: ('x' | 'o' | null)[];
}

const STRING_INDEX: Record<StringId, number> = { E: 0, A: 1, D: 2, G: 3, B: 4, e: 5 };

export function chordDiagram(id: ChordId): GridDiagram {
  const shape = CHORDS[id];
  return {
    name: id,
    startFret: 1,
    dots: shape.frets.flatMap((f, i) => (f > 0 ? [{ string: i, fret: f, finger: shape.fingers[i], root: false }] : [])),
    marks: shape.frets.map((f) => (f < 0 ? 'x' : f === 0 ? 'o' : null)),
  };
}

/** Power chord (quinta) con tónica en la 6.ª: G5 en el traste 3. Móvil a lo largo del mástil. */
export const POWER_6: GridDiagram = {
  name: 'G5',
  startFret: 3,
  dots: [
    { string: 0, fret: 3, finger: 1, root: true },
    { string: 1, fret: 5, finger: 3 },
  ],
  marks: [null, null, 'x', 'x', 'x', 'x'],
};

/** Power chord con tónica en la 5.ª: C5 en el traste 3. */
export const POWER_5: GridDiagram = {
  name: 'C5',
  startFret: 3,
  dots: [
    { string: 1, fret: 3, finger: 1, root: true },
    { string: 2, fret: 5, finger: 3 },
  ],
  marks: ['x', null, null, 'x', 'x', 'x'],
};

/** Pentatónica menor de La, 1.ª posición (traste 5): dos notas por cuerda. */
export const PENTA_A: GridDiagram = {
  name: 'Am',
  startFret: 5,
  dots: (
    [
      ['E', 5, 1, true],
      ['E', 8, 4, false],
      ['A', 5, 1, false],
      ['A', 7, 3, false],
      ['D', 5, 1, false],
      ['D', 7, 3, true],
      ['G', 5, 1, false],
      ['G', 7, 3, false],
      ['B', 5, 1, false],
      ['B', 8, 4, false],
      ['e', 5, 1, true],
      ['e', 8, 4, false],
    ] as [StringId, number, number, boolean][]
  ).map(([s, fret, finger, root]) => ({ string: STRING_INDEX[s], fret, finger, root })),
  marks: [null, null, null, null, null, null],
};

export function diagramOf(id: DiagramId): GridDiagram {
  if (id in BARRES) return BARRES[id as BarreId];
  if (id === 'octave') return OCTAVE;
  if (id === 'power-6') return POWER_6;
  if (id === 'power-5') return POWER_5;
  if (id === 'penta-a') return PENTA_A;
  return chordDiagram(id as ChordId);
}

/** Notas MIDI de un diagrama (las que se pisan y las cuerdas al aire). */
export function diagramMidi(d: GridDiagram): number[] {
  const open = d.marks.flatMap((m, i) => (m === 'o' ? [GUITAR.strings[i].openMidi] : []));
  // Con cejilla, las cuerdas sin otro dedo suenan en el traste de la cejilla.
  const barred = d.barre
    ? Array.from({ length: d.barre.to - d.barre.from + 1 }, (_, k) => d.barre!.from + k)
        .filter((i) => d.marks[i] !== 'x' && !d.dots.some((dot) => dot.string === i))
        .map((i) => GUITAR.strings[i].openMidi + d.barre!.fret)
    : [];
  return [...open, ...barred, ...d.dots.map((dot) => GUITAR.strings[dot.string].openMidi + dot.fret)].sort((a, b) => a - b);
}

/** Power chord de dos notas con tónica en una cuerda y traste: tónica y quinta (cuerda siguiente, 2 trastes arriba). */
export function powerMidi(root: 'E' | 'A' | 'D', fret: number): number[] {
  const r = midiOn(GUITAR, root, fret);
  return [r, r + 7];
}

// ───────────── Acordes con cejilla (nivel 3) ─────────────

/**
 * Forma de E con cejilla: mayor (1 3 3 2 1 1) o menor (1 3 3 1 1 1), móvil por la 6.ª cuerda.
 * Forma de A con cejilla: mayor (x 1 3 3 3 1) o menor (x 1 3 3 2 1), móvil por la 5.ª.
 */
export function eShape(name: string, fret: number, minor: boolean): GridDiagram {
  return {
    name,
    startFret: fret,
    barre: { fret, from: 0, to: 5 },
    dots: [
      { string: 0, fret, finger: 1, root: true },
      { string: 1, fret: fret + 2, finger: 3 },
      { string: 2, fret: fret + 2, finger: 4 },
      ...(minor ? [] : [{ string: 3, fret: fret + 1, finger: 2 }]),
    ],
    marks: [null, null, null, null, null, null],
  };
}

export function aShape(name: string, fret: number, minor: boolean): GridDiagram {
  return {
    name,
    startFret: fret,
    barre: { fret, from: 1, to: 5 },
    dots: [
      { string: 1, fret, finger: 1, root: true },
      { string: 2, fret: fret + 2, finger: minor ? 3 : 2 },
      { string: 3, fret: fret + 2, finger: minor ? 4 : 3 },
      { string: 4, fret: fret + (minor ? 1 : 2), finger: minor ? 2 : 4 },
    ],
    marks: ['x', null, null, null, null, null],
  };
}

export type BarreId = 'bar-f' | 'bar-fm' | 'bar-g' | 'bar-am' | 'bar-bb' | 'bar-c' | 'bar-cm' | 'bar-dm';

export const BARRES: Record<BarreId, GridDiagram> = {
  'bar-f': eShape('F', 1, false),
  'bar-fm': eShape('Fm', 1, true),
  'bar-g': eShape('G', 3, false),
  'bar-am': eShape('Am', 5, true),
  'bar-bb': aShape('Bb', 1, false),
  'bar-c': aShape('C', 3, false),
  'bar-cm': aShape('Cm', 3, true),
  'bar-dm': aShape('Dm', 5, true),
};

/** Octavas: la nota de la 6.ª cuerda se repite dos cuerdas más arriba, dos trastes más adelante. */
export const OCTAVE: GridDiagram = {
  name: '8va',
  startFret: 3,
  dots: [
    { string: 0, fret: 3, finger: 1, root: true },
    { string: 2, fret: 5, finger: 3, root: true },
  ],
  marks: [null, 'x', null, 'x', 'x', 'x'],
};
