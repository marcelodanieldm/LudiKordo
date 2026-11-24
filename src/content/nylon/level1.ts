/**
 * Guitarra criolla, nivel 1 (continuación): módulos 1.3 (pulsar con los dedos),
 * 1.4 (mano izquierda) y 1.5 (ritmo y lectura), y el checkpoint 1. Todo con
 * yemas (ADR 0010). Melodías y ejercicios originales. Textos en
 * `content.n.l13x…l15x` y `content.n.cp1`.
 *
 * Los arpegios y la alternancia i-m se puntúan como cualquier `playAlong`: la
 * app escucha qué nota suena y cuándo, no qué dedo la tocó. La digitación se
 * enseña en las tarjetas y en el teclado de p-i-m-a.
 */
import type { Checkpoint } from '../checkpoints';
import type { Lesson, ScoreEvent } from '../types';
import type { StringId } from '../../instruments/profiles';
import { hear, hz, k, listen, spiderHands, n, notesOf, open, rest, scenes, scoreNotes, spider, spiderDown, tabOf, times } from './helpers';

const STEPS = [60, 70, 80];

// ───────────── Partituras originales ─────────────

/** 1.3.1: i-m tirando en la 1.ª y la 2.ª al aire. */
export const FREE_IM: ScoreEvent[] = [
  open('e'), open('e'), open('e'), open('e'),
  open('B'), open('B'), open('B'), open('B'),
  open('e'), open('e'), open('B'), open('B'),
  open('e', 4),
];

/** 1.3.2: melodía apoyando en la 2.ª y la 1.ª (Si, Do, Re, Mi, Fa, Sol). */
export const REST_MELODY: ScoreEvent[] = [
  n('B', 0), n('B', 1), n('B', 3), n('e', 0),
  n('e', 1), n('e', 3), n('e', 1), n('e', 0),
  n('B', 3), n('B', 1), n('B', 0), n('B', 1),
  n('B', 0, 4),
];

/** 1.3.3: cambiar de cuerda sin dejar de alternar (3.ª, 2.ª, 1.ª y vuelta). */
export const CROSSING: ScoreEvent[] = [
  open('G'), open('B'), open('e'), open('B'),
  open('G'), open('B'), open('e'), open('B'),
  open('G'), open('B'), open('e'), open('B'),
  open('G', 4),
];

/** 1.3.4: el pulgar camina por los bajos (Mi, Sol, La, Si, Re, Mi). */
export const THUMB_WALK: ScoreEvent[] = [
  n('E', 0), n('E', 3), n('A', 0), n('A', 2),
  n('D', 0), n('D', 2), n('A', 2), n('A', 0),
  n('E', 0), n('E', 3), n('A', 0), n('A', 3),
  n('E', 0, 4),
];

/** 1.3.5: pulgar en el bajo y después i, m, i en las agudas. */
export const P_IM: ScoreEvent[] = [
  open('E'), open('G'), open('B'), open('G'),
  open('A'), open('G'), open('B'), open('G'),
  open('D'), open('G'), open('B'), open('G'),
  open('E'), open('G'), open('B', 2),
];

/** 1.4.1: pisar detrás del traste en la 2.ª y la 1.ª. */
export const FRET_TIPS: ScoreEvent[] = [
  n('B', 1), n('B', 3), n('e', 1), n('e', 3),
  n('e', 1), n('B', 3), n('B', 1), n('B', 0),
  n('B', 1), n('B', 3), n('e', 1), n('e', 3),
  n('e', 0, 4),
];

/** 1.4.2: un dedo por traste en la 6.ª y en la 1.ª. */
export const ONE_STRING = [...spider('E'), ...spiderDown('E'), ...spider('e'), ...spiderDown('e')];

/** 1.4.3: las 6 cuerdas, subiendo y bajando. */
const SIX_UP: StringId[] = ['E', 'A', 'D', 'G', 'B', 'e'];
export const FULL_SPIDER = [...SIX_UP.flatMap(spider), ...[...SIX_UP].reverse().flatMap(spiderDown)];

