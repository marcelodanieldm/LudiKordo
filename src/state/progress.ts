import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from './storage';
import { applyCheckpointPass, isoDate } from './rules';
import { XP_CHECKPOINT, xpFor } from '../music/scoring';
import type { Skill } from '../content/types';
import type { Stats as FretStats } from '../music/fretTrainer';
import { pushScore } from '../music/changes';

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
  /** Entrenador del mástil: aciertos de las últimas rondas por etapa y la estadística por nota. */
  fretRounds: Record<string, number[]>;
  fretStats: FretStats;
  /** Entrenador de ritmo: porcentaje de las últimas rondas por nivel. */
  rhythmRounds: Record<string, number[]>;
  /** «Cambios en un minuto»: últimos resultados por par (src/music/changes.ts). */
  changes: Record<string, number[]>;

  recordExercise: (id: string, stars: number, skills: Skill[]) => void;
  completeLesson: (id: string, stars: 0 | 1 | 2 | 3) => void;
  addMinutes: (minutes: number) => void;
  unlockTempo: (exerciseId: string, bpm: number) => void;
  /** Guarda una ronda del entrenador del mástil: suma el minuto y un punto de diapasón. */
  recordFretRound: (scope: string, right: number, stats: FretStats) => void;
  /** Guarda una ronda del entrenador de ritmo: suma el minuto y un punto de ritmo. */
  recordRhythmRound: (level: number, percent: number) => void;
  /** Guarda una ronda de cambios: suma el minuto practicado y un punto de técnica. */
  recordChanges: (pairId: string, count: number) => void;
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
      fretRounds: {},
      fretStats: {},
      rhythmRounds: {},
      changes: {},

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

      recordFretRound: (scope, right, stats) => {
        set((s) => ({
          fretRounds: { ...s.fretRounds, [scope]: [...(s.fretRounds[scope] ?? []), right].slice(-12) },
          fretStats: stats,
          skills: { ...s.skills, fretboard: { points: s.skills.fretboard.points + 1, last: isoDate() } },
        }));
        get().addMinutes(1);
      },

      recordRhythmRound: (level, percent) => {
        set((s) => ({
          rhythmRounds: { ...s.rhythmRounds, [level]: [...(s.rhythmRounds[level] ?? []), percent].slice(-12) },
          skills: { ...s.skills, rhythm: { points: s.skills.rhythm.points + 1, last: isoDate() } },
        }));
        get().addMinutes(1);
      },

      recordChanges: (pairId, count) => {
        set((s) => ({
          changes: { ...s.changes, [pairId]: pushScore(s.changes[pairId], count) },
          skills: { ...s.skills, technique: { points: s.skills.technique.points + 1, last: isoDate() } },
        }));
        // El minuto cuenta para la racha y las medallas de días, como cualquier práctica.
        get().addMinutes(1);
      },

      unlockTempo: (exerciseId, bpm) => set((s) => ({ tempo: { ...s.tempo, [exerciseId]: Math.max(s.tempo[exerciseId] ?? 0, bpm) } })),

      passCheckpoint: (level, stars, levelCompleted) =>
        set((s) => {
          // Las partes ya sumaron XP y estrellas al registrarse; el bono es fijo y una sola vez.
          const r = applyCheckpointPass(s.checkpoints[level], { level, stars, levelCompleted }, s.skippedLevels, isoDate(), XP_CHECKPOINT);
          const badges = new Set(s.badges);
          badges.add(`checkpoint-${level}`);
          return {
            checkpoints: { ...s.checkpoints, [level]: r.record },
            xp: s.xp + r.xp,
            badges: [...badges],
            skippedLevels: r.skippedLevels,
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
