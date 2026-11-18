/**
 * Lecciones de guitarra eléctrica: módulos 1.1 (tu guitarra y tu ampli) y 1.2
 * (postura y púa), los gratuitos. El resto del nivel 1 está en level1.ts. Mismo formato que las del bajo: 4 pasos, una
 * habilidad nueva por lección y criterio de dominio. Textos en `content.g.*`.
 *
 * Mientras no hay .riv, cada escena del cartoon trae su ilustración animada
 * (`visuals`) y, donde ayuda, su sonido (`sounds`).
 *
 * Las alturas se calculan con el perfil de guitarra (no con el instrumento
 * activo) para que las pruebas de Node, que corren como bajo, las validen igual.
 */
import type { Beats, Lesson, ListenExample, ScoreEvent } from '../types';
import type { StringId } from '../../instruments/profiles';
import { GUITAR, midiOn } from '../../instruments/profiles';
import { midiToFreq } from '../../music/notes';
import { GUITAR_LEVEL1_LESSONS } from './level1';
import { GUITAR_LEVEL2_LESSONS } from './level2';

const k = (lesson: string, key: string) => `content.g.l${lesson.replace(/\./g, '')}.${key}`;
const scenes = (lesson: string) => [1, 2, 3, 4].map((n) => k(lesson, `s${n}`));
const hz = (s: StringId, fret = 0) => midiToFreq(midiOn(GUITAR, s, fret));

/** Las 6 cuerdas al aire, de la 6.ª (grave) a la 1.ª (aguda). */
const LOW_TO_HIGH: StringId[] = ['E', 'A', 'D', 'G', 'B', 'e'];
const open = (s: StringId, beats: Beats = 1): ScoreEvent => ({ string: s, fret: 0, beats });
const times = (s: StringId, n: number) => Array.from({ length: n }, () => ({ string: s, fret: 0 }));

/** Las 6 cuerdas al aire en dos compases: 4 negras y 2 blancas (Si y Mi aguda). */
const openStringsExample = (bpm = 70): ListenExample => ({ events: LOW_TO_HIGH.map((s, i) => open(s, i >= 4 ? 2 : 1)), bpm, show: 'tab' });

/** Riff original de 1.2.5 en cuerdas al aire (4 compases de 4/4). */
export const FIRST_RIFF: ScoreEvent[] = [
  open('E'), open('E'), open('A'), open('E'),
  open('D'), open('A'), open('E', 2),
  open('G'), open('D'), open('A'), open('D'),
  open('E', 4),
];
const riffNotes = FIRST_RIFF.map((e) => ('rest' in e ? null : { string: e.string, fret: e.fret, beats: e.beats as 1 | 2 | 4 })).filter(
  (x): x is { string: StringId; fret: number; beats: 1 | 2 | 4 } => x !== null,
);

/** 16 corcheas en una cuerda al aire (púa alternada). */
const eighths = (s: StringId): ScoreEvent[] => Array.from({ length: 16 }, () => open(s, 0.5));

// ───────────────────────── Módulo 1.1 · Tu guitarra y tu ampli ─────────────────────────

const l111: Lesson = {
  id: '1.1.1',
  minutes: 10,
  titleKey: k('1.1.1', 'title'),
  objectiveKey: k('1.1.1', 'objective'),
  cartoon: {
    riveResource: 'kordi_g_1_1_1',
    durationSec: 110,
    sceneKeys: scenes('1.1.1'),
    visuals: [null, 'guitar-parts', 'guitar-strings', 'guitar-strings'],
    sounds: [null, null, openStringsExample(80), { events: [open('E', 2), open('e', 2)], bpm: 60 }],
  },
  cards: [
    { titleKey: k('1.1.1', 'c1t'), bodyKey: k('1.1.1', 'c1b'), figure: 'guitar-parts' },
    { titleKey: k('1.1.1', 'c2t'), bodyKey: k('1.1.1', 'c2b'), figure: 'guitar-strings', listen: openStringsExample() },
    { titleKey: k('1.1.1', 'c3t'), bodyKey: k('1.1.1', 'c3b'), listen: { events: [open('E', 2), open('e', 2)], bpm: 60 } },
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
    riveResource: 'kordi_g_1_1_2',
    durationSec: 100,
    sceneKeys: scenes('1.1.2'),
    visuals: ['cable-amp', 'cable-amp', 'amp-panel', null],
    sounds: [null, null, null, { events: [open('E', 4)], bpm: 60 }],
  },
  cards: [
    { titleKey: k('1.1.2', 'c1t'), bodyKey: k('1.1.2', 'c1b'), figure: 'cable-amp' },
    { titleKey: k('1.1.2', 'c2t'), bodyKey: k('1.1.2', 'c2b'), figure: 'amp-panel' },
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
      options: ['=GAIN', '=TREBLE', '=VOLUME', '=BASS'],
      correctIndex: 2,
    },
    {
      id: '1.1.2-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique'],
      promptKey: k('1.1.2', 'play'),
      notes: times('E', 4),
      bpm: null,
    },
  ],
  mastery: 1,
};

