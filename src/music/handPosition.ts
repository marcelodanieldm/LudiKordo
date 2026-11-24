/**
 * Tarjeta «Tus manos en la guitarra» (lógica pura, sin React Native): qué dedo
 * va en cada cuerda y traste, los pasos para colocarlos, dónde apoya el pulgar y
 * qué suena al escucharla. El dibujo vive en `src/components/HandsCard.tsx`.
 *
 * Cuerdas: índice 0 = 6.ª (la más grave) … 5 = 1.ª, como en `GridDiagram`.
 */
import type { GridDiagram } from './chords';
import { fretWindow, soundingStrings } from './chordCartoon';

export interface HandDot {
  string: number;
  fret: number;
  finger: 1 | 2 | 3 | 4;
}

export type HandStep =
  /** El dedo 1 se acuesta en un traste, de una cuerda a otra (índices). */
  | { kind: 'barre'; fret: number; from: number; to: number }
  | { kind: 'finger'; dot: number }
  | { kind: 'open'; strings: number[] }
  | { kind: 'mute'; strings: number[] };

export interface HandPosture {
  name: string;
  dots: HandDot[];
  barre?: { fret: number; from: number; to: number };
  /** Cuerdas al aire («O») y que no suenan («X»). */
  open: number[];
  muted: number[];
  /** Traste a cuya altura va el pulgar, detrás del mástil (el del dedo 2). */
  thumbFret: number;
  /** Trastes que se dibujan. */
  first: number;
  count: number;
  steps: HandStep[];
  /** Escuchar: notas sueltas en orden (índices de `dots`) o el acorde. */
  play: { kind: 'notes'; seq: number[] } | { kind: 'chord' };
}

const isFinger = (f: number): f is HandDot['finger'] => f >= 1 && f <= 4;

/** Postura de un acorde a partir de su diagrama: la cejilla primero, después cada dedo del 1 al 4. */
export function postureFromDiagram(d: GridDiagram): HandPosture {
  const onBarre = (dot: GridDiagram['dots'][number]) =>
    !!d.barre && dot.finger === 1 && dot.fret === d.barre.fret && dot.string >= d.barre.from && dot.string <= d.barre.to;
  const dots: HandDot[] = d.dots
    .filter((dot) => !onBarre(dot) && isFinger(dot.finger))
    .map((dot) => ({ string: dot.string, fret: dot.fret, finger: dot.finger as HandDot['finger'] }))
    .sort((a, b) => a.finger - b.finger || a.string - b.string);
  const open = d.marks.flatMap((m, i) => (m === 'o' ? [i] : []));
  const muted = d.marks.flatMap((m, i) => (m === 'x' ? [i] : []));
  const steps: HandStep[] = [];
  if (d.barre) steps.push({ kind: 'barre', ...d.barre });
  dots.forEach((_, k) => steps.push({ kind: 'finger', dot: k }));
  if (open.length) steps.push({ kind: 'open', strings: open });
  if (muted.length) steps.push({ kind: 'mute', strings: muted });
  const { first, count } = fretWindow(d);
  return { name: d.name, dots, barre: d.barre, open, muted, thumbFret: thumbFretOf(dots, d.barre, first), first, count, steps, play: { kind: 'chord' } };
}

/** El pulgar va detrás del dedo 2; si no hay dedo 2, en medio de los dedos que pisan. */
export function thumbFretOf(dots: HandDot[], barre: HandPosture['barre'], first: number): number {
  const two = dots.find((d) => d.finger === 2);
  if (two) return two.fret;
  const frets = [...dots.map((d) => d.fret), ...(barre ? [barre.fret] : [])];
  if (!frets.length) return first + 1;
  return Math.round((Math.min(...frets) + Math.max(...frets)) / 2);
}

/** La araña: un dedo por traste (1 a 4) en una cuerda, de ida y vuelta. */
export function spiderPosture(string: number): HandPosture {
  const dots: HandDot[] = [1, 2, 3, 4].map((f) => ({ string, fret: f, finger: f as HandDot['finger'] }));
  return {
    name: 'spider',
    dots,
    open: [],
    muted: [],
    thumbFret: 2,
    first: 1,
    count: 5,
    steps: dots.map((_, k) => ({ kind: 'finger', dot: k })),
    play: { kind: 'notes', seq: [0, 1, 2, 3, 2, 1, 0] },
  };
}

/** La nota MIDI de cada cuerda con esta postura (null = no suena). */
export function notesOfPosture(p: HandPosture, openMidi: readonly number[]): (number | null)[] {
  return openMidi.map((base, i) => {
    if (p.muted.includes(i)) return null;
    const own = p.dots.filter((d) => d.string === i).sort((a, b) => b.fret - a.fret)[0];
    if (own) return base + own.fret;
    if (p.barre && i >= p.barre.from && i <= p.barre.to) return base + p.barre.fret;
    return p.open.includes(i) ? base : null;
  });
}

/** Cuerdas que suenan, de la grave a la aguda (para el rasgueo y el arpegio). */
export function soundingOf(p: HandPosture, openMidi: readonly number[]): number[] {
  return notesOfPosture(p, openMidi).flatMap((m, i) => (m === null ? [] : [i]));
}

export interface PlayEvent {
  atMs: number;
  /** Cuerdas que se iluminan desde este momento. */
  strings: number[];
  /** Dedo que se resalta (índice de `dots`), o -1. */
  dot: number;
  /** Notas que suenan en este evento (con su desfase, para el rasgueo). */
  notes: { midi: number; offsetMs: number }[];
}

export const NOTE_MS = 480;
export const ARP_MS = 360;
export const STRUM_GAP_MS = 28;
export const STRUM_PAUSE_MS = 500;
export const RING_MS = 1600;

/**
 * Qué suena al tocar «Escuchar»: las notas sueltas en orden o, en un acorde,
 * cuerda por cuerda de la grave a la aguda y después un rasgueo.
 */
export function listenPlan(p: HandPosture, openMidi: readonly number[]): { events: PlayEvent[]; totalMs: number } {
  const events: PlayEvent[] = [];
  if (p.play.kind === 'notes') {
    p.play.seq.forEach((k, j) => {
      const d = p.dots[k];
      events.push({ atMs: j * NOTE_MS, strings: [d.string], dot: k, notes: [{ midi: openMidi[d.string] + d.fret, offsetMs: 0 }] });
    });
    return { events, totalMs: p.play.seq.length * NOTE_MS + 400 };
  }
  const notes = notesOfPosture(p, openMidi);
  const sounding = soundingOf(p, openMidi);
  sounding.forEach((s, j) => {
    events.push({ atMs: j * ARP_MS, strings: [s], dot: p.dots.findIndex((d) => d.string === s), notes: [{ midi: notes[s]!, offsetMs: 0 }] });
  });
  const strumAt = sounding.length * ARP_MS + STRUM_PAUSE_MS;
  events.push({ atMs: strumAt, strings: sounding, dot: -1, notes: sounding.map((s, j) => ({ midi: notes[s]!, offsetMs: j * STRUM_GAP_MS })) });
  return { events, totalMs: strumAt + RING_MS };
}

/** Cuántos pasos dejan visible cada dedo y la cejilla (para la colocación paso a paso). */
export function stepOfDot(p: HandPosture, dot: number): number {
  return p.steps.findIndex((s) => s.kind === 'finger' && s.dot === dot);
}
export function stepOfBarre(p: HandPosture): number {
  return p.steps.findIndex((s) => s.kind === 'barre');
}

/** Coincide con `soundingStrings` del cartoon (misma regla para el mismo diagrama). */
export const soundingFromDiagram = soundingStrings;
