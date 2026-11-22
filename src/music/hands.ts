/**
 * Las manos en cada ejercicio (lógica pura): qué dedo pisa cada nota, dónde va
 * el pulgar, cuándo se mueve la mano entera y cómo toca la otra mano.
 *
 * - Mano que pisa: «un dedo por traste». Las notas se agrupan en posiciones de
 *   4 trastes; el dedo 1 va en el traste más bajo de la posición (o en el 1,
 *   si todo entra en los primeros 4 trastes). Una nota fuera
 *   de la posición es un cambio de posición (se mueve la mano entera).
 * - Mano que toca: púa abajo/arriba (eléctrica), índice y medio alternados
 *   (bajo) o p-i-m-a por cuerda (criolla).
 *
 * Devuelve pasos para el dibujo y consejos (`ui.exercise.hand.*`) para la tarjeta.
 */
import type { Tip } from './feedback';
import type { Stroke } from './strum';
import { CHORDS, SEVENTHS, type ChordShape } from './chords';

export type HandInstrument = 'bass' | 'guitar' | 'nylon';
/** 0 = cuerda al aire. */
export type Finger = 0 | 1 | 2 | 3 | 4;
export type Pluck = 'down' | 'up' | 'p' | 'i' | 'm' | 'a';

export interface HandNote {
  string: string;
  fret: number;
}

export interface HandStep extends HandNote {
  finger: Finger;
  /** Traste del dedo 1 en este momento. */
  pos: number;
  /** Aquí empieza una posición nueva (la mano entera se mueve). */
  shift: boolean;
  pluck: Pluck;
}

/** Posición más ancha que cubre la mano sin moverse: 4 trastes (dedos 1 a 4). */
export const HAND_SPAN = 4;

/** Dedo de cada nota y posición de la mano, agrupando las notas en posiciones de 4 trastes. */
export function fingering(notes: HandNote[]): Omit<HandStep, 'pluck'>[] {
  // Primero las posiciones: tramos de notas pisadas que entran en 4 trastes.
  const posOf: number[] = [];
  let lo = Infinity;
  let hi = -Infinity;
  let start = 0;
  const close = (end: number) => {
    // Cerca de la cejuela se toca en 1.ª posición (dedo 1 en el traste 1), como en las lecciones.
    const pos = !Number.isFinite(lo) || hi <= HAND_SPAN ? 1 : lo;
    for (let k = start; k < end; k++) posOf[k] = pos;
  };
  notes.forEach((n, i) => {
    if (n.fret === 0) return;
    const nlo = Math.min(lo, n.fret);
    const nhi = Math.max(hi, n.fret);
    if (nhi - nlo <= HAND_SPAN - 1) {
      lo = nlo;
      hi = nhi;
      return;
    }
    close(i);
    start = i;
    lo = n.fret;
    hi = n.fret;
  });
  close(notes.length);
  let prev = -1;
  return notes.map((n, i) => {
    const pos = posOf[i];
    const fretted = n.fret > 0;
    const shift = fretted && prev !== -1 && pos !== prev;
    if (fretted) prev = pos;
    return { ...n, pos, shift, finger: (fretted ? Math.min(4, Math.max(1, n.fret - pos + 1)) : 0) as Finger };
  });
}

/** Cuerda de la criolla → dedo de la mano derecha (posición fija: p en los bordones, i-m-a en las agudas). */
const PIMA: Record<string, Pluck> = { E: 'p', A: 'p', D: 'p', G: 'i', B: 'm', e: 'a' };

/**
 * Cómo toca cada nota la otra mano. `onBeat[k]` dice si la nota k cae en el
 * tiempo (para la púa alternada: abajo en el tiempo, arriba en la «y»).
 */
export function plucking(notes: HandNote[], instrument: HandInstrument, onBeat?: boolean[]): Pluck[] {
  if (instrument === 'nylon') return notes.map((n) => PIMA[n.string] ?? 'i');
  if (instrument === 'bass') return notes.map((_, k) => (k % 2 === 0 ? 'i' : 'm'));
  return notes.map((_, k) => (onBeat && onBeat[k] === false ? 'up' : 'down'));
}

export interface HandPlan {
  steps: HandStep[];
  /** Posiciones distintas, en el orden en que aparecen. */
  positions: number[];
  shifts: number;
  tips: Tip[];
}

interface EventLike {
  beats: number;
  rest?: boolean;
}

const FINGER_SEQ_MAX = 12;

