/**
 * Práctica de habilidades (lógica pura): estado de cada ejercicio para el alumno
 * y cómo se guarda su progreso.
 */
import { moduleLearned, type SongStatus } from './songbook';
import type { PracticeItem } from './drills';
import { isRest, noteStartBeats } from '../music/staff';
import { midiAt } from '../music/notes';
import { liveStats, type LiveState, type LiveTarget } from '../music/live';
import { starsFor } from '../music/scoring';

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

/** Estado de práctica de una canción del cancionero (usa el estado que ya calcula el cancionero). */
export function practiceStatusFromSong(item: PracticeItem, song: SongStatus): PracticeStatus {
  return { item, state: song.state, missing: song.missing, stars: 0 };
}

/** Momento (ms, reloj de audio) y nota de cada nota esperada. */
export function liveTargets(item: PracticeItem, startMs: number, bpm: number): LiveTarget[] {
  const beatMs = 60000 / bpm;
  const notes = item.line.filter((e) => !isRest(e));
  return noteStartBeats(item.line).map((b, i) => {
    const e = notes[i];
    return { timeMs: startMs + b * beatMs, midi: isRest(e) ? 0 : midiAt(e.string, e.fret) };
  });
}

export interface LiveResult {
  stars: 0 | 1 | 2 | 3;
  accuracy: number;
  minutes: number;
  /** Tempo que se desbloquea ahora (solo si es más rápido que el ya desbloqueado). */
  unlockedNow: number | null;
}

/** Resultado de una toma: estrellas sobre todas las notas, minutos tocados y tempo nuevo. */
export function liveResult(state: LiveState, item: PracticeItem, playedBpm: number, alreadyUnlocked: number | undefined): LiveResult {
  const st = liveStats(state);
  const accuracy = state.targets.length ? st.hits / state.targets.length : 0;
  const stars = starsFor(accuracy, 0.8);
  const beats = item.line.reduce((a, e) => a + e.beats, 0);
  const next = stars === 3 ? item.tempoSteps.find((b) => b > playedBpm) : undefined;
  const top = Math.max(item.bpm, alreadyUnlocked ?? 0);
  return { stars, accuracy, minutes: Math.round(beats / playedBpm), unlockedNow: next !== undefined && next > top ? next : null };
}
