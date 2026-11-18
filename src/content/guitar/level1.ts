/**
 * Guitarra eléctrica, nivel 1 (continuación): módulos 1.3 (dedos independientes),
 * 1.4 (silencio entre notas) y 1.5 (leer guitarra), y el checkpoint 1.
 * Riffs y ejercicios originales. Textos en `content.g.l13x…l15x` y `content.g.cp1`.
 */
import type { Checkpoint } from '../checkpoints';
import type { Lesson, ScoreEvent } from '../types';
import type { StringId } from '../../instruments/profiles';
import { hz, k, listen, n, notesOf, rest, scenes, spider, spiderDown, tabOf } from './helpers';

const asScore = (notes: { string: StringId; fret: number }[]): ScoreEvent[] => notes.map((x) => n(x.string, x.fret));

// ───────────── Partituras originales ─────────────

/** 1.3.x: cromático de ida y vuelta en dos cuerdas. */
const pairSpider = (low: StringId, high: StringId) => [...spider(low), ...spider(high), ...spiderDown(high), ...spiderDown(low)];

/** 1.3.5: las 6 cuerdas, subiendo y bajando. */
const SIX_UP: StringId[] = ['E', 'A', 'D', 'G', 'B', 'e'];
export const FULL_SPIDER = [...SIX_UP.flatMap(spider), ...[...SIX_UP].reverse().flatMap(spiderDown)];

/** 1.4.1: notas pisadas que se cortan aflojando la mano. */
export const FRET_MUTE: ScoreEvent[] = [
  n('A', 2), rest(), n('A', 2), rest(),
  n('A', 3), rest(), n('A', 3), rest(),
  n('D', 2), rest(), n('D', 2), rest(),
  n('D', 3), rest(), n('D', 3), rest(),
];

/** 1.4.2: cuerdas al aire que se cortan con la mano de la púa. */
export const PICK_MUTE: ScoreEvent[] = [
  n('E', 0), rest(), n('E', 0), rest(),
  n('A', 0), rest(), n('A', 0), rest(),
  n('D', 0), rest(), n('D', 0), rest(),
  n('E', 0), rest(), n('A', 0), rest(),
];

/** 1.4.3: silencios dentro del ritmo. */
export const REST_GROOVE: ScoreEvent[] = [
  n('E', 0), n('E', 0), rest(), n('E', 0),
  n('A', 0), rest(), n('A', 0), rest(),
  n('D', 0), n('D', 0), n('D', 0), rest(),
  n('E', 0, 2), rest(2),
];

/** 1.4.4: riff original con silencios, sin ruido. */
export const QUIET_RIFF: ScoreEvent[] = [
  n('E', 0), rest(), n('E', 3), rest(),
  n('A', 0), rest(), n('A', 2), n('A', 3),
  n('E', 0), rest(), n('E', 3), n('E', 2),
  n('E', 0, 2), rest(2),
];

/** 1.5.1: primera tablatura en las cuerdas agudas. */
export const HIGH_TAB: ScoreEvent[] = [n('e', 0), n('B', 0), n('G', 0), n('D', 0), n('B', 1), n('B', 3), n('e', 0), n('e', 3)];

/** 1.5.2: negras, blancas y redondas en la TAB. */
export const LONG_SHORT: ScoreEvent[] = [
  n('E', 0, 2), n('A', 0, 2),
  n('D', 2), n('D', 0), n('A', 2), n('A', 0),
  n('E', 3), n('E', 0), n('A', 0, 2),
  n('E', 0, 4),
];

/** 1.5.3: corcheas y silencios. */
export const EIGHTHS_RESTS: ScoreEvent[] = [
  n('E', 0, 0.5), n('E', 0, 0.5), n('A', 0), rest(), n('A', 0),
  n('D', 0, 0.5), n('D', 0, 0.5), n('D', 2), rest(2),
  n('E', 0, 0.5), n('E', 0, 0.5), n('E', 3), rest(), n('A', 0),
  n('A', 2, 0.5), n('A', 2, 0.5), n('A', 0), rest(2),
];

/** 1.5.5: lectura a primera vista. */
export const SIGHT_RIFF: ScoreEvent[] = [
  n('A', 0), n('A', 3), n('D', 0), n('D', 2),
  n('E', 0), n('E', 3), n('A', 0, 2),
  n('D', 0), n('D', 2), n('G', 0), n('D', 2),
  n('A', 0, 4),
];

