/**
 * Lecciones de guitarra criolla: módulos 1.1 (tu guitarra criolla) y 1.2
 * (postura y manos), los gratuitos. Mismo formato que el bajo y la eléctrica:
 * 4 pasos, una habilidad nueva por lección y criterio de dominio. Textos en
 * `content.n.*`. El resto del nivel 1 está en level1.ts; los demás niveles llegan
 * de a uno (ADR 0010).
 *
 * Mientras no hay .riv, cada escena del cartoon trae su ilustración animada
 * (`visuals`) y, donde ayuda, su sonido (`sounds`).
 */
import type { Lesson, ListenExample, ScoreEvent } from '../types';
import { NYLON_LEVEL1_LESSONS } from './level1';
import { NYLON_LEVEL2_LESSONS } from './level2';
import { NYLON_LEVEL3_LESSONS } from './level3';
import { NYLON_LEVEL4_LESSONS } from './level4';
import { BASS_STRINGS, LOW_TO_HIGH, TREBLE_STRINGS, hear, hz, k, listen, n, notesOf, open, scenes, times } from './helpers';

/** Las 6 cuerdas al aire en dos compases: 4 negras y 2 blancas (Si y Mi aguda). */
const openStringsExample = (bpm = 70): ListenExample => listen(LOW_TO_HIGH.map((s, i) => open(s, i >= 4 ? 2 : 1)), bpm);

/** 1.1.2: las tres graves entorchadas y las tres agudas de nylon. */
const WOUND_VS_NYLON: ScoreEvent[] = [open('E'), open('A'), open('D', 2), open('G'), open('B'), open('e', 2)];

/** 1.2.2: el pulgar en las graves, de la 6.ª a la 4.ª y de vuelta. */
export const THUMB_BASSES: ScoreEvent[] = [open('E'), open('A'), open('D'), open('A'), open('E'), open('A'), open('D', 2)];

/** 1.2.3: un dedo por traste en la 1.ª cuerda (índice, medio, anular y meñique). */
export const FOUR_FINGERS: ScoreEvent[] = [n('e', 1), n('e', 2), n('e', 3), n('e', 4), n('e', 3), n('e', 2), n('e', 1, 2)];

/** 1.2.4: i-m alternados en la 1.ª cuerda al aire. */
export const IM_FIRST: ScoreEvent[] = Array.from({ length: 8 }, () => open('e'));

/**
 * 1.2.5: primer arpegio en cuerdas al aire (p-i-m-a): pulgar en una grave y
 * los dedos en 3.ª, 2.ª y 1.ª. Original, 4 compases de 4/4.
 */
export const FIRST_ARPEGGIO: ScoreEvent[] = [
  open('E'), open('G'), open('B'), open('e'),
  open('A'), open('G'), open('B'), open('e'),
  open('D'), open('G'), open('B'), open('e'),
  open('E'), open('G'), open('B', 2),
];

// ───────────────────────── Módulo 1.1 · Tu guitarra criolla ─────────────────────────

