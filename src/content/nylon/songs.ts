/**
 * Cancionero de guitarra criolla: canciones ORIGINALES de LudiKordo (ADR 0008 y
 * 0010). Géneros: rock, pop, blues, jazz, bossa nova y música popular. Llegan
 * nivel por nivel; el plan completo (18) está en docs/CURRICULUM-NYLON.md.
 *
 * Cuando el alumno toca los acordes (arpegio p-i-m-i), la canción se desbloquea
 * por acordes: `requires` sale de `songRequires` con los acordes que toca y la
 * técnica que usa. En las melodías, los acordes del cifrado los toca la banda y
 * solo cuenta la técnica. Textos en `content.song.n_<género>_<n>`.
 *
 * Reglas (probadas en tests/nylon.test.ts): compases completos, un acorde por
 * compás, la nota del tiempo 1 pertenece al acorde, corcheas a 80 bpm o menos.
 */
import type { StringId } from '../../instruments/profiles';
import type { ScoreEvent, Song } from '../types';
import type { OpenChordId } from '../../music/chords';
import { BALLAD, BOSSA_FINGERS, CHACARERA, CHARLESTON, QUARTERS, VALS, ZAMBA } from '../../music/strum';
import { songRequires } from './chordbook';
import { altBassBar, balladBar, pimaBar, pimiBar, steadyBassBar, waltzBar } from './helpers';
import { BLUES_A } from './level3';

type B = 0.5 | 1 | 2 | 4;
const n = (string: StringId, fret: number, beats: B = 1): ScoreEvent => ({ string, fret, beats });
const k = (id: string, key: string) => `content.song.${id.replace(/-/g, '_')}.${key}`;
const song = (s: Omit<Song, 'titleKey' | 'descriptionKey'>): Song => ({ ...s, titleKey: k(s.id, 'title'), descriptionKey: k(s.id, 'desc') });

/** Canción en la que el alumno toca los acordes en p-i-m-i: la línea sale del cifrado. */
const pimiSong = (chords: OpenChordId[]) => ({ chords: [...chords], line: chords.flatMap(pimiBar), requiresChords: chords });

const RUTA_3 = pimiSong(['Em', 'Em', 'D', 'D', 'A', 'A', 'Em', 'Em']);

/** Postal de domingo: p-i-m-a sobre G, C, D y Em (2.5). */
const POSTAL: OpenChordId[] = ['G', 'C', 'D', 'Em', 'G', 'C', 'D', 'G'];

/** Nivel 3: canciones con cejillas y blues. */
const TERRAZA = ['E', 'G', 'A', 'F#m', 'E', 'G', 'A', 'E'];
const CIUDAD = ['G', 'D', 'Bm', 'Em', 'G', 'D', 'A', 'G'];

/**
 * 3.7, música popular. En la zamba y la chacarera (6/8) el alumno toca negras de
 * 3/4 (bajo y dos notas) sobre la banda en 6/8: es la sesquiáltera de estos ritmos.
 */
const ZAMBA_SONG = ['Am', 'Am', 'Dm', 'Dm', 'E7', 'E7', 'Am', 'Am', 'Dm', 'Am', 'E7', 'Am'];
const CHACARERA_SONG = ['Am', 'E7', 'Am', 'E7', 'Dm', 'Am', 'E7', 'Am'];
const TANGO_SONG = ['Am', 'Am', 'Dm', 'Am', 'E7', 'E7', 'Am', 'Am'];
/** 4.2: dos II-V-I, en Fa mayor y en Re menor. */
const AVENIDA = ['Gm7', 'C7', 'Fmaj7', 'Fmaj7', 'Em7b5', 'A7b9', 'Dm7', 'Dm7'];
/** 4.3: la vuelta de bossa con 6/9, disminuido de paso, m6 y 13. */
const ARENA = ['C6/9', 'G#dim7', 'Am7', 'D7', 'Dm6', 'G13', 'C6/9', 'C6/9'];
const VALS_SONG = ['C', 'C', 'G7', 'G7', 'G7', 'G7', 'C', 'C', 'F', 'F', 'C', 'C', 'G7', 'G7', 'C', 'C'];

