import { requireOptionalNativeModule, type EventSubscription } from 'expo-modules-core';

/** Ataque de nota detectado. `elapsedMs` se cuenta en muestras desde start(). */
export interface PitchEvent {
  freq: number;
  elapsedMs: number;
  clarity: number;
}

/** Ataque (golpe) detectado, tenga o no altura clara. */
export interface AttackEvent {
  elapsedMs: number;
  rms: number;
}

export interface LevelEvent {
  rms: number;
}

export interface StartOptions {
  sampleRate: number;
  bufferSize: number;
  hopSize: number;
  threshold: number;
  /** Rango de búsqueda de YIN en Hz (por defecto, el del bajo: 35–450). */
  minFreq?: number;
  maxFreq?: number;
}

type Events = {
  /** Un ataque nuevo con altura estable. */
  onNote: (e: PitchEvent) => void;
  /** Altura continua, cuadro a cuadro (para el afinador). */
  onPitch: (e: PitchEvent) => void;
  /** Nivel de entrada, para el medidor de ruido. */
  onLevel: (e: LevelEvent) => void;
  /** Cada golpe, aunque no tenga altura clara (rasgueos). */
  onAttack: (e: AttackEvent) => void;
};

interface PitchDetectorNative {
  start(options: StartOptions): Promise<void>;
  stop(): void;
  addListener<K extends keyof Events>(event: K, listener: Events[K]): EventSubscription;
}

/** null cuando el módulo nativo no está compilado (por ejemplo, en Expo Go). */
export const PitchDetector = requireOptionalNativeModule<PitchDetectorNative>('PitchDetector');
