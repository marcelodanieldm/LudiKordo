/**
 * Cancionero de guitarra eléctrica: 10 canciones ORIGINALES de LudiKordo, dos por
 * género (rock, pop, funk, jazz y gospel, elegidos por Marcelo). La guitarra toca
 * la melodía o el riff y la app acompaña con los acordes del cifrado. Ninguna
 * reproduce una canción con derechos (AGENTS.md). Cada una se desbloquea con los
 * módulos que usa. Textos en `content.song.g_<género>_<n>`.
 *
 * Reglas (probadas en tests/guitar.test.ts): compases completos, un acorde por
 * compás, notas del cifrado o de paso de la escala, corcheas a 80 bpm o menos al
 * empezar, sin bends (la altura se mide al atacar la nota).
 */
import type { StringId } from '../../instruments/profiles';
import type { ScoreEvent, Song } from '../types';
import { BALLAD, DOWN_EIGHTHS, EIGHTHS, HALVES, QUARTERS } from '../../music/strum';

type B = 0.5 | 1 | 2 | 4;
const n = (string: StringId, fret: number, beats: B = 1): ScoreEvent => ({ string, fret, beats });
/** Nota larga con vibrato (se marca ~ en la tablatura). */
const v = (string: StringId, fret: number, beats: B, wide = false): ScoreEvent => ({ string, fret, beats, vibrato: wide ? 'wide' : true });
const r = (beats: B): ScoreEvent => ({ rest: true, beats });
const e8 = (string: StringId, fret: number) => n(string, fret, 0.5);
const k = (id: string, key: string) => `content.song.${id.replace(/-/g, '_')}.${key}`;
const song = (s: Omit<Song, 'titleKey' | 'descriptionKey'>): Song => ({ ...s, titleKey: k(s.id, 'title'), descriptionKey: k(s.id, 'desc') });

// ───────────── Funk 1: corcheas con palm mute en Mi ─────────────
const funkBar = (): ScoreEvent[] => [e8('E', 0), e8('E', 0), { rest: true, beats: 0.5 }, e8('E', 3), e8('E', 0), { rest: true, beats: 0.5 }, e8('A', 2), e8('A', 0)];
// ───────────── Funk 2: groove dórico en La ─────────────
const dorA = (): ScoreEvent[] => [e8('E', 5), r(0.5), e8('E', 5), e8('E', 8), e8('A', 5), r(0.5), e8('A', 7), e8('E', 8)];
const dorD = (): ScoreEvent[] => [e8('A', 5), r(0.5), e8('A', 5), e8('A', 9), e8('D', 7), r(0.5), e8('D', 5), e8('A', 9)];

