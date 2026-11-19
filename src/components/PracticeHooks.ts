import { useMemo } from 'react';
import { canOpenLesson } from '../billing/access';
import { useBilling } from '../billing/purchases';
import { DRILLS, drillExerciseId, drillState, missingModule, type Drill, type DrillState } from '../content/practice';
import { useProgress } from '../state/progress';
import { findModule } from '../content/theory';
import { useTranslation } from 'react-i18next';

export interface DrillStatus {
  drill: Drill;
  state: DrillState;
  /** Primer módulo que falta terminar (si está bloqueado). */
  missing?: string;
  stars: number;
}

/** Ejercicios de práctica para el alumno actual (progreso, nivel saltado y plan). */
export function useDrills(): DrillStatus[] {
  const isPremium = useBilling((s) => s.isPremium);
  const lessons = useProgress((s) => s.lessons);
  const skipped = useProgress((s) => s.skippedLevels);
  const exercises = useProgress((s) => s.exercises);
  return useMemo(() => {
    const completed = new Set(Object.entries(lessons).filter(([, r]) => r.stars > 0).map(([id]) => id));
    const skippedSet = new Set(skipped);
    return DRILLS.map((drill) => ({
      drill,
      state: drillState(drill, completed, skippedSet, (m) => canOpenLesson(`${m}.1`, isPremium)),
      missing: missingModule(drill, completed, skippedSet),
      stars: exercises[drillExerciseId(drill.id)] ?? 0,
    }));
  }, [lessons, skipped, exercises, isPremium]);
}

/** «2.6 Pentatónica menor»: número y título del módulo del instrumento de esta build. */
export function useModuleLabel() {
  const { t } = useTranslation();
  return (moduleId: string) => {
    const mod = findModule(moduleId);
    return mod ? `${moduleId} ${t(mod.titleKey)}` : moduleId;
  };
}
