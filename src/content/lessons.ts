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
  ],
  mastery: 0.8,
};

const spiderDown = (string: 'E' | 'A' | 'D' | 'G') => [4, 3, 2, 1].map((fret) => ({ string, fret }));
const twice = <T,>(notes: T[]) => notes.flatMap((n) => [n, n]);

const l132: Lesson = {
  id: '1.3.2',
  minutes: 10,
  titleKey: k('1.3.2', 'title'),
  objectiveKey: k('1.3.2', 'objective'),
  cartoon: { riveResource: 'kordi_1_3_2', durationSec: 90, sceneKeys: [1, 2, 3, 4].map((n) => k('1.3.2', `s${n}`)) },
  cards: [
    { titleKey: k('1.3.2', 'c1t'), bodyKey: k('1.3.2', 'c1b'), figure: 'left-hand' },
    { titleKey: k('1.3.2', 'c2t'), bodyKey: k('1.3.2', 'c2b') },
    { titleKey: k('1.3.2', 'c3t'), bodyKey: k('1.3.2', 'c3b') },
  ],
  exercises: [
    {
      id: '1.3.2-where',
      kind: 'quiz',
      needsBass: false,
      skills: ['technique'],
      promptKey: k('1.3.2', 'q1'),
      options: [k('1.3.2', 'q1o1'), k('1.3.2', 'q1o2'), k('1.3.2', 'q1o3')],
      correctIndex: 0,
      hintKey: k('1.3.2', 'q1h'),
    },
    {
      id: '1.3.2-buzz',
      kind: 'quiz',
      needsBass: false,
      skills: ['technique'],
      promptKey: k('1.3.2', 'q2'),
      options: [k('1.3.2', 'q2o1'), k('1.3.2', 'q2o2'), k('1.3.2', 'q2o3')],
      correctIndex: 0,
    },
    {
      id: '1.3.2-fb',
      kind: 'fretboardTap',
      needsBass: false,
      skills: ['fretboard'],
      promptKey: k('1.3.2', 'fb'),
      sequence: spider('A'),
      frets: 5,
    },
    {
      id: '1.3.2-clean',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique'],
      promptKey: k('1.3.2', 'play'),
      notes: twice(spider('A')),
      bpm: 60,
      tempoSteps: [60, 70],
    },
  ],
  mastery: 0.8,
};

const l133: Lesson = {
  id: '1.3.3',
  minutes: 12,
  titleKey: k('1.3.3', 'title'),
  objectiveKey: k('1.3.3', 'objective'),
  cartoon: { riveResource: 'kordi_1_3_3', durationSec: 90, sceneKeys: [1, 2, 3, 4].map((n) => k('1.3.3', `s${n}`)) },
  cards: [
    { titleKey: k('1.3.3', 'c1t'), bodyKey: k('1.3.3', 'c1b'), figure: 'fretboard-1234' },
    { titleKey: k('1.3.3', 'c2t'), bodyKey: k('1.3.3', 'c2b') },
  ],
  exercises: [
    {
      id: '1.3.3-fb',
      kind: 'fretboardTap',
      needsBass: false,
      skills: ['fretboard'],
      promptKey: k('1.3.3', 'fb'),
      sequence: spiderDown('E'),
      frets: 5,
    },
    {
      id: '1.3.3-q',
      kind: 'quiz',
      needsBass: false,
      skills: ['technique'],
      promptKey: k('1.3.3', 'q'),
      options: [k('1.3.3', 'qo1'), k('1.3.3', 'qo2'), k('1.3.3', 'qo3')],
      correctIndex: 0,
    },
    {
      id: '1.3.3-down',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique', 'rhythm'],
      promptKey: k('1.3.3', 'down'),
      notes: [...spiderDown('E'), ...spiderDown('E'), ...spiderDown('E'), ...spiderDown('E')],
      bpm: 60,
      tempoSteps: [60, 70, 80],
    },
    {
      id: '1.3.3-updown',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique', 'rhythm'],
      promptKey: k('1.3.3', 'updown'),
      notes: [...spider('E'), ...spiderDown('E'), ...spider('E'), ...spiderDown('E')],
      bpm: 60,
      tempoSteps: [60, 70, 80],
    },
  ],
  mastery: 0.8,
};