export const GUITAR_SONGS: Song[] = [
  // ── Nivel 1 ──
  song({
    id: 'g-pop-1',
    genre: 'pop',
    level: 1,
    requires: ['1.5'],
    key: 'C',
    bpm: 72,
    tempoSteps: [72, 80, 90],
    chords: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'C'],
    // Melodía en las tres cuerdas agudas, trastes 0 a 3.
    line: [
      n('e', 0, 2), n('B', 1), n('B', 3),
      n('B', 3, 2), n('B', 0, 2),
      n('B', 1, 2), n('G', 2, 2),
      n('G', 2), n('B', 1), n('e', 1, 2),
      n('e', 0), n('e', 1), n('e', 3, 2),
      n('e', 3), n('e', 1), n('B', 3, 2),
      n('e', 1, 2), n('B', 1), n('G', 2),
      n('B', 1, 4),
    ],
    notation: 'tab',
    skills: ['technique', 'fretboard'],
    strum: BALLAD,
    tone: 'clean',
  }),
  song({
    id: 'g-rock-1',
    genre: 'rock',
    level: 1,
    requires: ['1.5'],
    key: 'Em',
    bpm: 80,
    tempoSteps: [80, 90, 100],
    chords: ['E5', 'E5', 'A5', 'E5', 'B5', 'A5', 'E5', 'E5'],
    // Riff en las cuerdas graves, trastes 0 a 3.
    line: [
      n('E', 0), n('E', 0), n('E', 3), n('E', 0),
      n('E', 0), n('E', 3), n('A', 0), n('A', 2),
      n('A', 0), n('A', 0), n('A', 3), n('A', 0),
      n('E', 0), n('E', 0), n('E', 3), n('E', 0),
      n('A', 2, 2), n('A', 2), n('A', 0),
      n('A', 0, 2), n('A', 0), n('E', 3),
      n('E', 0), n('E', 3), n('E', 0), n('E', 2),
      n('E', 0, 4),
    ],
    notation: 'tab',
    skills: ['rhythm', 'technique'],
    strum: DOWN_EIGHTHS,
    tone: 'crunch',
  }),
  // ── Nivel 2 ──
  song({
    id: 'g-gospel-1',
    genre: 'gospel',
    level: 2,
    requires: ['2.3'],
    key: 'G',
    bpm: 70,
    tempoSteps: [70, 80, 90],
    chords: ['G', 'C', 'G', 'D', 'Em', 'C', 'D', 'G'],
    line: [
      n('B', 0, 2), n('B', 3, 2),
      n('e', 0, 2), n('B', 1, 2),
      n('B', 3), n('B', 1), n('B', 0, 2),
      n('G', 2, 2), n('e', 2, 2),
      n('e', 0, 2), n('e', 3, 2),
      n('e', 0), n('B', 3), n('B', 1, 2),
      n('B', 3, 2), n('G', 2, 2),
      n('G', 0, 4),
    ],
    notation: 'tab',
    skills: ['technique', 'fretboard'],
    strum: BALLAD,
    tone: 'clean',
  }),
  song({
    id: 'g-funk-1',
    genre: 'funk',
    level: 2,
    requires: ['2.5'],
    key: 'E',
    bpm: 72,
    tempoSteps: [72, 80, 90],
    chords: ['E7', 'E7', 'A7', 'E7'],
    line: [
      ...funkBar(),
      ...funkBar(),
      e8('A', 0), e8('A', 0), r(0.5), e8('A', 3), e8('A', 0), r(0.5), e8('D', 2), e8('D', 0),
      e8('E', 0), e8('E', 0), r(0.5), e8('E', 3), n('E', 0, 2),
    ],
    notation: 'tab',
    skills: ['rhythm', 'technique'],
    strum: EIGHTHS,
    tone: 'muted',
  }),
  // ── Nivel 3 ──
  song({
    id: 'g-rock-2',
    genre: 'rock',
    level: 3,
    requires: ['3.4'],
    key: 'Am',
    bpm: 72,
    tempoSteps: [72, 80, 90],
    chords: ['Am', 'G', 'D', 'Am', 'Am', 'G', 'D', 'Am'],
    // Solo en la caja 1 con vibrato.
    line: [
      e8('e', 5), e8('B', 8), n('B', 5), n('G', 7), n('G', 5),
      v('G', 7, 2), n('B', 8), n('B', 5),
      n('D', 7), n('G', 7), e8('G', 5), e8('G', 7), n('D', 7),
      n('D', 7), n('D', 5), v('D', 7, 2),
      n('e', 5), n('e', 8), e8('e', 5), e8('B', 8), n('B', 5),
      v('B', 8, 2), n('G', 7, 2),
      n('D', 7, 2), n('G', 7, 2),
      v('D', 7, 4, true),
    ],
    notation: 'tab',
    skills: ['technique', 'ear'],
    strum: DOWN_EIGHTHS,
    tone: 'crunch',
  }),
  song({
    id: 'g-jazz-1',
    genre: 'jazz',
    level: 4,
    // Arpegios de séptima con notas fuera de la pentatónica: pide la escala mayor.
    requires: ['4.3'],
    key: 'C',
    bpm: 76,
    tempoSteps: [76, 84, 92],
    // II – V – I en Do con una vuelta por La7.
    chords: ['Dm7', 'G7', 'Cmaj7', 'A7', 'Dm7', 'G7', 'Cmaj7', 'Cmaj7'],
    line: [
      n('G', 7), n('B', 6), n('e', 5), n('e', 8),
      n('e', 7, 2), n('B', 6), n('B', 8),
      n('B', 5, 2), n('e', 7, 2),
      n('G', 6, 2), n('B', 5), n('e', 5),
      n('e', 5), n('B', 6), n('G', 7), n('B', 6),
      n('B', 8), n('B', 6), n('G', 7), n('G', 4),
      n('G', 5, 2), n('B', 5, 2),
      n('e', 7), n('B', 5), v('e', 8, 2),
    ],
    notation: 'tab',
    skills: ['technique', 'theory'],
    strum: HALVES,
    tone: 'neck',
  }),
  song({
    id: 'g-pop-2',
    genre: 'pop',
    level: 3,
    requires: ['3.7'],
    key: 'G',
    bpm: 80,
    tempoSteps: [80, 90, 100],
    chords: ['G', 'D', 'Em', 'C', 'G', 'D', 'C', 'G'],
    // Melodía arriba del mástil (trastes 7 a 10).
    line: [
      n('B', 8, 2), n('e', 7, 2),
      n('B', 10, 2), n('B', 7, 2),
      n('G', 9, 2), n('B', 8, 2),
      n('e', 8, 2), n('B', 8), n('G', 9),
      n('e', 7), n('e', 10), n('e', 7), n('B', 8),
      n('B', 10, 2), n('G', 7, 2),
      n('G', 9), n('B', 8), n('e', 8, 2),
      v('B', 8, 4),
    ],
    notation: 'tab',
    skills: ['fretboard', 'technique'],
    strum: BALLAD,
    tone: 'clean',
  }),
  // ── Nivel 4 ──
  song({
    id: 'g-funk-2',
    genre: 'funk',
    level: 4,
    requires: ['4.4'],
    key: 'Am',
    bpm: 80,
    tempoSteps: [80, 90, 100],
    chords: ['Am7', 'D7', 'Am7', 'D7', 'Am7', 'D7', 'Am7', 'Am7'],
    // Groove con La dórico (el Fa♯ suena con el D7).
    line: [...dorA(), ...dorD(), ...dorA(), ...dorD(), ...dorA(), ...dorD(), ...dorA(), e8('E', 5), r(0.5), e8('E', 7), e8('E', 8), n('E', 5, 2)],
    notation: 'tab',
    skills: ['rhythm', 'theory'],
    strum: EIGHTHS,
    tone: 'clean',
  }),
  song({
    id: 'g-jazz-2',
    genre: 'jazz',
    level: 4,
    requires: ['4.3', '4.7'],
    key: 'G',
    bpm: 80,
    tempoSteps: [80, 90, 100],
    chords: ['Am7', 'D7', 'Gmaj7', 'Em7', 'Am7', 'D7', 'Gmaj7', 'Gmaj7'],
    // Sol mayor en 2.ª posición, llegando a notas de cada acorde.
    line: [
      n('G', 2), n('G', 5), n('B', 5), n('e', 3),
      n('e', 2, 2), n('B', 3), n('G', 5),
      n('G', 4, 2), n('B', 3, 2),
      n('B', 5, 2), n('e', 3), n('B', 5),
      n('e', 5, 2), n('e', 3), n('B', 5),
      n('e', 2), n('e', 5), n('B', 3), n('G', 5),
      n('G', 4), n('B', 3), n('e', 2, 2),
      v('e', 3, 4),
    ],
    notation: 'tab',
    skills: ['theory', 'fretboard'],
    strum: HALVES,
    tone: 'neck',
  }),
  song({
    id: 'g-gospel-2',
    genre: 'gospel',
    level: 4,
    requires: ['4.5'],
    key: 'C',
    bpm: 72,
    tempoSteps: [72, 80, 88],
    chords: ['C', 'F', 'C', 'G', 'Am', 'F', 'G', 'C'],
    // Pregunta y respuesta, con silencios.
    line: [
      e8('G', 5), e8('G', 7), n('B', 5), n('B', 8), r(1),
      n('B', 6, 2), n('e', 5), r(1),
      e8('e', 8), e8('e', 7), e8('e', 5), e8('B', 8), n('B', 5, 2),
      n('G', 7, 2), v('B', 8, 2),
      e8('e', 5), e8('B', 8), n('e', 5), n('e', 8), r(1),
      e8('e', 8), e8('e', 5), n('B', 6), n('e', 5), r(1),
      n('B', 8), n('G', 7), n('B', 6), n('B', 5),
      v('G', 5, 4),
    ],
    notation: 'tab',
    skills: ['ear', 'technique'],
    strum: QUARTERS,
    tone: 'clean',
  }),
];