const l113: Lesson = {
  id: '1.1.3',
  minutes: 12,
  titleKey: k('1.1.3', 'title'),
  objectiveKey: k('1.1.3', 'objective'),
  cartoon: {
    riveResource: 'kordi_g_1_1_3',
    durationSec: 140,
    sceneKeys: scenes('1.1.3'),
    visuals: ['guitar-tuner', 'guitar-tuner', 'guitar-strings', null],
    sounds: [null, { events: [open('A', 2)], bpm: 60 }, openStringsExample(80), null],
  },
  cards: [
    { titleKey: k('1.1.3', 'c1t'), bodyKey: k('1.1.3', 'c1b'), figure: 'guitar-tuner' },
    { titleKey: k('1.1.3', 'c2t'), bodyKey: k('1.1.3', 'c2b'), listen: openStringsExample() },
    { titleKey: k('1.1.3', 'c3t'), bodyKey: k('1.1.3', 'c3b') },
  ],
  exercises: [
    {
      id: '1.1.3-ear1',
      kind: 'ear',
      needsBass: false,
      skills: ['ear'],
      promptKey: k('1.1.3', 'ear'),
      options: [k('1.1.3', 'higher'), k('1.1.3', 'lower')],
      correctIndex: 0,
      tones: [hz('A'), hz('A', 1)], // un semitono
    },
    {
      id: '1.1.3-ear2',
      kind: 'ear',
      needsBass: false,
      skills: ['ear'],
      promptKey: k('1.1.3', 'ear'),
      options: [k('1.1.3', 'higher'), k('1.1.3', 'lower')],
      correctIndex: 1,
      tones: [hz('G'), midiToFreq(midiOn(GUITAR, 'G', 0) - 0.5)], // medio semitono
    },
    {
      id: '1.1.3-tune',
      kind: 'playAlong',
      needsBass: true,
      skills: ['ear', 'technique'],
      promptKey: k('1.1.3', 'tune'),
      notes: LOW_TO_HIGH.map((s) => ({ string: s, fret: 0 })),
      bpm: null,
      toleranceCents: 5,
    },
  ],
  mastery: 1,
};

const l114: Lesson = {
  id: '1.1.4',
  minutes: 10,
  titleKey: k('1.1.4', 'title'),
  objectiveKey: k('1.1.4', 'objective'),
  cartoon: {
    riveResource: 'kordi_g_1_1_4',
    durationSec: 120,
    sceneKeys: scenes('1.1.4'),
    visuals: ['pickup-selector', 'pickup-selector', 'pickup-selector', 'guitar-knobs'],
    sounds: [
      null,
      { events: [open('G'), open('B'), open('e', 2)], bpm: 70, tone: 'neck' },
      { events: [open('G'), open('B'), open('e', 2)], bpm: 70, tone: 'bridge' },
      null,
    ],
  },
  cards: [
    { titleKey: k('1.1.4', 'c1t'), bodyKey: k('1.1.4', 'c1b'), figure: 'pickup-selector' },
    { titleKey: k('1.1.4', 'c2t'), bodyKey: k('1.1.4', 'c2b'), listen: { events: [open('G'), open('B'), open('e', 2)], bpm: 70, tone: 'neck' } },
    { titleKey: k('1.1.4', 'c3t'), bodyKey: k('1.1.4', 'c3b'), listen: { events: [open('G'), open('B'), open('e', 2)], bpm: 70, tone: 'bridge' } },
    { titleKey: k('1.1.4', 'c4t'), bodyKey: k('1.1.4', 'c4b'), figure: 'guitar-knobs' },
  ],
  exercises: [
    {
      id: '1.1.4-ear1',
      kind: 'ear',
      needsBass: false,
      skills: ['ear'],
      promptKey: k('1.1.4', 'ear'),
      options: [k('1.1.4', 'neck'), k('1.1.4', 'bridge')],
      correctIndex: 1,
      tones: [hz('G'), hz('B'), hz('e')],
      timbres: ['bridge', 'bridge', 'bridge'],
    },
    {
      id: '1.1.4-ear2',
      kind: 'ear',
      needsBass: false,
      skills: ['ear'],
      promptKey: k('1.1.4', 'ear'),
      options: [k('1.1.4', 'neck'), k('1.1.4', 'bridge')],
      correctIndex: 0,
      tones: [hz('G'), hz('B'), hz('e')],
      timbres: ['neck', 'neck', 'neck'],
    },
    {
      id: '1.1.4-q1',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('1.1.4', 'q1'),
      options: [k('1.1.4', 'q1o1'), k('1.1.4', 'q1o2'), k('1.1.4', 'q1o3')],
      correctIndex: 0,
    },
    {
      id: '1.1.4-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique', 'ear'],
      promptKey: k('1.1.4', 'play'),
      notes: [...times('G', 2), ...times('B', 2), ...times('e', 2)],
      bpm: null,
    },
  ],
  mastery: 0.85,
};