/** 1.4.4: cromático de ida y vuelta en dos cuerdas vecinas. */
export const pairSpider = (low: StringId, high: StringId) => [...spider(low), ...spider(high), ...spiderDown(high), ...spiderDown(low)];

/** 1.4.5: notas que se cortan aflojando el dedo (sin despegarlo de la cuerda). */
export const STOP_NOTES: ScoreEvent[] = [
  n('e', 1), rest(), n('e', 3), rest(),
  n('B', 1), rest(), n('B', 3), rest(),
  n('e', 1), n('e', 3), n('B', 1), rest(),
  n('B', 0, 2), rest(2),
];

/** 1.5.2: redondas, blancas y negras en cuerdas al aire. */
export const LONG_SHORT: ScoreEvent[] = [
  open('E', 4),
  open('A', 2), open('D', 2),
  open('G'), open('G'), open('B'), open('B'),
  open('e', 4),
];

/** 1.5.3: corcheas y silencios (i-m). */
export const EIGHTHS: ScoreEvent[] = [
  n('e', 0, 0.5), n('e', 0, 0.5), n('B', 1), n('B', 0, 0.5), n('B', 0, 0.5), n('G', 0),
  n('e', 0), rest(), n('e', 3, 0.5), n('e', 1, 0.5), n('e', 0),
  n('B', 0, 0.5), n('B', 0, 0.5), n('B', 3), n('G', 0, 0.5), n('G', 0, 0.5), n('G', 2),
  n('e', 0, 2), rest(2),
];

/** 1.5.4: primera tablatura con notas pisadas. */
export const FIRST_TAB: ScoreEvent[] = [
  n('G', 0), n('B', 1), n('e', 0), n('B', 1),
  n('G', 2), n('B', 3), n('e', 1, 2),
  n('e', 0), n('B', 3), n('B', 1), n('G', 2),
  n('G', 0, 4),
];

/** 1.5.5: lectura a primera vista (sin ejemplo sonoro). */
export const SIGHT_TAB: ScoreEvent[] = [
  n('A', 0), n('A', 2), n('D', 0), n('D', 2),
  n('G', 0, 2), n('G', 2, 2),
  n('B', 0), n('B', 1), n('B', 3), n('e', 0),
  n('e', 1, 4),
];

/** Checkpoint 1: tablatura nueva (distinta de 1.5.5). */
export const CP1_TAB: ScoreEvent[] = [
  n('D', 0), n('D', 2), n('G', 0), n('G', 2),
  n('B', 0, 2), n('B', 1, 2),
  n('e', 0), n('B', 3), n('B', 1), n('G', 2),
  n('G', 0, 4),
];

/** Checkpoint 1: melodía con corcheas y silencios a 80 bpm. */
export const CP1_MELODY: ScoreEvent[] = [
  n('B', 0, 0.5), n('B', 1, 0.5), n('B', 3), n('e', 0, 0.5), n('e', 1, 0.5), n('e', 3),
  n('e', 1), rest(), n('e', 0), rest(),
  n('B', 3, 0.5), n('B', 1, 0.5), n('B', 0), n('G', 2, 0.5), n('G', 0, 0.5), n('G', 2),
  n('B', 0, 2), rest(2),
];

// ───────────── Módulo 1.3 · Pulsar con los dedos ─────────────

const l131: Lesson = {
  id: '1.3.1',
  minutes: 10,
  titleKey: k('1.3.1', 'title'),
  objectiveKey: k('1.3.1', 'objective'),
  cartoon: {
    riveResource: 'kordi_n_1_3_1',
    durationSec: 100,
    sceneKeys: scenes('1.3.1'),
    visuals: [null, 'pima-hand', 'pima-hand', null],
    sounds: [null, null, listen(FREE_IM, 70), null],
  },
  cards: [
    { titleKey: k('1.3.1', 'c1t'), bodyKey: k('1.3.1', 'c1b'), figure: 'pima-hand' },
    { titleKey: k('1.3.1', 'c2t'), bodyKey: k('1.3.1', 'c2b'), listen: listen(FREE_IM, 70, { click: true }) },
  ],
  exercises: [
    {
      id: '1.3.1-q1',
      kind: 'quiz',
      needsBass: false,
      skills: ['technique'],
      promptKey: k('1.3.1', 'q1'),
      options: [k('1.3.1', 'q1o1'), k('1.3.1', 'q1o2'), k('1.3.1', 'q1o3')],
      correctIndex: 0,
    },
    { id: '1.3.1-pads', kind: 'tapRhythm', needsBass: false, skills: ['rhythm', 'technique'], promptKey: k('1.3.1', 'pads'), bpm: 70, beats: 16, pads: ['i', 'm'] },
    { id: '1.3.1-play', kind: 'playAlong', needsBass: true, skills: ['technique', 'rhythm'], promptKey: k('1.3.1', 'play'), notes: notesOf(FREE_IM), bpm: 60, tempoSteps: STEPS },
  ],
  mastery: 0.85,
};