/** Checkpoint 1: tablatura nueva para leer (distinta de la de 1.5.5). */
export const CP1_TAB: ScoreEvent[] = [
  n('D', 0), n('D', 2), n('A', 0), n('A', 3),
  n('E', 0, 2), n('E', 3, 2),
  n('A', 0), n('A', 2), n('D', 0), n('G', 0),
  n('D', 2, 4),
];

/** Checkpoint 1: riff con corcheas y silencios a 80 bpm. */
export const CP1_RIFF: ScoreEvent[] = [
  n('E', 0, 0.5), n('E', 0, 0.5), n('E', 3), n('E', 0, 0.5), n('E', 0, 0.5), n('A', 0),
  n('A', 2), rest(), n('A', 0), rest(),
  n('D', 0, 0.5), n('D', 0, 0.5), n('D', 2), n('A', 0, 0.5), n('A', 0, 0.5), n('A', 2),
  n('E', 0, 2), rest(2),
];

const STEPS = [60, 70, 80];

// ───────────── Módulo 1.3 · Dedos independientes ─────────────

const l131: Lesson = {
  id: '1.3.1',
  minutes: 10,
  titleKey: k('1.3.1', 'title'),
  objectiveKey: k('1.3.1', 'objective'),
  cartoon: {
    riveResource: 'kordi_g_1_3_1',
    durationSec: 110,
    sceneKeys: scenes('1.3.1'),
    visuals: ['fret-hand', 'fret-hand', 'fretboard-1234', null],
    sounds: [null, null, listen(asScore(spider('E')), 70), null],
  },
  cards: [
    { titleKey: k('1.3.1', 'c1t'), bodyKey: k('1.3.1', 'c1b'), figure: 'fret-hand' },
    { titleKey: k('1.3.1', 'c2t'), bodyKey: k('1.3.1', 'c2b'), figure: 'fretboard-1234', listen: listen(asScore(spider('E')), 70, { show: 'tab' }) },
    { titleKey: k('1.3.1', 'c3t'), bodyKey: k('1.3.1', 'c3b') },
  ],
  exercises: [
    {
      id: '1.3.1-q1',
      kind: 'quiz',
      needsBass: false,
      skills: ['technique'],
      promptKey: k('1.3.1', 'q1'),
      options: [k('1.3.1', 'q1o1'), k('1.3.1', 'q1o2'), k('1.3.1', 'q1o3'), k('1.3.1', 'q1o4')],
      correctIndex: 2,
    },
    {
      id: '1.3.1-tap',
      kind: 'fretboardTap',
      needsBass: false,
      skills: ['fretboard'],
      promptKey: k('1.3.1', 'tap'),
      sequence: spider('E'),
      frets: 5,
    },
    {
      id: '1.3.1-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique'],
      promptKey: k('1.3.1', 'play'),
      notes: [...spider('E'), ...spider('E')],
      bpm: null,
    },
  ],
  mastery: 0.85,
};

function spiderLesson(id: string, low: StringId, high: StringId, minutes: number, visual: 'fret-hand' | 'fretboard-1234', bpm = 60): Lesson {
  const notes = pairSpider(low, high);
  return {
    id,
    minutes,
    titleKey: k(id, 'title'),
    objectiveKey: k(id, 'objective'),
    cartoon: {
      riveResource: `kordi_g_${id.replace(/\./g, '_')}`,
      durationSec: 100,
      sceneKeys: scenes(id),
      visuals: [visual, null, 'fret-hand', null],
      sounds: [null, listen(asScore(notes), 80), null, null],
    },
    cards: [
      { titleKey: k(id, 'c1t'), bodyKey: k(id, 'c1b'), listen: listen(asScore(notes), 70, { show: 'tab', click: true }) },
      { titleKey: k(id, 'c2t'), bodyKey: k(id, 'c2b'), figure: 'fret-hand' },
    ],
    exercises: [
      {
        id: `${id}-tab`,
        kind: 'tabReading',
        needsBass: false,
        skills: ['theory', 'fretboard'],
        promptKey: k(id, 'tab'),
        notes: tabOf(asScore(notes.slice(0, 8))),
        frets: 5,
      },
      {
        id: `${id}-play`,
        kind: 'playAlong',
        needsBass: true,
        skills: ['technique', 'fretboard'],
        promptKey: k(id, 'play'),
        notes,
        bpm,
        tempoSteps: STEPS,
      },
    ],
    mastery: 0.8,
  };
}