const l115: Lesson = {
  id: '1.1.5',
  minutes: 12,
  titleKey: k('1.1.5', 'title'),
  objectiveKey: k('1.1.5', 'objective'),
  cartoon: {
    riveResource: 'kordi_g_1_1_5',
    durationSec: 130,
    sceneKeys: scenes('1.1.5'),
    visuals: ['amp-panel', 'amp-clean', 'amp-crunch', 'amp-clean'],
    sounds: [
      null,
      { events: [open('E'), open('A'), open('D'), open('A'), open('E', 4)], bpm: 80, tone: 'clean' },
      { events: [open('E'), open('A'), open('D'), open('A'), open('E', 4)], bpm: 80, tone: 'crunch' },
      null,
    ],
  },
  cards: [
    { titleKey: k('1.1.5', 'c1t'), bodyKey: k('1.1.5', 'c1b'), figure: 'amp-panel' },
    {
      titleKey: k('1.1.5', 'c2t'),
      bodyKey: k('1.1.5', 'c2b'),
      figure: 'amp-clean',
      listen: { events: [open('E'), open('A'), open('D'), open('A'), open('E', 4)], bpm: 80, tone: 'clean' },
    },
    {
      titleKey: k('1.1.5', 'c3t'),
      bodyKey: k('1.1.5', 'c3b'),
      figure: 'amp-crunch',
      listen: { events: [open('E'), open('A'), open('D'), open('A'), open('E', 4)], bpm: 80, tone: 'crunch' },
    },
  ],
  exercises: [
    {
      id: '1.1.5-ear1',
      kind: 'ear',
      needsBass: false,
      skills: ['ear'],
      promptKey: k('1.1.5', 'ear'),
      options: [k('1.1.5', 'clean'), k('1.1.5', 'crunch')],
      correctIndex: 1,
      tones: [hz('E'), hz('A'), hz('D')],
      timbres: ['crunch', 'crunch', 'crunch'],
    },
    {
      id: '1.1.5-ear2',
      kind: 'ear',
      needsBass: false,
      skills: ['ear'],
      promptKey: k('1.1.5', 'ear'),
      options: [k('1.1.5', 'clean'), k('1.1.5', 'crunch')],
      correctIndex: 0,
      tones: [hz('E'), hz('A'), hz('D')],
      timbres: ['clean', 'clean', 'clean'],
    },
    {
      id: '1.1.5-q1',
      kind: 'quiz',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('1.1.5', 'q1'),
      options: ['=GAIN', '=BASS', '=MIDDLE', '=TREBLE'],
      correctIndex: 0,
    },
    {
      id: '1.1.5-play',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique'],
      promptKey: k('1.1.5', 'play'),
      notes: [...LOW_TO_HIGH, ...[...LOW_TO_HIGH].reverse()].map((s) => ({ string: s, fret: 0 })),
      bpm: null,
    },
  ],
  mastery: 0.85,
};