const l111: Lesson = {
  id: '1.1.1',
  minutes: 10,
  titleKey: k('1.1.1', 'title'),
  objectiveKey: k('1.1.1', 'objective'),
  cartoon: {
    riveResource: 'kordi_n_1_1_1',
    durationSec: 110,
    sceneKeys: scenes('1.1.1'),
    visuals: [null, 'nylon-parts', 'guitar-strings', 'guitar-strings'],
    sounds: [null, null, openStringsExample(80), hear([open('E', 2), open('e', 2)], 60)],
  },
  cards: [
    { titleKey: k('1.1.1', 'c1t'), bodyKey: k('1.1.1', 'c1b'), figure: 'nylon-parts' },
    { titleKey: k('1.1.1', 'c2t'), bodyKey: k('1.1.1', 'c2b'), figure: 'guitar-strings', listen: openStringsExample() },
    { titleKey: k('1.1.1', 'c3t'), bodyKey: k('1.1.1', 'c3b'), listen: listen([open('E', 2), open('e', 2)], 60) },
  ],
  exercises: [
    {
      id: '1.1.1-q1',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('1.1.1', 'q1'),
      options: [k('1.1.1', 'q1o1'), k('1.1.1', 'q1o2'), k('1.1.1', 'q1o3'), k('1.1.1', 'q1o4')],
      correctIndex: 1,
    },
    {
      id: '1.1.1-q2',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('1.1.1', 'q2'),
      options: [k('1.1.1', 'q2o1'), k('1.1.1', 'q2o2'), k('1.1.1', 'q2o3')],
      correctIndex: 0,
    },
    {
      id: '1.1.1-ear',
      kind: 'ear',
      needsBass: false,
      skills: ['ear'],
      promptKey: k('1.1.1', 'ear'),
      options: [k('1.1.1', 'first'), k('1.1.1', 'second')],
      correctIndex: 1,
      tones: [hz('E'), hz('e')],
    },
    {
      id: '1.1.1-open',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique'],
      promptKey: k('1.1.1', 'play'),
      notes: LOW_TO_HIGH.map((s) => ({ string: s, fret: 0 })),
      bpm: null,
    },
  ],
  mastery: 0.85,
};

const l112: Lesson = {
  id: '1.1.2',
  minutes: 8,
  titleKey: k('1.1.2', 'title'),
  objectiveKey: k('1.1.2', 'objective'),
  cartoon: {
    riveResource: 'kordi_n_1_1_2',
    durationSec: 100,
    sceneKeys: scenes('1.1.2'),
    visuals: [null, 'nylon-parts', 'guitar-strings', null],
    sounds: [null, null, listen(WOUND_VS_NYLON, 70), null],
  },
  cards: [
    { titleKey: k('1.1.2', 'c1t'), bodyKey: k('1.1.2', 'c1b'), figure: 'guitar-strings', listen: listen(WOUND_VS_NYLON, 70) },
    { titleKey: k('1.1.2', 'c2t'), bodyKey: k('1.1.2', 'c2b') },
    { titleKey: k('1.1.2', 'c3t'), bodyKey: k('1.1.2', 'c3b') },
  ],
  exercises: [
    {
      id: '1.1.2-q1',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('1.1.2', 'q1'),
      options: [k('1.1.2', 'q1o1'), k('1.1.2', 'q1o2'), k('1.1.2', 'q1o3')],
      correctIndex: 2,
    },
    {
      id: '1.1.2-q2',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('1.1.2', 'q2'),
      options: [k('1.1.2', 'q2o1'), k('1.1.2', 'q2o2'), k('1.1.2', 'q2o3')],
      correctIndex: 0,
    },
    {
      id: '1.1.2-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique'],
      promptKey: k('1.1.2', 'play'),
      notes: [...BASS_STRINGS, ...TREBLE_STRINGS].map((s) => ({ string: s, fret: 0 })),
      bpm: null,
    },
  ],
  mastery: 1,
};

