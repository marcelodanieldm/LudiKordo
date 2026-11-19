/**
 * Práctica de habilidades: ejercicios cortos para tocar en vivo con
 * acompañamiento (batería y teclado sintetizados) y evaluación nota por nota.
 * Líneas originales. Cada uno se abre con los módulos donde se aprende lo que usa.
 * Las canciones del cancionero también se pueden practicar así (`practiceItem`).
 */
import type { BackingStyle } from '../music/backing';
import { getSong } from './songs';
import { IS_GUITAR } from '../instruments/current';
import type { Beats, Genre, ScoreEvent, ScoreNotation, Skill } from './types';

export interface PracticeItem {
  id: string;
  titleKey: string;
  descriptionKey: string;
  /** Habilidad principal que entrena (para agrupar en la pantalla). */
  focus: Skill;
  skills: Skill[];
  level: 1 | 2 | 3 | 4 | 5;
  requires: string[];
  style: BackingStyle;
  /** Un acorde por compás (dos, separados por espacio, cambian en el tercer tiempo). */
  chords: string[];
  line: ScoreEvent[];
  notation: ScoreNotation;
  bpm: number;
  tempoSteps: number[];
  /** El teclado arranca apagado (por ejemplo, en un ejercicio cromático). */
  keysOff?: boolean;
}

type S = 'E' | 'A' | 'D' | 'G';
const k = (id: string, key: string) => `content.drill.${id.replace(/-/g, '_')}.${key}`;
const n = (s: S, f: number, beats: Beats = 1): ScoreEvent => ({ string: s, fret: f, beats });
const r = (beats: Beats): ScoreEvent => ({ rest: true, beats });
const four = (s: S, f: number) => [n(s, f), n(s, f), n(s, f), n(s, f)];
const eight = (s: S, f: number) => Array.from({ length: 8 }, () => n(s, f, 0.5));
const half2 = (rs: S, rf: number, fs: S, ff: number) => [n(rs, rf, 2), n(fs, ff, 2)];
const drill = (d: Omit<PracticeItem, 'titleKey' | 'descriptionKey'>): PracticeItem => ({ ...d, titleKey: k(d.id, 'title'), descriptionKey: k(d.id, 'desc') });

