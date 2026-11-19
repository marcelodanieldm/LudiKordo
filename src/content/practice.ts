/**
 * Práctica de habilidades (lógica pura): estado de cada ejercicio para el alumno
 * y cómo se guarda su progreso.
 */
import { moduleLearned } from './songbook';
import type { PracticeItem } from './drills';

export type PracticeState = 'open' | 'locked' | 'premium';

export interface PracticeStatus {
  item: PracticeItem;
  state: PracticeState;
  missing: string[];
  stars: number;
}

/** Id con el que se guarda el progreso de una práctica en vivo. */
export function liveExerciseId(itemId: string): string {
  return `live-${itemId}`;
}

export function practiceStatuses(
  items: PracticeItem[],
  completed: ReadonlySet<string>,
  skippedLevels: ReadonlySet<number>,
  canOpenModule: (moduleId: string) => boolean,
  bestStars: (itemId: string) => number,
): PracticeStatus[] {
  return items.map((item) => {
    const missing = item.requires.filter((m) => !moduleLearned(m, completed, skippedLevels));
    const premium = item.requires.some((m) => !canOpenModule(m));
    return { item, state: premium ? 'premium' : missing.length ? 'locked' : 'open', missing, stars: bestStars(item.id) };
  });
}

/** Tempos que el alumno puede elegir: hasta el último desbloqueado. */
export function availableTempos(item: PracticeItem, unlockedBpm: number | undefined): number[] {
  const top = Math.max(item.bpm, unlockedBpm ?? 0);
  return item.tempoSteps.filter((b) => b <= top);
}