const l113: Lesson = {
  id: '1.1.3',
  minutes: 10,
  titleKey: k('1.1.3', 'title'),
  objectiveKey: k('1.1.3', 'objective'),
  cartoon: {
    riveResource: 'kordi_n_1_1_3',
    durationSec: 110,
    sceneKeys: scenes('1.1.3'),
    visuals: ['guitar-strings', 'guitar-strings', 'guitar-strings', null],
    sounds: [null, openStringsExample(80), listen([open('A', 2), open('D', 2)], 60), null],
  },
  cards: [
    { titleKey: k('1.1.3', 'c1t'), bodyKey: k('1.1.3', 'c1b'), figure: 'guitar-strings' },
    { titleKey: k('1.1.3', 'c2t'), bodyKey: k('1.1.3', 'c2b'), listen: openStringsExample() },
    { titleKey: k('1.1.3', 'c3t'), bodyKey: k('1.1.3', 'c3b') },
  ],
  exercises: [
    {
      id: '1.1.3-q1',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory', 'fretboard'],
      promptKey: k('1.1.3', 'q1'),
      options: [k('1.1.3', 'q1o1'), k('1.1.3', 'q1o2'), k('1.1.3', 'q1o3'), k('1.1.3', 'q1o4')],
      correctIndex: 2,
    },
    {
      id: '1.1.3-q2',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory', 'fretboard'],
      promptKey: k('1.1.3', 'q2'),
      options: [k('1.1.3', 'q2o1'), k('1.1.3', 'q2o2'), k('1.1.3', 'q2o3'), k('1.1.3', 'q2o4')],
      correctIndex: 0,
    },
    {
      id: '1.1.3-tap',
      kind: 'fretboardTap',
      needsBass: false,
      skills: ['fretboard'],
      promptKey: k('1.1.3', 'tap'),
      sequence: [{ string: 'D', fret: 0 }, { string: 'B', fret: 0 }, { string: 'A', fret: 0 }, { string: 'G', fret: 0 }],
      frets: 3,
    },
    {
      id: '1.1.3-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique', 'fretboard'],
      promptKey: k('1.1.3', 'play'),
      notes: [{ string: 'A', fret: 0 }, { string: 'G', fret: 0 }, { string: 'e', fret: 0 }, { string: 'D', fret: 0 }, { string: 'B', fret: 0 }, { string: 'E', fret: 0 }],
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
  cartoon: {
    riveResource: 'kordi_n_1_1_4',
    durationSec: 140,
    sceneKeys: scenes('1.1.4'),
    visuals: ['guitar-tuner', 'guitar-tuner', 'guitar-strings', null],
    sounds: [null, hear([open('A', 2)], 60), openStringsExample(80), null],
  },
  cards: [
    { titleKey: k('1.1.4', 'c1t'), bodyKey: k('1.1.4', 'c1b'), figure: 'guitar-tuner' },
    { titleKey: k('1.1.4', 'c2t'), bodyKey: k('1.1.4', 'c2b'), listen: openStringsExample() },
    { titleKey: k('1.1.4', 'c3t'), bodyKey: k('1.1.4', 'c3b') },
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
      tones: [hz('A'), hz('A', 1)], // un semitono
    },
    {
      id: '1.1.4-ear2',
      kind: 'ear',
      needsBass: false,
      skills: ['ear'],
      promptKey: k('1.1.4', 'ear'),
      options: [k('1.1.4', 'higher'), k('1.1.4', 'lower')],
      correctIndex: 1,
      tones: [hz('G', 1), hz('G')],
    },
    {
      id: '1.1.4-tune',
      kind: 'playAlong',
      needsBass: true,
      skills: ['ear', 'technique'],
      promptKey: k('1.1.4', 'tune'),
      notes: LOW_TO_HIGH.map((s) => ({ string: s, fret: 0 })),
      bpm: null,
      toleranceCents: 5,
    },
  ],
  mastery: 1,
};

const l115: Lesson = {
  id: '1.1.5',
  minutes: 10,
  titleKey: k('1.1.5', 'title'),
  objectiveKey: k('1.1.5', 'objective'),
  cartoon: {
    riveResource: 'kordi_n_1_1_5',
    durationSec: 120,
    sceneKeys: scenes('1.1.5'),
    visuals: ['nylon-parts', 'nylon-parts', 'guitar-tuner', null],
    sounds: [null, null, null, null],
  },
  cards: [
    { titleKey: k('1.1.5', 'c1t'), bodyKey: k('1.1.5', 'c1b'), figure: 'nylon-parts' },
    { titleKey: k('1.1.5', 'c2t'), bodyKey: k('1.1.5', 'c2b') },
    { titleKey: k('1.1.5', 'c3t'), bodyKey: k('1.1.5', 'c3b'), figure: 'guitar-tuner' },
  ],
  exercises: [
    {
      id: '1.1.5-q1',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('1.1.5', 'q1'),
      options: [k('1.1.5', 'q1o1'), k('1.1.5', 'q1o2'), k('1.1.5', 'q1o3')],
      correctIndex: 1,
    },
    {
      id: '1.1.5-q2',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('1.1.5', 'q2'),
      options: [k('1.1.5', 'q2o1'), k('1.1.5', 'q2o2'), k('1.1.5', 'q2o3')],
      correctIndex: 2,
    },
    {
      id: '1.1.5-q3',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('1.1.5', 'q3'),
      options: [k('1.1.5', 'q3o1'), k('1.1.5', 'q3o2'), k('1.1.5', 'q3o3')],
      correctIndex: 0,
    },
    {
      id: '1.1.5-retune',
      kind: 'playAlong',
      needsBass: true,
      skills: ['ear', 'technique'],
      promptKey: k('1.1.5', 'tune'),
      notes: LOW_TO_HIGH.map((s) => ({ string: s, fret: 0 })),
      bpm: null,
      toleranceCents: 5,
    },
  ],
  mastery: 1,
};

