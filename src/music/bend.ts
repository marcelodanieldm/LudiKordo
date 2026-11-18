/**
 * Bends y vibrato (lógica pura), a partir de la altura continua del micrófono.
 *
 * Bend: se toca la nota de partida, se empuja la cuerda hasta la nota de
 * llegada (½ o 1 tono) y se sostiene. Opcionalmente se suelta y vuelve.
 * Vibrato: oscilación regular de la altura alrededor de la nota.
 */
import { centsOff } from './notes';

// ───────────── Bend ─────────────

export interface BendSpec {
  /** Nota de partida (MIDI). */
  startMidi: number;
  /** ½ tono = 1, 1 tono = 2. */
  semitones: 1 | 2;
  /** Si además hay que soltar y volver a la nota de partida. */
  release?: boolean;
}

export type BendPhase = 'waitStart' | 'bending' | 'release';

export interface BendState {
  phase: BendPhase;
  /** Cents arriba de la nota de partida (null sin altura). */
  rel: number | null;
  /** Lo más alto que llegó en este intento, en cents. */
  peak: number;
  /** Cuadros seguidos dentro de la tolerancia de la nota de llegada. */
  held: number;
  reps: number;
  /** Intentos que no llegaron (quedaron cortos) o se pasaron, para el consejo. */
  short: number;
  over: number;
}

/** Tolerancia de afinación de la nota de llegada (un bend real nunca es perfecto). */
export const BEND_TOLERANCE_CENTS = 25;
/** Cuadros sosteniendo la nota de llegada (~43 cuadros por segundo): ≈ 0,2 s. */
export const BEND_HOLD_FRAMES = 8;
/** Cerca de la nota de partida: para empezar un intento o para dar por soltado el bend. */
export const START_WINDOW_CENTS = 40;

export function initialBend(): BendState {
  return { phase: 'waitStart', rel: null, peak: 0, held: 0, reps: 0, short: 0, over: 0 };
}

/** Avanza con un cuadro de altura (o null si no hay nota). */
export function stepBend(spec: BendSpec, s: BendState, freq: number | null): BendState {
  if (freq === null) {
    // Silencio: si estaba empujando y no llegó, cuenta como corto (o pasado).
    if (s.phase === 'bending' && s.peak > 30) {
      const target = spec.semitones * 100;
      return { ...initialBend(), reps: s.reps, short: s.short + (s.peak < target - BEND_TOLERANCE_CENTS ? 1 : 0), over: s.over + (s.peak > target + BEND_TOLERANCE_CENTS ? 1 : 0) };
    }
    // Si se apagó mientras soltaba, el intento no cuenta: hay que volver con la nota sonando.
    return s.phase === 'release' ? { ...initialBend(), reps: s.reps, short: s.short, over: s.over } : { ...s, rel: null, held: 0, phase: 'waitStart' };
  }
  const rel = centsOff(freq, spec.startMidi);
  const target = spec.semitones * 100;
  switch (s.phase) {
    case 'waitStart':
      return Math.abs(rel) <= START_WINDOW_CENTS ? { ...s, phase: 'bending', rel, peak: 0, held: 0 } : { ...s, rel };
    case 'bending': {
      const peak = Math.max(s.peak, rel);
      const inTarget = Math.abs(rel - target) <= BEND_TOLERANCE_CENTS;
      const held = inTarget ? s.held + 1 : 0;
      if (held >= BEND_HOLD_FRAMES) {
        if (spec.release) return { ...s, phase: 'release', rel, peak, held: 0 };
        return { ...s, phase: 'waitStart', rel, peak: 0, held: 0, reps: s.reps + 1, short: 0, over: 0 };
      }
      // Volvió a la nota de partida sin llegar: intento corto o pasado.
      if (s.peak > 30 && rel < 20) {
        return { ...s, phase: 'bending', rel, peak: 0, held: 0, short: s.short + (s.peak < target - BEND_TOLERANCE_CENTS ? 1 : 0), over: s.over + (s.peak > target + BEND_TOLERANCE_CENTS ? 1 : 0) };
      }
      return { ...s, rel, peak, held };
    }
    case 'release':
      return Math.abs(rel) <= START_WINDOW_CENTS ? { ...s, phase: 'waitStart', rel, peak: 0, held: 0, reps: s.reps + 1, short: 0, over: 0 } : { ...s, rel };
  }
}