const l132: Lesson = {
  id: '1.3.2',
  minutes: 10,
  titleKey: k('1.3.2', 'title'),
  objectiveKey: k('1.3.2', 'objective'),
  cartoon: {
    riveResource: 'kordi_n_1_3_2',
    durationSec: 110,
    sceneKeys: scenes('1.3.2'),
    visuals: [null, 'pima-hand', 'fret-hand', null],
    sounds: [null, null, listen(REST_MELODY, 70), listen(REST_MELODY, 80)],
  },
  cards: [
    { titleKey: k('1.3.2', 'c1t'), bodyKey: k('1.3.2', 'c1b'), figure: 'pima-hand' },
    { titleKey: k('1.3.2', 'c2t'), bodyKey: k('1.3.2', 'c2b'), listen: listen(REST_MELODY, 70, { click: true }) },
    { titleKey: k('1.3.2', 'c3t'), bodyKey: k('1.3.2', 'c3b') },
  ],
  exercises: [
    {
      id: '1.3.2-q1',
      kind: 'quiz',
      needsBass: false,
      skills: ['technique'],
      promptKey: k('1.3.2', 'q1'),
      options: [k('1.3.2', 'q1o1'), k('1.3.2', 'q1o2'), k('1.3.2', 'q1o3')],
      correctIndex: 1,
    },
    {
      id: '1.3.2-q2',
      kind: 'quiz',
      needsBass: false,
      skills: ['technique'],
      promptKey: k('1.3.2', 'q2'),
      options: [k('1.3.2', 'q2o1'), k('1.3.2', 'q2o2'), k('1.3.2', 'q2o3')],
      correctIndex: 2,
    },
    { id: '1.3.2-play', kind: 'playAlong', needsBass: true, skills: ['technique', 'fretboard'], promptKey: k('1.3.2', 'play'), notes: notesOf(REST_MELODY), bpm: 60, tempoSteps: STEPS },
  ],
  mastery: 0.85,
};

const l133: Lesson = {
  id: '1.3.3',
  minutes: 10,
  titleKey: k('1.3.3', 'title'),
  objectiveKey: k('1.3.3', 'objective'),
  cartoon: {
    riveResource: 'kordi_n_1_3_3',
    durationSec: 100,
    sceneKeys: scenes('1.3.3'),
    visuals: [null, 'pima-hand', null, null],
    sounds: [null, listen(CROSSING, 70), null, null],
  },
  cards: [
    { titleKey: k('1.3.3', 'c1t'), bodyKey: k('1.3.3', 'c1b'), listen: listen(CROSSING, 70, { click: true }) },
    { titleKey: k('1.3.3', 'c2t'), bodyKey: k('1.3.3', 'c2b') },
  ],
  exercises: [
    {
      id: '1.3.3-q1',
      kind: 'quiz',
      needsBass: false,
      skills: ['technique'],
      promptKey: k('1.3.3', 'q1'),
      options: [k('1.3.3', 'q1o1'), k('1.3.3', 'q1o2'), k('1.3.3', 'q1o3')],
      correctIndex: 0,
    },
    {
      id: '1.3.3-tap',
      kind: 'fretboardTap',
      needsBass: false,
      skills: ['fretboard'],
      promptKey: k('1.3.3', 'tap'),
      sequence: [{ string: 'G', fret: 0 }, { string: 'B', fret: 0 }, { string: 'e', fret: 0 }, { string: 'B', fret: 0 }],
      frets: 3,
    },
    { id: '1.3.3-play', kind: 'playAlong', needsBass: true, skills: ['technique', 'rhythm'], promptKey: k('1.3.3', 'play'), notes: notesOf(CROSSING), bpm: 60, tempoSteps: STEPS },
  ],
  mastery: 0.85,
};

