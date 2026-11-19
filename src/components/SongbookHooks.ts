import { useMemo } from 'react';
import { canOpenLesson } from '../billing/access';
import { useBilling } from '../billing/purchases';
import { keyParts, songbook, songExerciseId } from '../content/songbook';
import { DRILLS } from '../content/drills';
import { liveExerciseId, practiceStatuses } from '../content/practice';
import { letterNoteLabel, type Locale } from '../music/notes';
import { useSettings } from '../state/settings';
import { useTranslation } from 'react-i18next';
import type { Genre } from '../content/types';
import { useProgress } from '../state/progress';

/** Lista del cancionero para el alumno actual (progreso, nivel saltado y plan). */
export function useSongbook(genre?: Genre) {
  const isPremium = useBilling((s) => s.isPremium);
  const lessons = useProgress((s) => s.lessons);
  const skipped = useProgress((s) => s.skippedLevels);
  const exercises = useProgress((s) => s.exercises);
  return useMemo(() => {
    const completed = new Set(Object.entries(lessons).filter(([, r]) => r.stars > 0).map(([id]) => id));
    return songbook(
      completed,
      new Set(skipped),
      (moduleId) => canOpenLesson(`${moduleId}.1`, isPremium),
      (songId) => exercises[songExerciseId(songId)] ?? 0,
      { genre },
    );
  }, [lessons, skipped, exercises, isPremium, genre]);
}

/** Tonalidad de una canción en el idioma y la notación del alumno. */
export function useKeyLabel() {
  const { t, i18n } = useTranslation();
  const notation = useSettings((s) => s.notation);
  return (key: string) => {
    const { letter, minor } = keyParts(key);
    const note = letterNoteLabel(letter, i18n.language as Locale, notation) ?? letter;
    return t(minor ? 'ui.songbook.keyMinor' : 'ui.songbook.keyMajor', { note });
  };
}

/** Ejercicios de práctica con su estado (abierto, bloqueado o Premium) y mejor resultado. */
export function usePracticeList() {
  const isPremium = useBilling((s) => s.isPremium);
  const lessons = useProgress((s) => s.lessons);
  const skipped = useProgress((s) => s.skippedLevels);
  const exercises = useProgress((s) => s.exercises);
  return useMemo(() => {
    const completed = new Set(Object.entries(lessons).filter(([, r]) => r.stars > 0).map(([id]) => id));
    return practiceStatuses(DRILLS, completed, new Set(skipped), (m) => canOpenLesson(`${m}.1`, isPremium), (id) => exercises[liveExerciseId(id)] ?? 0);
  }, [lessons, skipped, exercises, isPremium]);
}
