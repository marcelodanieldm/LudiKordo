/**
 * Perfiles de instrumento: lo único que cambia entre la app de bajo (LudiKordo),
 * la de guitarra eléctrica y la de guitarra criolla. El resto del motor (lecciones, cancionero, audio,
 * progreso, suscripción) es común. Ver ADR 0009 y 0010.
 *
 * Lógica pura: sin React Native, con pruebas en tests/instruments.test.ts.
 */

/** `nylon` = guitarra criolla (cuerdas de nylon, sin ampli). */
export type InstrumentId = 'bass' | 'guitar' | 'nylon';

/** Cuerdas de los instrumentos. En guitarra, «E» es la 6.ª (grave) y «e» la 1.ª (aguda). */
export type StringId = 'E' | 'A' | 'D' | 'G' | 'B' | 'e';

export interface InstrumentString {
  /** Identificador único dentro del instrumento («E» grave y «e» aguda en guitarra). */
  id: StringId;
  /** Número tradicional de cuerda: 1 = la más aguda. */
  number: number;
  openMidi: number;
}

export interface InstrumentProfile {
  id: InstrumentId;
  /** Cuerdas de la más grave (índice 0) a la más aguda. */
  strings: readonly InstrumentString[];
  frets: number;
  /** Rango para el detector YIN (Hz): de un poco bajo la cuerda más grave al último traste de la más aguda. */
  pitchRangeHz: { min: number; max: number };
  /**
   * Transposición de los ejemplos sonoros para que se oigan en el parlante del
   * teléfono. El bajo sube una octava; la guitarra ya suena en ese registro.
   */
  listenTransposeSemitones: number;
  /**
   * Instrumento eléctrico: para los ejercicios «con instrumento» la app pide
   * tocar por el ampli (desenchufado casi no lo capta el micrófono).
   */
  amplified: boolean;
  /** Sonidos de ampli con los que se puede puntuar (la distorsión fuerte confunde a YIN). */
  scoredTones: readonly AmpTone[];
  /** Habilidades que solo existen en este instrumento; habilitan tipos de ejercicio. */
  techniques: readonly Technique[];
}

export type AmpTone = 'clean' | 'crunch';

export type Technique =
  | 'fingerstyle'
  | 'pick'
  | 'slap'
  | 'tapping'
  | 'palmMute'
  | 'chords'
  | 'strumming'
  | 'bending'
  | 'vibrato'
  | 'barreChords';

export const BASS: InstrumentProfile = {
  id: 'bass',
  strings: [
    { id: 'E', number: 4, openMidi: 28 }, // E1
    { id: 'A', number: 3, openMidi: 33 }, // A1
    { id: 'D', number: 2, openMidi: 38 }, // D2
    { id: 'G', number: 1, openMidi: 43 }, // G2
  ],
  frets: 20,
  pitchRangeHz: { min: 35, max: 450 },
  listenTransposeSemitones: 12,
  amplified: true,
  scoredTones: ['clean'],
  techniques: ['fingerstyle', 'pick', 'slap', 'tapping', 'palmMute'],
};

export const GUITAR: InstrumentProfile = {
  id: 'guitar',
  strings: [
    { id: 'E', number: 6, openMidi: 40 }, // E2 ≈ 82,41 Hz
    { id: 'A', number: 5, openMidi: 45 }, // A2 = 110 Hz
    { id: 'D', number: 4, openMidi: 50 }, // D3
    { id: 'G', number: 3, openMidi: 55 }, // G3
    { id: 'B', number: 2, openMidi: 59 }, // B3
    { id: 'e', number: 1, openMidi: 64 }, // E4 ≈ 329,63 Hz
  ],
  frets: 22,
  // Traste 22 de la 1.ª cuerda = D6 ≈ 1175 Hz; los bends suben hasta un tono más.
  pitchRangeHz: { min: 70, max: 1400 },
  listenTransposeSemitones: 0,
  amplified: true,
  // Crunch solo para power chords y palm mute, con la detección probada en ese sonido (ADR 0009).
  scoredTones: ['clean', 'crunch'],
  techniques: ['pick', 'tapping', 'palmMute', 'chords', 'strumming', 'bending', 'vibrato', 'barreChords'],
};

/**
 * Guitarra criolla (ADR 0010): misma afinación que la eléctrica, pero acústica y
 * con cuerdas de nylon. El micrófono la capta sin ampli; se toca con los dedos
 * (p-i-m-a) y rasgueada, sin púa. 19 trastes: el 12 es donde el mástil se une a la caja.
 */
export const NYLON: InstrumentProfile = {
  id: 'nylon',
  strings: GUITAR.strings,
  frets: 19,
  // Traste 19 de la 1.ª cuerda = B5 ≈ 988 Hz; el armónico del traste 12 en la 1.ª, E5 ≈ 659 Hz.
  pitchRangeHz: { min: 70, max: 1400 },
  listenTransposeSemitones: 0,
  amplified: false,
  scoredTones: ['clean'],
  techniques: ['fingerstyle', 'chords', 'strumming', 'barreChords', 'vibrato'],
};

export const PROFILES: Record<InstrumentId, InstrumentProfile> = { bass: BASS, guitar: GUITAR, nylon: NYLON };

/** Lee el instrumento de la configuración de build (`extra.instrument`); por defecto, bajo. */
export function resolveInstrument(value: unknown): InstrumentProfile {
  if (value === 'guitar') return GUITAR;
  if (value === 'nylon') return NYLON;
  return BASS;
}

/** Instrumentos de 6 cuerdas (eléctrica y criolla): comparten diapasón, tablatura, acordes y rasgueo. */
export function isSixString(profile: InstrumentProfile): boolean {
  return profile.strings.length === 6;
}

export function openMidiOf(profile: InstrumentProfile, stringId: StringId): number {
  const s = profile.strings.find((x) => x.id === stringId);
  if (!s) throw new Error(`La cuerda «${stringId}» no existe en ${profile.id}`);
  return s.openMidi;
}

export function midiOn(profile: InstrumentProfile, stringId: StringId, fret: number): number {
  if (fret < 0 || fret > profile.frets) throw new Error(`Traste ${fret} fuera de rango (0–${profile.frets})`);
  return openMidiOf(profile, stringId) + fret;
}

/**
 * Cuántos semitonos sube cada cuerda respecto de la anterior.
 * Bajo: 5 5 5. Guitarra: 5 5 5 4 5 (la 2.ª cuerda, Si, está a una tercera mayor).
 */
export function stringIntervals(profile: InstrumentProfile): number[] {
  return profile.strings.slice(1).map((s, i) => s.openMidi - profile.strings[i].openMidi);
}
