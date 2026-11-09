/**
 * Audio de baja latencia con react-native-audio-api (API estilo Web Audio):
 * metrónomo con tiempos programados y tonos de referencia para el oído.
 */
import { AudioContext } from 'react-native-audio-api';

let ctx: AudioContext | null = null;
function context(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

/** Tiempo actual del reloj de audio, en ms. Sirve para medir ataques. */
export function nowMs(): number {
  return context().currentTime * 1000;
}

function click(at: number, accent: boolean) {
  const c = context();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.frequency.value = accent ? 1600 : 1000;
  gain.gain.setValueAtTime(0.6, at);
  gain.gain.exponentialRampToValueAtTime(0.001, at + 0.05);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(at);
  osc.stop(at + 0.06);
}

export interface MetronomeHandle {
  /** Momento (ms, reloj de audio) del primer pulso después de la cuenta. */
  startMs: number;
  stop: () => void;
}

/**
 * Programa `countIn` pulsos de cuenta y `beats` pulsos del ejercicio.
 * Programar todo por adelantado evita el jitter de los timers de JavaScript.
 */
export function startMetronome(bpm: number, beats: number, countIn = 4, beatsPerBar = 4): MetronomeHandle {
  const c = context();
  const step = 60 / bpm;
  const t0 = c.currentTime + 0.15;
  const total = countIn + beats;
  for (let i = 0; i < total; i++) click(t0 + i * step, i % beatsPerBar === 0);
  let stopped = false;
  return {
    startMs: (t0 + countIn * step) * 1000,
    stop: () => {
      if (stopped) return;
      stopped = true;
      // Cerrar y recrear el contexto corta los clics ya programados.
      void c.close();
      ctx = null;
    },
  };
}

/** Toca un tono suave de referencia (oído, afinación). */
export function playTone(freq: number, durationSec = 1.2, delaySec = 0): Promise<void> {
  const c = context();
  const at = c.currentTime + 0.05 + delaySec;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(0.5, at + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, at + durationSec);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(at);
  osc.stop(at + durationSec);
  return new Promise((resolve) => setTimeout(resolve, (0.05 + delaySec + durationSec) * 1000));
}

/** Toca varios tonos en secuencia, con una pausa corta entre ellos. */
export async function playTones(freqs: number[]): Promise<void> {
  for (const f of freqs) await playTone(f, 1, 0.15);
}
