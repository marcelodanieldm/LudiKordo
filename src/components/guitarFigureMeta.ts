/**
 * Datos de las figuras de guitarra (sin React Native, para poder probarlos):
 * cuáles hay, cuántos ítems tiene cada leyenda y su proporción alto/ancho.
 */
import type { Figure } from '../content/types';
import type { DiagramId } from '../music/chords';

/** Figuras que se dibujan como diagrama en grilla (acordes, power chords, caja de escala). */
export const CHORD_FIGURES: Partial<Record<Figure, DiagramId>> = {
  'chord-em': 'Em',
  'chord-e': 'E',
  'chord-am': 'Am',
  'chord-a': 'A',
  'chord-c': 'C',
  'chord-g': 'G',
  'chord-d': 'D',
  'chord-dm': 'Dm',
  'power-6': 'power-6',
  'power-5': 'power-5',
  'penta-box': 'penta-a',
  'barre-f': 'bar-f',
  'barre-fm': 'bar-fm',
  'barre-g': 'bar-g',
  'barre-am': 'bar-am',
  'barre-bb': 'bar-bb',
  'barre-c': 'bar-c',
  'barre-cm': 'bar-cm',
  'barre-dm': 'bar-dm',
  'barre-c8': 'bar-c8',
  'barre-only': 'bar-only',
  octave: 'octave',
};

export const GUITAR_FIGURES: Figure[] = [
  'guitar-parts',
  'guitar-strings',
  'pickup-selector',
  'guitar-knobs',
  'amp-panel',
  'amp-clean',
  'amp-crunch',
  'cable-amp',
  'guitar-tuner',
  'posture',
  'pick-grip',
  'pick-down',
  'pick-alternate',
  'string-crossing',
  'fret-hand',
  'mute-fret-hand',
  'mute-pick-hand',
  'chord-diagram-how',
  'palm-mute',
  'hammer-on',
  'pull-off',
  'slide',
  'bend',
  'vibrato',
  ...(Object.keys(CHORD_FIGURES) as Figure[]),
];

/** Cuántos ítems tiene la leyenda de cada figura (0 = sin leyenda). */
export const LEGEND_COUNT: Partial<Record<Figure, number>> = {
  'guitar-parts': 9,
  'pickup-selector': 5,
  'guitar-knobs': 3,
  'amp-panel': 5,
  'amp-clean': 2,
  'amp-crunch': 2,
  'cable-amp': 3,
  posture: 4,
  'pick-grip': 3,
  'pick-down': 2,
  'pick-alternate': 2,
  'string-crossing': 2,
  'fret-hand': 5,
  'mute-fret-hand': 2,
  'mute-pick-hand': 2,
  'chord-diagram-how': 5,
  'palm-mute': 2,
  'power-6': 2,
  'power-5': 2,
  'penta-box': 2,
  'hammer-on': 2,
  'pull-off': 2,
  slide: 2,
  bend: 3,
  vibrato: 2,
  'barre-f': 2,
  'barre-bb': 2,
  octave: 2,
};

export const RATIO: Partial<Record<Figure, number>> = {
  // Versión compacta (escenario del cartoon); en las tarjetas se usa el diapasón.
  'guitar-strings': 150 / 360,
  'guitar-parts': 130 / 360,
  'pickup-selector': 150 / 360,
  'guitar-knobs': 120 / 360,
  'amp-panel': 130 / 360,
  'amp-clean': 130 / 360,
  'amp-crunch': 130 / 360,
  'cable-amp': 120 / 360,
  'guitar-tuner': 170 / 360,
  posture: 170 / 360,
  'pick-grip': 150 / 360,
  'pick-down': 140 / 360,
  'pick-alternate': 140 / 360,
  'string-crossing': 150 / 360,
  'fret-hand': 150 / 360,
  'mute-fret-hand': 140 / 360,
  'mute-pick-hand': 140 / 360,
  'palm-mute': 140 / 360,
  'hammer-on': 150 / 360,
  'pull-off': 150 / 360,
  slide: 150 / 360,
  bend: 150 / 360,
  vibrato: 150 / 360,
  'chord-diagram-how': 216 / 360,
  ...Object.fromEntries(Object.keys(CHORD_FIGURES).map((f) => [f, 216 / 360])),
};

/** true si la figura se dibuja en GuitarFigures.tsx. */
export function isGuitarFigure(id: Figure): boolean {
  return GUITAR_FIGURES.includes(id);
}
