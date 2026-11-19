/**
 * Dibujos con movimiento (lógica pura): cuándo empieza cada paso y qué suena.
 * El sonido usa la misma octava de reproducción que los ejemplos sonoros, para
 * que se oiga en el parlante del teléfono.
 */
import { midiAt, midiToFreq } from './notes';
import { PLAYBACK_OCTAVE_UP, NOTE_GATE } from './listen';
import type { FigureMotion } from '../content/types';
import type { StringId } from './notes';

/** Pausa antes del primer paso, para que el alumno vea el dibujo quieto. */
export const MOTION_LEAD_SEC = 0.3;

/** Segundo en que empieza cada paso. */
export function motionStarts(motion: FigureMotion): number[] {
  const beat = 60 / motion.bpm;
  let t = MOTION_LEAD_SEC;
  return motion.steps.map((s) => {
    const at = t;
    t += s.beats * beat;
    return at;
  });
}

export function motionLengthSec(motion: FigureMotion): number {
  return MOTION_LEAD_SEC + motion.steps.reduce((a, s) => a + s.beats, 0) * (60 / motion.bpm);
}

/** Paso visible en el segundo `t` desde que empezó (-1 antes del primero o al terminar). */
export function motionStepAt(starts: number[], totalSec: number, t: number): number {
  if (t < (starts[0] ?? 0) || t >= totalSec) return -1;
  let i = 0;
  while (i + 1 < starts.length && starts[i + 1] <= t) i++;
  return i;
}

export interface MotionNote {
  freq: number;
  startSec: number;
  durSec: number;
  muted: boolean;
}

/** Notas para el motor de audio (solo los pasos que suenan). */
export function motionNotes(motion: FigureMotion): MotionNote[] {
  const beat = 60 / motion.bpm;
  const starts = motionStarts(motion);
  return motion.steps.flatMap((s, i) =>
    s.note
      ? [{
          freq: midiToFreq(midiAt(s.note.string, s.note.fret) + PLAYBACK_OCTAVE_UP),
          startSec: starts[i],
          durSec: s.beats * beat * NOTE_GATE,
          muted: Boolean(s.muted),
        }]
      : [],
  );
}

/** Posiciones únicas que aparecen en el movimiento (para dibujar todos los puntos del diapasón). */
export function motionPositions(motion: FigureMotion): { string: StringId; fret: number }[] {
  const seen = new Set<string>();
  const out: { string: StringId; fret: number }[] = [];
  for (const s of motion.steps) {
    if (!s.note) continue;
    const key = `${s.note.string}${s.note.fret}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ string: s.note.string, fret: s.note.fret });
  }
  return out;
}
