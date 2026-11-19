/**
 * Acompañamiento de la práctica (lógica pura): batería, bajo o guitarra y teclado
 * siguiendo el cifrado, en el estilo elegido. Todo se programa de antemano en el
 * reloj de audio, después de la cuenta previa.
 */
import { IS_GUITAR } from '../instruments/current';
import { chordFromName } from './chords';
import { drumSchedule, type DrumHit, type DrumStyle } from './drums';
import type { ScheduledNote } from './listen';
import { midiToFreq } from './notes';
import { BALLAD, DOWN_EIGHTHS, EIGHTHS, HALVES, QUARTERS, strumSchedule, type Stroke } from './strum';
import type { Tone } from './timbre';

export type JamPart = 'drums' | 'bass' | 'guitar' | 'keys';

/** Lo que acompaña a cada app: nunca el mismo instrumento que toca el alumno. */
export const JAM_PARTS: readonly JamPart[] = IS_GUITAR ? ['drums', 'bass', 'keys'] : ['drums', 'guitar', 'keys'];

/** Volumen de cada parte: la batería marca, el resto queda debajo del alumno. */
export const PART_LEVEL: Record<JamPart, number> = { drums: 1, bass: 0.55, guitar: 0.32, keys: 0.28 };

/** [pulso dentro del compás, intervalo desde la tónica, duración en pulsos]. 'third' y 'next' se resuelven por acorde. */
type BassStep = [number, number | 'third' | 'next', number];

const BASS: Record<DrumStyle, BassStep[]> = {
  rock: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((b) => [b, 0, 0.45] as BassStep),
  pop: [[0, 0, 1], [1, 0, 0.5], [1.5, 0, 0.5], [2, 7, 1], [3, 0, 1]],
  funk: [[0, 0, 0.25], [0.75, 12, 0.25], [1.5, 0, 0.25], [2.5, 7, 0.25], [3, 12, 0.25], [3.5, 10, 0.25]],
  ballad: [[0, 0, 2], [2, 7, 2]],
  shuffle: [[0, 0, 1], [1, 7, 1], [2, 9, 1], [3, 7, 1]],
  // Walking: tónica, tercera, quinta y una nota de paso hacia la tónica del próximo acorde.
  jazz: [[0, 0, 1], [1, 'third', 1], [2, 7, 1], [3, 'next', 1]],
  soul: [[0, 0, 1.5], [1.5, 0, 0.5], [2, 7, 1], [3, 12, 0.5], [3.5, 7, 0.5]],
  // One drop: el bajo deja el 1 vacío.
  reggae: [[1, 0, 0.5], [1.5, 0, 0.5], [2, 7, 1], [3, 0, 1]],
  bossa: [[0, 0, 1.5], [1.5, 7, 0.5], [2, 7, 1.5], [3.5, 0, 0.5]],
};

/** [pulso, duración] de los acordes del teclado. */
const KEYS: Record<DrumStyle, [number, number][]> = {
  rock: [[0, 4]],
  pop: [[0, 2], [2, 2]],
  funk: [[0.5, 0.25], [1.75, 0.25], [2.5, 0.25], [3.5, 0.25]],
  ballad: [[0, 4]],
  shuffle: [[1, 0.5], [3, 0.5]],
  // Comping «charleston»: en el 1 y en la corchea antes del 2.
  jazz: [[0, 0.75], [1.5, 0.75]],
  soul: [[0, 1.5], [1.5, 1], [2.5, 1.5]],
  // Skank: acordes cortos en el «y» de cada tiempo.
  reggae: [[0.5, 0.25], [1.5, 0.25], [2.5, 0.25], [3.5, 0.25]],
  bossa: [[0, 0.5], [1.5, 0.5], [2.5, 0.5], [3.5, 0.5]],
};

