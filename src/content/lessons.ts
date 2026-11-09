/**
 * Las 4 lecciones modelo del documento de producto. El resto de las lecciones
 * se agrega siguiendo exactamente este formato.
 */
import type { Lesson } from './types';
import { midiToFreq } from '../music/notes';

const k = (lesson: string, key: string) => `content.l${lesson.replace(/\./g, '')}.${key}`;

const l111: Lesson = {
  id: '1.1.1',
  minutes: 10,
  titleKey: k('1.1.1', 'title'),
  objectiveKey: k('1.1.1', 'objective'),
  cartoon: { riveResource: 'kordi_1_1_1', durationSec: 120, sceneKeys: [1, 2, 3, 4].map((n) => k('1.1.1', `s${n}`)) },
  cards: [
    { titleKey: k('1.1.1', 'c1t'), bodyKey: k('1.1.1', 'c1b'), figure: 'bass-parts' },
    { titleKey: k('1.1.1', 'c2t'), bodyKey: k('1.1.1', 'c2b'), figure: 'strings' },
    { titleKey: k('1.1.1', 'c3t'), bodyKey: k('1.1.1', 'c3b') },
  ],
  exercises: [
    {
      id: '1.1.1-q1',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('1.1.1', 'q1'),
      options: [k('1.1.1', 'q1o1'), k('1.1.1', 'q1o2'), k('1.1.1', 'q1o3'), k('1.1.1', 'q1o4')],
      correctIndex: 2,
    },
    {
      id: '1.1.1-ear',
      kind: 'ear',
      needsBass: false,
      skills: ['ear'],
      promptKey: k('1.1.1', 'ear'),
      options: ['=E', '=A', '=D', '=G'],
      correctIndex: 1,
      tones: [midiToFreq(33)],
    },
    {
      id: '1.1.1-open',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique'],
      promptKey: k('1.1.1', 'play'),
      notes: [
        { string: 'E', fret: 0 },
        { string: 'A', fret: 0 },
        { string: 'D', fret: 0 },
        { string: 'G', fret: 0 },
      ],
      bpm: null,
    },
  ],
  mastery: 0.85,
};

const l114: Lesson = {
  id: '1.1.4',
  minutes: 12,
  titleKey: k('1.1.4', 'title'),
  objectiveKey: k('1.1.4', 'objective'),
  cartoon: { riveResource: 'kordi_1_1_4', durationSec: 150, sceneKeys: [1, 2, 3, 4].map((n) => k('1.1.4', `s${n}`)) },
  cards: [
    { titleKey: k('1.1.4', 'c1t'), bodyKey: k('1.1.4', 'c1b'), figure: 'tuner' },
    { titleKey: k('1.1.4', 'c2t'), bodyKey: k('1.1.4', 'c2b') },
    { titleKey: k('1.1.4', 'c3t'), bodyKey: k('1.1.4', 'c3b'), figure: 'fret5' },
  ],
  exercises: [
    {
      id: '1.1.4-ear1',
      kind: 'ear',
      needsBass: false,
      skills: ['ear'],
      promptKey: k('1.1.4', 'ear'),
      options: [k('1.1.4', 'higher'), k('1.1.4', 'lower')],
      correctIndex: 0,
      tones: [midiToFreq(33), midiToFreq(34)], // un semitono
    },
    {
      id: '1.1.4-ear2',
      kind: 'ear',
      needsBass: false,
      skills: ['ear'],
      promptKey: k('1.1.4', 'ear'),
      options: [k('1.1.4', 'higher'), k('1.1.4', 'lower')],
      correctIndex: 1,
      tones: [midiToFreq(38), midiToFreq(37.5)], // medio semitono
    },
    {
      id: '1.1.4-tune',
      kind: 'playAlong',
      needsBass: true,
      skills: ['ear', 'technique'],
      promptKey: k('1.1.4', 'tune'),
      notes: [
        { string: 'E', fret: 0 },
        { string: 'A', fret: 0 },
        { string: 'D', fret: 0 },
        { string: 'G', fret: 0 },
      ],
      bpm: null,
      toleranceCents: 5,
    },
  ],
  mastery: 1,
};

