/**
 * Programación de un ejemplo sonoro completo (lógica pura): una melodía
 * (`events`), un rasgueo de acordes (`strum`) o las dos cosas juntas (una
 * melodía sobre una pista de acompañamiento), con o sin cuenta previa y efectos.
 * La usan las tarjetas «Escuchar», los sonidos de las escenas y los ejercicios.
 */
import type { ListenExample } from '../content/types';
import { LISTEN_COUNT_IN, listenSchedule, type ScheduledNote } from './listen';
import { strumSchedule } from './strum';
import { applyFx } from './fx';

export interface ExampleSchedule {
  notes: ScheduledNote[];
  /** Pulsos totales, cuenta previa incluida (para el clic y la duración). */
  beats: number;
  lengthSec: number;
}

export function exampleSchedule(ex: ListenExample): ExampleSchedule {
  const offset = ex.click ? LISTEN_COUNT_IN : 0;
  const melodyBeats = ex.events.reduce((a, e) => a + e.beats, 0);
  // Un compás de rasgueo dura lo que su patrón: 4 pulsos (8 corcheas) o 3 (6 corcheas, 3/4 y 6/8).
  const bodyBeats = Math.max(ex.strum ? ex.strum.chords.length * (ex.strum.pattern.length / 2) : 0, melodyBeats);
  const melody = applyFx(listenSchedule(ex.events, ex.bpm, offset), ex.fx);
  const chords = ex.strum
    ? strumSchedule(ex.strum.chords, ex.strum.pattern, ex.bpm, offset).map((n) => ({
        ...n,
        ...(ex.strum!.tone ? { tone: ex.strum!.tone } : {}),
        ...(ex.strum!.level !== undefined ? { level: ex.strum!.level } : {}),
      }))
    : [];
  // Sin melodía, el efecto va sobre los acordes (por ejemplo, un rasgueo con chorus).
  const notes = ex.events.length ? [...chords, ...melody] : applyFx(chords, ex.fx);
  const beats = bodyBeats + offset;
  // Lo que dure más: los compases o la última nota (con la cola del delay y la reverb).
  const lastEnd = notes.reduce((a, x) => Math.max(a, x.startSec + x.durSec), 0);
  return { notes, beats, lengthSec: Math.max((beats * 60) / ex.bpm, lastEnd) };
}

/**
 * Índice del evento de la melodía que suena a los `elapsedMs` desde el inicio
 * del ejemplo (con la cuenta previa, si hay clic), o -1 antes o después de la
 * melodía. Sirve para seguir la partitura mientras suena.
 */
export function eventAtMs(ex: ListenExample, elapsedMs: number): number {
  const beat = (elapsedMs / 60000) * ex.bpm - (ex.click ? LISTEN_COUNT_IN : 0);
  if (beat < 0) return -1;
  let start = 0;
  for (let i = 0; i < ex.events.length; i++) {
    start += ex.events[i].beats;
    if (beat < start) return i;
  }
  return -1;
}
