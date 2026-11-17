/**
 * Ejemplos sonoros (lógica pura): cuándo suena cada nota de un ejemplo.
 *
 * El parlante de un teléfono casi no reproduce el Mi grave (41 Hz), así que el
 * ejemplo suena una octava arriba: se oyen igual el ritmo, la melodía y la
 * diferencia entre grave y agudo.
 */
import { midiAt, midiToFreq } from './notes';
import { isRest } from './staff';
import type { ScoreEvent } from '../content/types';

export const PLAYBACK_OCTAVE_UP = 12;
/** La nota dura un poco menos que su figura para que se escuche el ataque de la siguiente. */
export const NOTE_GATE = 0.9;
/** Cuenta previa del ejemplo con clic, en pulsos. */
export const LISTEN_COUNT_IN = 4;

export interface ScheduledNote {
  freq: number;
  startSec: number;
  durSec: number;
}

export function listenSchedule(events: ScoreEvent[], bpm: number, offsetBeats = 0): ScheduledNote[] {
  const beatSec = 60 / bpm;
  let beat = offsetBeats;
  const out: ScheduledNote[] = [];
  for (const e of events) {
    if (!isRest(e)) {
      out.push({
        freq: midiToFreq(midiAt(e.string, e.fret) + PLAYBACK_OCTAVE_UP),
        startSec: beat * beatSec,
        durSec: e.beats * beatSec * NOTE_GATE,
      });
    }
    beat += e.beats;
  }
  return out;
}

/** Duración total del ejemplo, en segundos, incluida la cuenta previa si hay clic. */
export function listenLengthSec(events: ScoreEvent[], bpm: number, click = false): number {
  const beats = events.reduce((a, e) => a + e.beats, 0) + (click ? LISTEN_COUNT_IN : 0);
  return (beats * 60) / bpm;
}