const l134: Lesson = {
  id: '1.3.4',
  minutes: 10,
  titleKey: k('1.3.4', 'title'),
  objectiveKey: k('1.3.4', 'objective'),
  cartoon: {
    riveResource: 'kordi_n_1_3_4',
    durationSec: 100,
    sceneKeys: scenes('1.3.4'),
    visuals: [null, 'pima-hand', 'fret-hand', null],
    sounds: [null, null, listen(THUMB_WALK, 70), null],
  },
  cards: [
    { titleKey: k('1.3.4', 'c1t'), bodyKey: k('1.3.4', 'c1b'), figure: 'pima-hand' },
    { titleKey: k('1.3.4', 'c2t'), bodyKey: k('1.3.4', 'c2b'), listen: listen(THUMB_WALK, 70, { click: true }) },
  ],
  exercises: [
    {
      id: '1.3.4-q1',
      kind: 'quiz',
      needsBass: false,
      skills: ['technique'],
      promptKey: k('1.3.4', 'q1'),
      options: [k('1.3.4', 'q1o1'), k('1.3.4', 'q1o2'), k('1.3.4', 'q1o3')],
      correctIndex: 2,
    },
    {
      id: '1.3.4-ear',
      kind: 'ear',
      needsBass: false,
      skills: ['ear'],
      promptKey: k('1.3.4', 'ear'),
      options: [k('1.3.4', 'up'), k('1.3.4', 'down')],
      correctIndex: 0,
      tones: [hz('E'), hz('E', 3), hz('A')],
    },
    { id: '1.3.4-play', kind: 'playAlong', needsBass: true, skills: ['technique', 'fretboard'], promptKey: k('1.3.4', 'play'), notes: notesOf(THUMB_WALK), bpm: 60, tempoSteps: STEPS },
  ],
  mastery: 0.85,
};

const l135: Lesson = {
  id: '1.3.5',
  minutes: 12,
  titleKey: k('1.3.5', 'title'),
  objectiveKey: k('1.3.5', 'objective'),
  cartoon: {
    riveResource: 'kordi_n_1_3_5',
    durationSec: 120,
    sceneKeys: scenes('1.3.5'),
    visuals: [null, 'pima-hand', 'pima-hand', null],
    sounds: [null, null, listen(P_IM, 60), listen(P_IM, 70)],
  },
  cards: [
    { titleKey: k('1.3.5', 'c1t'), bodyKey: k('1.3.5', 'c1b'), figure: 'pima-hand' },
    { titleKey: k('1.3.5', 'c2t'), bodyKey: k('1.3.5', 'c2b'), listen: listen(P_IM, 60, { click: true }) },
  ],
  exercises: [
    { id: '1.3.5-pads', kind: 'tapRhythm', needsBass: false, skills: ['rhythm', 'technique'], promptKey: k('1.3.5', 'pads'), bpm: 60, beats: 12, pads: ['p', 'i', 'm'] },
    { id: '1.3.5-play', kind: 'playAlong', needsBass: true, skills: ['technique', 'rhythm'], promptKey: k('1.3.5', 'play'), notes: notesOf(P_IM), bpm: 60, tempoSteps: [60, 70] },
  ],
  mastery: 0.85,
};

// ───────────── Módulo 1.4 · Mano izquierda ─────────────

