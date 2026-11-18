/**
 * Efectos de los ejemplos sonoros (lógica pura), para el módulo 4.9.
 *
 * Sin nodos de efecto: cada efecto se arma con copias de las notas, que el
 * motor ya sabe tocar. No suena como un pedal de estudio, pero se oye clara la
 * idea que enseña la lección:
 * - delay: la frase se repite atrás, cada vez más bajo;
 * - reverb: muchas copias muy cercanas y suaves que dejan una cola de ambiente;
 * - chorus: una segunda voz apenas desafinada y ondulante, que engorda la nota.
 */
import type { ScheduledNote } from './listen';

export interface Fx {
  /** Tiempo entre repeticiones (ms), cuántas repeticiones y cuánto baja cada una (0–1). */
  delay?: { ms: number; repeats: number; feedback: number };
  /** Tamaño del ambiente, de 0 (nada) a 1 (sala grande). */
  reverb?: number;
  chorus?: boolean;
}

/** Retardos (ms) de las primeras reflexiones de la reverb, para un tamaño 1. */
const REVERB_TAPS_MS = [31, 67, 113, 173];
/** Volumen de la primera reflexión, para un tamaño 1. */
const REVERB_LEVEL = 0.38;
/** Cuánto se estira cada reflexión (la cola dura más que la nota). */
const REVERB_STRETCH = 1.6;
const CHORUS_DETUNE_CENTS = 14;
const CHORUS_WOBBLE_CENTS = 9;

export function applyFx(notes: ScheduledNote[], fx: Fx | undefined): ScheduledNote[] {
  if (!fx) return notes;
  let out = notes;
  if (fx.chorus) {
    out = out.flatMap((n) => [
      { ...n, level: (n.level ?? 1) * 0.75 },
      { ...n, level: (n.level ?? 1) * 0.55, detuneCents: CHORUS_DETUNE_CENTS, vibratoCents: n.vibratoCents ?? CHORUS_WOBBLE_CENTS },
    ]);
  }
  // La reverb se arma sobre la señal sin ecos: sumarla a cada eco multiplicaría las notas (y los osciladores).
  const beforeDelay = out;
  if (fx.delay) {
    const { ms, repeats, feedback } = fx.delay;
    const dry = out;
    for (let r = 1; r <= repeats; r++) {
      out = out.concat(dry.map((n) => ({ ...n, startSec: n.startSec + (r * ms) / 1000, level: (n.level ?? 1) * feedback ** r })));
    }
  }
  if (fx.reverb && fx.reverb > 0) {
    const size = Math.min(1, fx.reverb);
    const dry = beforeDelay;
    REVERB_TAPS_MS.forEach((tap, i) => {
      out = out.concat(
        dry.map((n) => ({
          ...n,
          startSec: n.startSec + (tap * (0.5 + size)) / 1000,
          durSec: n.durSec * REVERB_STRETCH,
          level: (n.level ?? 1) * REVERB_LEVEL * size * 0.8 ** i,
        })),
      );
    });
  }
  return out;
}

