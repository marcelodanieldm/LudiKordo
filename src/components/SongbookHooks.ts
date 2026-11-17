import { useMemo } from 'react';
import { canOpenLesson } from '../billing/access';
import { useBilling } from '../billing/purchases';
import { songbook, songExerciseId, type SongbookFilter } from '../content/songbook';
import { useProgress } from '../state/progress';

/** Lista del cancionero para el alumno actual (progreso, nivel saltado y plan). */
export function useSongbook(filter: SongbookFilter = {}) {
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
      filter,
    );
  }, [lessons, skipped, exercises, isPremium, filter.genre]);
}