const l132 = spiderLesson('1.3.2', 'E', 'A', 10, 'fretboard-1234');
const l133 = spiderLesson('1.3.3', 'D', 'G', 10, 'fret-hand');
const l134 = spiderLesson('1.3.4', 'B', 'e', 10, 'fret-hand');

const l135: Lesson = {
  id: '1.3.5',
  minutes: 14,
  titleKey: k('1.3.5', 'title'),
  objectiveKey: k('1.3.5', 'objective'),
  cartoon: {
    riveResource: 'kordi_g_1_3_5',
    durationSec: 110,
    sceneKeys: scenes('1.3.5'),
    visuals: [null, 'fret-hand', null, null],
    sounds: [listen(asScore(FULL_SPIDER.slice(0, 24)), 90), null, null, null],
  },
  cards: [
    { titleKey: k('1.3.5', 'c1t'), bodyKey: k('1.3.5', 'c1b'), listen: listen(asScore(FULL_SPIDER), 70, { show: 'tab', click: true }) },
    { titleKey: k('1.3.5', 'c2t'), bodyKey: k('1.3.5', 'c2b') },
  ],
  exercises: [
    {
      id: '1.3.5-pulse',
      kind: 'tempoTrainer',
      needsBass: false,
      skills: ['rhythm'],
      promptKey: k('1.3.5', 'pulse'),
      bpm: 70,
      beats: 24,
      audibleBeats: 8,
    },
    {
      id: '1.3.5-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique', 'fretboard', 'rhythm'],
      promptKey: k('1.3.5', 'play'),
      notes: FULL_SPIDER,
      bpm: 60,
      tempoSteps: STEPS,
    },
  ],
  mastery: 0.8,
};

// ───────────── Módulo 1.4 · Silencio entre notas ─────────────

const l141: Lesson = {
  id: '1.4.1',
  minutes: 10,
  titleKey: k('1.4.1', 'title'),
  objectiveKey: k('1.4.1', 'objective'),
  cartoon: {
    riveResource: 'kordi_g_1_4_1',
    durationSec: 100,
    sceneKeys: scenes('1.4.1'),
    visuals: [null, 'mute-fret-hand', 'mute-fret-hand', null],
    sounds: [listen([n('A', 2, 4)], 70), null, listen(FRET_MUTE.slice(0, 4), 70), null],
  },
  cards: [
    { titleKey: k('1.4.1', 'c1t'), bodyKey: k('1.4.1', 'c1b'), figure: 'mute-fret-hand' },
    { titleKey: k('1.4.1', 'c2t'), bodyKey: k('1.4.1', 'c2b'), listen: listen(FRET_MUTE, 70, { show: 'tab', click: true }) },
  ],
  exercises: [
    {
      id: '1.4.1-ear',
      kind: 'ear',
      needsBass: false,
      skills: ['ear'],
      promptKey: k('1.4.1', 'ear'),
      options: [k('1.4.1', 'long'), k('1.4.1', 'short')],
      correctIndex: 1,
      tones: [hz('A', 2)],
      timbres: ['muted'],
    },
    {
      id: '1.4.1-ear2',
      kind: 'ear',
      needsBass: false,
      skills: ['ear'],
      promptKey: k('1.4.1', 'ear'),
      options: [k('1.4.1', 'long'), k('1.4.1', 'short')],
      correctIndex: 0,
      tones: [hz('A', 2)],
      timbres: ['clean'],
    },
    {
      id: '1.4.1-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique', 'rhythm'],
      promptKey: k('1.4.1', 'play'),
      notes: notesOf(FRET_MUTE),
      score: FRET_MUTE,
      bpm: 60,
      tempoSteps: STEPS,
    },
  ],
  mastery: 0.8,
};

const l142: Lesson = {
  id: '1.4.2',
  minutes: 10,
  titleKey: k('1.4.2', 'title'),
  objectiveKey: k('1.4.2', 'objective'),
  cartoon: {
    riveResource: 'kordi_g_1_4_2',
    durationSec: 100,
    sceneKeys: scenes('1.4.2'),
    visuals: ['mute-pick-hand', 'mute-pick-hand', null, null],
    sounds: [listen([n('E', 0, 4)], 70), null, listen(PICK_MUTE.slice(0, 8), 70), null],
  },
  cards: [
    { titleKey: k('1.4.2', 'c1t'), bodyKey: k('1.4.2', 'c1b'), figure: 'mute-pick-hand' },
    { titleKey: k('1.4.2', 'c2t'), bodyKey: k('1.4.2', 'c2b'), listen: listen(PICK_MUTE, 70, { show: 'tab', click: true }) },
  ],
  exercises: [
    {
      id: '1.4.2-q1',
      kind: 'quiz',
      needsBass: false,
      skills: ['technique'],
      promptKey: k('1.4.2', 'q1'),
      options: [k('1.4.2', 'q1o1'), k('1.4.2', 'q1o2'), k('1.4.2', 'q1o3')],
      correctIndex: 0,
    },
    {
      id: '1.4.2-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique', 'rhythm'],
      promptKey: k('1.4.2', 'play'),
      notes: notesOf(PICK_MUTE),
      score: PICK_MUTE,
      bpm: 60,
      tempoSteps: STEPS,
    },
  ],
  mastery: 0.8,
};