// ───────────────────────── Módulo 1.2 · Postura y púa ─────────────────────────

const l121: Lesson = {
  id: '1.2.1',
  minutes: 10,
  titleKey: k('1.2.1', 'title'),
  objectiveKey: k('1.2.1', 'objective'),
  cartoon: {
    riveResource: 'kordi_g_1_2_1',
    durationSec: 110,
    sceneKeys: scenes('1.2.1'),
    visuals: ['posture', 'posture', 'posture', null],
    sounds: [null, null, null, { events: Array.from({ length: 8 }, () => open('E')), bpm: 60, click: true }],
  },
  cards: [
    { titleKey: k('1.2.1', 'c1t'), bodyKey: k('1.2.1', 'c1b'), figure: 'posture' },
    { titleKey: k('1.2.1', 'c2t'), bodyKey: k('1.2.1', 'c2b') },
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
      id: '1.2.1-pulse',
      kind: 'tempoTrainer',
      needsBass: false,
      skills: ['rhythm'],
      promptKey: k('1.2.1', 'pulse'),
      bpm: 60,
      beats: 16,
      audibleBeats: 16,
    },
    {
      id: '1.2.1-E',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique', 'rhythm'],
      promptKey: k('1.2.1', 'play'),
      notes: times('E', 8),
      bpm: 60,
      tempoSteps: [60, 70, 80],
    },
  ],
  mastery: 0.8,
};

const l122: Lesson = {
  id: '1.2.2',
  minutes: 10,
  titleKey: k('1.2.2', 'title'),
  objectiveKey: k('1.2.2', 'objective'),
  cartoon: {
    riveResource: 'kordi_g_1_2_2',
    durationSec: 110,
    sceneKeys: scenes('1.2.2'),
    visuals: ['pick-grip', 'pick-grip', 'pick-down', null],
    sounds: [null, null, { events: Array.from({ length: 4 }, () => open('D')), bpm: 70 }, null],
  },
  cards: [
    { titleKey: k('1.2.2', 'c1t'), bodyKey: k('1.2.2', 'c1b'), figure: 'pick-grip' },
    { titleKey: k('1.2.2', 'c2t'), bodyKey: k('1.2.2', 'c2b'), figure: 'pick-down' },
    { titleKey: k('1.2.2', 'c3t'), bodyKey: k('1.2.2', 'c3b') },
  ],
  exercises: [
    {
      id: '1.2.2-q1',
      kind: 'quiz',
      needsBass: false,
      skills: ['technique'],
      promptKey: k('1.2.2', 'q1'),
      options: [k('1.2.2', 'q1o1'), k('1.2.2', 'q1o2'), k('1.2.2', 'q1o3')],
      correctIndex: 2,
    },
    {
      id: '1.2.2-q2',
      kind: 'quiz',
      needsBass: false,
      skills: ['technique'],
      promptKey: k('1.2.2', 'q2'),
      options: [k('1.2.2', 'q2o1'), k('1.2.2', 'q2o2')],
      correctIndex: 0,
    },
    {
      id: '1.2.2-down',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique', 'rhythm'],
      promptKey: k('1.2.2', 'play'),
      notes: times('D', 8),
      bpm: 60,
      tempoSteps: [60, 70, 80],
    },
  ],
  mastery: 0.8,
};

const l123: Lesson = {
  id: '1.2.3',
  minutes: 12,
  titleKey: k('1.2.3', 'title'),
  objectiveKey: k('1.2.3', 'objective'),
  cartoon: {
    riveResource: 'kordi_g_1_2_3',
    durationSec: 120,
    sceneKeys: scenes('1.2.3'),
    visuals: ['pick-down', 'string-crossing', 'string-crossing', null],
    sounds: [null, null, { events: LOW_TO_HIGH.flatMap((s) => [open(s), open(s)]), bpm: 80 }, null],
  },
  cards: [
    { titleKey: k('1.2.3', 'c1t'), bodyKey: k('1.2.3', 'c1b'), figure: 'string-crossing' },
    {
      titleKey: k('1.2.3', 'c2t'),
      bodyKey: k('1.2.3', 'c2b'),
      listen: { events: LOW_TO_HIGH.flatMap((s) => [open(s), open(s), open(s), open(s)]), bpm: 70, show: 'tab', click: true },
    },
  ],
  exercises: [
    {
      id: '1.2.3-tab',
      kind: 'tabReading',
      needsBass: false,
      skills: ['theory', 'fretboard'],
      promptKey: k('1.2.3', 'tab'),
      notes: [...LOW_TO_HIGH.slice(0, 4), ...[...LOW_TO_HIGH].reverse().slice(0, 4)].map((s) => ({ string: s, fret: 0, beats: 1 as const })),
      frets: 3,
    },
    {
      id: '1.2.3-strings',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique', 'rhythm'],
      promptKey: k('1.2.3', 'play'),
      notes: LOW_TO_HIGH.flatMap((s) => times(s, 4)),
      bpm: 60,
      tempoSteps: [60, 70, 80],
    },
  ],
  mastery: 0.8,
};

