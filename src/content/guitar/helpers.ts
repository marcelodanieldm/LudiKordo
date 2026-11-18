/**
 * Utilidades para escribir lecciones de guitarra como datos. Las alturas se
 * calculan con el perfil de guitarra (no con el instrumento activo) para que
 * las pruebas de Node, que corren como bajo, las validen igual.
 */
import type { Beats, ListenExample, ScoreEvent, TabNote } from '../types';
import type { StringId } from '../../instruments/profiles';
import { GUITAR, midiOn } from '../../instruments/profiles';
import { midiToFreq } from '../../music/notes';
import { CHORDS, chordMidi, type ChordId } from '../../music/chords';
import type { Stroke } from '../../music/strum';

export const k = (lesson: string, key: string) => `content.g.l${lesson.replace(/\./g, '')}.${key}`;
export const scenes = (lesson: string) => [1, 2, 3, 4].map((n) => k(lesson, `s${n}`));
export const hz = (s: StringId, fret = 0) => midiToFreq(midiOn(GUITAR, s, fret));

/** Las 6 cuerdas de la 6.ª (grave) a la 1.ª (aguda). */
export const LOW_TO_HIGH: StringId[] = ['E', 'A', 'D', 'G', 'B', 'e'];

/** Nota de partitura: cuerda, traste y duración (1 = negra por defecto). */
export const n = (s: StringId, fret: number, beats: Beats = 1): ScoreEvent => ({ string: s, fret, beats });
export const rest = (beats: Beats = 1): ScoreEvent => ({ rest: true, beats });

/** Notas a tocar (sin silencios) de una partitura, en el formato de `playAlong.notes`. */
export function notesOf(score: ScoreEvent[]): { string: StringId; fret: number }[] {
  return score.flatMap((e) => ('rest' in e ? [] : [{ string: e.string, fret: e.fret }]));
}

/** Partitura sin silencios ni corcheas → notas de tablatura (para `tabReading`). */
export function tabOf(score: ScoreEvent[]): TabNote[] {
  return score.map((e) => {
    if ('rest' in e || e.beats === 0.5) throw new Error('tabReading solo admite negras, blancas y redondas');
    return { string: e.string, fret: e.fret, beats: e.beats };
  });
}

/** Cromático 1-2-3-4 en una cuerda (y de vuelta, 4-3-2-1). */
export const spider = (s: StringId) => [1, 2, 3, 4].map((fret) => ({ string: s, fret }));
export const spiderDown = (s: StringId) => [4, 3, 2, 1].map((fret) => ({ string: s, fret }));

/** Ejemplo sonoro de una partitura. */
export const listen = (events: ScoreEvent[], bpm: number, extra: Partial<ListenExample> = {}): ListenExample => ({ events, bpm, ...extra });

/** Total de pulsos de una partitura. */
export const beatsOf = (score: ScoreEvent[]) => score.reduce((a, e) => a + e.beats, 0);

// ───────────── Acordes ─────────────


const GUITAR_STRING_IDS: StringId[] = ['E', 'A', 'D', 'G', 'B', 'e'];

/** Las notas de un acorde de grave a agudo (cuerdas que suenan), para tocarlas de a una. */
export function chordArp(id: ChordId): { string: StringId; fret: number }[] {
  return CHORDS[id].frets.flatMap((f, i) => (f < 0 ? [] : [{ string: GUITAR_STRING_IDS[i], fret: f }]));
}

/** Las notas pisadas de un acorde (para tocarlas en el diapasón virtual). */
export function chordFretted(id: ChordId): { string: StringId; fret: number }[] {
  return chordArp(id).filter((n) => n.fret > 0);
}

/** Ejemplo sonoro rasgueado: un acorde por compás. */
export function strumListen(chords: (ChordId | number[])[], pattern: Stroke[], bpm: number, extra: Partial<ListenExample> = {}): ListenExample {
  return { events: [], bpm, strum: { chords: chords.map((c) => (Array.isArray(c) ? c : chordMidi(c))), pattern }, ...extra };
}
