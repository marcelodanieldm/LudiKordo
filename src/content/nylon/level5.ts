/**
 * Guitarra criolla, nivel 5 (primera parte): 5.1 mapa del mástil, 5.2 tríadas e
 * inversiones y 5.3 chord-melody. Entran al álbum C/E, G/B y D/F# (5.2).
 *
 * El detector de notas escucha una nota por vez: en el chord-melody el alumno
 * alterna el bajo (en el 1) y la melodía (en los otros tiempos), y el acorde
 * completo se practica aparte, rasgueado en el tiempo fuerte.
 * Textos en `content.n.l51x…l53x`.
 */
import type { Lesson, ScoreEvent } from '../types';
import type { StringId } from '../../instruments/profiles';
import { QUARTERS, WHOLES } from '../../music/strum';
import { chordFigure, chordFretted, k, listen, n, strumListen } from './helpers';
import { changeLesson, chordLesson, lesson, play, playScore, quiz, strum, tap } from './level2';

const fig = chordFigure;
const q3 = (id: string, correct = 0) => quiz(id, 'q1', [k(id, 'q1o1'), k(id, 'q1o2'), k(id, 'q1o3')], correct);
const at = (xs: [StringId, number][]) => xs.map(([string, fret]) => ({ string, fret }));
const quarters = (xs: [StringId, number][]) => xs.map(([s, f]) => n(s, f));

// ───────────── 5.1 · Mapa del mástil ─────────────

/** Las notas naturales en la 6.ª y en la 5.ª, hasta el traste 12. */
export const NATURALS_6: [StringId, number][] = [['E', 0], ['E', 1], ['E', 3], ['E', 5], ['E', 7], ['E', 8], ['E', 10], ['E', 12]];
export const NATURALS_5: [StringId, number][] = [['A', 0], ['A', 2], ['A', 3], ['A', 5], ['A', 7], ['A', 8], ['A', 10], ['A', 12]];

const l511 = lesson('5.1.1', 12, {
  visuals: [null, 'fret-hand', null, null],
  sounds: [listen(quarters(NATURALS_6), 70), null, listen(quarters(NATURALS_5), 70), null],
  cards: [{ listen: listen(quarters(NATURALS_6), 60) }, { listen: listen(quarters(NATURALS_5), 60) }],
  exercises: [
    q3('5.1.1', 1),
    tap('5.1.1', 'tap', at(NATURALS_6)),
    play('5.1.1', 'play6', at(NATURALS_6), null),
    play('5.1.1', 'play5', at(NATURALS_5), null),
  ],
});

/** Octavas: de la 6.ª a la 4.ª y de la 5.ª a la 3.ª, dos trastes más adelante. */
export const OCTAVES: ScoreEvent[] = [
  n('E', 5, 2), n('D', 7, 2),
  n('E', 8, 2), n('D', 10, 2),
  n('A', 3, 2), n('G', 5, 2),
  n('A', 5, 2), n('G', 7, 2),
];

const l512 = lesson('5.1.2', 10, {
  visuals: [null, 'fret-hand', null, null],
  sounds: [listen(OCTAVES, 70), null, null, null],
  cards: [{ listen: listen(OCTAVES.slice(0, 4), 60, { click: true }) }, { listen: listen(OCTAVES.slice(4), 60, { click: true }) }],
  exercises: [q3('5.1.2', 0), tap('5.1.2', 'tap', at([['E', 5], ['D', 7], ['A', 3], ['G', 5]])), playScore('5.1.2', 'play', OCTAVES, 70)],
});

/** Do mayor en tres formas del CAGED: la de C (abierta), la de A (traste 3) y la de E (traste 8). */
export const CAGED_C: [StringId, number][] = [
  ['A', 3], ['D', 2], ['G', 0], ['B', 1],
  ['A', 3], ['D', 5], ['G', 5], ['B', 5],
  ['E', 8], ['A', 10], ['D', 10], ['G', 9],
];

const l513 = lesson('5.1.3', 12, {
  visuals: ['chord-c', null, null, null],
  sounds: [listen(quarters(CAGED_C), 70), null, null, null],
  cards: [{ figure: 'chord-c', listen: listen(quarters(CAGED_C.slice(0, 4)), 60) }, { listen: listen(quarters(CAGED_C.slice(4)), 60) }],
  exercises: [q3('5.1.3', 0), play('5.1.3', 'play', at(CAGED_C), null), playScore('5.1.3', 'timed', [...quarters(CAGED_C), n('A', 3, 4)], 60)],
});

