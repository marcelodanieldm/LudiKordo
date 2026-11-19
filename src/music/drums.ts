/**
 * Batería sintetizada para el acompañamiento de la práctica (lógica pura).
 * Cada estilo es un compás de 4/4 dividido en pasos: 16 (semicorcheas) para los
 * estilos rectos y 12 (tresillos de corchea) para los que van con swing.
 * El motor (src/audio/engine.ts) arma cada golpe con osciladores.
 */
export type DrumKind = 'kick' | 'snare' | 'hat' | 'ride' | 'rim';
export type DrumStyle = 'rock' | 'pop' | 'funk' | 'ballad' | 'shuffle' | 'jazz' | 'soul' | 'reggae' | 'bossa';

export interface DrumPattern {
  steps: 12 | 16;
  kick: number[];
  snare: number[];
  hat: number[];
  ride: number[];
  /** Golpe de aro (rim click): bossa y reggae. */
  rim?: number[];
}

export const DRUM_STYLES: Record<DrumStyle, DrumPattern> = {
  // Bombo en 1 y 3 (y la corchea antes del 3), caja en 2 y 4, hi-hat en corcheas.
  rock: { steps: 16, kick: [0, 6, 8], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], ride: [] },
  pop: { steps: 16, kick: [0, 7, 8, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], ride: [] },
  // Semicorcheas en el hi-hat y bombo sincopado.
  funk: { steps: 16, kick: [0, 3, 7, 10], snare: [4, 12], hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], ride: [] },
  // Medio tiempo: caja solo en el 3.
  ballad: { steps: 16, kick: [0, 10], snare: [8], hat: [0, 4, 8, 12], ride: [] },
  // Tresillos: hi-hat en la 1.ª y 3.ª de cada tresillo (swing).
  shuffle: { steps: 12, kick: [0, 6], snare: [3, 9], hat: [0, 2, 3, 5, 6, 8, 9, 11], ride: [] },
  // Ride con swing, hi-hat de pie en 2 y 4, bombo suave en cada tiempo.
  jazz: { steps: 12, kick: [0, 3, 6, 9], snare: [], hat: [3, 9], ride: [0, 3, 5, 6, 9, 11] },
  soul: { steps: 16, kick: [0, 6, 8], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], ride: [] },
  // One drop: el 1 vacío; bombo y aro juntos en el 3.
  reggae: { steps: 16, kick: [8], snare: [], hat: [2, 4, 6, 8, 10, 12, 14], ride: [], rim: [8] },
  bossa: { steps: 16, kick: [0, 6, 8, 14], snare: [], hat: [0, 2, 4, 6, 8, 10, 12, 14], ride: [], rim: [0, 3, 6, 10, 12] },
};

/** Volumen relativo de cada golpe. */
export const DRUM_LEVEL: Record<DrumKind, number> = { kick: 0.9, snare: 0.6, hat: 0.35, ride: 0.3, rim: 0.4 };

export interface DrumHit {
  kind: DrumKind;
  startSec: number;
  level: number;
}

/**
 * Golpes de `bars` compases de un estilo, empezando `offsetBeats` pulsos después
 * del 0 (la cuenta previa). En jazz el bombo va muy suave, como «feathering».
 */
export function drumSchedule(style: DrumStyle, bars: number, bpm: number, offsetBeats = 0): DrumHit[] {
  const p = DRUM_STYLES[style];
  const beatSec = 60 / bpm;
  const stepSec = (4 * beatSec) / p.steps;
  const hits: DrumHit[] = [];
  for (let bar = 0; bar < bars; bar++) {
    const barStart = (offsetBeats + bar * 4) * beatSec;
    for (const kind of ['kick', 'snare', 'hat', 'ride', 'rim'] as const) {
      for (const step of p[kind] ?? []) {
        const accent = step % (p.steps / 4) === 0 ? 1 : 0.75;
        const level = DRUM_LEVEL[kind] * accent * (style === 'jazz' && kind === 'kick' ? 0.35 : 1);
        hits.push({ kind, startSec: barStart + step * stepSec, level });
      }
    }
  }
  return hits.sort((a, b) => a.startSec - b.startSec);
}
