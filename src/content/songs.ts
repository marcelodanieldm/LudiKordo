/**
 * Cancionero: líneas de bajo ORIGINALES de LudiKordo para tocar por género y
 * nivel. Ninguna reproduce una canción con derechos (AGENTS.md: solo música
 * original o de dominio público). Cada canción se desbloquea al terminar los
 * módulos donde se aprende lo que usa.
 */
import type { Beats, Genre, ListenExample, ScoreEvent, Song } from './types';
import { chordFromName } from '../music/chords';
import { GUITAR_SONGS } from './guitar/songs';
import { IS_GUITAR, IS_NYLON } from '../instruments/current';

type S = 'E' | 'A' | 'D' | 'G';
const k = (id: string, key: string) => `content.song.${id.replace(/-/g, '_')}.${key}`;
const n = (string: S, fret: number, beats: Beats = 1): ScoreEvent => ({ string, fret, beats });
const r = (beats: Beats): ScoreEvent => ({ rest: true, beats });
const e = (string: S, fret: number) => n(string, fret, 0.5);
/** Blanca y dos negras sobre la misma nota. */
const hqq = (s: S, f: number) => [n(s, f, 2), n(s, f), n(s, f)];
/** Cuatro negras sobre la misma nota. */
const four = (s: S, f: number) => [n(s, f), n(s, f), n(s, f), n(s, f)];
/** Ocho corcheas sobre la misma nota. */
const eight = (s: S, f: number) => Array.from({ length: 8 }, () => e(s, f));
/** Raíz y quinta en blancas. */
const rootFifth = (rs: S, rf: number, fs: S, ff: number) => [n(rs, rf, 2), n(fs, ff, 2)];

const song = (s: Omit<Song, 'titleKey' | 'descriptionKey'>): Song => ({ ...s, titleKey: k(s.id, 'title'), descriptionKey: k(s.id, 'desc') });

