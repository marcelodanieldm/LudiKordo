/**
 * Roadmap completo: 5 niveles, 25 módulos, 123 lecciones.
 * Coincide con la tabla del documento de producto.
 */
import type { Level, Module } from './types';

const m = (id: string, lessonCount: number): Module => ({
  id,
  titleKey: `content.module.${id.replace('.', '_')}`,
  lessonCount,
  starExerciseKey: `content.star.${id.replace('.', '_')}`,
});

export const LEVELS: Level[] = [
  {
    id: 1,
    titleKey: 'content.level.1',
    weeks: [1, 6],
    checkpointKey: 'content.checkpoint.1',
    modules: [m('1.1', 5), m('1.2', 5), m('1.3', 5), m('1.4', 5), m('1.5', 5)],
  },
  {
    id: 2,
    titleKey: 'content.level.2',
    weeks: [7, 14],
    checkpointKey: 'content.checkpoint.2',
    modules: [m('2.1', 5), m('2.2', 5), m('2.3', 5), m('2.4', 4), m('2.5', 5)],
  },
  {
    id: 3,
    titleKey: 'content.level.3',
    weeks: [15, 24],
    checkpointKey: 'content.checkpoint.3',
    modules: [m('3.1', 5), m('3.2', 5), m('3.3', 5), m('3.4', 5), m('3.5', 5)],
  },
  {
    id: 4,
    titleKey: 'content.level.4',
    weeks: [25, 38],
    checkpointKey: 'content.checkpoint.4',
    modules: [m('4.1', 5), m('4.2', 5), m('4.3', 5), m('4.4', 5), m('4.5', 5)],
  },
  {
    id: 5,
    titleKey: 'content.level.5',
    weeks: [39, 52],
    checkpointKey: 'content.checkpoint.5',
    modules: [m('5.1', 5), m('5.2', 5), m('5.3', 5), m('5.4', 5), m('5.5', 4)],
  },
];

export function moduleOf(lessonId: string): string {
  return lessonId.split('.').slice(0, 2).join('.');
}

export function levelOf(lessonId: string): number {
  return Number(lessonId.split('.')[0]);
}

export function lessonIdsOf(mod: Module): string[] {
  return Array.from({ length: mod.lessonCount }, (_, i) => `${mod.id}.${i + 1}`);
}

/** Todas las lecciones en el orden de la ruta. */
export function allLessonIds(): string[] {
  return LEVELS.flatMap((l) => l.modules.flatMap(lessonIdsOf));
}

export function totalLessons(): number {
  return allLessonIds().length;
}

/**
 * Una lección se desbloquea cuando la anterior está completada (1 estrella o más).
 * Un nivel saltado (checkpoint aprobado sin terminarlo) cuenta como completo:
 * todas sus lecciones quedan abiertas para repasar y el nivel siguiente
 * empieza por su primera lección, en orden.
 */
export function isUnlocked(lessonId: string, completed: ReadonlySet<string>, skippedLevels: ReadonlySet<number> = new Set()): boolean {
  const ids = allLessonIds();
  const i = ids.indexOf(lessonId);
  if (i <= 0) return i === 0;
  if (skippedLevels.has(levelOf(lessonId))) return true;
  const prev = ids[i - 1];
  return completed.has(prev) || skippedLevels.has(levelOf(prev));
}

/** La próxima lección pendiente (sin contar niveles saltados), o null si terminó el curso. */
export function nextLesson(completed: ReadonlySet<string>, skippedLevels: ReadonlySet<number> = new Set()): string | null {
  return allLessonIds().find((id) => !completed.has(id) && !skippedLevels.has(levelOf(id))) ?? null;
}

/** Porcentaje (0–1) de lecciones completadas en un nivel. */
export function levelProgress(levelId: number, completed: ReadonlySet<string>): number {
  const level = LEVELS.find((l) => l.id === levelId);
  if (!level) return 0;
  const ids = level.modules.flatMap(lessonIdsOf);
  return ids.filter((id) => completed.has(id)).length / ids.length;
}
