/**
 * Cancionero (lógica pura): qué canciones puede tocar el alumno según lo que
 * ya aprendió, cuáles recomendar y qué le falta para las demás.
 */
import { LEVELS, lessonIdsOf, levelOf } from './curriculum';
import { SONGS } from './songs';
import type { Genre, Module, Song } from './types';

function findModule(id: string): Module | undefined {
  return LEVELS.flatMap((l) => l.modules).find((m) => m.id === id);
}

/**
 * Un módulo cuenta como aprendido si todas sus lecciones están completas, o si
 * su nivel se saltó aprobando el checkpoint por test.
 */
export function moduleLearned(moduleId: string, completed: ReadonlySet<string>, skippedLevels: ReadonlySet<number> = new Set()): boolean {
  const mod = findModule(moduleId);
  if (!mod) return false;
  if (skippedLevels.has(levelOf(`${moduleId}.1`))) return true;
  return lessonIdsOf(mod).every((id) => completed.has(id));
}

export type SongState = 'open' | 'locked' | 'premium';

export interface SongStatus {
  song: Song;
  state: SongState;
  /** Módulos que faltan para desbloquearla, en orden de la ruta. */
  missing: string[];
  /** Mejor resultado del alumno (0 = sin tocar). */
  stars: number;
}

/**
 * Estado de una canción. `canOpenModule` dice si el plan del alumno incluye el
 * módulo (Premium): una canción que usa módulos pagos también lo es.
 */
export function songStatus(
  song: Song,
  completed: ReadonlySet<string>,
  skippedLevels: ReadonlySet<number>,
  canOpenModule: (moduleId: string) => boolean,
  bestStars: (songId: string) => number = () => 0,
): SongStatus {
  const missing = song.requires.filter((m) => !moduleLearned(m, completed, skippedLevels));
  const premium = song.requires.some((m) => !canOpenModule(m));
  const state: SongState = missing.length > 0 ? 'locked' : premium ? 'premium' : 'open';
  return { song, state, missing, stars: bestStars(song.id) };
}

export interface SongbookFilter {
  genre?: Genre;
}

/**
 * Canciones ordenadas para la lista: primero las abiertas y sin dominar
 * (empezando por las de nivel más alto, que usan lo último que aprendió),
 * después las abiertas dominadas y al final las bloqueadas por nivel.
 */
export function songbook(
  completed: ReadonlySet<string>,
  skippedLevels: ReadonlySet<number>,
  canOpenModule: (moduleId: string) => boolean,
  bestStars: (songId: string) => number = () => 0,
  filter: SongbookFilter = {},
  songs: Song[] = SONGS,
): SongStatus[] {
  const rank = (s: SongStatus) => (s.state === 'open' ? (s.stars < 3 ? 0 : 1) : s.state === 'premium' ? 2 : 3);
  return songs
    .filter((s) => !filter.genre || s.genre === filter.genre)
    .map((s) => songStatus(s, completed, skippedLevels, canOpenModule, bestStars))
    .sort((a, b) => rank(a) - rank(b) || (rank(a) <= 1 ? b.song.level - a.song.level : a.song.level - b.song.level) || a.song.id.localeCompare(b.song.id));
}

/** La canción sugerida para hoy: la primera abierta sin dominar, o null. */
export function recommendedSong(list: SongStatus[]): SongStatus | null {
  return list.find((s) => s.state === 'open' && s.stars < 3) ?? null;
}

/** Id del ejercicio con el que se guarda el progreso de una canción. */
export function songExerciseId(songId: string): string {
  return `song-${songId}`;
}
