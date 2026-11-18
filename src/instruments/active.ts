/**
 * Instrumento de esta build, leído de `extra.instrument` (app.config.ts).
 * Es el único punto que toca Expo; el resto usa los perfiles puros.
 */
import Constants from 'expo-constants';
import { resolveInstrument } from './profiles';

export const INSTRUMENT = resolveInstrument(Constants.expoConfig?.extra?.instrument);