/** Ejercicios del bajo. La guitarra todavía no tiene los suyos: la sección no aparece en esa build. */
const BASS_DRILLS: PracticeItem[] = [
  drill({
    id: 'rock-quarters',
    focus: 'rhythm',
    skills: ['rhythm', 'technique'],
    level: 1,
    requires: ['1.4'],
    style: 'rock',
    chords: ['A', 'A', 'D', 'A', 'E', 'D', 'A', 'A'],
    line: [...four('A', 0), ...four('A', 0), ...four('D', 0), ...four('A', 0), ...four('E', 0), ...four('D', 0), ...four('A', 0), n('A', 0, 4)],
    notation: 'tab',
    bpm: 80,
    tempoSteps: [80, 90, 100, 110],
  }),
  drill({
    id: 'spider-groove',
    focus: 'technique',
    skills: ['technique', 'fretboard'],
    level: 1,
    requires: ['1.3'],
    style: 'rock',
    chords: ['E5', 'E5', 'E5', 'E5'],
    line: (['E', 'A', 'D', 'G'] as const).flatMap((s) => [1, 2, 3, 4].map((f) => n(s, f))),
    notation: 'tab',
    bpm: 70,
    tempoSteps: [70, 80, 90, 100],
    keysOff: true,
  }),
  drill({
    id: 'blues-roots',
    focus: 'rhythm',
    skills: ['rhythm', 'theory'],
    level: 1,
    requires: ['1.5'],
    style: 'blues',
    chords: ['A7', 'A7', 'A7', 'A7', 'D7', 'D7', 'A7', 'A7', 'E7', 'D7', 'A7', 'E7'],
    line: [
      ...four('A', 0), ...four('A', 0), ...four('A', 0), ...four('A', 0),
      ...four('D', 0), ...four('D', 0), ...four('A', 0), ...four('A', 0),
      ...four('E', 0), ...four('D', 0), ...four('A', 0), ...four('E', 0),
    ],
    notation: 'tab',
    bpm: 80,
    tempoSteps: [80, 90, 100],
  }),
  drill({
    id: 'roots-ea',
    focus: 'fretboard',
    skills: ['fretboard', 'theory'],
    level: 2,
    requires: ['2.2'],
    style: 'pop',
    chords: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'C'],
    line: [...four('A', 3), ...four('E', 3), ...four('A', 0), ...four('E', 1), ...four('A', 3), ...four('E', 3), ...four('E', 1), n('A', 3, 4)],
    notation: 'tab',
    bpm: 76,
    tempoSteps: [76, 84, 92, 100],
  }),
  drill({
    id: 'root-fifth-soul',
    focus: 'theory',
    skills: ['theory', 'fretboard'],
    level: 2,
    requires: ['2.3'],
    style: 'soul',
    chords: ['G', 'C', 'D', 'G', 'G', 'C', 'D', 'G'],
    line: [
      ...half2('E', 3, 'D', 0), ...half2('A', 3, 'E', 3), ...half2('D', 0, 'A', 0), ...half2('E', 3, 'D', 0),
      ...half2('E', 3, 'D', 0), ...half2('A', 3, 'E', 3), ...half2('D', 0, 'A', 0), n('E', 3, 4),
    ],
    notation: 'tab',
    bpm: 80,
    tempoSteps: [80, 90, 100],
  }),
  drill({
    id: 'bossa-root-fifth',
    focus: 'rhythm',
    skills: ['rhythm', 'theory'],
    level: 2,
    requires: ['2.3'],
    style: 'bossa',
    chords: ['Am7', 'D7', 'Gmaj7', 'Cmaj7', 'Am7', 'D7', 'Gmaj7', 'Gmaj7'],
    line: [
      ...half2('A', 0, 'E', 0), ...half2('D', 0, 'A', 0), ...half2('E', 3, 'D', 0), ...half2('A', 3, 'E', 3),
      ...half2('A', 0, 'E', 0), ...half2('D', 0, 'A', 0), ...half2('E', 3, 'D', 0), n('E', 3, 4),
    ],
    notation: 'tab',
    bpm: 70,
    tempoSteps: [70, 80, 90],
  }),
  drill({
    id: 'pop-eighths',
    focus: 'rhythm',
    skills: ['rhythm', 'technique'],
    level: 2,
    requires: ['2.1', '2.6'],
    style: 'pop',
    chords: ['Am', 'F', 'C', 'G'],
    line: [...eight('A', 0), ...eight('E', 1), ...eight('A', 3), ...eight('E', 3)],
    notation: 'staff',
    // Corcheas repetidas: tempo inicial que el micrófono puede seguir (ver learnings.md).
    bpm: 72,
    tempoSteps: [72, 80, 88],
  }),
  drill({
    id: 'one-drop',
    focus: 'rhythm',
    skills: ['rhythm', 'theory'],
    level: 2,
    requires: ['2.1', '2.6'],
    style: 'reggae',
    chords: ['Am', 'D', 'Am', 'D'],
    line: [
      r(1), n('A', 0, 0.5), n('A', 0, 0.5), n('A', 3), n('A', 0),
      r(1), n('D', 0, 0.5), n('D', 0, 0.5), n('D', 4), n('D', 0),
      r(1), n('A', 0, 0.5), n('A', 0, 0.5), n('A', 3), n('A', 0),
      r(1), n('D', 0, 2), r(1),
    ],
    notation: 'staff',
    bpm: 72,
    tempoSteps: [72, 80],
  }),
];

export const DRILLS: PracticeItem[] = IS_GUITAR ? [] : BASS_DRILLS;

const GENRE_STYLE: Record<Genre, BackingStyle> = {
  pop: 'pop',
  rock: 'rock',
  ballad: 'ballad',
  blues: 'blues',
  bossa: 'bossa',
  soul: 'soul',
  reggae: 'reggae',
  funk: 'funk',
  jazz: 'blues',
  gospel: 'soul',
};

/** Ejercicio de práctica o canción del cancionero (`song-<id>`), listo para tocar en vivo. */
export function practiceItem(id: string): PracticeItem | undefined {
  if (id.startsWith('song-')) {
    if (IS_GUITAR) return undefined;
    const s = getSong(id.slice(5));
    if (!s) return undefined;
    return {
      id,
      titleKey: s.titleKey,
      descriptionKey: s.descriptionKey,
      focus: s.skills[0],
      skills: s.skills,
      level: s.level,
      requires: s.requires,
      style: GENRE_STYLE[s.genre] ?? 'pop',
      chords: s.chords,
      line: s.line,
      notation: s.notation,
      bpm: s.bpm,
      tempoSteps: s.tempoSteps,
    };
  }
  return DRILLS.find((d) => d.id === id);
}