const l121: Lesson = {
  id: '1.2.1',
  minutes: 12,
  titleKey: k('1.2.1', 'title'),
  objectiveKey: k('1.2.1', 'objective'),
  cartoon: { riveResource: 'kordi_1_2_1', durationSec: 120, sceneKeys: [1, 2, 3, 4].map((n) => k('1.2.1', `s${n}`)) },
  cards: [
    { titleKey: k('1.2.1', 'c1t'), bodyKey: k('1.2.1', 'c1b'), figure: 'right-hand' },
    { titleKey: k('1.2.1', 'c2t'), bodyKey: k('1.2.1', 'c2b') },
  ],
  exercises: [
    {
      id: '1.2.1-walk',
      kind: 'tapRhythm',
      needsBass: false,
      skills: ['rhythm', 'technique'],
      promptKey: k('1.2.1', 'walk'),
      bpm: 60,
      beats: 16,
      pads: ['i', 'm'],
    },
    {
      id: '1.2.1-E',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique', 'rhythm'],
      promptKey: k('1.2.1', 'playE'),
      notes: Array.from({ length: 16 }, () => ({ string: 'E' as const, fret: 0 })),
      bpm: 60,
      tempoSteps: [60, 70, 80],
    },
    {
      id: '1.2.1-EA',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique', 'rhythm'],
      promptKey: k('1.2.1', 'playEA'),
      notes: Array.from({ length: 16 }, (_, i) => ({ string: (Math.floor(i / 4) % 2 === 0 ? 'E' : 'A') as 'E' | 'A', fret: 0 })),
      bpm: 60,
      tempoSteps: [60, 70, 80],
    },
  ],
  mastery: 0.8,
};

const spider = (string: 'E' | 'A' | 'D' | 'G') => [1, 2, 3, 4].map((fret) => ({ string, fret }));

const l131: Lesson = {
  id: '1.3.1',
  minutes: 12,
  titleKey: k('1.3.1', 'title'),
  objectiveKey: k('1.3.1', 'objective'),
  cartoon: { riveResource: 'kordi_1_3_1', durationSec: 150, sceneKeys: [1, 2, 3, 4].map((n) => k('1.3.1', `s${n}`)) },
  cards: [
    { titleKey: k('1.3.1', 'c1t'), bodyKey: k('1.3.1', 'c1b'), figure: 'left-hand' },
    { titleKey: k('1.3.1', 'c2t'), bodyKey: k('1.3.1', 'c2b') },
    { titleKey: k('1.3.1', 'c3t'), bodyKey: k('1.3.1', 'c3b'), figure: 'fretboard-1234' },
  ],
  exercises: [
    {
      id: '1.3.1-fb',
      kind: 'fretboardTap',
      needsBass: false,
      skills: ['fretboard'],
      promptKey: k('1.3.1', 'fb'),
      sequence: spider('E'),
      frets: 5,
    },
    {
      id: '1.3.1-q',
      kind: 'quiz',
      needsBass: false,
      skills: ['technique'],
      promptKey: k('1.3.1', 'q'),
      options: ['=1', '=2', '=3', '=4'],
      correctIndex: 2,
      hintKey: k('1.3.1', 'hint'),
    },
    {
      id: '1.3.1-spiderE',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique', 'rhythm'],
      promptKey: k('1.3.1', 'spiderE'),
      notes: [...spider('E'), ...spider('E'), ...spider('E'), ...spider('E')],
      bpm: 60,
      tempoSteps: [60, 70, 80],
    },
    {
      id: '1.3.1-spider4',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique', 'fretboard'],
      promptKey: k('1.3.1', 'spider4'),
      notes: [...spider('E'), ...spider('A'), ...spider('D'), ...spider('G')],
      bpm: 60,
    },
  ],
  mastery: 0.8,
};

export const LESSONS: Record<string, Lesson> = {
  [l111.id]: l111,
  [l114.id]: l114,
  [l121.id]: l121,
  [l131.id]: l131,
};

export function getLesson(id: string): Lesson | undefined {
  return LESSONS[id];
}