const l143: Lesson = {
  id: '1.4.3',
  minutes: 10,
  titleKey: k('1.4.3', 'title'),
  objectiveKey: k('1.4.3', 'objective'),
  cartoon: {
    riveResource: 'kordi_g_1_4_3',
    durationSec: 90,
    sceneKeys: scenes('1.4.3'),
    visuals: [null, null, 'mute-pick-hand', null],
    sounds: [null, listen(REST_GROOVE, 70, { click: true }), null, null],
  },
  cards: [
    { titleKey: k('1.4.3', 'c1t'), bodyKey: k('1.4.3', 'c1b'), listen: listen(REST_GROOVE, 70, { show: 'tab', click: true }) },
    { titleKey: k('1.4.3', 'c2t'), bodyKey: k('1.4.3', 'c2b') },
  ],
  exercises: [
    {
      id: '1.4.3-pulse',
      kind: 'tempoTrainer',
      needsBass: false,
      skills: ['rhythm'],
      promptKey: k('1.4.3', 'pulse'),
      bpm: 70,
      beats: 16,
      audibleBeats: 8,
    },
    {
      id: '1.4.3-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['rhythm', 'technique'],
      promptKey: k('1.4.3', 'play'),
      notes: notesOf(REST_GROOVE),
      score: REST_GROOVE,
      bpm: 60,
      tempoSteps: STEPS,
    },
  ],
  mastery: 0.8,
};

const l144: Lesson = {
  id: '1.4.4',
  minutes: 12,
  titleKey: k('1.4.4', 'title'),
  objectiveKey: k('1.4.4', 'objective'),
  cartoon: {
    riveResource: 'kordi_g_1_4_4',
    durationSec: 100,
    sceneKeys: scenes('1.4.4'),
    visuals: [null, 'mute-fret-hand', 'mute-pick-hand', null],
    sounds: [listen(QUIET_RIFF, 80, { tone: 'crunch' }), null, null, listen(QUIET_RIFF, 70, { click: true })],
  },
  cards: [
    { titleKey: k('1.4.4', 'c1t'), bodyKey: k('1.4.4', 'c1b'), listen: listen(QUIET_RIFF, 70, { show: 'tab', click: true }) },
    { titleKey: k('1.4.4', 'c2t'), bodyKey: k('1.4.4', 'c2b'), listen: listen(QUIET_RIFF, 80, { tone: 'crunch' }) },
  ],
  exercises: [
    {
      id: '1.4.4-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique', 'rhythm'],
      promptKey: k('1.4.4', 'play'),
      notes: notesOf(QUIET_RIFF),
      score: QUIET_RIFF,
      bpm: 60,
      tempoSteps: STEPS,
    },
  ],
  mastery: 0.8,
};

// ───────────── Módulo 1.5 · Leer guitarra ─────────────

const l151: Lesson = {
  id: '1.5.1',
  minutes: 10,
  titleKey: k('1.5.1', 'title'),
  objectiveKey: k('1.5.1', 'objective'),
  cartoon: {
    riveResource: 'kordi_g_1_5_1',
    durationSec: 100,
    sceneKeys: scenes('1.5.1'),
    visuals: [null, 'guitar-strings', null, null],
    sounds: [null, null, listen(HIGH_TAB, 70), null],
  },
  cards: [
    { titleKey: k('1.5.1', 'c1t'), bodyKey: k('1.5.1', 'c1b'), figure: 'guitar-strings' },
    { titleKey: k('1.5.1', 'c2t'), bodyKey: k('1.5.1', 'c2b'), listen: listen(HIGH_TAB, 70, { show: 'tab' }) },
  ],
  exercises: [
    {
      id: '1.5.1-q1',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('1.5.1', 'q1'),
      options: [k('1.5.1', 'q1o1'), k('1.5.1', 'q1o2'), k('1.5.1', 'q1o3')],
      correctIndex: 1,
    },
    {
      id: '1.5.1-tab',
      kind: 'tabReading',
      needsBass: false,
      skills: ['theory', 'fretboard'],
      promptKey: k('1.5.1', 'tab'),
      notes: tabOf(HIGH_TAB),
      frets: 4,
    },
  ],
  mastery: 0.85,
};

