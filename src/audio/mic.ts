/**
 * Puente con el módulo nativo de detección (modules/pitch-detector).
 * Si el módulo no está (por ejemplo, en Expo Go) o no hay permiso, el
 * ejercicio pasa a autoevaluación en lugar de bloquear al alumno.
 */
import { PermissionsAndroid, Platform } from 'react-native';
import { PitchDetector, type PitchEvent } from '../../modules/pitch-detector';
import { nowMs } from './engine';
import type { DetectedNote } from '../music/scoring';

export type MicStatus = 'ok' | 'denied' | 'unavailable';

/**
 * Latencia de entrada estimada (ms). La fase 0 del plan la mide por modelo de
 * teléfono con la calibración del aplauso; mientras tanto, un valor típico.
 */
export const DEFAULT_INPUT_LATENCY_MS = 60;

export async function requestMic(): Promise<MicStatus> {
  if (!PitchDetector) return 'unavailable';
  if (Platform.OS !== 'android') return 'ok';
  const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
  return res === PermissionsAndroid.RESULTS.GRANTED ? 'ok' : 'denied';
}

export interface Listener {
  stop: () => void;
}

const START_OPTIONS = { sampleRate: 44100, bufferSize: 4096, hopSize: 1024, threshold: 0.15 };

/**
 * Escucha ataques de nota. Los tiempos llegan convertidos al reloj de audio
 * (el mismo del metrónomo), para poder compararlos con los tiempos esperados.
 */
export async function listenNotes(onNote: (n: DetectedNote) => void, latencyMs = DEFAULT_INPUT_LATENCY_MS): Promise<Listener | null> {
  if (!PitchDetector) return null;
  let startedAt = nowMs();
  const sub = PitchDetector.addListener('onNote', (e: PitchEvent) => {
    onNote({ freq: e.freq, timeMs: startedAt + e.elapsedMs - latencyMs });
  });
  startedAt = nowMs();
  await PitchDetector.start(START_OPTIONS);
  return {
    stop: () => {
      sub.remove();
      PitchDetector?.stop();
    },
  };
}

/** Altura continua, para el afinador y los ejercicios sin tempo. */
export async function listenPitch(onPitch: (freq: number) => void): Promise<Listener | null> {
  if (!PitchDetector) return null;
  const sub = PitchDetector.addListener('onPitch', (e: PitchEvent) => onPitch(e.freq));
  await PitchDetector.start(START_OPTIONS);
  return {
    stop: () => {
      sub.remove();
      PitchDetector?.stop();
    },
  };
}
