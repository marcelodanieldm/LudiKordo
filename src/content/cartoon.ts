/**
 * Lógica pura del reproductor de cartoons (sin React Native): cuánto dura cada
 * escena cuando todavía no hay voz grabada y qué hacer cuando termina una.
 */

/** Pausa entre el final de la voz de una escena y la siguiente. */
export const SCENE_GAP_MS = 600;
/** Ninguna escena dura menos que esto, aunque su texto sea corto. */
export const MIN_SCENE_MS = 4000;
/** Velocidad de lectura tranquila para el subtítulo sin voz (palabras por minuto). */
const WPM = 130;

/** Palabras de un subtítulo (sin comillas ni signos sueltos). */
export function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/**
 * Duración de cada escena sin voz: su tiempo de lectura (proporcional al texto,
 * con un mínimo). `rate` < 1 alarga (0,75×). No se estira hasta
 * `cartoon.durationSec`: ese número es la duración objetivo de la animación,
 * para el animador, y estirar un subtítulo solo hace esperar.
 */
export function sceneDurationsMs(texts: string[], rate = 1): number[] {
  return texts.map((t) => Math.round(Math.max(MIN_SCENE_MS, (wordCount(t) / WPM) * 60_000 + SCENE_GAP_MS) / rate));
}

/** Escena siguiente, o null si era la última. */
export function nextScene(scene: number, count: number): number | null {
  return scene + 1 < count ? scene + 1 : null;
}

/** Nombre de recurso esperado para el .riv de una lección («1.3.1» → «kordi_1_3_1»). */
export function riveResourceFor(lessonId: string): string {
  return `kordi_${lessonId.replace(/\./g, '_')}`;
}

/** Carpeta de audio de una lección («1.3.1» → «131»). */
export function audioFolderFor(lessonId: string): string {
  return lessonId.replace(/\./g, '');
}
