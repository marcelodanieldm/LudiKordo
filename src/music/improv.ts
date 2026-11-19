/**
 * Puntaje de una improvisación (lógica pura). Improvisar no tiene una respuesta
 * única: se mira que las notas estén en la escala, que haya suficientes y, si la
 * lección lo pide, que en cada cambio de acorde se llegue a una nota del acorde.
 */
import { freqToMidi } from './notes';

export interface ImprovNote {
  /** Momento del ataque (ms, reloj de audio). */
  timeMs: number;
  freq: number;
}

export interface ImprovTarget {
  /** Comienzo del compás (ms, mismo reloj). */
  timeMs: number;
  pcs: number[];
}

export interface ImprovResult {
  notes: number;
  /** Fracción de notas dentro de la escala (0–1). */
  inScale: number;
  /** Cambios de acorde donde se llegó a una nota del acorde. */
  targetHits: number;
  targetTotal: number;
  accuracy: number;
}

/** Ventana alrededor del cambio de acorde en la que cuenta la nota de llegada. */
export const TARGET_WINDOW_MS = { before: 300, after: 700 };
/** Peso de las notas de llegada en el puntaje, cuando la lección las pide. */
const TARGET_WEIGHT = 0.4;

const pcOf = (freq: number) => ((Math.round(freqToMidi(freq)) % 12) + 12) % 12;

/** Para el puntaje completo hace falta usar al menos estas notas distintas (no vale repetir una sola). */
export const MIN_DISTINCT_PCS = 3;

/**
 * `detected` son tus notas sin la pista (ver `filterBacking`); `all` son todas
 * las que oyó el micrófono, para las notas de llegada (que caen con el acorde).
 */
export function scoreImprov(detected: ImprovNote[], scale: number[], minNotes: number, targets: ImprovTarget[] = [], all: ImprovNote[] = detected): ImprovResult {
  const notes = detected.length;
  const inScale = notes ? detected.filter((d) => scale.includes(pcOf(d.freq))).length / notes : 0;
  const distinct = new Set(detected.map((d) => pcOf(d.freq))).size;
  let targetHits = 0;
  for (const tg of targets) {
    const near = all.filter((d) => d.timeMs >= tg.timeMs - TARGET_WINDOW_MS.before && d.timeMs <= tg.timeMs + TARGET_WINDOW_MS.after);
    if (near.some((d) => tg.pcs.includes(pcOf(d.freq)))) targetHits++;
  }
  const amount = Math.min(1, notes / Math.max(1, minNotes)) * Math.min(1, distinct / MIN_DISTINCT_PCS);
  const base = inScale * amount;
  const accuracy = targets.length ? base * (1 - TARGET_WEIGHT) + (targetHits / targets.length) * TARGET_WEIGHT * amount : base;
  return { notes, inScale, targetHits, targetTotal: targets.length, accuracy };
}

/** Comienzo de cada compás de la pista repetida (para las notas de llegada). */
export function targetTimes(startMs: number, bpm: number, barsPerLoop: number, loops: number, pcs: number[][]): ImprovTarget[] {
  const barMs = (4 * 60000) / bpm;
  return Array.from({ length: barsPerLoop * loops }, (_, i) => ({ timeMs: startMs + i * barMs, pcs: pcs[i % barsPerLoop] }));
}

/** Cuánto puede tardar el parlante en sonar después de programar una nota (Android, sin compensar). */
export const BACKING_WINDOW_MS = 250;

/** Una nota de la pista: cuándo se programó (ms, reloj de audio) y su altura MIDI. */
export interface BackingNote {
  timeMs: number;
  midi: number;
}

/**
 * Saca las notas que son la pista oída por el micrófono: misma altura que una
 * nota de la pista y justo después de que sonó. Una nota tuya a tiempo pero en
 * otra altura se queda. Con auriculares no saca nada. No se usa para las notas
 * de llegada: ahí cuenta llegar a tiempo aunque coincida con el acorde.
 */
export function filterBacking(detected: ImprovNote[], backing: BackingNote[], windowMs = BACKING_WINDOW_MS): ImprovNote[] {
  return detected.filter((d) => {
    const midi = Math.round(freqToMidi(d.freq));
    return !backing.some((b) => b.midi === midi && d.timeMs >= b.timeMs - 20 && d.timeMs <= b.timeMs + windowMs);
  });
}