// ───────────────────────── Módulo 1.2 · Postura y manos ─────────────────────────

const l121: Lesson = {
  id: '1.2.1',
  minutes: 8,
  titleKey: k('1.2.1', 'title'),
  objectiveKey: k('1.2.1', 'objective'),
  cartoon: {
    riveResource: 'kordi_n_1_2_1',
    durationSec: 100,
    sceneKeys: scenes('1.2.1'),
    visuals: [null, 'nylon-posture', 'nylon-posture', null],
    sounds: [null, null, null, hear([open('E', 4)], 60)],
  },
  cards: [
    { titleKey: k('1.2.1', 'c1t'), bodyKey: k('1.2.1', 'c1b'), figure: 'nylon-posture' },
    { titleKey: k('1.2.1', 'c2t'), bodyKey: k('1.2.1', 'c2b') },
    { titleKey: k('1.2.1', 'c3t'), bodyKey: k('1.2.1', 'c3b') },
  ],
  exercises: [
    {
      id: '1.2.1-q1',
      kind: 'quiz',
      needsBass: false,
      skills: ['technique'],
      promptKey: k('1.2.1', 'q1'),
      options: [k('1.2.1', 'q1o1'), k('1.2.1', 'q1o2'), k('1.2.1', 'q1o3')],
      correctIndex: 1,
    },
    {
      id: '1.2.1-q2',
      kind: 'quiz',
      needsBass: false,
      skills: ['technique'],
      promptKey: k('1.2.1', 'q2'),
      options: [k('1.2.1', 'q2o1'), k('1.2.1', 'q2o2'), k('1.2.1', 'q2o3')],
      correctIndex: 0,
    },
    {
      id: '1.2.1-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique'],
      promptKey: k('1.2.1', 'play'),
      // Sin notas iguales seguidas: sin tempo, una nota que sigue sonando se daría por tocada otra vez.
      notes: [...times('E', 1), ...times('A', 1), ...times('D', 1), ...times('A', 1), ...times('E', 1)],
      bpm: null,
    },
  ],
  mastery: 1,
};

const l122: Lesson = {
  id: '1.2.2',
  minutes: 10,
  titleKey: k('1.2.2', 'title'),
  objectiveKey: k('1.2.2', 'objective'),
  cartoon: {
    riveResource: 'kordi_n_1_2_2',
    durationSec: 120,
    sceneKeys: scenes('1.2.2'),
    visuals: [null, 'pima-hand', 'pima-hand', 'pima-hand'],
    sounds: [null, null, listen(THUMB_BASSES, 70), null],
  },
  cards: [
    { titleKey: k('1.2.2', 'c1t'), bodyKey: k('1.2.2', 'c1b'), figure: 'pima-hand' },
    { titleKey: k('1.2.2', 'c2t'), bodyKey: k('1.2.2', 'c2b'), listen: listen(THUMB_BASSES, 70) },
    { titleKey: k('1.2.2', 'c3t'), bodyKey: k('1.2.2', 'c3b') },
  ],
  exercises: [
    {
      id: '1.2.2-q1',
      kind: 'quiz',
      needsBass: false,
      skills: ['technique'],
      promptKey: k('1.2.2', 'q1'),
      options: ['=p', '=i', '=m', '=a'],
      correctIndex: 2,
    },
    {
      id: '1.2.2-q2',
      kind: 'quiz',
      needsBass: false,
      skills: ['technique'],
      promptKey: k('1.2.2', 'q2'),
      options: [k('1.2.2', 'q2o1'), k('1.2.2', 'q2o2'), k('1.2.2', 'q2o3')],
      correctIndex: 0,
    },
    {
      id: '1.2.2-pads',
      kind: 'tapRhythm',
      needsBass: false,
      skills: ['rhythm', 'technique'],
      promptKey: k('1.2.2', 'pads'),
      bpm: 60,
      beats: 16,
      pads: ['p', 'i', 'm', 'a'],
    },
    {
      id: '1.2.2-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique', 'rhythm'],
      promptKey: k('1.2.2', 'play'),
      notes: notesOf(THUMB_BASSES),
      bpm: 60,
      tempoSteps: [60, 70],
    },
  ],
  mastery: 0.85,
};

