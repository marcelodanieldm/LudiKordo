/**
 * Módulo 2.6 · Pentagrama y clave de fa.
 * Leer y escribir en partitura lo que ya se toca en tablatura: clave, cuerdas
 * al aire, figuras y silencios, notas de las cuerdas Mi y La, y una pieza
 * clásica de dominio público (el bajo del Canon de Pachelbel, c. 1680).
 */
import type { Beats, Lesson, ScoreEvent } from './types';
import { midiAt, midiToFreq } from '../music/notes';

const k = (lesson: string, key: string) => `content.l${lesson.replace(/\./g, '')}.${key}`;
type S = 'E' | 'A' | 'D' | 'G';
/** Nota de partitura. */
const nt = (string: S, fret: number, beats: Beats = 1): ScoreEvent => ({ string, fret, beats });
/** Silencio. */
const rest = (beats: Beats): ScoreEvent => ({ rest: true, beats });
/** Nota para leer o tocar (sin corcheas ni silencios). */
const tn = (string: S, fret: number, beats: 1 | 2 | 4 = 1) => ({ string, fret, beats });
const hz = (string: S, fret: number) => midiToFreq(midiAt(string, fret));
const scenes = (id: string) => [1, 2, 3, 4].map((x) => k(id, `s${x}`));
const rive = (id: string) => `kordi_${id.replace(/\./g, '_')}`;

/** Bajo del Canon de Pachelbel (dominio público): Re La Si Fa♯ Sol Re Sol La, en blancas. */
export const CANON_BASS = [tn('D', 0, 2), tn('A', 0, 2), tn('A', 2, 2), tn('E', 2, 2), tn('E', 3, 2), tn('D', 0, 2), tn('E', 3, 2), tn('A', 0, 2)];

const l261: Lesson = {
  id: '2.6.1',
  minutes: 10,
  titleKey: k('2.6.1', 'title'),
  objectiveKey: k('2.6.1', 'objective'),
  cartoon: { riveResource: rive('2.6.1'), durationSec: 90, sceneKeys: scenes('2.6.1') },
  cards: [
    {
      titleKey: k('2.6.1', 'c1t'),
      bodyKey: k('2.6.1', 'c1b'),
      listen: { events: [nt('E', 0), nt('E', 1), nt('E', 3), nt('A', 0), nt('A', 2), nt('A', 3), nt('D', 0), nt('D', 2)], bpm: 72, show: 'staff', noteNames: true },
    },
    { titleKey: k('2.6.1', 'c2t'), bodyKey: k('2.6.1', 'c2b'), figure: 'bass-clef' },
    {
      titleKey: k('2.6.1', 'c3t'),
      bodyKey: k('2.6.1', 'c3b'),
      listen: { events: [nt('E', 0, 4)], bpm: 60, show: 'staff', noteNames: true },
    },
  ],
  exercises: [
    {
      id: '2.6.1-clef',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('2.6.1', 'q1'),
      options: [k('2.6.1', 'q1o1'), k('2.6.1', 'q1o2'), k('2.6.1', 'q1o3')],
      correctIndex: 0,
      hintKey: k('2.6.1', 'q1h'),
    },
    {
      id: '2.6.1-f',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('2.6.1', 'q2'),
      staff: [nt('D', 3, 4)],
      options: ['=F', '=G', '=E'],
      correctIndex: 0,
      hintKey: k('2.6.1', 'q2h'),
    },
    {
      id: '2.6.1-up',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory', 'ear'],
      promptKey: k('2.6.1', 'q3'),
      options: [k('2.6.1', 'q3o1'), k('2.6.1', 'q3o2'), k('2.6.1', 'q3o3')],
      correctIndex: 0,
    },
    {
      id: '2.6.1-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['theory', 'technique'],
      promptKey: k('2.6.1', 'play'),
      notes: [tn('D', 3, 2), tn('D', 3, 2), tn('D', 3, 4)],
      notation: 'staff',
      bpm: 60,
      tempoSteps: [60, 70],
    },
  ],
  mastery: 0.8,
};

