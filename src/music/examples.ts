/**
 * Programación de un ejemplo sonoro completo (lógica pura): una melodía
 * (`events`) o un rasgueo de acordes (`strum`), con o sin cuenta previa.
 * La usan las tarjetas «Escuchar» y los sonidos de las escenas.
 */
import type { ListenExample } from '../content/types';
import { LISTEN_COUNT_IN, listenSchedule, type ScheduledNote } from './listen';
import { strumSchedule } from './strum';

export interface ExampleSchedule {
  notes: ScheduledNote[];
  /** Pulsos totales, cuenta previa incluida (para el clic y la duración). */
  beats: number;
  lengthSec: number;
}

export function exampleSchedule(ex: ListenExample): ExampleSchedule {
  const offset = ex.click ? LISTEN_COUNT_IN : 0;
  const bodyBeats = ex.strum ? ex.strum.chords.length * 4 : ex.events.reduce((a, e) => a + e.beats, 0);
  const notes = ex.strum ? strumSchedule(ex.strum.chords, ex.strum.pattern, ex.bpm, offset) : listenSchedule(ex.events, ex.bpm, offset);
  const beats = bodyBeats + offset;
  return { notes, beats, lengthSec: (beats * 60) / ex.bpm };
}