/** Consejo después de varios intentos que no llegaron. */
export function bendAdvice(s: BendState): 'short' | 'over' | null {
  if (s.short === 0 && s.over === 0) return null;
  return s.short >= s.over ? 'short' : 'over';
}

// ───────────── Vibrato ─────────────

export interface PitchSample {
  tMs: number;
  /** Cents respecto de la nota objetivo. */
  cents: number;
}

export interface VibratoResult {
  /** Oscilaciones por segundo. */
  rateHz: number;
  /** Ancho medio (de la nota hacia cada lado), en cents. */
  depthCents: number;
  /** Variación de la duración de cada medio ciclo (0 = perfecto). */
  irregularity: number;
}

/**
 * Mide un vibrato: resta la media móvil (≈ 300 ms) para quedarse con la
 * oscilación, cuenta los cruces por cero y toma el pico de cada medio ciclo.
 */
export function analyzeVibrato(samples: PitchSample[]): VibratoResult | null {
  if (samples.length < 12) return null;
  const dur = samples[samples.length - 1].tMs - samples[0].tMs;
  if (dur < 500) return null;
  const dev = samples.map((s) => {
    const win = samples.filter((o) => Math.abs(o.tMs - s.tMs) <= 150);
    return s.cents - win.reduce((a, o) => a + o.cents, 0) / win.length;
  });
  const crossings: number[] = [];
  for (let i = 1; i < dev.length; i++) if (Math.sign(dev[i]) !== Math.sign(dev[i - 1]) && dev[i] !== 0) crossings.push(i);
  if (crossings.length < 3) return { rateHz: 0, depthCents: 0, irregularity: 1 };
  const halves: { len: number; peak: number }[] = [];
  for (let c = 1; c < crossings.length; c++) {
    const a = crossings[c - 1];
    const b = crossings[c];
    let peak = 0;
    for (let i = a; i < b; i++) peak = Math.max(peak, Math.abs(dev[i]));
    halves.push({ len: samples[b].tMs - samples[a].tMs, peak });
  }
  const span = samples[crossings[crossings.length - 1]].tMs - samples[crossings[0]].tMs;
  const rateHz = halves.length / 2 / (span / 1000);
  const depthCents = halves.reduce((a, h) => a + h.peak, 0) / halves.length;
  const meanLen = halves.reduce((a, h) => a + h.len, 0) / halves.length;
  const sd = Math.sqrt(halves.reduce((a, h) => a + (h.len - meanLen) ** 2, 0) / halves.length);
  return { rateHz, depthCents, irregularity: meanLen ? sd / meanLen : 1 };
}

export const VIBRATO_RATE = { min: 3, max: 8 };
/**
 * El detector mira ventanas de ~93 ms: eso suaviza la oscilación y el ancho
 * medido sale menor que el real (un vibrato de ±30 cents se mide como ±20).
 * Los anchos mínimos de las lecciones están pensados sobre el valor medido.
 */
export const DETECTOR_WINDOW_MS = 93;
export const VIBRATO_MAX_IRREGULARITY = 0.45;

export function vibratoOk(r: VibratoResult | null, minDepth: number): boolean {
  return !!r && r.rateHz >= VIBRATO_RATE.min && r.rateHz <= VIBRATO_RATE.max && r.depthCents >= minDepth && r.irregularity <= VIBRATO_MAX_IRREGULARITY;
}

/**
 * Puntaje de un vibrato largo: se mide en ventanas de 1 s que avanzan de a
 * medio segundo; la precisión es la parte de las ventanas con vibrato válido.
 */
export function scoreVibrato(samples: PitchSample[], minDepth: number): { accuracy: number; overall: VibratoResult | null } {
  if (samples.length === 0) return { accuracy: 0, overall: null };
  const t0 = samples[0].tMs;
  const t1 = samples[samples.length - 1].tMs;
  let ok = 0;
  let total = 0;
  for (let w = t0; w + 1000 <= t1 + 1; w += 500) {
    total += 1;
    if (vibratoOk(analyzeVibrato(samples.filter((s) => s.tMs >= w && s.tMs < w + 1000)), minDepth)) ok += 1;
  }
  return { accuracy: total ? ok / total : 0, overall: analyzeVibrato(samples) };
}