const GUITAR: Record<DrumStyle, { pattern: Stroke[]; tone: Tone }> = {
  rock: { pattern: DOWN_EIGHTHS, tone: 'crunch' },
  pop: { pattern: BALLAD, tone: 'clean' },
  funk: { pattern: EIGHTHS, tone: 'muted' },
  ballad: { pattern: HALVES, tone: 'clean' },
  shuffle: { pattern: QUARTERS, tone: 'clean' },
  jazz: { pattern: HALVES, tone: 'neck' },
  soul: { pattern: BALLAD, tone: 'clean' },
  reggae: { pattern: ['-', 'D', '-', 'D', '-', 'D', '-', 'D'], tone: 'muted' },
  bossa: { pattern: ['D', '-', '-', 'D', '-', 'D', '-', 'D'], tone: 'clean' },
};

export interface JamOptions {
  /** Un acorde por compás (cifrado americano); dos separados por espacio cambian en el tercer tiempo. */
  chords: string[];
  bpm: number;
  style: DrumStyle;
  /** Vueltas del cifrado. */
  loops: number;
  parts: readonly JamPart[];
  /** Pulsos de cuenta previa antes del primer compás. */
  countIn: number;
}

export interface JamSchedule {
  notes: ScheduledNote[];
  drums: DrumHit[];
  /** Pulsos que dura la música, sin la cuenta. */
  bodyBeats: number;
  lengthSec: number;
}

const voicing = (name: string) => chordFromName(name) ?? [45, 52, 57];

export function jamSchedule(o: JamOptions): JamSchedule {
  const bars = o.chords.length * o.loops;
  const beatSec = 60 / o.bpm;
  const at = (bar: number, beat: number) => (o.countIn + bar * 4 + beat) * beatSec;
  /** El acorde que suena en un pulso del compás (con dos, el segundo desde el tercer tiempo). */
  const chordOf = (bar: number, beat = 0) => {
    const parts = o.chords[bar % o.chords.length].trim().split(/\s+/);
    return parts[beat >= 2 && parts.length > 1 ? 1 : 0];
  };
  const notes: ScheduledNote[] = [];

  if (o.parts.includes('bass')) {
    for (let bar = 0; bar < bars; bar++) {
      for (const [beat, iv, dur] of BASS[o.style]) {
        const v = voicing(chordOf(bar, beat));
        const root = v[0];
        const third = v[v.length - 1] - 12;
        const next = voicing(chordOf(bar + 1))[0];
        const midi = iv === 'third' ? third : iv === 'next' ? next + (next > root ? -1 : 1) : root + iv;
        notes.push({ freq: midiToFreq(midi), startSec: at(bar, beat), durSec: dur * beatSec, tone: 'ebass', level: PART_LEVEL.bass });
      }
    }
  }
  if (o.parts.includes('keys')) {
    for (let bar = 0; bar < bars; bar++) {
      for (const [beat, dur] of KEYS[o.style]) {
        // Sin la tónica grave (la toca el bajo): el resto del acorde, una octava más arriba.
        const v = voicing(chordOf(bar, beat)).slice(1).map((m) => m + 12);
        for (const m of v) notes.push({ freq: midiToFreq(m), startSec: at(bar, beat), durSec: dur * beatSec, tone: 'keys', level: PART_LEVEL.keys });
      }
    }
  }
  if (o.parts.includes('guitar')) {
    const g = GUITAR[o.style];
    // Dos rasgueos (primer y segundo acorde de cada compás) y de cada uno se toma su mitad.
    const first = strumSchedule(Array.from({ length: bars }, (_, bar) => voicing(chordOf(bar, 0))), g.pattern, o.bpm, o.countIn);
    const second = strumSchedule(Array.from({ length: bars }, (_, bar) => voicing(chordOf(bar, 2))), g.pattern, o.bpm, o.countIn);
    const halfOf = (sec: number) => Math.floor((sec / beatSec - o.countIn) / 2) % 2;
    for (const n of [...first.filter((x) => halfOf(x.startSec) === 0), ...second.filter((x) => halfOf(x.startSec) === 1)]) notes.push({ ...n, tone: g.tone, level: PART_LEVEL.guitar });
  }
  const drums = o.parts.includes('drums') ? drumSchedule(o.style, bars, o.bpm, o.countIn) : [];
  const bodyBeats = bars * 4;
  return { notes, drums, bodyBeats, lengthSec: (o.countIn + bodyBeats) * beatSec };
}