const l141: Lesson = {
  id: '1.4.1',
  minutes: 10,
  titleKey: k('1.4.1', 'title'),
  objectiveKey: k('1.4.1', 'objective'),
  cartoon: {
    riveResource: 'kordi_n_1_4_1',
    durationSec: 100,
    sceneKeys: scenes('1.4.1'),
    visuals: ['fret-hand', 'fret-hand', null, null],
    sounds: [null, null, listen(FRET_TIPS, 70), null],
  },
  cards: [
    { titleKey: k('1.4.1', 'c1t'), bodyKey: k('1.4.1', 'c1b'), figure: 'fret-hand' },
    { titleKey: k('1.4.1', 'c2t'), bodyKey: k('1.4.1', 'c2b'), listen: listen(FRET_TIPS, 70, { click: true }) },
  ],
  exercises: [
    {
      id: '1.4.1-q1',
      kind: 'quiz',
      needsBass: false,
      skills: ['technique'],
      promptKey: k('1.4.1', 'q1'),
      options: [k('1.4.1', 'q1o1'), k('1.4.1', 'q1o2'), k('1.4.1', 'q1o3')],
      correctIndex: 0,
    },
    { id: '1.4.1-play', kind: 'playAlong', needsBass: true, skills: ['technique', 'fretboard'], promptKey: k('1.4.1', 'play'), notes: notesOf(FRET_TIPS), bpm: 60, tempoSteps: STEPS },
  ],
  mastery: 0.85,
};

const l142: Lesson = {
  id: '1.4.2',
  minutes: 10,
  titleKey: k('1.4.2', 'title'),
  objectiveKey: k('1.4.2', 'objective'),
  cartoon: {
    riveResource: 'kordi_n_1_4_2',
    durationSec: 100,
    sceneKeys: scenes('1.4.2'),
    visuals: [null, 'fret-hand', 'fret-hand', null],
    sounds: [null, null, hear(ONE_STRING.slice(0, 8).map((x) => n(x.string, x.fret)), 70), null],
  },
  cards: [
    { titleKey: k('1.4.2', 'c1t'), bodyKey: k('1.4.2', 'c1b'), figure: 'fret-hand', hands: spiderHands(0) },
    { titleKey: k('1.4.2', 'c2t'), bodyKey: k('1.4.2', 'c2b'), listen: listen(ONE_STRING.map((x) => n(x.string, x.fret)), 70) },
  ],
  exercises: [
    { id: '1.4.2-tap', kind: 'fretboardTap', needsBass: false, skills: ['fretboard'], promptKey: k('1.4.2', 'tap'), sequence: spider('E'), frets: 5 },
    { id: '1.4.2-play', kind: 'playAlong', needsBass: true, skills: ['technique', 'fretboard'], promptKey: k('1.4.2', 'play'), notes: ONE_STRING, bpm: 60, tempoSteps: STEPS },
  ],
  mastery: 0.85,
};

const l143: Lesson = {
  id: '1.4.3',
  minutes: 12,
  titleKey: k('1.4.3', 'title'),
  objectiveKey: k('1.4.3', 'objective'),
  cartoon: {
    riveResource: 'kordi_n_1_4_3',
    durationSec: 110,
    sceneKeys: scenes('1.4.3'),
    visuals: [null, 'fret-hand', 'fret-hand', null],
    sounds: [null, hear(FULL_SPIDER.slice(0, 12).map((x) => n(x.string, x.fret)), 80), null, null],
  },
  cards: [
    { titleKey: k('1.4.3', 'c1t'), bodyKey: k('1.4.3', 'c1b'), listen: hear(FULL_SPIDER.slice(0, 12).map((x) => n(x.string, x.fret)), 70) },
    { titleKey: k('1.4.3', 'c2t'), bodyKey: k('1.4.3', 'c2b') },
  ],
  exercises: [
    {
      id: '1.4.3-q1',
      kind: 'quiz',
      needsBass: false,
      skills: ['technique'],
      promptKey: k('1.4.3', 'q1'),
      options: [k('1.4.3', 'q1o1'), k('1.4.3', 'q1o2'), k('1.4.3', 'q1o3')],
      correctIndex: 1,
    },
    { id: '1.4.3-play', kind: 'playAlong', needsBass: true, skills: ['technique', 'fretboard'], promptKey: k('1.4.3', 'play'), notes: FULL_SPIDER, bpm: 60, tempoSteps: STEPS },
  ],
  mastery: 0.8,
};

