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

/** Acordes de séptima abiertos (guitarra criolla, módulos 2.2 y 2.3). */
export type SeventhId = 'E7' | 'A7' | 'D7' | 'G7' | 'Em7' | 'Am7';

export const SEVENTHS: Record<SeventhId, ChordShape> = {
  E7: { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], root: 4, minor: false },
  A7: { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0], root: 9, minor: false },
  D7: { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3], root: 2, minor: false },
  G7: { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], root: 7, minor: false },
  Em7: { frets: [0, 2, 0, 0, 3, 0], fingers: [0, 2, 0, 0, 3, 0], root: 4, minor: true },
  Am7: { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0], root: 9, minor: true },
};

/** Acorde abierto (tríada o séptima) por nombre. */
export type OpenChordId = ChordId | SeventhId;

export function shapeOf(id: OpenChordId): ChordShape {
  return id in CHORDS ? CHORDS[id as ChordId] : SEVENTHS[id as SeventhId];
}

/** Clases de altura de un acorde de séptima: tónica, tercera, quinta y séptima menor. */
export function seventhPitchClasses(id: SeventhId): number[] {
  const { root, minor } = SEVENTHS[id];
  return [root, (root + (minor ? 3 : 4)) % 12, (root + 7) % 12, (root + 10) % 12];
}

/** Las notas (MIDI) que suenan al rasguear el acorde, de grave a agudo. */
export function chordMidi(id: OpenChordId): number[] {
  const shape = shapeOf(id);
  return GUITAR.strings.flatMap((s, i) => (shape.frets[i] < 0 ? [] : [midiOn(GUITAR, s.id as StringId, shape.frets[i])]));
}

/** Clases de altura que debe tener el acorde: tónica, tercera (mayor o menor) y quinta. */
export function triadPitchClasses(id: ChordId): number[] {
  const { root, minor } = CHORDS[id];
  return [root, (root + (minor ? 3 : 4)) % 12, (root + 7) % 12];
}

// ───────────── Diagramas en grilla: acordes, power chords y cajas de escala ─────────────

/** Formas que se dibujan como diagrama vertical (como un acorde). */
export type DiagramId = ChordId | SeventhId | NylonGridId | 'power-6' | 'power-5' | 'penta-a' | BarreId | 'octave' | ScaleGridId;

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

