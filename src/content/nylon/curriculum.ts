/**
 * Ruta de guitarra criolla: 5 niveles, 31 módulos, 151 lecciones (~60 semanas).
 * Plan, árbol de acordes y cancionero: docs/CURRICULUM-NYLON.md (ADR 0010).
 * Textos en `content.n.*`.
 */
import type { Level, Module } from '../types';

const m = (id: string, lessonCount: number): Module => ({
  id,
  titleKey: `content.n.module.${id.replace('.', '_')}`,
  lessonCount,
  starExerciseKey: `content.n.star.${id.replace('.', '_')}`,
  goalKey: `content.n.goal.${id.replace('.', '_')}`,
});

export const NYLON_LEVELS: Level[] = [
  {
    id: 1,
    titleKey: 'content.n.level.1',
    weeks: [1, 8],
    checkpointKey: 'content.n.checkpoint.1',
    modules: [m('1.1', 5), m('1.2', 5), m('1.3', 5), m('1.4', 5), m('1.5', 5)],
  },
  {
    id: 2,
    titleKey: 'content.n.level.2',
    weeks: [9, 20],
    checkpointKey: 'content.n.checkpoint.2',
    modules: [m('2.1', 5), m('2.2', 5), m('2.3', 5), m('2.4', 5), m('2.5', 5), m('2.6', 5), m('2.7', 5)],
  },
  {
    id: 3,
    titleKey: 'content.n.level.3',
    weeks: [21, 34],
    checkpointKey: 'content.n.checkpoint.3',
    modules: [m('3.1', 4), m('3.2', 5), m('3.3', 5), m('3.4', 5), m('3.5', 5), m('3.6', 5), m('3.7', 5)],
  },
  {
    id: 4,
    titleKey: 'content.n.level.4',
    weeks: [35, 48],
    checkpointKey: 'content.n.checkpoint.4',
    modules: [m('4.1', 5), m('4.2', 5), m('4.3', 5), m('4.4', 5), m('4.5', 5), m('4.6', 5)],
  },
  {
    id: 5,
    titleKey: 'content.n.level.5',
    weeks: [49, 60],
    checkpointKey: 'content.n.checkpoint.5',
    modules: [m('5.1', 4), m('5.2', 5), m('5.3', 5), m('5.4', 5), m('5.5', 4), m('5.6', 4)],
  },
];
