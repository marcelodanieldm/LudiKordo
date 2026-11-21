/**
 * Utilidades para escribir lecciones de guitarra criolla como datos. Las alturas
 * se calculan con el perfil de criolla (no con el instrumento activo) para que
 * las pruebas de Node, que corren como bajo, las validen igual.
 */
import type { Beats, ListenExample, ScoreEvent } from '../types';
import type { StringId } from '../../instruments/profiles';
import { NYLON, midiOn } from '../../instruments/profiles';
import { midiToFreq } from '../../music/notes';

export const k = (lesson: string, key: string) => `content.n.l${lesson.replace(/\./g, '')}.${key}`;
export const scenes = (lesson: string) => [1, 2, 3, 4].map((n) => k(lesson, `s${n}`));
export const hz = (s: StringId, fret = 0) => midiToFreq(midiOn(NYLON, s, fret));

/** Las 6 cuerdas de la 6.ª (grave) a la 1.ª (aguda). */
export const LOW_TO_HIGH: StringId[] = ['E', 'A', 'D', 'G', 'B', 'e'];
/** Graves entorchadas (las toca el pulgar) y agudas de nylon (índice, medio y anular). */
export const BASS_STRINGS: StringId[] = ['E', 'A', 'D'];
export const TREBLE_STRINGS: StringId[] = ['G', 'B', 'e'];

/** Nota de partitura: cuerda, traste y duración (1 = negra por defecto). */
export const n = (s: StringId, fret: number, beats: Beats = 1): ScoreEvent => ({ string: s, fret, beats });
export const open = (s: StringId, beats: Beats = 1): ScoreEvent => n(s, 0, beats);
export const times = (s: StringId, count: number, fret = 0) => Array.from({ length: count }, () => ({ string: s, fret }));

/** Notas a tocar (sin silencios) de una partitura, en el formato de `playAlong.notes`. */
export function notesOf(score: ScoreEvent[]): { string: StringId; fret: number; beats?: 1 | 2 | 4 }[] {
  return score.flatMap((e) => {
    if ('rest' in e) return [];
    if (e.beats === 0.5) throw new Error('playAlong.notes no admite corcheas: usar `score`');
    return [{ string: e.string, fret: e.fret, ...(e.beats === 1 ? {} : { beats: e.beats }) }];
  });
}

/** Ejemplo sonoro de una partitura (tablatura y timbre de nylon por defecto). */
export const listen = (events: ScoreEvent[], bpm: number, extra: Partial<ListenExample> = {}): ListenExample => ({ events, bpm, show: 'tab', tone: 'nylon', ...extra });

/** Ejemplo sonoro sin dibujo (solo el botón «Escuchar»), con timbre de nylon por defecto. */
export const hear = (events: ScoreEvent[], bpm: number, extra: Partial<ListenExample> = {}): ListenExample => ({ events, bpm, tone: 'nylon', ...extra });
