/**
 * Datos de las figuras de guitarra (sin React Native, para poder probarlos):
 * cuáles hay, cuántos ítems tiene cada leyenda y su proporción alto/ancho.
 */
import type { Figure } from '../content/types';

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
};

export const RATIO: Partial<Record<Figure, number>> = {
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
};

/** true si la figura se dibuja en GuitarFigures.tsx. */
export function isGuitarFigure(id: Figure): boolean {
  return GUITAR_FIGURES.includes(id);
}
