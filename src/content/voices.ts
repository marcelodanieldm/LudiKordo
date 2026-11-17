import type { Locale } from '../music/notes';

/**
 * Voces de los cartoons, por lección e idioma: un archivo por escena, en orden.
 * Metro necesita `require` estáticos, así que cada lección se agrega a mano
 * cuando llegan sus MP3 (docs/CARTOON_PIPELINE.md, etapa 4). Ejemplo:
 *
 *   '1.1.1': {
 *     es: [require('../../assets/audio/es/111/s1.mp3'), require('../../assets/audio/es/111/s2.mp3'), …],
 *     en: […],
 *     pt: […],
 *   },
 *
 * Si falta un idioma o una escena, el reproductor usa el tiempo de lectura del subtítulo.
 */
export const VOICES: Record<string, Partial<Record<Locale, number[]>>> = {};

export function voiceFor(lessonId: string, locale: Locale, scene: number): number | undefined {
  return VOICES[lessonId]?.[locale]?.[scene];
}