export const NYLON_SONGS: Song[] = [
  // ── Nivel 1: melodía en las agudas; la banda toca los acordes ──
  song({
    id: 'n-pop-1',
    genre: 'pop',
    level: 1,
    requires: songRequires([], ['1.5']),
    key: 'C',
    bpm: 72,
    tempoSteps: [72, 80, 90],
    chords: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'C'],
    line: [
      n('e', 0, 2), n('e', 1), n('e', 0),
      n('B', 3, 2), n('B', 0), n('B', 3),
      n('B', 1, 2), n('e', 0, 2),
      n('e', 1, 2), n('B', 1, 2),
      n('G', 0), n('B', 1), n('e', 0), n('B', 1),
      n('B', 0), n('B', 3), n('G', 0, 2),
      n('e', 1), n('e', 0), n('B', 3), n('B', 1),
      n('B', 1, 4),
    ],
    notation: 'tab',
    skills: ['technique', 'fretboard'],
    strum: BALLAD,
    tone: 'nylon',
  }),
  // ── Nivel 2: el alumno toca los acordes en p-i-m-i ──
  song({
    id: 'n-rock-1',
    genre: 'rock',
    level: 2,
    requires: songRequires(RUTA_3.requiresChords, ['1.3']),
    key: 'Em',
    bpm: 80,
    tempoSteps: [80, 90, 100],
    chords: RUTA_3.chords,
    line: RUTA_3.line,
    notation: 'tab',
    skills: ['technique', 'rhythm'],
    strum: QUARTERS,
    tone: 'nylon',
  }),
  song({
    id: 'n-pop-2',
    genre: 'pop',
    level: 2,
    requires: songRequires(POSTAL, ['2.5']),
    key: 'G',
    bpm: 76,
    tempoSteps: [76, 84, 92],
    chords: [...POSTAL],
    line: POSTAL.flatMap(pimaBar),
    notation: 'tab',
    skills: ['technique', 'rhythm'],
    strum: BALLAD,
    tone: 'nylon',
  }),
  // Melodía con la pentatónica menor; la banda toca Am, Dm y E7.
  song({
    id: 'n-blues-1',
    genre: 'blues',
    level: 2,
    requires: songRequires([], ['2.7']),
    key: 'Am',
    bpm: 70,
    tempoSteps: [70, 80, 90],
    chords: ['Am', 'Am', 'Dm', 'Am', 'E7', 'Dm', 'Am', 'Am'],
    line: [
      n('G', 2, 2), n('B', 1), n('B', 3),
      n('e', 0, 2), n('B', 3), n('B', 1),
      n('B', 3, 2), n('B', 1), n('G', 2),
      n('G', 2, 4),
      n('e', 0, 2), n('e', 3), n('e', 0),
      n('B', 3, 2), n('G', 2), n('G', 0),
      n('G', 2), n('B', 1), n('G', 2), n('G', 0),
      n('G', 2, 4),
    ],
    notation: 'tab',
    skills: ['technique', 'ear'],
    strum: QUARTERS,
    tone: 'nylon',
  }),
  // ── Nivel 3 ──
  song({
    id: 'n-rock-2',
    genre: 'rock',
    level: 3,
    requires: songRequires(TERRAZA, ['2.5']),
    key: 'E',
    bpm: 80,
    tempoSteps: [80, 90, 100],
    chords: [...TERRAZA],
    line: TERRAZA.flatMap(pimaBar),
    notation: 'tab',
    skills: ['technique', 'rhythm'],
    strum: QUARTERS,
    tone: 'nylon',
  }),
  song({
    id: 'n-pop-3',
    genre: 'pop',
    level: 3,
    requires: songRequires(CIUDAD, ['2.5']),
    key: 'G',
    bpm: 66,
    tempoSteps: [66, 72, 80],
    chords: [...CIUDAD],
    line: CIUDAD.flatMap(balladBar),
    notation: 'tab',
    skills: ['technique', 'rhythm'],
    strum: BALLAD,
    tone: 'nylon',
  }),
  song({
    id: 'n-blues-2',
    genre: 'blues',
    level: 3,
    requires: songRequires(BLUES_A, ['3.4']),
    key: 'A',
    bpm: 72,
    tempoSteps: [72, 80, 90],
    chords: [...BLUES_A],
    line: BLUES_A.flatMap(altBassBar),
    notation: 'tab',
    skills: ['technique', 'rhythm'],
    strum: QUARTERS,
    tone: 'nylon',
  }),
  // ── Nivel 3 · música popular (3.7) ──
  song({
    id: 'n-popular-1',
    genre: 'popular',
    level: 3,
    requires: songRequires(ZAMBA_SONG, ['3.7']),
    key: 'Am',
    bpm: 60,
    tempoSteps: [60, 66, 72],
    chords: [...ZAMBA_SONG],
    line: ZAMBA_SONG.flatMap(waltzBar),
    notation: 'tab',
    skills: ['technique', 'rhythm'],
    strum: ZAMBA,
    tone: 'nylon',
    beatsPerBar: 3,
    style: 'zamba',
  }),
  song({
    id: 'n-popular-2',
    genre: 'popular',
    level: 3,
    requires: songRequires(CHACARERA_SONG, ['3.7']),
    key: 'Am',
    bpm: 66,
    tempoSteps: [66, 72, 80],
    chords: [...CHACARERA_SONG],
    line: CHACARERA_SONG.flatMap(waltzBar),
    notation: 'tab',
    skills: ['technique', 'rhythm'],
    strum: CHACARERA,
    tone: 'nylon',
    beatsPerBar: 3,
    style: 'chacarera',
  }),
  song({
    id: 'n-popular-3',
    genre: 'popular',
    level: 3,
    requires: songRequires(TANGO_SONG, ['3.7']),
    key: 'Am',
    bpm: 66,
    tempoSteps: [66, 72, 80],
    chords: [...TANGO_SONG],
    line: TANGO_SONG.flatMap(steadyBassBar),
    notation: 'tab',
    skills: ['technique', 'rhythm'],
    strum: QUARTERS,
    tone: 'nylon',
    style: 'tango',
  }),
  song({
    id: 'n-popular-4',
    genre: 'popular',
    level: 3,
    requires: songRequires(VALS_SONG, ['3.7']),
    key: 'C',
    bpm: 80,
    tempoSteps: [80, 90, 100],
    chords: [...VALS_SONG],
    line: VALS_SONG.flatMap(waltzBar),
    notation: 'tab',
    skills: ['technique', 'rhythm'],
    strum: VALS,
    tone: 'nylon',
    beatsPerBar: 3,
    style: 'vals',
  }),
  // ── Nivel 4 · jazz y bossa nova ──
  song({
    id: 'n-jazz-1',
    genre: 'jazz',
    level: 4,
    requires: songRequires(AVENIDA, ['4.2']),
    key: 'F',
    bpm: 80,
    tempoSteps: [80, 90, 100],
    chords: [...AVENIDA],
    line: AVENIDA.flatMap(pimaBar),
    notation: 'tab',
    skills: ['technique', 'rhythm'],
    strum: CHARLESTON,
    tone: 'nylon',
  }),
  song({
    id: 'n-bossa-1',
    genre: 'bossa',
    level: 4,
    requires: songRequires(ARENA, ['4.3']),
    key: 'C',
    bpm: 72,
    tempoSteps: [72, 80, 90],
    chords: [...ARENA],
    line: ARENA.flatMap(altBassBar),
    notation: 'tab',
    skills: ['technique', 'rhythm'],
    strum: BOSSA_FINGERS,
    tone: 'nylon',
  }),
];

/** Géneros con canciones en la criolla. */
export const NYLON_GENRES = ['pop', 'rock', 'blues', 'popular', 'jazz', 'bossa'] as const;
