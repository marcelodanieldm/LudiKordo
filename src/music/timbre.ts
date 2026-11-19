/**
 * Timbres sintetizados para los ejemplos sonoros (lógica pura).
 *
 * Sin grabaciones: cada timbre es una mezcla de osciladores básicos con una
 * envolvente. No pretende sonar como una guitarra grabada, sino que se oiga
 * clara la diferencia que enseña la lección: limpio vs crunch, pastilla del
 * mástil (oscura) vs del puente (brillante), nota apagada (palm mute).
 */
export type Tone = 'clean' | 'crunch' | 'lead' | 'neck' | 'bridge' | 'muted' | 'keys' | 'ebass';
export type OscType = 'sine' | 'triangle' | 'square' | 'sawtooth';

export interface VoicePartial {
  type: OscType;
  /** Desafinación en cents (para engrosar el crunch) o +1200 para una octava. */
  detune: number;
  gain: number;
}

export interface Voice {
  partials: VoicePartial[];
  /** Segundos hasta el pico. */
  attack: number;
  /**
   * 'pluck': cae desde el pico como una cuerda pulsada (hasta `maxRing` s).
   * 'sustain': se mantiene en `sustain` y cae al final de la nota (saturación).
   */
  envelope: 'pluck' | 'sustain';
  maxRing: number;
  sustain: number;
}

/** El tono suave de siempre (bajo): sube en 15 ms y cae hasta el final de la nota. */
export const LEGACY_VOICE: Voice = {
  partials: [{ type: 'triangle', detune: 0, gain: 0.45 }],
  attack: 0.015,
  envelope: 'pluck',
  maxRing: 8,
  sustain: 0,
};

export const VOICES: Record<Tone, Voice> = {
  clean: {
    partials: [
      { type: 'triangle', detune: 0, gain: 0.3 },
      { type: 'sawtooth', detune: 0, gain: 0.12 },
      { type: 'sine', detune: 1200, gain: 0.08 },
    ],
    attack: 0.006,
    envelope: 'pluck',
    maxRing: 1.8,
    sustain: 0,
  },
  neck: {
    partials: [
      { type: 'triangle', detune: 0, gain: 0.38 },
      { type: 'sine', detune: 0, gain: 0.18 },
    ],
    attack: 0.008,
    envelope: 'pluck',
    maxRing: 2,
    sustain: 0,
  },
  bridge: {
    partials: [
      { type: 'sawtooth', detune: 0, gain: 0.2 },
      { type: 'square', detune: 0, gain: 0.07 },
      { type: 'sawtooth', detune: 1200, gain: 0.05 },
    ],
    attack: 0.004,
    envelope: 'pluck',
    maxRing: 1.4,
    sustain: 0,
  },
  crunch: {
    partials: [
      { type: 'square', detune: -8, gain: 0.12 },
      { type: 'sawtooth', detune: 8, gain: 0.12 },
      { type: 'square', detune: 1200, gain: 0.04 },
    ],
    attack: 0.005,
    envelope: 'sustain',
    maxRing: 4,
    sustain: 0.8,
  },
  // Distorsión (nivel 4): más parciales ásperos y más sostenido que el crunch.
  lead: {
    partials: [
      { type: 'sawtooth', detune: -12, gain: 0.13 },
      { type: 'square', detune: 12, gain: 0.11 },
      { type: 'sawtooth', detune: 1200, gain: 0.06 },
      { type: 'square', detune: 1902, gain: 0.03 },
    ],
    attack: 0.004,
    envelope: 'sustain',
    maxRing: 6,
    sustain: 0.92,
  },
  // Acompañamiento de la práctica: piano eléctrico (fundamental redonda y un brillo de octava).
  keys: {
    partials: [
      { type: 'sine', detune: 0, gain: 0.4 },
      { type: 'sine', detune: 1200, gain: 0.12 },
      { type: 'triangle', detune: 1902, gain: 0.04 },
    ],
    attack: 0.006,
    envelope: 'pluck',
    maxRing: 2.5,
    sustain: 0,
  },
  // Bajo eléctrico del acompañamiento: grave y redondo, con un poco de ataque.
  ebass: {
    partials: [
      { type: 'triangle', detune: 0, gain: 0.45 },
      { type: 'sine', detune: 1200, gain: 0.1 },
      { type: 'square', detune: 0, gain: 0.03 },
    ],
    attack: 0.01,
    envelope: 'pluck',
    maxRing: 1.6,
    sustain: 0,
  },
  muted: {
    partials: [
      { type: 'triangle', detune: 0, gain: 0.4 },
      { type: 'square', detune: 0, gain: 0.05 },
    ],
    attack: 0.004,
    envelope: 'pluck',
    maxRing: 0.14,
    sustain: 0,
  },
};

/** Voz de un ejemplo: la pedida, o la del instrumento (guitarra → limpio; bajo → tono suave). */
export function voiceFor(tone: Tone | undefined, guitar: boolean): Voice {
  if (tone) return VOICES[tone];
  return guitar ? VOICES.clean : LEGACY_VOICE;
}

/** Cuánto suena de verdad una nota: su duración, salvo que la cuerda se apague antes. */
export function ringSec(voice: Voice, durSec: number): number {
  const d = Math.max(0.08, durSec);
  return voice.envelope === 'pluck' ? Math.min(d, voice.maxRing) : d;
}

/** Ganancia total de una voz (para que ningún timbre sature la salida). */
export function peakGain(voice: Voice): number {
  return voice.partials.reduce((a, p) => a + p.gain, 0);
}