const l123: Lesson = {
  id: '1.2.3',
  minutes: 10,
  titleKey: k('1.2.3', 'title'),
  objectiveKey: k('1.2.3', 'objective'),
  cartoon: {
    riveResource: 'kordi_n_1_2_3',
    durationSec: 110,
    sceneKeys: scenes('1.2.3'),
    visuals: [null, 'fret-hand', 'fret-hand', null],
    sounds: [null, null, listen(FOUR_FINGERS, 60), null],
  },
  cards: [
    { titleKey: k('1.2.3', 'c1t'), bodyKey: k('1.2.3', 'c1b'), figure: 'fret-hand' },
    { titleKey: k('1.2.3', 'c2t'), bodyKey: k('1.2.3', 'c2b'), listen: listen(FOUR_FINGERS, 60) },
    { titleKey: k('1.2.3', 'c3t'), bodyKey: k('1.2.3', 'c3b') },
  ],
  exercises: [
    {
      id: '1.2.3-q1',
      kind: 'quiz',
      needsBass: false,
      skills: ['technique'],
      promptKey: k('1.2.3', 'q1'),
      options: [k('1.2.3', 'q1o1'), k('1.2.3', 'q1o2'), k('1.2.3', 'q1o3')],
      correctIndex: 0,
    },
    {
      id: '1.2.3-tap',
      kind: 'fretboardTap',
      needsBass: false,
      skills: ['fretboard'],
      promptKey: k('1.2.3', 'tap'),
      sequence: [1, 2, 3, 4].map((fret) => ({ string: 'e' as const, fret })),
      frets: 5,
    },
    {
      id: '1.2.3-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique', 'fretboard'],
      promptKey: k('1.2.3', 'play'),
      notes: notesOf(FOUR_FINGERS),
      bpm: 60,
      tempoSteps: [60, 70],
    },
  ],
  mastery: 0.85,
};

