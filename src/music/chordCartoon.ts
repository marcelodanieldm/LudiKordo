/**
 * Guion del cartoon «armar un acorde con la mano» (lógica pura, sin React Native):
 * qué hace la mano en cada tiempo y qué cuerdas suenan. El dibujo vive en
 * `src/components/ChordHandCartoon.tsx`.
 */
import type { GridDiagram } from './chords';

export type ChordBeat =
  /** El pulgar se apoya detrás del mástil. */
  | { kind: 'thumb' }
  /** Un dedo baja a su lugar; con cejilla, el dedo 1 se acuesta sobre varias cuerdas. */
  | { kind: 'place'; finger: number; fret: number; strings: number[]; barre: boolean }
  /** La otra mano toca: de la cuerda más grave que suena a la más aguda. */
  | { kind: 'strum'; strings: number[] }
  /** Se sostiene el acorde: dedos arqueados, yemas detrás del traste. */
  | { kind: 'hold' };

/** Duración de cada tiempo, en ms: lento, para que se vea cada dedo. */
export const BEAT_MS: Record<ChordBeat['kind'], number> = { thumb: 900, place: 1100, strum: 1600, hold: 1300 };

/** Fracción del tiempo «place» que tarda el dedo en llegar (después queda quieto). */
export const LAND = 0.6;

/**
 * Si el diagrama es un acorde que se arma con una mano (como mucho una nota por
 * cuerda fuera de la cejilla, dedos 1 a 4). Las cajas de escala no lo son.
 */
export function isHandChord(d: GridDiagram): boolean {
  const own = d.dots.filter((dot) => !onBarre(d, dot));
  const strings = new Set(own.map((dot) => dot.string));
  // Un dedo pisa un solo traste; con cejilla, el dedo 1 es solo la cejilla.
  const fretOf = new Map<number, number>();
  const oneFretPerFinger = own.every((dot) => (fretOf.get(dot.finger) ?? dot.fret) === dot.fret && !!fretOf.set(dot.finger, dot.fret));
  const barreIsOnlyOne = !d.barre || own.every((dot) => dot.finger !== 1);
  return (own.length > 0 || !!d.barre) && strings.size === own.length && oneFretPerFinger && barreIsOnlyOne && d.dots.every((dot) => dot.finger >= 1 && dot.finger <= 4);
}

/** Un punto que ya cubre la cejilla (dedo 1 en su traste y dentro de su rango). */
function onBarre(d: GridDiagram, dot: GridDiagram['dots'][number]): boolean {
  return !!d.barre && dot.finger === 1 && dot.fret === d.barre.fret && dot.string >= d.barre.from && dot.string <= d.barre.to;
}

/** Cuerdas que suenan (0 = 6.ª … 5 = 1.ª): al aire, pisadas o bajo la cejilla, nunca las «x». */
export function soundingStrings(d: GridDiagram): number[] {
  return [0, 1, 2, 3, 4, 5].filter((i) => {
    if (d.marks[i] === 'x') return false;
    if (d.marks[i] === 'o') return true;
    if (d.dots.some((dot) => dot.string === i)) return true;
    return !!d.barre && i >= d.barre.from && i <= d.barre.to;
  });
}

/** Trastes que se muestran: desde la cejuela (o la posición del acorde) y al menos 4. */
export function fretWindow(d: GridDiagram): { first: number; count: number } {
  const frets = [...d.dots.map((dot) => dot.fret), d.barre?.fret ?? 0].filter((f) => f > 0);
  const lo = frets.length ? Math.min(...frets) : 1;
  const hi = frets.length ? Math.max(...frets) : 1;
  // Igual que la digitación: si entra en los primeros 4 trastes, se ve desde la cejuela.
  const first = hi <= 4 ? 1 : lo;
  return { first, count: Math.max(4, hi - first + 1) };
}

/**
 * El guion: pulgar, después cada dedo del 1 al 4 (la cejilla primero, porque es
 * el apoyo de la forma), el rasgueo y un momento para sostenerlo.
 */
export function chordBeats(d: GridDiagram): ChordBeat[] {
  const beats: ChordBeat[] = [{ kind: 'thumb' }];
  const byFinger = new Map<number, { fret: number; strings: number[] }>();
  for (const dot of d.dots) {
    if (onBarre(d, dot)) continue;
    const cur = byFinger.get(dot.finger);
    if (cur) cur.strings.push(dot.string);
    else byFinger.set(dot.finger, { fret: dot.fret, strings: [dot.string] });
  }
  if (d.barre) {
    const strings = Array.from({ length: d.barre.to - d.barre.from + 1 }, (_, k) => d.barre!.from + k);
    beats.push({ kind: 'place', finger: 1, fret: d.barre.fret, strings, barre: true });
    byFinger.delete(1);
  }
  [...byFinger.entries()]
    .sort(([a], [b]) => a - b)
    .forEach(([finger, { fret, strings }]) => beats.push({ kind: 'place', finger, fret, strings: strings.sort((a, b) => a - b), barre: false }));
  beats.push({ kind: 'strum', strings: soundingStrings(d) }, { kind: 'hold' });
  return beats;
}

/** Lo más rápido que se acelera el guion para entrar en una escena corta. */
export const MIN_SPEED_SCALE = 0.4;

/** Duración total de una vuelta del guion, en ms (`scale` < 1 la acorta). */
export function loopMs(beats: ChordBeat[], scale = 1): number {
  return beats.reduce((sum, b) => sum + BEAT_MS[b.kind], 0) * scale;
}

/**
 * Escala del guion para que una vuelta entera (con el rasgueo) entre en la
 * escena: 1 si sobra tiempo; si no, más rápido, sin bajar de MIN_SPEED_SCALE.
 */
export function fitScale(beats: ChordBeat[], sceneMs: number): number {
  return Math.min(1, Math.max(MIN_SPEED_SCALE, (sceneMs * 0.9) / loopMs(beats)));
}

/** En qué tiempo está la animación a los `ms` (con vueltas) y cuánto avanzó dentro de él (0 a 1). */
export function beatAt(beats: ChordBeat[], ms: number, scale = 1): { index: number; progress: number } {
  const total = loopMs(beats, scale);
  let t = ((ms % total) + total) % total;
  for (let i = 0; i < beats.length; i++) {
    const len = BEAT_MS[beats[i].kind] * scale;
    if (t < len) return { index: i, progress: t / len };
    t -= len;
  }
  return { index: beats.length - 1, progress: 1 };
}

/** Número de cuerda como lo dice el texto (6.ª … 1.ª) a partir del índice del diagrama. */
export const stringNumber = (index: number) => 6 - index;