const l124: Lesson = {
  id: '1.2.4',
  minutes: 12,
  titleKey: k('1.2.4', 'title'),
  objectiveKey: k('1.2.4', 'objective'),
  cartoon: {
    riveResource: 'kordi_g_1_2_4',
    durationSec: 120,
    sceneKeys: scenes('1.2.4'),
    visuals: ['pick-alternate', 'pick-alternate', 'pick-alternate', null],
    sounds: [null, { events: eighths('G').slice(0, 8), bpm: 70, click: true }, null, null],
  },
  cards: [
    { titleKey: k('1.2.4', 'c1t'), bodyKey: k('1.2.4', 'c1b'), figure: 'pick-alternate' },
    { titleKey: k('1.2.4', 'c2t'), bodyKey: k('1.2.4', 'c2b'), listen: { events: eighths('G'), bpm: 70, click: true } },
    { titleKey: k('1.2.4', 'c3t'), bodyKey: k('1.2.4', 'c3b') },
  ],
  exercises: [
    {
      id: '1.2.4-tap',
      kind: 'tapRhythm',
      needsBass: false,
      skills: ['rhythm', 'technique'],
      promptKey: k('1.2.4', 'tap'),
      bpm: 60,
      beats: 16,
      pads: ['↓', '↑'],
    },
    {
      id: '1.2.4-alt',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique', 'rhythm'],
      promptKey: k('1.2.4', 'play'),
      notes: times('G', 16),
      score: eighths('G'),
      bpm: 60,
      tempoSteps: [60, 70, 80],
    },
  ],
  mastery: 0.8,
};

const l125: Lesson = {
  id: '1.2.5',
  minutes: 14,
  titleKey: k('1.2.5', 'title'),
  objectiveKey: k('1.2.5', 'objective'),
  cartoon: {
    riveResource: 'kordi_g_1_2_5',
    durationSec: 130,
    sceneKeys: scenes('1.2.5'),
    visuals: [null, 'string-crossing', null, null],
    sounds: [{ events: FIRST_RIFF, bpm: 80, tone: 'crunch' }, null, { events: FIRST_RIFF, bpm: 70, tone: 'clean', click: true }, null],
  },
  cards: [
    { titleKey: k('1.2.5', 'c1t'), bodyKey: k('1.2.5', 'c1b'), listen: { events: FIRST_RIFF, bpm: 70, show: 'tab', click: true } },
    { titleKey: k('1.2.5', 'c2t'), bodyKey: k('1.2.5', 'c2b'), figure: 'string-crossing' },
    { titleKey: k('1.2.5', 'c3t'), bodyKey: k('1.2.5', 'c3b'), listen: { events: FIRST_RIFF, bpm: 80, tone: 'crunch' } },
  ],
  exercises: [
    {
      id: '1.2.5-tab',
      kind: 'tabReading',
      needsBass: false,
      skills: ['theory'],
      promptKey: k('1.2.5', 'tab'),
      notes: riffNotes,
      frets: 3,
    },
    {
      id: '1.2.5-riff',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique', 'rhythm'],
      promptKey: k('1.2.5', 'play'),
      notes: riffNotes,
      bpm: 60,
      tempoSteps: [60, 70, 80],
    },
  ],
  mastery: 0.8,
};

export const GUITAR_LESSONS: Record<string, Lesson> = Object.fromEntries(
  [l111, l112, l113, l114, l115, l121, l122, l123, l124, l125, ...GUITAR_LEVEL1_LESSONS, ...GUITAR_LEVEL2_LESSONS].map((l) => [l.id, l]),
);