/** La menor en tres lugares: abierta, cejilla en el 5 (forma de E) y forma de A en el 12. */
export const AM_PLACES: ScoreEvent[] = [
  n('A', 0), n('D', 2), n('G', 2), n('B', 1),
  n('E', 5), n('A', 7), n('D', 7), n('G', 5),
  n('A', 12), n('D', 14), n('G', 14), n('B', 13),
  n('A', 0, 4),
];

const l514 = lesson('5.1.4', 12, {
  visuals: ['chord-am', 'barre-am', null, null],
  sounds: [listen(AM_PLACES, 70), null, strumListen(['Am', 'Am'], QUARTERS, 70), null],
  cards: [{ figure: 'chord-am', listen: listen(AM_PLACES.slice(0, 4), 60) }, { listen: listen(AM_PLACES.slice(4, 12), 60) }],
  exercises: [q3('5.1.4', 2), playScore('5.1.4', 'play', AM_PLACES, 60)],
});

// ───────────── 5.2 · Tríadas e inversiones ─────────────

/** C, F, G y C en las cuerdas 3, 2 y 1. */
export const TRIADS_123: ScoreEvent[] = [
  n('G', 5), n('B', 5), n('e', 3, 2),
  n('G', 2), n('B', 1), n('e', 1, 2),
  n('G', 4), n('B', 3), n('e', 3, 2),
  n('G', 5), n('B', 5), n('e', 3, 2),
];
/** C, F, G y C en las cuerdas 4, 3 y 2. */
export const TRIADS_234: ScoreEvent[] = [
  n('D', 5), n('G', 5), n('B', 5, 2),
  n('D', 3), n('G', 2), n('B', 1, 2),
  n('D', 5), n('G', 4), n('B', 3, 2),
  n('D', 2), n('G', 0), n('B', 1, 2),
];
export const CFGC = ['C', 'F', 'G', 'C'];
const CFGC_BACK = strumListen(CFGC, QUARTERS, 70);

const l521 = lesson('5.2.1', 12, {
  visuals: [null, null, null, null],
  sounds: [listen(TRIADS_123, 70), CFGC_BACK, null, null],
  cards: [{ listen: listen(TRIADS_123, 60, { click: true }) }, { listen: CFGC_BACK }],
  exercises: [q3('5.2.1', 0), playScore('5.2.1', 'play', TRIADS_123, 60)],
});

const l522 = lesson('5.2.2', 12, {
  visuals: [null, null, null, null],
  sounds: [listen(TRIADS_234, 70), CFGC_BACK, null, null],
  cards: [{ listen: listen(TRIADS_234, 60, { click: true }) }, { listen: listen(TRIADS_123, 60) }],
  exercises: [q3('5.2.2', 1), playScore('5.2.2', 'play', TRIADS_234, 60)],
});

const l523 = chordLesson('5.2.3', 'C/E');

/** El bajo baja por grados: C, G/B, Am y G. */
export const DESCENT = ['C', 'G/B', 'Am', 'G'];
const l524 = changeLesson('5.2.4', 12, DESCENT, QUARTERS, ['chord-c', fig('G/B'), 'chord-am', null], [q3('5.2.4', 0), tap('5.2.4', 'tap', chordFretted('G/B'))]);

/** Un bajo caminante con el pulgar: G, D/F#, Em y C. */
export const WALK = ['G', 'D/F#', 'Em', 'C'];
export const WALKING_BASS: ScoreEvent[] = [
  n('E', 3), n('A', 2), n('D', 0), n('A', 0),
  n('E', 2), n('A', 0), n('D', 0), n('A', 2),
  n('E', 0), n('A', 2), n('D', 2), n('D', 0),
  n('A', 3, 2), n('D', 2), n('G', 0),
];
const l525 = changeLesson('5.2.5', 14, WALK, QUARTERS, ['chord-g', fig('D/F#'), 'chord-em', null], [
  tap('5.2.5', 'tap', chordFretted('D/F#')),
  playScore('5.2.5', 'walk', WALKING_BASS, 70),
]);

// ───────────── 5.3 · Chord-melody ─────────────

export const CAFG = ['C', 'Am', 'F', 'G'];
const CAFG_BACK = strumListen(CAFG, QUARTERS, 70);