const l152: Lesson = {
  id: '1.5.2',
  minutes: 10,
  titleKey: k('1.5.2', 'title'),
  objectiveKey: k('1.5.2', 'objective'),
  cartoon: {
    riveResource: 'kordi_g_1_5_2',
    durationSec: 100,
    sceneKeys: scenes('1.5.2'),
    visuals: [null, null, 'guitar-strings', null],
    sounds: [null, listen([n('E', 0), n('E', 0), n('E', 0, 2), n('E', 0, 4)], 70, { click: true }), listen(LONG_SHORT, 70, { click: true }), null],
  },
  cards: [
    { titleKey: k('1.5.2', 'c1t'), bodyKey: k('1.5.2', 'c1b'), listen: listen([n('E', 0), n('E', 0), n('E', 0, 2), n('E', 0, 4)], 70, { show: 'tab', click: true }) },
    { titleKey: k('1.5.2', 'c2t'), bodyKey: k('1.5.2', 'c2b'), listen: listen(LONG_SHORT, 70, { show: 'tab', click: true }) },
  ],
  exercises: [
    {
      id: '1.5.2-q1',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('1.5.2', 'q1'),
      options: ['=1', '=2', '=4'],
      correctIndex: 1,
    },
    {
      id: '1.5.2-tab',
      kind: 'tabReading',
      needsBass: false,
      skills: ['theory', 'rhythm'],
      promptKey: k('1.5.2', 'tab'),
      notes: tabOf(LONG_SHORT),
      frets: 4,
    },
    {
      id: '1.5.2-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['rhythm', 'technique'],
      promptKey: k('1.5.2', 'play'),
      notes: tabOf(LONG_SHORT),
      bpm: 60,
      tempoSteps: STEPS,
    },
  ],
  mastery: 0.8,
};

const l153: Lesson = {
  id: '1.5.3',
  minutes: 12,
  titleKey: k('1.5.3', 'title'),
  objectiveKey: k('1.5.3', 'objective'),
  cartoon: {
    riveResource: 'kordi_g_1_5_3',
    durationSec: 100,
    sceneKeys: scenes('1.5.3'),
    visuals: [null, 'pick-alternate', null, null],
    sounds: [null, null, listen(EIGHTHS_RESTS.slice(0, 5), 70, { click: true }), null],
  },
  cards: [
    { titleKey: k('1.5.3', 'c1t'), bodyKey: k('1.5.3', 'c1b'), listen: listen(EIGHTHS_RESTS.slice(0, 5), 70, { show: 'tab', click: true }) },
    { titleKey: k('1.5.3', 'c2t'), bodyKey: k('1.5.3', 'c2b'), listen: listen(EIGHTHS_RESTS, 70, { show: 'tab', click: true }) },
  ],
  exercises: [
    {
      id: '1.5.3-tap',
      kind: 'tapRhythm',
      needsBass: false,
      skills: ['rhythm'],
      promptKey: k('1.5.3', 'tap'),
      bpm: 60,
      beats: 8,
      pads: ['↓', '↑'],
    },
    {
      id: '1.5.3-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['rhythm', 'technique'],
      promptKey: k('1.5.3', 'play'),
      notes: notesOf(EIGHTHS_RESTS),
      score: EIGHTHS_RESTS,
      bpm: 60,
      tempoSteps: STEPS,
    },
  ],
  mastery: 0.8,
};