const l134: Lesson = {
  id: '1.3.4',
  minutes: 12,
  titleKey: k('1.3.4', 'title'),
  objectiveKey: k('1.3.4', 'objective'),
  cartoon: { riveResource: 'kordi_1_3_4', durationSec: 90, sceneKeys: [1, 2, 3, 4].map((n) => k('1.3.4', `s${n}`)) },
  cards: [
    { titleKey: k('1.3.4', 'c1t'), bodyKey: k('1.3.4', 'c1b'), figure: 'fretboard-1234' },
    { titleKey: k('1.3.4', 'c2t'), bodyKey: k('1.3.4', 'c2b'), figure: 'right-hand' },
  ],
  exercises: [
    {
      id: '1.3.4-q',
      kind: 'quiz',
      needsBass: false,
      skills: ['fretboard'],
      promptKey: k('1.3.4', 'q'),
      options: [k('1.3.4', 'qo1'), k('1.3.4', 'qo2'), k('1.3.4', 'qo3')],
      correctIndex: 0,
      hintKey: k('1.3.4', 'qh'),
    },
    {
      id: '1.3.4-fb',
      kind: 'fretboardTap',
      needsBass: false,
      skills: ['fretboard'],
      promptKey: k('1.3.4', 'fb'),
      sequence: [...spider('E'), ...spider('A')],
      frets: 5,
    },
    {
      id: '1.3.4-EA',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique', 'rhythm'],
      promptKey: k('1.3.4', 'EA'),
      notes: [...spider('E'), ...spider('A'), ...spider('E'), ...spider('A')],
      bpm: 60,
      tempoSteps: [60, 70, 80],
    },
    {
      id: '1.3.4-DG',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique', 'rhythm'],
      promptKey: k('1.3.4', 'DG'),
      notes: [...spider('D'), ...spider('G'), ...spider('D'), ...spider('G')],
      bpm: 60,
      tempoSteps: [60, 70, 80],
    },
  ],
  mastery: 0.8,
};

const l135: Lesson = {
  id: '1.3.5',
  minutes: 15,
  titleKey: k('1.3.5', 'title'),
  objectiveKey: k('1.3.5', 'objective'),
  cartoon: { riveResource: 'kordi_1_3_5', durationSec: 90, sceneKeys: [1, 2, 3, 4].map((n) => k('1.3.5', `s${n}`)) },
  cards: [
    { titleKey: k('1.3.5', 'c1t'), bodyKey: k('1.3.5', 'c1b'), figure: 'fretboard-1234' },
    { titleKey: k('1.3.5', 'c2t'), bodyKey: k('1.3.5', 'c2b') },
  ],
  exercises: [
    {
      id: '1.3.5-ear',
      kind: 'ear',
      needsBass: false,
      skills: ['ear', 'fretboard'],
      promptKey: k('1.3.5', 'ear'),
      options: [k('1.3.5', 'n1'), k('1.3.5', 'n2'), k('1.3.5', 'n3'), k('1.3.5', 'n4')],
      correctIndex: 2,
      // Referencia: Mi al aire; después cuerda Mi, traste 3 = Sol. Una octava arriba
      // (E2, G2) porque el parlante de un teléfono casi no reproduce 41–52 Hz.
      tones: [midiToFreq(28 + 12), midiToFreq(31 + 12)],
    },
    {
      id: '1.3.5-fb',
      kind: 'fretboardTap',
      needsBass: false,
      skills: ['fretboard'],
      promptKey: k('1.3.5', 'fb'),
      sequence: [...spiderDown('G'), ...spiderDown('D')],
      frets: 5,
    },
    {
      id: '1.3.5-full',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique', 'rhythm', 'fretboard'],
      promptKey: k('1.3.5', 'full'),
      notes: [...spider('E'), ...spider('A'), ...spider('D'), ...spider('G'), ...spiderDown('G'), ...spiderDown('D'), ...spiderDown('A'), ...spiderDown('E')],
      bpm: 60,
      tempoSteps: [60, 70],
    },
  ],
  mastery: 0.8,
};

/** Nota de tablatura o de «tocar con el bajo» con su duración en pulsos. */
const n = (string: 'E' | 'A' | 'D' | 'G', fret: number, beats: 1 | 2 | 4 = 1) => ({ string, fret, beats });