/** Melodía original en las cuerdas agudas sobre C, Am, F y G. */
export const MELODY_TOP: ScoreEvent[] = [
  n('e', 3, 2), n('e', 0), n('B', 1),
  n('e', 0, 2), n('B', 1), n('e', 0),
  n('e', 1, 2), n('B', 1), n('e', 1),
  n('B', 3, 2), n('B', 0), n('e', 3),
];
/** La misma melodía con el bajo en el 1 de cada compás (pulgar) y la melodía en el 2, el 3 y el 4. */
export const MELODY_BASS: ScoreEvent[] = [
  n('A', 3), n('e', 3), n('e', 0), n('B', 1),
  n('A', 0), n('e', 0), n('B', 1), n('e', 0),
  n('D', 3), n('e', 1), n('B', 1), n('e', 1),
  n('E', 3), n('B', 3), n('B', 0), n('e', 3),
];
/** La melodía con rellenos en corcheas entre las notas largas. */
export const MELODY_FILLS: ScoreEvent[] = [
  n('e', 3, 2), n('e', 0, 0.5), n('e', 1, 0.5), n('e', 3),
  n('e', 0, 2), n('B', 1, 0.5), n('B', 0, 0.5), n('B', 1),
  n('e', 1, 2), n('e', 0, 0.5), n('B', 1, 0.5), n('e', 1),
  n('B', 3, 2), n('B', 1, 0.5), n('B', 0, 0.5), n('B', 3),
];
/** Arreglo de 8 compases: la melodía con bajo y una segunda frase que vuelve a Do. */
export const ARRANGEMENT = ['C', 'Am', 'F', 'G', 'C', 'G/B', 'F', 'C'];
export const ARRANGEMENT_LINE: ScoreEvent[] = [
  ...MELODY_BASS,
  n('A', 3), n('e', 0), n('e', 1), n('e', 3),
  n('A', 2), n('B', 3), n('e', 3), n('B', 0),
  n('D', 3), n('e', 1), n('B', 1), n('e', 0),
  n('A', 3), n('e', 0), n('B', 1, 2),
];

const l531 = lesson('5.3.1', 12, {
  visuals: [null, 'chord-c', null, null],
  sounds: [listen(MELODY_TOP, 70), CAFG_BACK, null, null],
  cards: [{ listen: listen(MELODY_TOP, 60, { click: true }) }, { listen: CAFG_BACK }],
  exercises: [q3('5.3.1', 0), playScore('5.3.1', 'play', MELODY_TOP, 70)],
});

const l532 = lesson('5.3.2', 12, {
  visuals: [null, 'pima-hand', null, null],
  sounds: [listen(MELODY_BASS, 70), null, listen(MELODY_TOP, 70), null],
  cards: [{ listen: listen(MELODY_BASS, 60, { click: true }) }, { figure: 'pima-hand' }],
  exercises: [q3('5.3.2', 1), playScore('5.3.2', 'play', MELODY_BASS, 60)],
});

const l533 = lesson('5.3.3', 10, {
  visuals: ['chord-c', 'chord-am', fig('F'), null],
  sounds: [strumListen(CAFG, WHOLES, 70), null, listen(MELODY_BASS, 70), null],
  cards: [{ listen: strumListen(CAFG, WHOLES, 60, { click: true }) }, { listen: listen(MELODY_BASS, 60) }],
  exercises: [q3('5.3.3', 0), strum('5.3.3', 'strum', CAFG, WHOLES, 70), playScore('5.3.3', 'play', MELODY_BASS, 70)],
});

const l534 = lesson('5.3.4', 12, {
  visuals: [null, null, null, null],
  sounds: [listen(MELODY_FILLS, 70), null, listen(MELODY_TOP, 70), null],
  cards: [{ listen: listen(MELODY_FILLS, 60, { click: true }) }, { listen: listen(MELODY_TOP, 60) }],
  exercises: [q3('5.3.4', 0), playScore('5.3.4', 'play', MELODY_FILLS, 60)],
});

const l535 = lesson('5.3.5', 14, {
  visuals: ['chord-c', fig('G/B'), fig('F'), null],
  sounds: [listen(ARRANGEMENT_LINE, 70), strumListen(ARRANGEMENT, QUARTERS, 70), null, null],
  cards: [{ listen: listen(ARRANGEMENT_LINE.slice(0, 16), 60, { click: true }) }, { listen: listen(ARRANGEMENT_LINE.slice(16), 60, { click: true }) }],
  exercises: [playScore('5.3.5', 'play', ARRANGEMENT_LINE, 60), strum('5.3.5', 'strum', ARRANGEMENT, QUARTERS, 70)],
});

export const NYLON_LEVEL5_LESSONS: Lesson[] = [
  l511, l512, l513, l514,
  l521, l522, l523, l524, l525,
  l531, l532, l533, l534, l535,
];