/** Plan de manos para tocar unas notas (con su partitura, si tiene tempo). */
export function handPlan(notes: HandNote[], instrument: HandInstrument, score?: EventLike[]): HandPlan {
  // ¿Cae cada nota en el tiempo? Solo importa si hay corcheas.
  let onBeat: boolean[] | undefined;
  const hasEighths = Boolean(score?.some((e) => e.beats < 1));
  if (score && hasEighths) {
    onBeat = [];
    let beat = 0;
    for (const e of score) {
      if (!e.rest) onBeat.push(Math.abs(beat - Math.round(beat)) < 1e-6);
      beat += e.beats;
    }
  }
  const fingers = fingering(notes);
  const plucks = plucking(notes, instrument, onBeat);
  const steps: HandStep[] = fingers.map((f, k) => ({ ...f, pluck: plucks[k] }));
  const positions = [...new Set(steps.filter((s) => s.fret > 0).map((s) => s.pos))];
  const shifts = steps.filter((s) => s.shift).length;
  const tips: Tip[] = [];

  // Mano que pisa.
  if (positions.length === 0) {
    tips.push({ key: 'hand.leftOpen' });
  } else {
    const p = positions[0];
    tips.push({ key: 'hand.left', params: { pos: p, p2: p + 1, p3: p + 2, p4: p + 3 } });
    tips.push({ key: 'hand.fingers', params: { seq: steps.slice(0, FINGER_SEQ_MAX).map((s) => String(s.finger)).join(' · ') + (steps.length > FINGER_SEQ_MAX ? ' …' : '') } });
    tips.push({ key: `hand.thumb.${instrument}` });
    if (shifts > 0) {
      const first = steps.find((s) => s.shift)!;
      tips.push({ key: shifts === 1 ? 'hand.shiftOne' : 'hand.shift', params: { count: shifts, fret: first.fret, pos: first.pos } });
    }
    tips.push({ key: 'hand.press' });
  }

  // Mano que toca.
  const strings = new Set(notes.map((n) => n.string));
  if (instrument === 'nylon') {
    tips.push({ key: 'hand.pima', params: { seq: plucks.slice(0, FINGER_SEQ_MAX).join(' · ') + (plucks.length > FINGER_SEQ_MAX ? ' …' : '') } });
  } else if (instrument === 'bass') {
    tips.push({ key: 'hand.bassFingers' });
  } else {
    tips.push({ key: hasEighths ? 'hand.pickAlt' : 'hand.pickDown' });
  }
  if (strings.size > 1 && instrument !== 'nylon') tips.push({ key: 'hand.cross' });
  return { steps, positions, shifts, tips };
}

const STRING_ORDINAL = [6, 5, 4, 3, 2, 1];

/** Acorde por nombre, si es un acorde abierto del álbum. */
export function openShape(name: string): ChordShape | undefined {
  if (Object.prototype.hasOwnProperty.call(CHORDS, name)) return CHORDS[name as keyof typeof CHORDS];
  if (Object.prototype.hasOwnProperty.call(SEVENTHS, name)) return SEVENTHS[name as keyof typeof SEVENTHS];
  return undefined;
}

/** Los dedos de un acorde: [{ dedo, traste, cuerda }] del dedo 1 al 4. */
export function chordFingers(shape: ChordShape): { finger: number; fret: number; string: number }[] {
  return shape.fingers
    .map((finger, i) => ({ finger, fret: shape.frets[i], string: STRING_ORDINAL[i] }))
    .filter((x) => x.finger > 0 && x.fret > 0)
    .sort((a, b) => a.finger - b.finger);
}

/** Manos para un rasgueo: cómo armar el primer acorde, cómo cambiar y cómo se mueve el brazo. */
export function strumHands(chords: string[], pattern: Stroke[], instrument: HandInstrument): Tip[] {
  const tips: Tip[] = [];
  const named = [...new Set(chords)].map((c) => ({ name: c, shape: openShape(c) })).find((c) => c.shape);
  if (named?.shape) {
    const fingers = chordFingers(named.shape);
    if (fingers.length > 0) tips.push({ key: 'hand.chord', params: { chord: named.name, fingers: fingers.map((f) => f.finger).join(', ') } });
  }
  if (new Set(chords).size > 1) tips.push({ key: 'hand.chordChange' });
  tips.push({ key: instrument === 'nylon' ? 'hand.strumNylon' : 'hand.strumArm' });
  if (pattern.includes('-')) tips.push({ key: 'hand.strumAir' });
  return tips;
}

export function bendHands(): Tip[] {
  return [{ key: 'hand.bendWrist' }, { key: 'hand.bendThumb' }];
}

export function vibratoHands(instrument: HandInstrument): Tip[] {
  return [{ key: instrument === 'nylon' ? 'hand.vibratoNylon' : 'hand.vibratoWrist' }];
}

export function improvHands(instrument: HandInstrument): Tip[] {
  return [{ key: 'hand.improvBox' }, { key: instrument === 'nylon' ? 'hand.improvNylon' : instrument === 'bass' ? 'hand.bassFingers' : 'hand.pickAlt' }];
}