const l144: Lesson = {
  id: '1.4.4',
  minutes: 10,
  titleKey: k('1.4.4', 'title'),
  objectiveKey: k('1.4.4', 'objective'),
  cartoon: {
    riveResource: 'kordi_n_1_4_4',
    durationSec: 100,
    sceneKeys: scenes('1.4.4'),
    visuals: [null, 'fret-hand', null, null],
    sounds: [null, hear(pairSpider('B', 'e').map((x) => n(x.string, x.fret)), 70), null, null],
  },
  cards: [
    { titleKey: k('1.4.4', 'c1t'), bodyKey: k('1.4.4', 'c1b'), listen: listen(pairSpider('B', 'e').map((x) => n(x.string, x.fret)), 70) },
    { titleKey: k('1.4.4', 'c2t'), bodyKey: k('1.4.4', 'c2b') },
  ],
  exercises: [
    { id: '1.4.4-tap', kind: 'fretboardTap', needsBass: false, skills: ['fretboard'], promptKey: k('1.4.4', 'tap'), sequence: pairSpider('D', 'G'), frets: 5 },
    { id: '1.4.4-play1', kind: 'playAlong', needsBass: true, skills: ['technique', 'fretboard'], promptKey: k('1.4.4', 'play'), notes: pairSpider('B', 'e'), bpm: 60, tempoSteps: STEPS },
    { id: '1.4.4-play2', kind: 'playAlong', needsBass: true, skills: ['technique', 'fretboard'], promptKey: k('1.4.4', 'play'), notes: pairSpider('E', 'A'), bpm: 60, tempoSteps: STEPS },
  ],
  mastery: 0.85,
};

const l145: Lesson = {
  id: '1.4.5',
  minutes: 10,
  titleKey: k('1.4.5', 'title'),
  objectiveKey: k('1.4.5', 'objective'),
  cartoon: {
    riveResource: 'kordi_n_1_4_5',
    durationSec: 100,
    sceneKeys: scenes('1.4.5'),
    visuals: [null, 'fret-hand', null, null],
    sounds: [hear([n('e', 1, 4)], 70), null, listen(STOP_NOTES, 70, { click: true }), null],
  },
  cards: [
    { titleKey: k('1.4.5', 'c1t'), bodyKey: k('1.4.5', 'c1b'), figure: 'fret-hand' },
    { titleKey: k('1.4.5', 'c2t'), bodyKey: k('1.4.5', 'c2b'), listen: listen(STOP_NOTES, 70, { click: true }) },
  ],
  exercises: [
    {
      id: '1.4.5-ear1',
      kind: 'ear',
      needsBass: false,
      skills: ['ear'],
      promptKey: k('1.4.5', 'ear'),
      options: [k('1.4.5', 'long'), k('1.4.5', 'short')],
      correctIndex: 1,
      tones: [hz('e', 1)],
      timbres: ['muted'],
    },
    {
      id: '1.4.5-ear2',
      kind: 'ear',
      needsBass: false,
      skills: ['ear'],
      promptKey: k('1.4.5', 'ear'),
      options: [k('1.4.5', 'long'), k('1.4.5', 'short')],
      correctIndex: 0,
      tones: [hz('e', 1)],
      timbres: ['nylon'],
    },
    { id: '1.4.5-play', kind: 'playAlong', needsBass: true, skills: ['technique', 'rhythm'], promptKey: k('1.4.5', 'play'), notes: scoreNotes(STOP_NOTES), score: STOP_NOTES, bpm: 60, tempoSteps: STEPS },
  ],
  mastery: 0.8,
};

// ───────────── Módulo 1.5 · Ritmo y lectura ─────────────