const l141: Lesson = {
  id: '1.4.1',
  minutes: 10,
  titleKey: k('1.4.1', 'title'),
  objectiveKey: k('1.4.1', 'objective'),
  cartoon: { riveResource: 'kordi_1_4_1', durationSec: 90, sceneKeys: [1, 2, 3, 4].map((x) => k('1.4.1', `s${x}`)) },
  cards: [
    { titleKey: k('1.4.1', 'c1t'), bodyKey: k('1.4.1', 'c1b'), figure: 'strings' },
    { titleKey: k('1.4.1', 'c2t'), bodyKey: k('1.4.1', 'c2b') },
    { titleKey: k('1.4.1', 'c3t'), bodyKey: k('1.4.1', 'c3b') },
  ],
  exercises: [
    {
      id: '1.4.1-line',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('1.4.1', 'q1'),
      options: [k('1.4.1', 'q1o1'), k('1.4.1', 'q1o2'), k('1.4.1', 'q1o3')],
      correctIndex: 0,
      hintKey: k('1.4.1', 'q1h'),
    },
    {
      id: '1.4.1-number',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('1.4.1', 'q2'),
      options: [k('1.4.1', 'q2o1'), k('1.4.1', 'q2o2'), k('1.4.1', 'q2o3')],
      correctIndex: 0,
    },
    {
      id: '1.4.1-tab',
      kind: 'tabReading',
      needsBass: false,
      skills: ['theory', 'fretboard'],
      promptKey: k('1.4.1', 'tab'),
      notes: [n('E', 0), n('E', 1), n('E', 3), n('E', 0), n('A', 0), n('A', 2), n('A', 3), n('A', 0)],
      frets: 5,
    },
    {
      id: '1.4.1-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['theory', 'technique'],
      promptKey: k('1.4.1', 'play'),
      notes: [n('E', 0), n('E', 1), n('E', 3), n('E', 0), n('A', 0), n('A', 2), n('A', 3), n('A', 0)],
      bpm: 60,
      tempoSteps: [60, 70],
    },
  ],
  mastery: 0.8,
};

const l142: Lesson = {
  id: '1.4.2',
  minutes: 10,
  titleKey: k('1.4.2', 'title'),
  objectiveKey: k('1.4.2', 'objective'),
  cartoon: { riveResource: 'kordi_1_4_2', durationSec: 90, sceneKeys: [1, 2, 3, 4].map((x) => k('1.4.2', `s${x}`)) },
  cards: [
    { titleKey: k('1.4.2', 'c1t'), bodyKey: k('1.4.2', 'c1b') },
    { titleKey: k('1.4.2', 'c2t'), bodyKey: k('1.4.2', 'c2b') },
  ],
  exercises: [
    {
      id: '1.4.2-q',
      kind: 'quiz',
      needsBass: false,
      skills: ['rhythm'],
      promptKey: k('1.4.2', 'q'),
      options: ['=2', '=3', '=4'],
      correctIndex: 2,
    },
    {
      id: '1.4.2-click',
      kind: 'tempoTrainer',
      needsBass: false,
      skills: ['rhythm'],
      promptKey: k('1.4.2', 'click'),
      bpm: 60,
      beats: 16,
      audibleBeats: 16,
    },
    {
      id: '1.4.2-alone',
      kind: 'tempoTrainer',
      needsBass: false,
      skills: ['rhythm'],
      promptKey: k('1.4.2', 'alone'),
      bpm: 60,
      beats: 16,
      audibleBeats: 8,
    },
    {
      id: '1.4.2-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['rhythm', 'technique'],
      promptKey: k('1.4.2', 'play'),
      notes: (['E', 'A', 'D', 'G'] as const).flatMap((s) => [n(s, 0), n(s, 0), n(s, 0), n(s, 0)]),
      bpm: 60,
      tempoSteps: [60, 70, 80],
    },
  ],
  mastery: 0.8,
};

const l143: Lesson = {
  id: '1.4.3',
  minutes: 12,
  titleKey: k('1.4.3', 'title'),
  objectiveKey: k('1.4.3', 'objective'),
  cartoon: { riveResource: 'kordi_1_4_3', durationSec: 90, sceneKeys: [1, 2, 3, 4].map((x) => k('1.4.3', `s${x}`)) },
  cards: [
    { titleKey: k('1.4.3', 'c1t'), bodyKey: k('1.4.3', 'c1b') },
    { titleKey: k('1.4.3', 'c2t'), bodyKey: k('1.4.3', 'c2b') },
    { titleKey: k('1.4.3', 'c3t'), bodyKey: k('1.4.3', 'c3b') },
  ],
  exercises: [
    {
      id: '1.4.3-half',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory', 'rhythm'],
      promptKey: k('1.4.3', 'q1'),
      options: ['=1', '=2', '=4'],
      correctIndex: 1,
    },
    {
      id: '1.4.3-whole',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory', 'rhythm'],
      promptKey: k('1.4.3', 'q2'),
      options: [k('1.4.3', 'whole'), k('1.4.3', 'half'), k('1.4.3', 'quarter')],
      correctIndex: 0,
    },
    {
      id: '1.4.3-tab',
      kind: 'tabReading',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('1.4.3', 'tab'),
      notes: [n('E', 0, 4), n('A', 0, 2), n('A', 2, 2), n('D', 0), n('D', 2), n('D', 3, 2)],
      frets: 5,
    },
    {
      id: '1.4.3-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['theory', 'rhythm'],
      promptKey: k('1.4.3', 'play'),
      notes: [n('E', 0, 4), n('A', 0, 2), n('A', 0, 2), n('E', 0), n('E', 0), n('E', 0), n('E', 0), n('A', 0, 4)],
      bpm: 60,
      tempoSteps: [60, 70],
    },
  ],
  mastery: 0.8,
};

