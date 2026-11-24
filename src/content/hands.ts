/**
 * Tarjetas «Tus manos en el instrumento» (`Card.hands`) para las tres apps:
 * la araña en una cuerda, las guías de postura de cada mano y, en las tarjetas
 * que ya muestran el diagrama de un acorde, el acorde con los dedos de colores.
 */
import type { Figure, HandsSpec, Lesson } from './types';
import { CHORD_FIGURES } from '../components/guitarFigureMeta';
import { diagramOf } from '../music/chords';
import { isHandChord } from '../music/chordCartoon';
import { postureFromDiagram, spiderPosture } from '../music/handPosition';

/** La araña (un dedo por traste) en una cuerda: 0 = la más grave. */
export const spiderHands = (string: number): HandsSpec => ({ kind: 'spider', posture: spiderPosture(string) });
/** El mástil de costado: dedo en garra y pulgar detrás (bien) contra dedo acostado y pulgar que asoma (evita). */
export const LEFT_GUIDE: HandsSpec = { kind: 'guide', hand: 'left' };
/** Dónde y con qué toca la otra mano (dedos en la criolla, púa en la eléctrica, i-m en el bajo). */
export const RIGHT_GUIDE: HandsSpec = { kind: 'guide', hand: 'right' };

/** La tarjeta de manos de una figura de acorde, si es un acorde que se arma con una mano (no una caja de escala). */
export function handsForFigure(figure: Figure): HandsSpec | undefined {
  const id = CHORD_FIGURES[figure];
  if (!id) return undefined;
  const d = diagramOf(id);
  return isHandChord(d) ? { kind: 'chord', posture: postureFromDiagram(d) } : undefined;
}

/**
 * Suma la tarjeta de manos a las tarjetas que muestran el diagrama de un acorde
 * (y no tienen ya otra animación). El resto queda igual.
 */
export function withChordHands(lesson: Lesson): Lesson {
  let changed = false;
  const cards = lesson.cards.map((c) => {
    if (c.hands || c.motion || !c.figure) return c;
    const hands = handsForFigure(c.figure);
    if (!hands) return c;
    changed = true;
    return { ...c, hands };
  });
  return changed ? { ...lesson, cards } : lesson;
}

export const withChordHandsAll = (lessons: Record<string, Lesson>): Record<string, Lesson> =>
  Object.fromEntries(Object.entries(lessons).map(([id, l]) => [id, withChordHands(l)]));
