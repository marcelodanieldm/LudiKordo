import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from './storage';
import { isoDate } from './rules';
import { xpFor } from '../music/scoring';
import type { Skill } from '../content/types';

export interface LessonRecord {
  stars: 0 | 1 | 2 | 3;
  completedAt: string;
}

interface ProgressState {
  lessons: Record<string, LessonRecord>;
  /** Mejor estrella por ejercicio. */
  exercises: Record<string, number>;
  xp: number;
  minutesByDay: Record<string, number>;
  skills: Record<Skill, { points: number; last?: string }>;
  badges: string[];
  skippedLevels: number[];
  /** Tempo desbloqueado por ejercicio (bpm). */
  tempo: Record<string, number>;
  /** Mejor resultado de cada checkpoint aprobado, por nivel. */
  checkpoints: Record<number, { stars: number; passedAt: string }>;

  recordExercise: (id: string, stars: number, skills: Skill[]) => void;
  completeLesson: (id: string, stars: 0 | 1 | 2 | 3) => void;
  addMinutes: (minutes: number) => void;
  unlockTempo: (exerciseId: string, bpm: number) => void;
  /**
   * Guarda un checkpoint aprobado. Si el nivel no estaba terminado, se marca
   * como saltado para desbloquear el siguiente.
   */
  passCheckpoint: (level: number, stars: number, levelCompleted: boolean) => void;
  completedSet: () => Set<string>;
  practiceDays: () => string[];
}

const emptySkills = (): ProgressState['skills'] => ({
  technique: { points: 0 },
  rhythm: { points: 0 },
  fretboard: { points: 0 },
  theory: { points: 0 },
  ear: { points: 0 },
});

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      lessons: {},
      exercises: {},
      xp: 0,
      minutesByDay: {},
      skills: emptySkills(),
      badges: [],
      skippedLevels: [],
      tempo: {},
      checkpoints: {},

      recordExercise: (id, stars, skills) =>
        set((s) => {
          const today = isoDate();
          const nextSkills = { ...s.skills };
          for (const sk of skills) {
            nextSkills[sk] = { points: nextSkills[sk].points + 1 + stars, last: today };
          }
          return {
            exercises: { ...s.exercises, [id]: Math.max(s.exercises[id] ?? 0, stars) },
            xp: s.xp + xpFor(stars),
            skills: nextSkills,
          };
        }),

      completeLesson: (id, stars) =>
        set((s) => {
          const prev = s.lessons[id];
          const badges = new Set(s.badges);
          badges.add('first-lesson');
          if (id === '1.1.4' && stars >= 1) badges.add('in-tune');
          return {
            lessons: {
              ...s.lessons,
              [id]: { stars: Math.max(prev?.stars ?? 0, stars) as LessonRecord['stars'], completedAt: isoDate() },
            },
            badges: [...badges],
          };
        }),

      addMinutes: (minutes) =>
        set((s) => {
          const today = isoDate();
          const minutesByDay = { ...s.minutesByDay, [today]: (s.minutesByDay[today] ?? 0) + minutes };
          const badges = new Set(s.badges);
          if (Object.keys(minutesByDay).length >= 7) badges.add('days-7');
          if (Object.keys(minutesByDay).length >= 30) badges.add('days-30');
          if (Object.keys(minutesByDay).length >= 100) badges.add('days-100');
          return { minutesByDay, badges: [...badges] };
        }),

      unlockTempo: (exerciseId, bpm) => set((s) => ({ tempo: { ...s.tempo, [exerciseId]: Math.max(s.tempo[exerciseId] ?? 0, bpm) } })),

      passCheckpoint: (level, stars, levelCompleted) =>
        set((s) => {
          const prev = s.checkpoints[level];
          const badges = new Set(s.badges);
          badges.add(`checkpoint-${level}`);
          const skipped = new Set(s.skippedLevels);
          if (!levelCompleted) skipped.add(level);
          return {
            checkpoints: { ...s.checkpoints, [level]: { stars: Math.max(prev?.stars ?? 0, stars), passedAt: prev?.passedAt ?? isoDate() } },
            // El bono de XP del checkpoint se gana una sola vez.
            xp: s.xp + (prev ? 0 : xpFor(stars, true)),
            badges: [...badges],
            skippedLevels: [...skipped],
          };
        }),

      completedSet: () => new Set(Object.entries(get().lessons).filter(([, r]) => r.stars >= 1).map(([id]) => id)),
      practiceDays: () => Object.keys(get().minutesByDay),
    }),
    { name: 'progress', storage: createJSONStorage(() => zustandStorage) },
  ),
);

/** Valor del radar (0–100) a partir de los puntos acumulados. */
export function skillLevel(points: number): number {
  return Math.min(100, Math.round(100 * (1 - Math.exp(-points / 60))));
}