const l144: Lesson = {
  id: '1.4.4',
  minutes: 12,
  titleKey: k('1.4.4', 'title'),
  objectiveKey: k('1.4.4', 'objective'),
  cartoon: { riveResource: 'kordi_1_4_4', durationSec: 90, sceneKeys: [1, 2, 3, 4].map((x) => k('1.4.4', `s${x}`)) },
  cards: [
    { titleKey: k('1.4.4', 'c1t'), bodyKey: k('1.4.4', 'c1b') },
    { titleKey: k('1.4.4', 'c2t'), bodyKey: k('1.4.4', 'c2b') },
  ],
  exercises: [
    {
      id: '1.4.4-q',
      kind: 'quiz',
      needsBass: false,
      skills: ['rhythm', 'theory'],
      promptKey: k('1.4.4', 'q'),
      options: ['=2', '=3', '=4'],
      correctIndex: 2,
      hintKey: k('1.4.4', 'qh'),
    },
    {
      id: '1.4.4-tempo',
      kind: 'tempoTrainer',
      needsBass: false,
      skills: ['rhythm'],
      promptKey: k('1.4.4', 'tempo'),
      bpm: 70,
      beats: 16,
      audibleBeats: 8,
    },
    {
      id: '1.4.4-tab',
      kind: 'tabReading',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('1.4.4', 'tab'),
      notes: [n('D', 0, 2), n('D', 2, 2), n('G', 0), n('G', 2), n('G', 0, 2), n('A', 0, 4)],
      frets: 5,
    },
    {
      id: '1.4.4-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['theory', 'rhythm'],
      promptKey: k('1.4.4', 'play'),
      notes: [n('E', 3, 2), n('E', 1, 2), n('A', 0), n('A', 2), n('A', 3, 2), n('D', 0, 4)],
      bpm: 60,
      tempoSteps: [60, 70],
    },
  ],
  mastery: 0.8,
};

/** Línea original de 4 compases para el hito del módulo 1.4. */
const LINE_145 = [n('E', 0), n('E', 3), n('A', 0, 2), n('A', 2, 2), n('A', 0, 2), n('D', 0), n('D', 2), n('D', 3), n('D', 2), n('E', 0, 4)];

const l145: Lesson = {
  id: '1.4.5',
  minutes: 15,
  titleKey: k('1.4.5', 'title'),
  objectiveKey: k('1.4.5', 'objective'),
  cartoon: { riveResource: 'kordi_1_4_5', durationSec: 90, sceneKeys: [1, 2, 3, 4].map((x) => k('1.4.5', `s${x}`)) },
  cards: [
    { titleKey: k('1.4.5', 'c1t'), bodyKey: k('1.4.5', 'c1b') },
    { titleKey: k('1.4.5', 'c2t'), bodyKey: k('1.4.5', 'c2b') },
  ],
  exercises: [
    {
      id: '1.4.5-pulse',
      kind: 'tempoTrainer',
      needsBass: false,
      skills: ['rhythm'],
      promptKey: k('1.4.5', 'pulse'),
      bpm: 70,
      beats: 32,
      audibleBeats: 8,
    },
    {
      id: '1.4.5-tab',
      kind: 'tabReading',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('1.4.5', 'tab'),
      notes: LINE_145,
      frets: 5,
    },
    {
      id: '1.4.5-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['theory', 'rhythm', 'technique'],
      promptKey: k('1.4.5', 'play'),
      notes: LINE_145,
      bpm: 60,
      tempoSteps: [60, 70],
    },
  ],
  mastery: 0.8,
};

export const LESSONS: Record<string, Lesson> = {
  [l111.id]: l111,
  [l114.id]: l114,
  [l121.id]: l121,
  [l131.id]: l131,
  [l132.id]: l132,
  [l133.id]: l133,
  [l134.id]: l134,
  [l135.id]: l135,
  [l141.id]: l141,
  [l142.id]: l142,
  [l143.id]: l143,
  [l144.id]: l144,
  [l145.id]: l145,
};

export function getLesson(id: string): Lesson | undefined {
  return LESSONS[id];
}