const l124: Lesson = {
  id: '1.2.4',
  minutes: 10,
  titleKey: k('1.2.4', 'title'),
  objectiveKey: k('1.2.4', 'objective'),
  cartoon: {
    riveResource: 'kordi_n_1_2_4',
    durationSec: 120,
    sceneKeys: scenes('1.2.4'),
    visuals: [null, 'pima-hand', 'pima-hand', null],
    sounds: [null, hear([open('e'), open('B'), open('G', 2)], 70, { tone: 'neck' }), hear([open('e'), open('B'), open('G', 2)], 70, { tone: 'clean' }), null],
  },
  cards: [
    {
      titleKey: k('1.2.4', 'c1t'),
      bodyKey: k('1.2.4', 'c1b'),
      listen: hear([open('e'), open('B'), open('G', 2)], 70, { tone: 'neck' }),
    },
    {
      titleKey: k('1.2.4', 'c2t'),
      bodyKey: k('1.2.4', 'c2b'),
      listen: hear([open('e'), open('B'), open('G', 2)], 70, { tone: 'clean' }),
    },
    { titleKey: k('1.2.4', 'c3t'), bodyKey: k('1.2.4', 'c3b'), figure: 'pima-hand' },
  ],
  exercises: [
    {
      id: '1.2.4-ear1',
      kind: 'ear',
      needsBass: false,
      skills: ['ear'],
      promptKey: k('1.2.4', 'ear'),
      options: [k('1.2.4', 'flesh'), k('1.2.4', 'nail')],
      correctIndex: 1,
      tones: [hz('e'), hz('B'), hz('G')],
      timbres: ['clean', 'clean', 'clean'],
    },
    {
      id: '1.2.4-ear2',
      kind: 'ear',
      needsBass: false,
      skills: ['ear'],
      promptKey: k('1.2.4', 'ear'),
      options: [k('1.2.4', 'flesh'), k('1.2.4', 'nail')],
      correctIndex: 0,
      tones: [hz('e'), hz('B'), hz('G')],
      timbres: ['neck', 'neck', 'neck'],
    },
    {
      id: '1.2.4-pads',
      kind: 'tapRhythm',
      needsBass: false,
      skills: ['rhythm', 'technique'],
      promptKey: k('1.2.4', 'pads'),
      bpm: 70,
      beats: 16,
      pads: ['i', 'm'],
    },
    {
      id: '1.2.4-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique', 'rhythm'],
      promptKey: k('1.2.4', 'play'),
      notes: notesOf(IM_FIRST),
      bpm: 60,
      tempoSteps: [60, 70, 80],
    },
  ],
  mastery: 0.85,
};

const l125: Lesson = {
  id: '1.2.5',
  minutes: 12,
  titleKey: k('1.2.5', 'title'),
  objectiveKey: k('1.2.5', 'objective'),
  cartoon: {
    riveResource: 'kordi_n_1_2_5',
    durationSec: 130,
    sceneKeys: scenes('1.2.5'),
    visuals: [null, 'pima-hand', 'pima-hand', null],
    sounds: [null, null, listen(FIRST_ARPEGGIO, 60), listen(FIRST_ARPEGGIO, 70)],
  },
  cards: [
    { titleKey: k('1.2.5', 'c1t'), bodyKey: k('1.2.5', 'c1b') },
    { titleKey: k('1.2.5', 'c2t'), bodyKey: k('1.2.5', 'c2b'), figure: 'pima-hand', listen: listen(FIRST_ARPEGGIO, 60) },
    { titleKey: k('1.2.5', 'c3t'), bodyKey: k('1.2.5', 'c3b') },
  ],
  exercises: [
    {
      id: '1.2.5-q1',
      kind: 'quiz',
      needsBass: false,
      skills: ['technique'],
      promptKey: k('1.2.5', 'q1'),
      options: ['=p', '=i', '=m', '=a'],
      correctIndex: 0,
    },
    {
      id: '1.2.5-pads',
      kind: 'tapRhythm',
      needsBass: false,
      skills: ['rhythm', 'technique'],
      promptKey: k('1.2.5', 'pads'),
      bpm: 60,
      beats: 16,
      pads: ['p', 'i', 'm', 'a'],
    },
    {
      id: '1.2.5-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique', 'rhythm'],
      promptKey: k('1.2.5', 'play'),
      notes: notesOf(FIRST_ARPEGGIO),
      bpm: 60,
      tempoSteps: [60, 70],
    },
  ],
  mastery: 0.85,
};

export const NYLON_LESSONS: Record<string, Lesson> = {
  [l111.id]: l111,
  [l112.id]: l112,
  [l113.id]: l113,
  [l114.id]: l114,
  [l115.id]: l115,
  [l121.id]: l121,
  [l122.id]: l122,
  [l123.id]: l123,
  [l124.id]: l124,
  [l125.id]: l125,
  ...Object.fromEntries([...NYLON_LEVEL1_LESSONS, ...NYLON_LEVEL2_LESSONS, ...NYLON_LEVEL3_LESSONS, ...NYLON_LEVEL4_LESSONS].map((l) => [l.id, l])),
};
