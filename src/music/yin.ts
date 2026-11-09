/**
 * Detección de altura con el algoritmo YIN (de Cheveigné y Kawahara, 2002).
 *
 * Esta versión en TypeScript es la referencia: se usa en las pruebas y como
 * respaldo. En el teléfono corre la versión nativa en Kotlin
 * (modules/pitch-detector), que implementa los mismos pasos.
 *
 * Para el Mi grave del bajo (41,2 Hz, período de 24 ms) hacen falta al menos
 * dos períodos en la ventana: 4.096 muestras a 44,1 kHz son 93 ms.
 */

export interface PitchResult {
  /** Frecuencia estimada en Hz, o null si no hay una nota clara. */
  freq: number | null;
  /** 0 a 1: qué tan periódica es la señal (1 = tono puro). */
  clarity: number;
}

export interface YinOptions {
  sampleRate: number;
  /** Umbral de la diferencia normalizada; 0,10–0,20 es lo habitual. */
  threshold?: number;
  minFreq?: number;
  maxFreq?: number;
}

export function detectPitch(buffer: Float32Array, opts: YinOptions): PitchResult {
  const { sampleRate } = opts;
  const threshold = opts.threshold ?? 0.15;
  const minFreq = opts.minFreq ?? 35; // un poco por debajo del Mi1
  const maxFreq = opts.maxFreq ?? 450; // traste 20 de la cuerda Sol ≈ 311 Hz, con margen

  const maxTau = Math.min(Math.floor(sampleRate / minFreq), Math.floor(buffer.length / 2));
  const minTau = Math.max(2, Math.floor(sampleRate / maxFreq));
  const W = buffer.length - maxTau;
  if (W <= 0) return { freq: null, clarity: 0 };

  // Silencio: no vale la pena analizar.
  let energy = 0;
  for (let i = 0; i < buffer.length; i++) energy += buffer[i] * buffer[i];
  if (energy / buffer.length < 1e-6) return { freq: null, clarity: 0 };

  // Paso 2: función de diferencia.
  const d = new Float32Array(maxTau + 1);
  for (let tau = 1; tau <= maxTau; tau++) {
    let sum = 0;
    for (let i = 0; i < W; i++) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    d[tau] = sum;
  }

  // Paso 3: diferencia normalizada acumulada.
  const cmnd = new Float32Array(maxTau + 1);
  cmnd[0] = 1;
  let running = 0;
  for (let tau = 1; tau <= maxTau; tau++) {
    running += d[tau];
    cmnd[tau] = running === 0 ? 1 : (d[tau] * tau) / running;
  }

  // Paso 4: primer mínimo por debajo del umbral.
  let tauEst = -1;
  for (let tau = minTau; tau <= maxTau; tau++) {
    if (cmnd[tau] < threshold) {
      while (tau + 1 <= maxTau && cmnd[tau + 1] < cmnd[tau]) tau++;
      tauEst = tau;
      break;
    }
  }
  if (tauEst === -1) return { freq: null, clarity: 0 };

  // Paso 5: interpolación parabólica para afinar el período.
  let betterTau = tauEst;
  if (tauEst > 1 && tauEst < maxTau) {
    const s0 = cmnd[tauEst - 1];
    const s1 = cmnd[tauEst];
    const s2 = cmnd[tauEst + 1];
    const denom = 2 * (2 * s1 - s2 - s0);
    if (denom !== 0) betterTau = tauEst + (s2 - s0) / denom;
  }

  return { freq: sampleRate / betterTau, clarity: Math.max(0, Math.min(1, 1 - cmnd[tauEst])) };
}
