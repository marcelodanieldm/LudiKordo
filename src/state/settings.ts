import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from './storage';
import type { Locale, Notation } from '../music/notes';

export type Hand = 'right' | 'left';

interface SettingsState {
  onboarded: boolean;
  locale: Locale | null; // null = seguir el idioma del teléfono
  notation: Notation;
  hand: Hand;
  dailyMinutes: 5 | 10 | 15 | 20;
  weeklyDays: number; // 3 a 7
  hasBass: boolean;
  reminderHour: number; // 0–23
  setLocale: (l: Locale) => void;
  update: (patch: Partial<Omit<SettingsState, 'setLocale' | 'update'>>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      onboarded: false,
      locale: null,
      notation: 'both',
      hand: 'right',
      dailyMinutes: 15,
      weeklyDays: 5,
      hasBass: true,
      reminderHour: 19,
      setLocale: (locale) => set({ locale }),
      update: (patch) => set(patch),
    }),
    { name: 'settings', storage: createJSONStorage(() => zustandStorage) },
  ),
);
