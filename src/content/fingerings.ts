/**
 * Digitaciones que enseña cada lección cuando no salen de «un dedo por traste»
 * (las lee `handPlan`, src/music/hands.ts):
 * - un número: todas las notas con ese dedo (power chords, slides «con el mismo dedo»);
 * - una lista: el dedo de cada nota (octavas: 1 y 3);
 * - `false`: no mostrar números, la digitación sale del acorde que muestra la lección.
 * Por instrumento, porque los ids de ejercicio se repiten entre apps.
 */
import type { HandInstrument } from '../music/hands';

export type Fingering = number | number[] | false;

export const FINGERINGS: Record<HandInstrument, Record<string, Fingering>> = {
  bass: {},
  guitar: {
    // Power chords: la tónica siempre con el dedo 1 y la mano se desliza sin cambiar la forma (2.4.2).
    '2.4.2-play': 1,
    '2.4.3-play': 1,
    '2.4.4-play': 1,
    '2.4.5-play': 1,
    // Slides: «desliza con el mismo dedo» (3.2.1, 3.2.2).
    '3.2.1-play': 3,
    '3.2.2-play': 3,
    // Slide de 7 a 9 con el dedo 3 y la mano queda en la posición 7.
    '3.2.3-play': [1, 3, 3, 2, 4],
    '3.3.3-play': [3, 1, 3],
    // Octavas: «dedo 1 en la 6.ª cuerda y dedo 3 en la 4.ª» (3.7.3).
    '3.7.3-play': [1, 3, 1, 3, 1, 3],
    // Práctica: el riff de power chords (tónicas con el dedo 1).
    'g-power': 1,
  },
  nylon: {
    // Arpegios de acordes: los dedos salen de la forma del acorde.
    '3.3.4-pimi': false,
    '3.3.5-pimi': false,
  },
};

/**
 * Digitación de un ejercicio de la Práctica: la suya, o la de la lección de la
 * que sale (criolla: un ejercicio por lección). Solo se toma de la lección un
 * dedo único o `false`; una lista por nota no sirve porque la línea cambia.
 */
export function drillFingering(instrument: HandInstrument, drillId: string, lessonId?: string): Fingering | undefined {
  const own = FINGERINGS[instrument][drillId];
  if (own !== undefined) return own;
  if (!lessonId) return undefined;
  const fromLesson = Object.entries(FINGERINGS[instrument]).find(([id, f]) => id.startsWith(`${lessonId}-`) && !Array.isArray(f));
  return fromLesson?.[1];
}