const l151: Lesson = {
  id: '1.5.1',
  minutes: 8,
  titleKey: k('1.5.1', 'title'),
  objectiveKey: k('1.5.1', 'objective'),
  cartoon: {
    riveResource: 'kordi_n_1_5_1',
    durationSec: 90,
    sceneKeys: scenes('1.5.1'),
    visuals: [null, null, 'guitar-strings', null],
    sounds: [null, hear(times('E', 4).map((x) => n(x.string, x.fret)), 70, { click: true }), null, null],
  },
  cards: [
    { titleKey: k('1.5.1', 'c1t'), bodyKey: k('1.5.1', 'c1b'), listen: hear(times('E', 8).map((x) => n(x.string, x.fret)), 70, { click: true }) },
    { titleKey: k('1.5.1', 'c2t'), bodyKey: k('1.5.1', 'c2b') },
  ],
  exercises: [
    { id: '1.5.1-pulse', kind: 'tempoTrainer', needsBass: false, skills: ['rhythm'], promptKey: k('1.5.1', 'pulse'), bpm: 70, beats: 16, audibleBeats: 8 },
    { id: '1.5.1-play', kind: 'playAlong', needsBass: true, skills: ['rhythm'], promptKey: k('1.5.1', 'play'), notes: times('E', 8), bpm: 60, tempoSteps: STEPS },
  ],
  mastery: 0.85,
};

const l152: Lesson = {
  id: '1.5.2',
  minutes: 10,
  titleKey: k('1.5.2', 'title'),
  objectiveKey: k('1.5.2', 'objective'),
  cartoon: {
    riveResource: 'kordi_n_1_5_2',
    durationSec: 100,
    sceneKeys: scenes('1.5.2'),
    visuals: [null, null, 'guitar-strings', null],
    sounds: [null, listen([open('e'), open('e'), open('e', 2), open('e', 4)], 70, { click: true }), listen(LONG_SHORT, 70, { click: true }), null],
  },
  cards: [
    { titleKey: k('1.5.2', 'c1t'), bodyKey: k('1.5.2', 'c1b'), listen: listen([open('e'), open('e'), open('e', 2), open('e', 4)], 70, { click: true }) },
    { titleKey: k('1.5.2', 'c2t'), bodyKey: k('1.5.2', 'c2b'), listen: listen(LONG_SHORT, 70, { click: true }) },
  ],
  exercises: [
    { id: '1.5.2-q1', kind: 'quiz', needsBass: false, skills: ['theory'], promptKey: k('1.5.2', 'q1'), options: ['=1', '=2', '=4'], correctIndex: 1 },
    { id: '1.5.2-tab', kind: 'tabReading', needsBass: false, skills: ['theory', 'rhythm'], promptKey: k('1.5.2', 'tab'), notes: tabOf(LONG_SHORT), frets: 4 },
    { id: '1.5.2-play', kind: 'playAlong', needsBass: true, skills: ['rhythm', 'technique'], promptKey: k('1.5.2', 'play'), notes: tabOf(LONG_SHORT), bpm: 60, tempoSteps: STEPS },
  ],
  mastery: 0.8,
};

const l153: Lesson = {
  id: '1.5.3',
  minutes: 12,
  titleKey: k('1.5.3', 'title'),
  objectiveKey: k('1.5.3', 'objective'),
  cartoon: {
    riveResource: 'kordi_n_1_5_3',
    durationSec: 100,
    sceneKeys: scenes('1.5.3'),
    visuals: [null, 'pima-hand', null, null],
    sounds: [null, null, listen(EIGHTHS.slice(0, 6), 60, { click: true }), null],
  },
  cards: [
    { titleKey: k('1.5.3', 'c1t'), bodyKey: k('1.5.3', 'c1b'), listen: listen(EIGHTHS.slice(0, 6), 60, { click: true }) },
    { titleKey: k('1.5.3', 'c2t'), bodyKey: k('1.5.3', 'c2b'), listen: listen(EIGHTHS, 60, { click: true }) },
  ],
  exercises: [
    { id: '1.5.3-tap', kind: 'tapRhythm', needsBass: false, skills: ['rhythm'], promptKey: k('1.5.3', 'tap'), bpm: 60, beats: 8, pads: ['i', 'm'] },
    { id: '1.5.3-play', kind: 'playAlong', needsBass: true, skills: ['rhythm', 'technique'], promptKey: k('1.5.3', 'play'), notes: scoreNotes(EIGHTHS), score: EIGHTHS, bpm: 60, tempoSteps: STEPS },
  ],
  mastery: 0.8,
};

