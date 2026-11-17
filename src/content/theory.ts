/**
 * Ficha teórica de un módulo (lógica pura): junta las tarjetas «Entiende» de
 * sus lecciones, con figuras y ejemplos sonoros, para repasar sin rehacer la
 * lección. Solo incluye lecciones escritas y a las que el alumno tiene acceso.
 */
import { LEVELS, lessonIdsOf } from './curriculum';
import { getLesson } from './lessons';
import type { Card, Module } from './types';

export interface TheorySection {
  lessonId: string;
  titleKey: string;
  cards: Card[];
}

export interface TheorySheet {
  module: Module;
  sections: TheorySection[];
  /** Lecciones escritas que piden Premium (se muestran como aviso, sin contenido). */
  locked: number;
}

export function findModule(id: string): Module | undefined {
  return LEVELS.flatMap((l) => l.modules).find((m) => m.id === id);
}

export function theorySheet(moduleId: string, canOpen: (lessonId: string) => boolean): TheorySheet | null {
  const module = findModule(moduleId);
  if (!module) return null;
  const sections: TheorySection[] = [];
  let locked = 0;
  for (const id of lessonIdsOf(module)) {
    const lesson = getLesson(id);
    if (!lesson) continue;
    if (!canOpen(id)) {
      locked++;
      continue;
    }
    sections.push({ lessonId: id, titleKey: lesson.titleKey, cards: lesson.cards });
  }
  return { module, sections, locked };
}
