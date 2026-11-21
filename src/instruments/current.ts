/**
 * Instrumento de esta build. Expo incrusta las variables EXPO_PUBLIC_* en el
 * bundle al compilar, así que es una constante: la app de bajo, la de guitarra
 * eléctrica y la de criolla son builds distintas del mismo código (ADR 0009 y
 * 0010). En las pruebas de Node, sin la variable, es el bajo.
 *
 * Se lee con acceso literal (`process.env.EXPO_PUBLIC_INSTRUMENT`): es lo que
 * Expo reemplaza al compilar.
 */
import { isSixString, resolveInstrument } from './profiles';

export const INSTRUMENT = resolveInstrument(process.env.EXPO_PUBLIC_INSTRUMENT);
/**
 * Guitarra de 6 cuerdas (eléctrica o criolla): el motor se comporta como guitarra
 * (tablatura, timbres sin transponer, banda con bajo). El contenido de cada una se
 * elige con `IS_NYLON`.
 */
export const IS_GUITAR = isSixString(INSTRUMENT);
/** Guitarra criolla: su propia ruta, lecciones y textos (`content.n.*`, `nylon.ui`). */
export const IS_NYLON = INSTRUMENT.id === 'nylon';
