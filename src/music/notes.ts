/**
 * Teoría básica del instrumento de esta build en afinación estándar:
 * bajo E1 A1 D2 G2, guitarra E2 A2 D3 G3 B3 E4 (src/instruments/profiles.ts).
 * Todo en MIDI para que la conversión a frecuencia y nombre sea exacta.
 */
import { INSTRUMENT } from '../instruments/current';
import type { InstrumentString, StringId } from '../instruments/profiles';

export type { StringId } from '../instruments/profiles';

export type Locale = 'en' | 'es' | 'pt';
export type Notation = 'letters' | 'solfege' | 'both';

/** Cuerdas de la más grave (índice 0) a la más aguda, del instrumento de esta build. */
export const STRINGS: readonly InstrumentString[] = INSTRUMENT.strings;

const LETTERS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const SOLFEGE_ES = ['Do', 'Do♯', 'Re', 'Re♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];
const SOLFEGE_PT = ['Dó', 'Dó♯', 'Ré', 'Ré♯', 'Mi', 'Fá', 'Fá♯', 'Sol', 'Sol♯', 'Lá', 'Lá♯', 'Si'];

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function freqToMidi(freq: number): number {
  return 69 + 12 * Math.log2(freq / 440);
}

/** Diferencia en cents entre una frecuencia medida y una nota objetivo (MIDI). */
export function centsOff(freq: number, targetMidi: number): number {
  return 1200 * Math.log2(freq / midiToFreq(targetMidi));
}

export function stringIndex(id: StringId): number {
  return STRINGS.findIndex((s) => s.id === id);
}

export function midiAt(string: StringId, fret: number): number {
  const i = stringIndex(string);
  if (i < 0) throw new Error(`La cuerda «${string}» no existe en este instrumento`);
  return STRINGS[i].openMidi + fret;
}

export function octaveOf(midi: number): number {
  return Math.floor(midi / 12) - 1;
}

/**
 * Nombre de una nota según el idioma y la preferencia de notación.
 * En inglés siempre se usan letras; en es/pt el modo 'both' da «Mi (E)».
 */
export function noteName(midi: number, locale: Locale, notation: Notation = 'both', withOctave = false): string {
  const pc = ((midi % 12) + 12) % 12;
  const letter = LETTERS[pc] + (withOctave ? String(octaveOf(midi)) : '');
  if (locale === 'en' || notation === 'letters') return letter;
  const sol = (locale === 'pt' ? SOLFEGE_PT : SOLFEGE_ES)[pc];
  return notation === 'solfege' ? sol : `${sol} (${letter})`;
}

/** Frecuencia de cada cuerda al aire, para el afinador. */
export function openStringFreqs(): Partial<Record<StringId, number>> {
  return Object.fromEntries(STRINGS.map((s) => [s.id, midiToFreq(s.openMidi)]));
}

const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/**
 * Nombre de nota para una opción literal de ejercicio escrita en letras («E»,
 * «F♯»), según idioma y notación del alumno. Devuelve null si no es una nota.
 */
export function letterNoteLabel(text: string, locale: Locale, notation: Notation): string | null {
  const m = /^([A-G])(♯)?$/.exec(text);
  if (!m) return null;
  const pc = (LETTER_PC[m[1]] + (m[2] ? 1 : 0)) % 12;
  return noteName(24 + pc, locale, notation);
}