const l154: Lesson = {
  id: '1.5.4',
  minutes: 10,
  titleKey: k('1.5.4', 'title'),
  objectiveKey: k('1.5.4', 'objective'),
  cartoon: {
    riveResource: 'kordi_n_1_5_4',
    durationSec: 100,
    sceneKeys: scenes('1.5.4'),
    visuals: [null, 'guitar-strings', null, null],
    sounds: [null, null, listen(FIRST_TAB, 70), null],
  },
  cards: [
    { titleKey: k('1.5.4', 'c1t'), bodyKey: k('1.5.4', 'c1b'), figure: 'guitar-strings' },
    { titleKey: k('1.5.4', 'c2t'), bodyKey: k('1.5.4', 'c2b'), listen: listen(FIRST_TAB, 70) },
  ],
  exercises: [
    {
      id: '1.5.4-q1',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('1.5.4', 'q1'),
      options: [k('1.5.4', 'q1o1'), k('1.5.4', 'q1o2'), k('1.5.4', 'q1o3')],
      correctIndex: 1,
    },
    { id: '1.5.4-tab', kind: 'tabReading', needsBass: false, skills: ['theory', 'fretboard'], promptKey: k('1.5.4', 'tab'), notes: tabOf(FIRST_TAB), frets: 4 },
    { id: '1.5.4-play', kind: 'playAlong', needsBass: true, skills: ['technique', 'fretboard'], promptKey: k('1.5.4', 'play'), notes: tabOf(FIRST_TAB), bpm: 60, tempoSteps: STEPS },
  ],
  mastery: 0.85,
};

const l155: Lesson = {
  id: '1.5.5',
  minutes: 12,
  titleKey: k('1.5.5', 'title'),
  objectiveKey: k('1.5.5', 'objective'),
  cartoon: {
    riveResource: 'kordi_n_1_5_5',
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
    { id: '1.5.5-tab', kind: 'tabReading', needsBass: false, skills: ['theory', 'fretboard'], promptKey: k('1.5.5', 'tab'), notes: tabOf(SIGHT_TAB), frets: 4 },
    { id: '1.5.5-play', kind: 'playAlong', needsBass: true, skills: ['technique', 'rhythm', 'fretboard'], promptKey: k('1.5.5', 'play'), notes: tabOf(SIGHT_TAB), bpm: 60, tempoSteps: STEPS },
  ],
  mastery: 0.8,
};

export const NYLON_LEVEL1_LESSONS: Lesson[] = [l131, l132, l133, l134, l135, l141, l142, l143, l144, l145, l151, l152, l153, l154, l155];

// ───────────── Checkpoint 1 ─────────────

const ck = (key: string) => `content.n.cp1.${key}`;

export const NYLON_CP1: Checkpoint = {
  level: 1,
  titleKey: 'content.n.checkpoint.1',
  introKey: ck('intro'),
  mastery: 0.8,
  parts: [
    { id: 'ncp1-ear', kind: 'ear', needsBass: false, skills: ['ear'], promptKey: ck('ear'), options: ['=A', '=D', '=G', '=B'], correctIndex: 2, tones: [hz('E'), hz('G')] },
    { id: 'ncp1-tab', kind: 'tabReading', needsBass: false, skills: ['theory', 'fretboard'], promptKey: ck('tab'), notes: tabOf(CP1_TAB), frets: 4 },
    { id: 'ncp1-pulse', kind: 'tempoTrainer', needsBass: false, skills: ['rhythm'], promptKey: ck('pulse'), bpm: 80, beats: 32, audibleBeats: 8 },
    { id: 'ncp1-spider', kind: 'playAlong', needsBass: true, skills: ['technique', 'fretboard'], promptKey: ck('spider'), notes: FULL_SPIDER, bpm: 70 },
    { id: 'ncp1-melody', kind: 'playAlong', needsBass: true, skills: ['rhythm', 'technique'], promptKey: ck('melody'), notes: scoreNotes(CP1_MELODY), score: CP1_MELODY, bpm: 80 },
  ],
};
