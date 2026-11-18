/**
 * Ruta de guitarra eléctrica: 4 niveles, 28 módulos, 132 lecciones (~54 semanas).
 * Plan y objetivos: docs/CURRICULUM-GUITAR.md. Textos en `content.g.*`.
 */
import type { Level, Module } from '../types';

const m = (id: string, lessonCount: number): Module => ({
  id,
  titleKey: `content.g.module.${id.replace('.', '_')}`,
  lessonCount,
  starExerciseKey: `content.g.star.${id.replace('.', '_')}`,
  goalKey: `content.g.goal.${id.replace('.', '_')}`,
});

export const GUITAR_LEVELS: Level[] = [
  {
    id: 1,
    titleKey: 'content.g.level.1',
    weeks: [1, 8],
    checkpointKey: 'content.g.checkpoint.1',
    modules: [m('1.1', 5), m('1.2', 5), m('1.3', 5), m('1.4', 4), m('1.5', 5)],
  },
  {
    id: 2,
    titleKey: 'content.g.level.2',
    weeks: [9, 17],
    checkpointKey: 'content.g.checkpoint.2',
    modules: [m('2.1', 5), m('2.2', 5), m('2.3', 5), m('2.4', 5), m('2.5', 5), m('2.6', 5)],
  },
  {
    id: 3,
    titleKey: 'content.g.level.3',
    weeks: [18, 30],
    checkpointKey: 'content.g.checkpoint.3',
    modules: [m('3.1', 5), m('3.2', 4), m('3.3', 5), m('3.4', 4), m('3.5', 5), m('3.6', 5), m('3.7', 4)],
  },
  {
    id: 4,
    titleKey: 'content.g.level.4',
    weeks: [31, 54],
    checkpointKey: 'content.g.checkpoint.4',
    modules: [m('4.1', 5), m('4.2', 5), m('4.3', 5), m('4.4', 4), m('4.5', 5), m('4.6', 4), m('4.7', 5), m('4.8', 4), m('4.9', 5), m('4.10', 4)],
  },
];