export const BASS_SONGS: Song[] = [
  // ── Nivel 1: cuerdas Mi, La y Re, trastes 0–4, redondas, blancas y negras ──
  song({
    id: 'pop-1',
    genre: 'pop',
    level: 1,
    requires: ['1.5'],
    key: 'E',
    bpm: 80,
    tempoSteps: [80, 90, 100],
    chords: ['E', 'B', 'C#m', 'A', 'E', 'B', 'A', 'E'],
    line: [...hqq('E', 0), ...hqq('A', 2), ...hqq('A', 4), ...hqq('A', 0), ...hqq('E', 0), ...hqq('A', 2), ...hqq('A', 0), n('E', 0, 4)],
    notation: 'tab',
    skills: ['rhythm', 'technique'],
  }),
  song({
    id: 'rock-1',
    genre: 'rock',
    level: 1,
    requires: ['1.5'],
    key: 'A',
    bpm: 90,
    tempoSteps: [90, 100, 110, 120],
    chords: ['A', 'A', 'D', 'A', 'E', 'D', 'A', 'A'],
    line: [...four('A', 0), ...four('A', 0), ...four('D', 0), ...four('A', 0), ...four('E', 0), ...four('D', 0), ...four('A', 0), n('A', 0, 4)],
    notation: 'tab',
    skills: ['rhythm', 'technique'],
  }),
  song({
    id: 'ballad-1',
    genre: 'ballad',
    level: 1,
    requires: ['1.5'],
    key: 'D',
    bpm: 66,
    tempoSteps: [66, 72, 80],
    chords: ['D', 'A', 'Bm', 'G', 'D', 'A', 'G', 'D'],
    line: [n('D', 0, 4), n('A', 0, 4), n('A', 2, 4), n('E', 3, 4), n('D', 0, 2), n('D', 0, 2), n('A', 0, 2), n('A', 0, 2), n('E', 3, 4), n('D', 0, 4)],
    notation: 'tab',
    skills: ['technique', 'fretboard'],
  }),
  song({
    id: 'blues-1',
    genre: 'blues',
    level: 1,
    requires: ['1.5'],
    key: 'E',
    bpm: 80,
    tempoSteps: [80, 90, 100],
    // Blues de 12 compases en Mi: I I I I · IV IV I I · V IV I V.
    chords: ['E7', 'E7', 'E7', 'E7', 'A7', 'A7', 'E7', 'E7', 'B7', 'A7', 'E7', 'B7'],
    line: [
      ...hqq('E', 0), ...hqq('E', 0), ...hqq('E', 0), ...hqq('E', 0),
      ...hqq('A', 0), ...hqq('A', 0), ...hqq('E', 0), ...hqq('E', 0),
      ...hqq('A', 2), ...hqq('A', 0), ...hqq('E', 0), n('A', 2, 4),
    ],
    notation: 'tab',
    skills: ['rhythm', 'theory'],
  }),

  // ── Nivel 2: raíz y quinta, apagado, corcheas, silencios y pentagrama ──
  song({
    id: 'bossa-1',
    genre: 'bossa',
    level: 2,
    requires: ['2.3'],
    key: 'Em',
    bpm: 70,
    tempoSteps: [70, 80, 90],
    chords: ['Am7', 'D7', 'Gmaj7', 'Cmaj7', 'Am7', 'B7', 'Em', 'Em'],
    line: [
      ...rootFifth('A', 0, 'E', 0), ...rootFifth('D', 0, 'A', 0), ...rootFifth('E', 3, 'D', 0), ...rootFifth('A', 3, 'E', 3),
      ...rootFifth('A', 0, 'E', 0), ...rootFifth('A', 2, 'E', 2), ...rootFifth('E', 0, 'A', 2), n('E', 0, 4),
    ],
    notation: 'tab',
    skills: ['theory', 'rhythm'],
  }),
  song({
    id: 'soul-1',
    genre: 'soul',
    level: 2,
    requires: ['2.3', '2.4'],
    key: 'G',
    bpm: 84,
    tempoSteps: [84, 92, 100],
    chords: ['G', 'C', 'G', 'D', 'G', 'C', 'D', 'G'],
    line: [
      // Raíz, quinta, octava y quinta.
      n('E', 3), n('D', 0), n('D', 5), n('D', 0),
      n('A', 3), n('D', 5), n('G', 5), n('D', 5),
      n('E', 3), n('D', 0), n('D', 5), n('D', 0),
      n('D', 0), n('A', 0), n('D', 0), n('A', 0),
      n('E', 3), n('D', 0), n('D', 5), n('D', 0),
      n('A', 3), n('D', 5), n('G', 5), n('D', 5),
      n('D', 0), n('A', 0), n('D', 0), n('A', 0),
      n('E', 3, 4),
    ],
    notation: 'tab',
    skills: ['theory', 'technique'],
  }),
  song({
    id: 'reggae-1',
    genre: 'reggae',
    level: 2,
    requires: ['2.1', '2.6'],
    key: 'Am',
    bpm: 72,
    tempoSteps: [72, 80, 90],
    chords: ['Am', 'D', 'Am', 'D', 'Am', 'D', 'Am', 'Am'],
    line: [
      // El primer tiempo queda vacío: el bajo deja respirar al grupo.
      r(1), e('A', 0), e('A', 0), n('A', 3), n('A', 0),
      r(1), e('D', 0), e('D', 0), n('D', 4), n('D', 0),
      r(1), e('A', 0), e('A', 0), n('A', 3), n('A', 0),
      r(1), e('D', 0), e('D', 0), n('D', 4), n('D', 0),
      r(1), e('A', 0), e('A', 0), n('A', 3), n('A', 0),
      r(1), e('D', 0), e('D', 0), n('D', 4), n('D', 0),
      r(1), e('A', 0), e('A', 0), n('A', 3), n('A', 0),
      r(1), n('A', 0, 2), r(1),
    ],
    notation: 'staff',
    skills: ['rhythm', 'theory'],
  }),

  // ── Nivel 3: cifrado, corcheas continuas e inversiones ──
  song({
    id: 'pop-2',
    genre: 'pop',
    level: 3,
    requires: ['3.4'],
    key: 'C',
    // Corcheas repetidas en la misma nota: tempo inicial moderado para que el micrófono distinga cada ataque.
    bpm: 80,
    tempoSteps: [80, 88, 96, 104],
    chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'C'],
    line: [...eight('A', 0), ...eight('E', 1), ...eight('A', 3), ...eight('E', 3), ...eight('A', 0), ...eight('E', 1), ...eight('E', 3), n('A', 3, 4)],
    notation: 'staff',
    skills: ['rhythm', 'technique'],
  }),
  song({
    id: 'ballad-2',
    genre: 'ballad',
    level: 3,
    requires: ['3.6'],
    key: 'C',
    bpm: 66,
    tempoSteps: [66, 72, 80],
    // Bajo que desciende con inversiones: Do, Si, La, Sol, Fa, Mi.
    chords: ['C', 'G/B', 'Am', 'Am/G', 'F', 'C/E', 'Dm G', 'C'],
    line: [n('A', 3, 4), n('A', 2, 4), n('A', 0, 4), n('E', 3, 4), n('E', 1, 4), n('E', 0, 4), n('D', 0, 2), n('E', 3, 2), n('A', 3, 4)],
    notation: 'tab',
    skills: ['theory', 'fretboard'],
  }),

  // ── Nivel 4: estilos ──
  song({
    id: 'rock-2',
    genre: 'rock',
    level: 4,
    requires: ['4.2'],
    key: 'Em',
    bpm: 80,
    tempoSteps: [80, 90, 100, 110],
    chords: ['Em', 'Em', 'Am', 'Am', 'Em', 'Em', 'C', 'D Em'],
    line: [
      e('E', 0), e('E', 0), e('E', 0), e('E', 0), e('E', 3), e('E', 0), e('A', 0), e('E', 0),
      e('E', 0), e('E', 0), e('E', 0), e('E', 0), e('E', 3), e('E', 0), e('A', 0), e('E', 0),
      e('A', 0), e('A', 0), e('A', 0), e('A', 0), e('A', 3), e('A', 0), e('D', 0), e('A', 0),
      e('A', 0), e('A', 0), e('A', 0), e('A', 0), e('A', 3), e('A', 0), e('D', 0), e('A', 0),
      e('E', 0), e('E', 0), e('E', 0), e('E', 0), e('E', 3), e('E', 0), e('A', 0), e('E', 0),
      e('E', 0), e('E', 0), e('E', 0), e('E', 0), e('E', 3), e('E', 0), e('A', 0), e('E', 0),
      ...eight('A', 3),
      e('D', 0), e('D', 0), e('D', 0), e('D', 0), n('E', 0, 2),
    ],
    notation: 'staff',
    skills: ['technique', 'rhythm'],
  }),
  song({
    id: 'blues-2',
    genre: 'blues',
    level: 4,
    requires: ['4.4'],
    key: 'A',
    bpm: 100,
    tempoSteps: [100, 110, 120, 132],
    // 12 compases y un compás final para resolver en La.
    chords: ['A7', 'A7', 'A7', 'A7', 'D7', 'D7', 'A7', 'A7', 'E7', 'D7', 'A7', 'E7', 'A7'],
    line: [
      // Walking: arpegio y aproximaciones cromáticas al acorde siguiente.
      n('A', 0), n('A', 4), n('D', 2), n('D', 4),
      n('A', 0), n('A', 4), n('D', 2), n('A', 4),
      n('A', 0), n('A', 4), n('D', 2), n('D', 4),
      n('A', 0), n('A', 4), n('D', 2), n('D', 1),
      n('D', 0), n('D', 4), n('G', 2), n('G', 4),
      n('D', 0), n('D', 4), n('G', 2), n('A', 1),
      n('A', 0), n('A', 4), n('D', 2), n('D', 4),
      n('A', 0), n('A', 4), n('D', 2), n('E', 1),
      n('E', 0), n('E', 4), n('A', 2), n('A', 4),
      n('D', 0), n('D', 4), n('G', 2), n('E', 4),
      n('A', 0), n('A', 4), n('D', 2), n('D', 4),
      n('E', 0), n('E', 4), n('A', 2), n('A', 1),
      n('A', 0, 4),
    ],
    notation: 'tab',
    skills: ['theory', 'fretboard', 'rhythm'],
  }),
  song({
    id: 'bossa-2',
    genre: 'bossa',
    level: 4,
    requires: ['4.5'],
    key: 'C',
    bpm: 76,
    tempoSteps: [76, 84, 92],
    chords: ['Dm7', 'G7', 'Cmaj7', 'Cmaj7', 'Em7', 'A7', 'Dm7 G7', 'Cmaj7'],
    line: [
      // Raíz y quinta; la quinta entra una corchea antes del tercer tiempo, como en la bossa.
      n('D', 0), r(0.5), e('A', 0), n('A', 0, 2),
      n('E', 3), r(0.5), e('D', 0), n('D', 0, 2),
      n('A', 3), r(0.5), e('E', 3), n('E', 3, 2),
      n('A', 3), r(0.5), e('E', 3), n('E', 3, 2),
      n('E', 0), r(0.5), e('A', 2), n('A', 2, 2),
      n('A', 0), r(0.5), e('E', 0), n('E', 0, 2),
      n('D', 0), n('A', 0), n('E', 3), n('D', 0),
      n('A', 3, 4),
    ],
    notation: 'staff',
    skills: ['rhythm', 'theory'],
  }),
  song({
    id: 'reggae-2',
    genre: 'reggae',
    level: 4,
    requires: ['4.6'],
    key: 'Em',
    bpm: 70,
    tempoSteps: [70, 76, 84],
    chords: ['Em', 'Am', 'Em', 'Bm', 'Em', 'Am', 'Bm', 'Em'],
    line: [
      r(1), n('E', 0), e('E', 3), e('A', 0), n('A', 2),
      r(1), n('A', 0), e('A', 3), e('D', 0), n('D', 2),
      r(1), n('E', 0), e('E', 3), e('A', 0), n('A', 2),
      r(1), n('A', 2), e('D', 0), e('D', 2), n('D', 4),
      r(1), n('E', 0), e('E', 3), e('A', 0), n('A', 2),
      r(1), n('A', 0), e('A', 3), e('D', 0), n('D', 2),
      r(1), n('A', 2), e('D', 0), e('D', 2), n('D', 4),
      r(1), n('E', 0, 2), r(1),
    ],
    notation: 'staff',
    skills: ['rhythm', 'technique'],
  }),
  song({
    id: 'soul-2',
    genre: 'soul',
    level: 4,
    requires: ['4.6'],
    key: 'C',
    bpm: 80,
    tempoSteps: [80, 88, 96, 104],
    chords: ['C', 'F', 'G', 'C', 'Am', 'F', 'G', 'C'],
    line: [
      // Notas de paso: cada compás camina hacia la raíz del siguiente.
      n('A', 3), r(0.5), e('A', 3), n('D', 0), n('D', 2),
      n('D', 3), r(0.5), e('D', 3), n('A', 3), n('D', 4),
      n('D', 5), r(0.5), e('D', 5), n('D', 0), n('A', 2),
      n('A', 3), r(0.5), e('A', 3), n('A', 5), n('A', 2),
      n('A', 0), r(0.5), e('A', 0), n('A', 3), n('D', 2),
      n('D', 3), r(0.5), e('D', 3), n('A', 3), n('D', 4),
      n('D', 5), r(0.5), e('D', 5), n('D', 0), n('A', 2),
      n('A', 3, 2), r(2),
    ],
    notation: 'staff',
    skills: ['theory', 'technique'],
  }),
];