export function chordDiagram(id: OpenChordId): GridDiagram {
  const shape = shapeOf(id);
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

// ───────────── Escalas, tríadas y notas dobles (nivel 4) ─────────────

/**
 * Grilla de una posición de escala: `pos` es el traste del dedo 1; cada traste
 * va con el dedo que le toca (los de más abajo con el 1, los estirados con el 4).
 */
export function scaleGrid(name: string, pos: number, notes: [StringId, number][], rootPc: number): GridDiagram {
  return {
    name,
    startFret: Math.min(...notes.map(([, f]) => f)),
    dots: notes.map(([s, fret]) => ({
      string: STRING_INDEX[s],
      fret,
      finger: Math.min(4, Math.max(1, fret - pos + 1)),
      root: (midiOn(GUITAR, s, fret) - rootPc) % 12 === 0,
    })),
    marks: [null, null, null, null, null, null],
  };
}

/** Forma con dedos elegidos a mano (tríadas, notas dobles); las cuerdas sin nota no suenan. */
function shapeGrid(name: string, notes: [StringId, number, number][], rootPc: number): GridDiagram {
  const used = new Set(notes.map(([s]) => STRING_INDEX[s]));
  return {
    name,
    startFret: Math.min(...notes.map(([, f]) => f)),
    dots: notes.map(([s, fret, finger]) => ({ string: STRING_INDEX[s], fret, finger, root: (midiOn(GUITAR, s, fret) - rootPc) % 12 === 0 })),
    marks: [0, 1, 2, 3, 4, 5].map((i) => (used.has(i) ? null : 'x')),
  };
}

const A = 9;
/** Las cinco cajas de la pentatónica menor de La, de grave a agudo en cada cuerda. */
export const PENTA_BOXES: Record<1 | 2 | 3 | 4 | 5, [StringId, number][]> = {
  1: [['E', 5], ['E', 8], ['A', 5], ['A', 7], ['D', 5], ['D', 7], ['G', 5], ['G', 7], ['B', 5], ['B', 8], ['e', 5], ['e', 8]],
  2: [['E', 8], ['E', 10], ['A', 7], ['A', 10], ['D', 7], ['D', 10], ['G', 7], ['G', 9], ['B', 8], ['B', 10], ['e', 8], ['e', 10]],
  3: [['E', 10], ['E', 12], ['A', 10], ['A', 12], ['D', 10], ['D', 12], ['G', 9], ['G', 12], ['B', 10], ['B', 13], ['e', 10], ['e', 12]],
  4: [['E', 12], ['E', 15], ['A', 12], ['A', 15], ['D', 12], ['D', 14], ['G', 12], ['G', 14], ['B', 13], ['B', 15], ['e', 12], ['e', 15]],
  5: [['E', 3], ['E', 5], ['A', 3], ['A', 5], ['D', 2], ['D', 5], ['G', 2], ['G', 5], ['B', 3], ['B', 5], ['e', 3], ['e', 5]],
};
const BOX_POS = { 1: 5, 2: 7, 3: 9, 4: 12, 5: 2 } as const;

/** Sol mayor en 2.ª posición y La menor natural en 5.ª: las dos posiciones del módulo 4.3. */
export const MAJOR_G_NOTES: [StringId, number][] = [
  ['E', 3], ['E', 5], ['A', 2], ['A', 3], ['A', 5], ['D', 2], ['D', 4], ['D', 5], ['G', 2], ['G', 4], ['G', 5], ['B', 3], ['B', 5], ['e', 2], ['e', 3], ['e', 5],
];
export const MINOR_A_NOTES: [StringId, number][] = [
  ['E', 5], ['E', 7], ['E', 8], ['A', 5], ['A', 7], ['A', 8], ['D', 5], ['D', 7], ['G', 4], ['G', 5], ['G', 7], ['B', 5], ['B', 6], ['B', 8], ['e', 5], ['e', 7], ['e', 8],
];

export type ScaleGridId =
  | 'penta-2'
  | 'penta-3'
  | 'penta-4'
  | 'penta-5'
  | 'major-g'
  | 'minor-a'
  | 'dorian-a'
  | 'mixo-a'
  | 'phryg-a'
  | 'triad-d'
  | 'triad-dm'
  | 'dstop-12'
  | 'dstop-23';

/** Modos de La en 5.ª posición, una octava desde la 6.ª cuerda (módulo 4.4). */
export const DORIAN_A_NOTES: [StringId, number][] = [['E', 5], ['E', 7], ['E', 8], ['A', 5], ['A', 7], ['A', 9], ['D', 5], ['D', 7]];
export const MIXO_A_NOTES: [StringId, number][] = [['E', 5], ['E', 7], ['E', 9], ['A', 5], ['A', 7], ['A', 9], ['D', 5], ['D', 7]];
export const PHRYG_A_NOTES: [StringId, number][] = [['E', 5], ['E', 6], ['E', 8], ['A', 5], ['A', 7], ['A', 8], ['D', 5], ['D', 7]];

export const SCALE_GRIDS: Record<ScaleGridId, GridDiagram> = {
  'penta-2': scaleGrid('Am', BOX_POS[2], PENTA_BOXES[2], A),
  'penta-3': scaleGrid('Am', BOX_POS[3], PENTA_BOXES[3], A),
  'penta-4': scaleGrid('Am', BOX_POS[4], PENTA_BOXES[4], A),
  'penta-5': scaleGrid('Am', BOX_POS[5], PENTA_BOXES[5], A),
  'major-g': scaleGrid('G', 2, MAJOR_G_NOTES, 7),
  'minor-a': scaleGrid('Am', 5, MINOR_A_NOTES, A),
  'dorian-a': scaleGrid('A', 5, DORIAN_A_NOTES, A),
  'mixo-a': scaleGrid('A', 5, MIXO_A_NOTES, A),
  'phryg-a': scaleGrid('A', 5, PHRYG_A_NOTES, A),
  // Tríadas en las tres cuerdas agudas (forma de Re abierto, movible).
  'triad-d': shapeGrid('D', [['G', 7, 2], ['B', 7, 3], ['e', 5, 1]], 2),
  'triad-dm': shapeGrid('Dm', [['G', 7, 3], ['B', 6, 2], ['e', 5, 1]], 2),
  // Notas dobles: 1.ª y 2.ª con un dedo; 3.ª y 2.ª con dos.
  'dstop-12': shapeGrid('', [['B', 8, 3], ['e', 8, 3]], A),
  'dstop-23': shapeGrid('', [['G', 7, 1], ['B', 8, 2]], A),
};

export function diagramOf(id: DiagramId): GridDiagram {
  if (id in SCALE_GRIDS) return SCALE_GRIDS[id as ScaleGridId];
  if (id in BARRES) return BARRES[id as BarreId];
  if (id in NYLON_GRIDS) return NYLON_GRIDS[id as NylonGridId];
  if (id === 'octave') return OCTAVE;
  if (id === 'power-6') return POWER_6;
  if (id === 'power-5') return POWER_5;
  if (id === 'penta-a') return PENTA_A;
  return chordDiagram(id as OpenChordId);
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

export type BarreId = 'bar-f' | 'bar-fm' | 'bar-g' | 'bar-am' | 'bar-bb' | 'bar-c' | 'bar-cm' | 'bar-dm' | 'bar-c8' | 'bar-only';

export const BARRES: Record<BarreId, GridDiagram> = {
  'bar-f': eShape('F', 1, false),
  'bar-fm': eShape('Fm', 1, true),
  'bar-g': eShape('G', 3, false),
  'bar-am': eShape('Am', 5, true),
  'bar-bb': aShape('Bb', 1, false),
  'bar-c': aShape('C', 3, false),
  'bar-cm': aShape('Cm', 3, true),
  'bar-dm': aShape('Dm', 5, true),
  'bar-c8': eShape('C', 8, false),
  // Solo la cejilla, sin otros dedos (3.5.1).
  'bar-only': { name: '', startFret: 5, barre: { fret: 5, from: 0, to: 5 }, dots: [], marks: [null, null, null, null, null, null] },
};

/** Cejilla forma de E7 (1 3 1 2 1 1), móvil por la 6.ª. */
export function eShape7(name: string, fret: number): GridDiagram {
  return {
    name,
    startFret: fret,
    barre: { fret, from: 0, to: 5 },
    dots: [
      { string: 0, fret, finger: 1, root: true },
      { string: 1, fret: fret + 2, finger: 3 },
      { string: 3, fret: fret + 1, finger: 2 },
    ],
    marks: [null, null, null, null, null, null],
  };
}

/** Cejilla forma de Am7 (x 1 3 1 2 1), móvil por la 5.ª. */
export function aShapeM7(name: string, fret: number): GridDiagram {
  return {
    name,
    startFret: fret,
    barre: { fret, from: 1, to: 5 },
    dots: [
      { string: 1, fret, finger: 1, root: true },
      { string: 2, fret: fret + 2, finger: 3 },
      { string: 4, fret: fret + 1, finger: 2 },
    ],
    marks: ['x', null, null, null, null, null],
  };
}

/** Diagramas de la guitarra criolla, nivel 3: media cejilla, cejillas movidas y B7, C7. */
export type NylonGridId =
  | 'fmaj7' | 'f-half' | 'bm-half' | 'bar-f7' | 'bar-fsm' | 'bar-gm' | 'bar-bbm' | 'bar-bm7' | 'bar-csm' | 'b7' | 'c7'
  | 'cmaj7' | 'dm7' | 'gmaj7' | 'bm7b5' | 'gm7' | 'bbmaj7' | 'em7b5' | 'a7b9' | 'c69' | 'dm6' | 'g13' | 'gsdim7'
  | 'c-e' | 'g-b' | 'd-fs';

export const NYLON_GRIDS: Record<NylonGridId, GridDiagram> = {
  fmaj7: {
    name: 'Fmaj7',
    startFret: 1,
    dots: [
      { string: 2, fret: 3, finger: 3 },
      { string: 3, fret: 2, finger: 2 },
      { string: 4, fret: 1, finger: 1 },
    ],
    marks: ['x', 'x', null, null, null, 'o'],
  },
  // Media cejilla: el dedo 1 acostado sobre la 2.ª y la 1.ª.
  'f-half': {
    name: 'F',
    startFret: 1,
    barre: { fret: 1, from: 4, to: 5 },
    dots: [
      { string: 2, fret: 3, finger: 3, root: true },
      { string: 3, fret: 2, finger: 2 },
    ],
    marks: ['x', 'x', null, null, null, null],
  },
  // Bm en las 4 cuerdas agudas, con el dedo 1 en la 1.ª (paso previo a la cejilla).
  'bm-half': {
    name: 'Bm',
    startFret: 2,
    dots: [
      { string: 2, fret: 4, finger: 3 },
      { string: 3, fret: 4, finger: 4, root: true },
      { string: 4, fret: 3, finger: 2 },
      { string: 5, fret: 2, finger: 1 },
    ],
    marks: ['x', 'x', null, null, null, null],
  },
  'bar-f7': eShape7('F7', 1),
  'bar-fsm': eShape('F#m', 2, true),
  'bar-gm': eShape('Gm', 3, true),
  'bar-bbm': aShape('Bbm', 1, true),
  'bar-bm7': aShapeM7('Bm7', 2),
  'bar-csm': aShape('C#m', 4, true),
  b7: {
    name: 'B7',
    startFret: 1,
    dots: [
      { string: 1, fret: 2, finger: 2, root: true },
      { string: 2, fret: 1, finger: 1 },
      { string: 3, fret: 2, finger: 3 },
      { string: 5, fret: 2, finger: 4 },
    ],
    marks: ['x', null, null, null, 'o', null],
  },
  c7: {
    name: 'C7',
    startFret: 1,
    dots: [
      { string: 1, fret: 3, finger: 3, root: true },
      { string: 2, fret: 2, finger: 2 },
      { string: 3, fret: 3, finger: 4 },
      { string: 4, fret: 1, finger: 1 },
    ],
    marks: ['x', null, null, null, null, 'o'],
  },
  // ── Nivel 4: cuatríadas (4.1), acordes de jazz (4.2) y de bossa (4.3) ──
  // Todos con la 1.ª sonando, para que sirvan con p-i-m-a.
  cmaj7: {
    name: 'Cmaj7',
    startFret: 1,
    dots: [
      { string: 1, fret: 3, finger: 3, root: true },
      { string: 2, fret: 2, finger: 2 },
    ],
    marks: ['x', null, null, 'o', 'o', 'o'],
  },
  dm7: {
    name: 'Dm7',
    startFret: 1,
    barre: { fret: 1, from: 4, to: 5 },
    dots: [{ string: 3, fret: 2, finger: 2 }],
    marks: ['x', 'x', 'o', null, null, null],
  },
  gmaj7: {
    name: 'Gmaj7',
    startFret: 1,
    dots: [
      { string: 0, fret: 3, finger: 3, root: true },
      { string: 1, fret: 2, finger: 2 },
      { string: 5, fret: 2, finger: 1 },
    ],
    marks: [null, null, 'o', 'o', 'o', null],
  },
  bm7b5: {
    name: 'Bm7b5',
    startFret: 1,
    dots: [
      { string: 1, fret: 2, finger: 2, root: true },
      { string: 3, fret: 2, finger: 3 },
      { string: 5, fret: 1, finger: 1 },
    ],
    marks: ['x', null, 'o', null, 'o', null],
  },
  gm7: {
    name: 'Gm7',
    startFret: 3,
    barre: { fret: 3, from: 0, to: 5 },
    dots: [
      { string: 0, fret: 3, finger: 1, root: true },
      { string: 1, fret: 5, finger: 3 },
    ],
    marks: [null, null, null, null, null, null],
  },
  bbmaj7: {
    name: 'Bbmaj7',
    startFret: 1,
    barre: { fret: 1, from: 1, to: 5 },
    dots: [
      { string: 1, fret: 1, finger: 1, root: true },
      { string: 2, fret: 3, finger: 3 },
      { string: 3, fret: 2, finger: 2 },
      { string: 4, fret: 3, finger: 4 },
    ],
    marks: ['x', null, null, null, null, null],
  },
  em7b5: {
    name: 'Em7b5',
    startFret: 1,
    dots: [
      { string: 1, fret: 1, finger: 1 },
      { string: 4, fret: 3, finger: 3 },
    ],
    marks: ['o', null, 'o', 'o', null, 'o'],
  },
  a7b9: {
    name: 'A7b9',
    startFret: 1,
    dots: [
      { string: 2, fret: 2, finger: 1 },
      { string: 3, fret: 3, finger: 3 },
      { string: 4, fret: 2, finger: 2 },
      { string: 5, fret: 3, finger: 4 },
    ],
    marks: ['x', 'o', null, null, null, null],
  },
  c69: {
    name: 'C6/9',
    startFret: 1,
    barre: { fret: 2, from: 2, to: 3 },
    dots: [
      { string: 1, fret: 3, finger: 2, root: true },
      { string: 4, fret: 3, finger: 3 },
      { string: 5, fret: 3, finger: 4 },
    ],
    marks: ['x', null, null, null, null, null],
  },
  dm6: {
    name: 'Dm6',
    startFret: 1,
    dots: [
      { string: 3, fret: 2, finger: 2 },
      { string: 5, fret: 1, finger: 1 },
    ],
    marks: ['x', 'x', 'o', null, 'o', null],
  },
  g13: {
    name: 'G13',
    startFret: 3,
    dots: [
      { string: 0, fret: 3, finger: 1, root: true },
      { string: 2, fret: 3, finger: 2 },
      { string: 3, fret: 4, finger: 3 },
      { string: 4, fret: 5, finger: 4 },
    ],
    marks: [null, 'x', null, null, null, 'o'],
  },
  gsdim7: {
    name: 'G#dim7',
    startFret: 3,
    barre: { fret: 3, from: 2, to: 4 },
    dots: [
      { string: 0, fret: 4, finger: 2, root: true },
      { string: 3, fret: 4, finger: 3 },
      { string: 5, fret: 4, finger: 4 },
    ],
    marks: [null, 'x', null, null, null, null],
  },
  // ── Nivel 5: acordes con bajo indicado (5.2), para la conducción de voces y los bajos caminantes ──
  'c-e': {
    name: 'C/E',
    startFret: 1,
    dots: [
      { string: 1, fret: 3, finger: 3 },
      { string: 2, fret: 2, finger: 2 },
      { string: 4, fret: 1, finger: 1 },
    ],
    marks: ['o', null, null, 'o', null, 'o'],
  },
  'g-b': {
    name: 'G/B',
    startFret: 1,
    dots: [
      { string: 1, fret: 2, finger: 1 },
      { string: 4, fret: 3, finger: 3 },
      { string: 5, fret: 3, finger: 4 },
    ],
    marks: ['x', null, 'o', 'o', null, null],
  },
  'd-fs': {
    name: 'D/F#',
    startFret: 1,
    dots: [
      { string: 0, fret: 2, finger: 1 },
      { string: 3, fret: 2, finger: 2 },
      { string: 4, fret: 3, finger: 4 },
      { string: 5, fret: 2, finger: 3 },
    ],
    marks: [null, 'x', 'o', null, null, null],
  },
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

// ───────────── Acordes por nombre (pistas del cancionero) ─────────────

const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
/** Intervalos desde la tónica de cada tipo de acorde, como un rasgueo simple de guitarra. */
const QUALITY: Record<string, number[]> = {
  '': [0, 7, 12, 16],
  m: [0, 7, 12, 15],
  '7': [0, 7, 10, 16],
  m7: [0, 7, 10, 15],
  maj7: [0, 7, 11, 16],
  m7b5: [0, 6, 10, 15],
  '7b9': [0, 7, 10, 16, 25],
  '6/9': [0, 4, 9, 14, 19],
  m6: [0, 7, 9, 15],
  '13': [0, 7, 10, 16, 21],
  dim7: [0, 6, 9, 15],
  '5': [0, 7, 12],
};

/**
 * Notas MIDI de un acorde escrito en cifrado americano («Am7», «F#», «Bb5»),
 * con la tónica entre Mi2 y Re♯3 (registro de las cuerdas graves de la guitarra).
 * Devuelve null si el tipo de acorde no está en la tabla.
 */
export function chordFromName(name: string): number[] | null {
  // Con bajo indicado («C/E»): el mismo acorde con esa nota abajo.
  const slash = /^(.+)\/([A-G])([#b]?)$/.exec(name);
  if (slash) {
    const upper = chordFromName(slash[1]);
    if (!upper) return null;
    const bassPc = (LETTER_PC[slash[2]] + (slash[3] === '#' ? 1 : slash[3] === 'b' ? -1 : 0) + 12) % 12;
    return [40 + ((bassPc - 4 + 12) % 12), ...upper.slice(1)];
  }
  const m = /^([A-G])([#b]?)(.*)$/.exec(name);
  if (!m || !Object.prototype.hasOwnProperty.call(QUALITY, m[3])) return null;
  const pc = (LETTER_PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12;
  const root = 40 + ((pc - 4 + 12) % 12);
  return QUALITY[m[3]].map((i) => root + i);
}