const l154: Lesson = {
  id: '1.5.4',
  minutes: 12,
  titleKey: k('1.5.4', 'title'),
  objectiveKey: k('1.5.4', 'objective'),
  cartoon: {
    riveResource: 'kordi_g_1_5_4',
    durationSec: 110,
    sceneKeys: scenes('1.5.4'),
    visuals: ['chord-diagram-how', 'chord-diagram-how', 'chord-em', 'chord-am'],
    sounds: [null, null, listen([n('E', 0), n('A', 2), n('D', 2), n('G', 0), n('B', 0), n('e', 0)], 140), null],
  },
  cards: [
    { titleKey: k('1.5.4', 'c1t'), bodyKey: k('1.5.4', 'c1b'), figure: 'chord-diagram-how' },
    {
      titleKey: k('1.5.4', 'c2t'),
      bodyKey: k('1.5.4', 'c2b'),
      figure: 'chord-em',
      listen: listen([n('E', 0), n('A', 2), n('D', 2), n('G', 0), n('B', 0), n('e', 0)], 90),
    },
    { titleKey: k('1.5.4', 'c3t'), bodyKey: k('1.5.4', 'c3b'), figure: 'chord-am' },
  ],
  exercises: [
    {
      id: '1.5.4-q1',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('1.5.4', 'q1'),
      options: [k('1.5.4', 'q1o1'), k('1.5.4', 'q1o2'), k('1.5.4', 'q1o3')],
      correctIndex: 0,
    },
    {
      id: '1.5.4-q2',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('1.5.4', 'q2'),
      options: [k('1.5.4', 'q2o1'), k('1.5.4', 'q2o2'), k('1.5.4', 'q2o3')],
      correctIndex: 2,
    },
    {
      id: '1.5.4-tap',
      kind: 'fretboardTap',
      needsBass: false,
      skills: ['fretboard', 'theory'],
      promptKey: k('1.5.4', 'tap'),
      sequence: [
        { string: 'A', fret: 2 },
        { string: 'D', fret: 2 },
      ],
      frets: 4,
    },
  ],
  mastery: 0.85,
};

const l155: Lesson = {
  id: '1.5.5',
  minutes: 14,
  titleKey: k('1.5.5', 'title'),
  objectiveKey: k('1.5.5', 'objective'),
  cartoon: {
    riveResource: 'kordi_g_1_5_5',
    durationSec: 100,
    sceneKeys: scenes('1.5.5'),
    visuals: [null, 'guitar-strings', 'fret-hand', null],
    // Sin ejemplo sonoro: el desafío es leer una tablatura que nunca escuchaste.
    sounds: [null, null, null, null],
  },
  cards: [
    { titleKey: k('1.5.5', 'c1t'), bodyKey: k('1.5.5', 'c1b') },
    { titleKey: k('1.5.5', 'c2t'), bodyKey: k('1.5.5', 'c2b') },
  ],
  exercises: [
    {
      id: '1.5.5-tab',
      kind: 'tabReading',
      needsBass: false,
      skills: ['theory', 'fretboard'],
      promptKey: k('1.5.5', 'tab'),
      notes: tabOf(SIGHT_RIFF),
      frets: 4,
    },
    {
      id: '1.5.5-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique', 'rhythm', 'fretboard'],
      promptKey: k('1.5.5', 'play'),
      notes: tabOf(SIGHT_RIFF),
      bpm: 60,
      tempoSteps: STEPS,
    },
  ],
  mastery: 0.8,
};

export const GUITAR_LEVEL1_LESSONS: Lesson[] = [l131, l132, l133, l134, l135, l141, l142, l143, l144, l151, l152, l153, l154, l155];

// ───────────── Checkpoint 1 ─────────────

const ck = (key: string) => `content.g.cp1.${key}`;

export const GUITAR_CP1: Checkpoint = {
  level: 1,
  titleKey: 'content.g.checkpoint.1',
  introKey: ck('intro'),
  mastery: 0.8,
  parts: [
    {
      id: 'gcp1-ear',
      kind: 'ear',
      needsBass: false,
      skills: ['ear'],
      promptKey: ck('ear'),
      options: ['=A', '=D', '=G', '=B'],
      correctIndex: 3,
      tones: [hz('E'), hz('B')],
    },
    {
      id: 'gcp1-tab',
      kind: 'tabReading',
      needsBass: false,
      skills: ['theory', 'fretboard'],
      promptKey: ck('tab'),
      notes: tabOf(CP1_TAB),
      frets: 4,
    },
    {
      id: 'gcp1-pulse',
      kind: 'tempoTrainer',
      needsBass: false,
      skills: ['rhythm'],
      promptKey: ck('pulse'),
      bpm: 80,
      beats: 32,
      audibleBeats: 8,
    },
    {
      id: 'gcp1-spider',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique', 'fretboard'],
      promptKey: ck('spider'),
      notes: FULL_SPIDER,
      bpm: 70,
    },
    {
      id: 'gcp1-riff',
      kind: 'playAlong',
      needsBass: true,
      skills: ['rhythm', 'technique'],
      promptKey: ck('riff'),
      notes: notesOf(CP1_RIFF),
      score: CP1_RIFF,
      bpm: 80,
    },
  ],
};