const l262: Lesson = {
  id: '2.6.2',
  minutes: 10,
  titleKey: k('2.6.2', 'title'),
  objectiveKey: k('2.6.2', 'objective'),
  cartoon: { riveResource: rive('2.6.2'), durationSec: 90, sceneKeys: scenes('2.6.2') },
  cards: [
    { titleKey: k('2.6.2', 'c1t'), bodyKey: k('2.6.2', 'c1b'), listen: { events: [nt('E', 0, 2), nt('A', 0, 2)], bpm: 60, show: 'staff', noteNames: true } },
    { titleKey: k('2.6.2', 'c2t'), bodyKey: k('2.6.2', 'c2b'), listen: { events: [nt('D', 0, 2), nt('G', 0, 2)], bpm: 60, show: 'staff', noteNames: true } },
    {
      titleKey: k('2.6.2', 'c3t'),
      bodyKey: k('2.6.2', 'c3b'),
      listen: { events: [nt('A', 0), nt('A', 3), nt('D', 2), nt('D', 5), nt('E', 3), nt('A', 2), nt('D', 0), nt('D', 3), nt('D', 7, 2), rest(2)], bpm: 66, show: 'staff', noteNames: true },
    },
  ],
  exercises: [
    {
      id: '2.6.2-a',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('2.6.2', 'q1'),
      staff: [nt('A', 0, 4)],
      options: [k('2.6.2', 'oA'), k('2.6.2', 'oE'), k('2.6.2', 'oD')],
      correctIndex: 0,
      hintKey: k('2.6.2', 'q1h'),
    },
    {
      id: '2.6.2-g',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('2.6.2', 'q1'),
      staff: [nt('G', 0, 4)],
      options: [k('2.6.2', 'oD'), k('2.6.2', 'oG'), k('2.6.2', 'oA')],
      correctIndex: 1,
    },
    {
      id: '2.6.2-e',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('2.6.2', 'q1'),
      staff: [nt('E', 0, 4)],
      options: [k('2.6.2', 'oG'), k('2.6.2', 'oA'), k('2.6.2', 'oE')],
      correctIndex: 2,
      hintKey: k('2.6.2', 'q3h'),
    },
    {
      id: '2.6.2-read',
      kind: 'tabReading',
      needsBass: false,
      skills: ['theory', 'fretboard'],
      promptKey: k('2.6.2', 'read'),
      notation: 'staff',
      notes: [tn('E', 0, 2), tn('A', 0, 2), tn('D', 0, 2), tn('G', 0, 2), tn('G', 0, 2), tn('D', 0, 2), tn('A', 0, 2), tn('E', 0, 2)],
      frets: 3,
    },
    {
      id: '2.6.2-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['theory', 'technique'],
      promptKey: k('2.6.2', 'play'),
      notation: 'staff',
      notes: [tn('E', 0, 2), tn('A', 0, 2), tn('D', 0, 2), tn('G', 0, 2), tn('G', 0, 2), tn('D', 0, 2), tn('A', 0, 2), tn('E', 0, 2)],
      bpm: 70,
      tempoSteps: [70, 80],
    },
  ],
  mastery: 0.8,
};

