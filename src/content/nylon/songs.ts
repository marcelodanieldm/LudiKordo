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
import { QUARTERS, BALLAD } from '../../music/strum';
import { songRequires } from './chordbook';
import { pimaBar, pimiBar } from './helpers';

type B = 0.5 | 1 | 2 | 4;
const n = (string: StringId, fret: number, beats: B = 1): ScoreEvent => ({ string, fret, beats });
const k = (id: string, key: string) => `content.song.${id.replace(/-/g, '_')}.${key}`;
const song = (s: Omit<Song, 'titleKey' | 'descriptionKey'>): Song => ({ ...s, titleKey: k(s.id, 'title'), descriptionKey: k(s.id, 'desc') });

/** Canción en la que el alumno toca los acordes en p-i-m-i: la línea sale del cifrado. */
const pimiSong = (chords: OpenChordId[]) => ({ chords: [...chords], line: chords.flatMap(pimiBar), requiresChords: chords });

const RUTA_3 = pimiSong(['Em', 'Em', 'D', 'D', 'A', 'A', 'Em', 'Em']);

/** Postal de domingo: p-i-m-a sobre G, C, D y Em (2.5). */
const POSTAL: OpenChordId[] = ['G', 'C', 'D', 'Em', 'G', 'C', 'D', 'G'];

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
];

/** Géneros con canciones en la criolla (se suman jazz, bossa y música popular con sus niveles). */
export const NYLON_GENRES = ['pop', 'rock', 'blues'] as const;
