/**
 * Checkpoints: una prueba al final de cada nivel con lo aprendido. Se puede
 * hacer en cualquier momento: aprobarla antes de terminar el nivel lo salta
 * (desbloquea el nivel siguiente).
 */
import { KORDI_GROOVE_1 } from './lessons';
import { midiToFreq } from '../music/notes';
import { IS_GUITAR, IS_NYLON } from '../instruments/current';
import { GUITAR_CP1 } from './guitar/level1';
import { GUITAR_CP2 } from './guitar/level2';
import { GUITAR_CP3 } from './guitar/level3';
import { GUITAR_CP4 } from './guitar/level4';
import { NYLON_CP1 } from './nylon/level1';
import { NYLON_CP2 } from './nylon/level2';
import type { Exercise } from './types';

export interface Checkpoint {
  level: number;
  /** Título visible (también el detalle del nodo en la ruta). */
  titleKey: string;
  introKey: string;
  parts: Exercise[];
  /** Criterio de dominio de cada prueba (3 estrellas). */
  mastery: number;
}

const k = (level: number, key: string) => `content.cp${level}.${key}`;
const spider = (string: 'E' | 'A' | 'D' | 'G') => [1, 2, 3, 4].map((fret) => ({ string, fret }));
const spiderDown = (string: 'E' | 'A' | 'D' | 'G') => [4, 3, 2, 1].map((fret) => ({ string, fret }));

const cp1: Checkpoint = {
  level: 1,
  titleKey: 'content.checkpoint.1',
  introKey: k(1, 'intro'),
  mastery: 0.8,
  parts: [
    {
      id: 'cp1-ear',
      kind: 'ear',
      needsBass: false,
      skills: ['ear'],
      promptKey: k(1, 'ear'),
      options: ['=E', '=A', '=D', '=G'],
      correctIndex: 3,
      tones: [midiToFreq(28), midiToFreq(43)],
    },
    {
      id: 'cp1-tab',
      kind: 'tabReading',
      needsBass: false,
      skills: ['theory', 'fretboard'],
      promptKey: k(1, 'tab'),
      notes: [
        { string: 'E', fret: 0, beats: 2 },
        { string: 'E', fret: 3, beats: 2 },
        { string: 'A', fret: 0, beats: 1 },
        { string: 'A', fret: 2, beats: 1 },
        { string: 'A', fret: 4, beats: 2 },
        { string: 'D', fret: 0, beats: 1 },
        { string: 'D', fret: 1, beats: 1 },
        { string: 'D', fret: 2, beats: 1 },
        { string: 'D', fret: 4, beats: 1 },
        { string: 'G', fret: 0, beats: 4 },
      ],
      frets: 5,
    },
    {
      id: 'cp1-pulse',
      kind: 'tempoTrainer',
      needsBass: false,
      skills: ['rhythm'],
      promptKey: k(1, 'pulse'),
      bpm: 80,
      beats: 32,
      audibleBeats: 8,
    },
    {
      id: 'cp1-spider',
      kind: 'playAlong',
      needsBass: true,
      skills: ['technique', 'fretboard'],
      promptKey: k(1, 'spider'),
      notes: [...spider('E'), ...spider('A'), ...spider('D'), ...spider('G'), ...spiderDown('G'), ...spiderDown('D'), ...spiderDown('A'), ...spiderDown('E')],
      bpm: 70,
    },
    {
      id: 'cp1-groove',
      kind: 'playAlong',
      needsBass: true,
      skills: ['rhythm', 'technique', 'fretboard'],
      promptKey: k(1, 'groove'),
      notes: KORDI_GROOVE_1,
      bpm: 80,
    },
  ],
};

/** Checkpoints del instrumento de esta build (los de guitarra están en guitar/level*.ts). */
/** La criolla suma sus checkpoints nivel por nivel (ADR 0010); sin checkpoint, el nivel se completa con sus lecciones. */
export const CHECKPOINTS: Record<number, Checkpoint> = IS_NYLON
  ? { [NYLON_CP1.level]: NYLON_CP1, [NYLON_CP2.level]: NYLON_CP2 }
  : IS_GUITAR ? { [GUITAR_CP1.level]: GUITAR_CP1, [GUITAR_CP2.level]: GUITAR_CP2, [GUITAR_CP3.level]: GUITAR_CP3, [GUITAR_CP4.level]: GUITAR_CP4 } : { [cp1.level]: cp1 };

export function getCheckpoint(level: number): Checkpoint | undefined {
  return CHECKPOINTS[level];
}

/** Para aprobar: al menos 1 estrella en cada prueba y 2 de promedio. */
export const PASS_MIN_PART = 1;
export const PASS_AVERAGE = 2;

/**
 * Resultado del checkpoint a partir de las estrellas de cada prueba: las
 * estrellas finales son el promedio redondeado hacia abajo.
 */
export function checkpointResult(partStars: number[]): { stars: 0 | 1 | 2 | 3; passed: boolean } {
  if (partStars.length === 0) return { stars: 0, passed: false };
  const avg = partStars.reduce((a, b) => a + b, 0) / partStars.length;
  const passed = partStars.every((s) => s >= PASS_MIN_PART) && avg >= PASS_AVERAGE;
  return { stars: Math.max(0, Math.min(3, Math.floor(avg))) as 0 | 1 | 2 | 3, passed };
}
