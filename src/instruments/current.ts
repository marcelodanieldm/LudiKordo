/**
 * Instrumento de esta build. Expo incrusta las variables EXPO_PUBLIC_* en el
 * bundle al compilar, así que es una constante: la app de bajo y la de guitarra
 * son dos builds distintas del mismo código (ADR 0009). En las pruebas de Node,
 * sin la variable, es el bajo.
 *
 * Se lee con acceso literal (`process.env.EXPO_PUBLIC_INSTRUMENT`): es lo que
 * Expo reemplaza al compilar.
 */
import { resolveInstrument } from './profiles';

export const INSTRUMENT = resolveInstrument(process.env.EXPO_PUBLIC_INSTRUMENT);
export const IS_GUITAR = INSTRUMENT.id === 'guitar';
