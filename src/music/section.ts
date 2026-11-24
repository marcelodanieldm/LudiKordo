/**
 * Tramos de una canción o ejercicio (lógica pura): para practicar en bucle solo
 * unos compases, como en las apps que permiten repetir una sección. Un tramo
 * son compases enteros; la línea y los acordes se recortan juntos.
 */
import type { ScoreEvent } from '../content/types';

export interface Section {
  /** Primer y último compás (desde 0, ambos incluidos). */
  from: number;
  to: number;
}

/**
 * Tramos para elegir: de a 4 compases en canciones de 8 o más, de a 2 en las
 * más cortas. Sin tramos si hay menos de 4 compases (no vale la pena recortar).
 */
export function sectionsOf(bars: number): Section[] {
  if (bars < 4) return [];
  const size = bars >= 8 ? 4 : 2;
  const out: Section[] = [];
  for (let from = 0; from < bars; from += size) out.push({ from, to: Math.min(bars, from + size) - 1 });
  return out;
}

/**
 * Índice del evento donde empieza cada compás, o null si alguna nota cruza la
 * barra de compás (ahí no se puede cortar sin partir una nota).
 */
export function barStarts(line: ScoreEvent[], barBeats: number): number[] | null {
  const starts: number[] = [];
  let beat = 0;
  for (let i = 0; i < line.length; i++) {
    const bar = beat / barBeats;
    if (Math.abs(bar - Math.round(bar)) < 1e-9) starts.push(i);
    const next = beat + line[i].beats;
    // La nota termina pasando una barra que no es su final: cruza el compás.
    if (Math.floor(beat / barBeats + 1e-9) !== Math.floor((next - 1e-9) / barBeats)) return null;
    beat = next;
  }
  return starts;
}

/** Los eventos de los compases del tramo, o null si no se puede cortar ahí. */
export function sliceLine(line: ScoreEvent[], barBeats: number, s: Section): ScoreEvent[] | null {
  const starts = barStarts(line, barBeats);
  if (!starts || s.from < 0 || s.to < s.from || s.to >= starts.length) return null;
  const end = s.to + 1 < starts.length ? starts[s.to + 1] : line.length;
  return line.slice(starts[s.from], end);
}

/** Recorta un ejercicio con línea y acordes a un tramo (o null si no se puede). */
export function sliceDrill<T extends { chords: string[]; line?: ScoreEvent[] }>(drill: T, s: Section, barBeats: number): T | null {
  if (!drill.line || s.to >= drill.chords.length) return null;
  const line = sliceLine(drill.line, barBeats, s);
  return line ? { ...drill, line, chords: drill.chords.slice(s.from, s.to + 1) } : null;
}