const l263: Lesson = {
  id: '2.6.3',
  minutes: 12,
  titleKey: k('2.6.3', 'title'),
  objectiveKey: k('2.6.3', 'objective'),
  cartoon: { riveResource: rive('2.6.3'), durationSec: 90, sceneKeys: scenes('2.6.3') },
  cards: [
    {
      titleKey: k('2.6.3', 'c1t'),
      bodyKey: k('2.6.3', 'c1b'),
      listen: {
        events: [
          nt('A', 0, 4),
          nt('A', 0, 2), nt('A', 0, 2),
          nt('A', 0), nt('A', 0), nt('A', 0), nt('A', 0),
          nt('A', 0, 0.5), nt('A', 0, 0.5), nt('A', 0, 0.5), nt('A', 0, 0.5), nt('A', 0, 0.5), nt('A', 0, 0.5), nt('A', 0, 0.5), nt('A', 0, 0.5),
        ],
        bpm: 80,
        show: 'staff',
        click: true,
      },
    },
    {
      titleKey: k('2.6.3', 'c2t'),
      bodyKey: k('2.6.3', 'c2b'),
      listen: {
        events: [nt('A', 0), rest(1), nt('A', 0), rest(1), nt('A', 0, 2), rest(2), nt('A', 0, 0.5), nt('A', 0, 0.5), rest(1), nt('A', 0), rest(1), rest(4)],
        bpm: 80,
        show: 'staff',
        click: true,
      },
    },
    {
      titleKey: k('2.6.3', 'c3t'),
      bodyKey: k('2.6.3', 'c3b'),
      listen: { events: [nt('E', 0), nt('A', 0), nt('D', 0), nt('G', 0)], bpm: 72, show: 'staff' },
    },
  ],
  exercises: [
    {
      id: '2.6.3-half',
      kind: 'quiz',
      needsBass: false,
      skills: ['rhythm', 'theory'],
      promptKey: k('2.6.3', 'q1'),
      staff: [nt('A', 0, 2), nt('A', 0, 2)],
      options: ['=2', '=1', '=4'],
      correctIndex: 0,
      hintKey: k('2.6.3', 'q1h'),
    },
    {
      id: '2.6.3-rests',
      kind: 'quiz',
      needsBass: false,
      skills: ['rhythm', 'theory'],
      promptKey: k('2.6.3', 'q2'),
      staff: [nt('A', 0), rest(1), nt('A', 0), rest(1)],
      options: ['=2', '=4', '=3'],
      correctIndex: 0,
    },
    {
      id: '2.6.3-eighths',
      kind: 'quiz',
      needsBass: false,
      skills: ['rhythm', 'theory'],
      promptKey: k('2.6.3', 'q3'),
      staff: [nt('A', 0, 0.5), nt('A', 0, 0.5), nt('A', 0, 0.5), nt('A', 0, 0.5), nt('A', 0, 2)],
      options: [k('2.6.3', 'q3o1'), k('2.6.3', 'q3o2'), k('2.6.3', 'q3o3')],
      correctIndex: 0,
    },
    {
      id: '2.6.3-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['rhythm', 'technique'],
      promptKey: k('2.6.3', 'play'),
      notation: 'staff',
      notes: [tn('A', 0, 4), tn('A', 0, 2), tn('A', 0, 2), tn('A', 0), tn('A', 0), tn('A', 0, 2), tn('E', 0), tn('E', 0), tn('E', 0), tn('E', 0)],
      bpm: 70,
      tempoSteps: [70, 80, 90],
    },
  ],
  mastery: 0.8,
};