/** Canciones del instrumento de esta build. La criolla todavía no tiene cancionero (llega con su nivel 2, ADR 0010): la tarjeta se oculta. */
export const SONGS: Song[] = IS_NYLON ? [] : IS_GUITAR ? GUITAR_SONGS : BASS_SONGS;

/**
 * Ejemplo para escuchar una canción: la línea sola o, si la canción trae rasgueo
 * (guitarra), la línea sobre una pista con los acordes del cifrado.
 */
export function songExample(song: Song): ListenExample {
  const base: ListenExample = { events: song.line, bpm: song.bpm, show: song.notation, click: true, ...(song.tone ? { tone: song.tone } : {}) };
  if (!song.strum) return base;
  const chords = song.chords.map((c) => chordFromName(c) ?? []);
  // En rock la pista suena con crunch, como una segunda guitarra; en el resto, limpia.
  return { ...base, strum: { chords, pattern: song.strum, tone: song.tone === 'crunch' ? 'crunch' : 'clean', level: 0.4 } };
}

export function getSong(id: string): Song | undefined {
  return SONGS.find((s) => s.id === id);
}

const BASS_GENRES: readonly Genre[] = ['pop', 'rock', 'ballad', 'blues', 'bossa', 'soul', 'reggae'];
/** Géneros del cancionero de guitarra, elegidos por Marcelo (18 nov 2026). */
export const GUITAR_GENRES: readonly Genre[] = ['rock', 'pop', 'funk', 'jazz', 'gospel'];
/** Los géneros de la criolla (rock, pop, blues, jazz, bossa y música popular) llegan con su cancionero. */
export const GENRES: readonly Genre[] = IS_NYLON ? [] : IS_GUITAR ? GUITAR_GENRES : BASS_GENRES;
