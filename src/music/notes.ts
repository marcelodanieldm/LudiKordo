/**
 * Teoría básica para un bajo de 4 cuerdas en afinación estándar (E1 A1 D2 G2).
 * Todo en MIDI para que la conversión a frecuencia y nombre sea exacta.
 */

export type Locale = 'en' | 'es' | 'pt';
export type Notation = 'letters' | 'solfege' | 'both';

/** Cuerdas de la más grave (índice 0, la 4ª cuerda) a la más aguda. */
export const STRINGS = [
  { id: 'E', number: 4, openMidi: 28 }, // E1 ≈ 41,20 Hz
  { id: 'A', number: 3, openMidi: 33 }, // A1 = 55 Hz
  { id: 'D', number: 2, openMidi: 38 }, // D2 ≈ 73,42 Hz
  { id: 'G', number: 1, openMidi: 43 }, // G2 ≈ 98,00 Hz
] as const;

export type StringId = (typeof STRINGS)[number]['id'];

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
  return STRINGS[stringIndex(string)].openMidi + fret;
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
export function openStringFreqs(): Record<StringId, number> {
  return {
    E: midiToFreq(28),
    A: midiToFreq(33),
    D: midiToFreq(38),
    G: midiToFreq(43),
  };
}