const l264: Lesson = {
  id: '2.6.4',
  minutes: 12,
  titleKey: k('2.6.4', 'title'),
  objectiveKey: k('2.6.4', 'objective'),
  cartoon: { riveResource: rive('2.6.4'), durationSec: 90, sceneKeys: scenes('2.6.4') },
  cards: [
    { titleKey: k('2.6.4', 'c1t'), bodyKey: k('2.6.4', 'c1b'), listen: { events: [nt('E', 0), nt('E', 1), nt('E', 3), rest(1)], bpm: 66, show: 'staff', noteNames: true } },
    { titleKey: k('2.6.4', 'c2t'), bodyKey: k('2.6.4', 'c2b'), listen: { events: [nt('A', 0), nt('A', 2), nt('A', 3), nt('A', 5)], bpm: 66, show: 'staff', noteNames: true } },
    { titleKey: k('2.6.4', 'c3t'), bodyKey: k('2.6.4', 'c3b'), listen: { events: [nt('E', 1, 2), nt('E', 2, 2)], bpm: 60, show: 'staff', noteNames: true } },
    { titleKey: k('2.6.4', 'c4t'), bodyKey: k('2.6.4', 'c4b'), listen: { events: [nt('A', 5, 2), nt('D', 0, 2)], bpm: 60, show: 'staff', noteNames: true } },
  ],
  exercises: [
    {
      id: '2.6.4-c',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('2.6.4', 'q1'),
      staff: [nt('A', 3, 4)],
      options: ['=C', '=D', '=B'],
      correctIndex: 0,
    },
    {
      id: '2.6.4-fsharp',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('2.6.4', 'q1'),
      staff: [nt('E', 2, 4)],
      options: ['=F', '=F♯', '=G'],
      correctIndex: 1,
      hintKey: k('2.6.4', 'q2h'),
    },
    {
      id: '2.6.4-dictation',
      kind: 'ear',
      needsBass: false,
      skills: ['ear', 'theory'],
      promptKey: k('2.6.4', 'q3'),
      tones: [hz('E', 0), hz('E', 3), hz('A', 0)],
      options: [k('2.6.4', 'q3o1'), k('2.6.4', 'q3o2'), k('2.6.4', 'q3o3')],
      correctIndex: 0,
      hintKey: k('2.6.4', 'q3h'),
    },
    {
      id: '2.6.4-read',
      kind: 'tabReading',
      needsBass: false,
      skills: ['theory', 'fretboard'],
      promptKey: k('2.6.4', 'read'),
      notation: 'staff',
      notes: [tn('E', 0), tn('E', 1), tn('E', 3), tn('A', 0), tn('A', 2), tn('A', 3), tn('A', 2), tn('A', 0), tn('E', 3), tn('E', 1), tn('E', 0, 2)],
      frets: 5,
    },
    {
      id: '2.6.4-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['theory', 'technique'],
      promptKey: k('2.6.4', 'play'),
      notation: 'staff',
      notes: [tn('E', 0), tn('E', 1), tn('E', 3), tn('A', 0), tn('A', 2), tn('A', 3), tn('A', 2), tn('A', 0), tn('E', 3), tn('E', 1), tn('E', 0, 2)],
      bpm: 66,
      tempoSteps: [66, 76, 86],
    },
  ],
  mastery: 0.8,
};

const l265: Lesson = {
  id: '2.6.5',
  minutes: 12,
  titleKey: k('2.6.5', 'title'),
  objectiveKey: k('2.6.5', 'objective'),
  cartoon: { riveResource: rive('2.6.5'), durationSec: 90, sceneKeys: scenes('2.6.5') },
  cards: [
    { titleKey: k('2.6.5', 'c1t'), bodyKey: k('2.6.5', 'c1b'), listen: { events: CANON_BASS, bpm: 60, show: 'staff', noteNames: true } },
    { titleKey: k('2.6.5', 'c2t'), bodyKey: k('2.6.5', 'c2b') },
    { titleKey: k('2.6.5', 'c3t'), bodyKey: k('2.6.5', 'c3b') },
  ],
  exercises: [
    {
      id: '2.6.5-sharp',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('2.6.5', 'q1'),
      staff: CANON_BASS,
      options: ['=F♯', '=B', '=G'],
      correctIndex: 0,
      hintKey: k('2.6.5', 'q1h'),
    },
    {
      id: '2.6.5-ostinato',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('2.6.5', 'q2'),
      options: [k('2.6.5', 'q2o1'), k('2.6.5', 'q2o2'), k('2.6.5', 'q2o3')],
      correctIndex: 0,
    },
    {
      id: '2.6.5-read',
      kind: 'tabReading',
      needsBass: false,
      skills: ['theory', 'fretboard'],
      promptKey: k('2.6.5', 'read'),
      notation: 'staff',
      notes: CANON_BASS,
      frets: 5,
    },
    {
      id: '2.6.5-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['theory', 'technique'],
      promptKey: k('2.6.5', 'play'),
      notation: 'staff',
      notes: [...CANON_BASS, ...CANON_BASS],
      bpm: 60,
      tempoSteps: [60, 72, 84],
    },
  ],
  mastery: 0.8,
};

export const LESSONS_2_6: Lesson[] = [l261, l262, l263, l264, l265];
