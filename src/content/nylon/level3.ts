/**
 * Guitarra criolla, nivel 3 (primera parte): 3.1 preparar la cejilla, 3.2
 * cejilla forma de E, 3.3 cejilla forma de A y 3.4 séptimas y blues. Cada
 * acorde nuevo entra al álbum de acordes (chordbook.ts). En la criolla la
 * cejilla cuesta más que en la eléctrica (cuerdas más tensas y mástil más ancho):
 * por eso el módulo 3.1 arranca con media cejilla.
 * Textos en `content.n.l31x…l34x`.
 */
import type { Lesson, ScoreEvent } from '../types';
import { QUARTERS, HALVES, WHOLES } from '../../music/strum';
import { chordFretted, k, listen, n, strumListen } from './helpers';
import { changeLesson, chordLesson, ear, lesson, play, playScore, quiz, strum, tap } from './level2';

// ───────────── 3.1 · Preparar la cejilla ─────────────

const l311 = chordLesson('3.1.1', 'Fmaj7');

/** 3.1.2: el dedo 1 acostado sobre la 2.ª y la 1.ª en el traste 1 (Do y Fa juntos). */
export const HALF_BARRE_DRILL: ScoreEvent[] = [
  n('B', 1), n('e', 1), n('B', 1), n('e', 1),
  n('B', 1), n('e', 1), n('B', 1, 2),
  n('e', 1), n('B', 1), n('e', 1), n('B', 1),
  n('e', 1, 4),
];

const l312 = lesson('3.1.2', 10, {
  visuals: [null, 'chord-f-half', 'chord-f-half', null],
  sounds: [null, listen(HALF_BARRE_DRILL, 70), null, null],
  cards: [{ figure: 'chord-f-half' }, { listen: listen(HALF_BARRE_DRILL, 60, { click: true }) }],
  exercises: [
    quiz('3.1.2', 'q1', [k('3.1.2', 'q1o1'), k('3.1.2', 'q1o2'), k('3.1.2', 'q1o3')], 1),
    playScore('3.1.2', 'play', HALF_BARRE_DRILL),
  ],
});

const l313 = chordLesson('3.1.3', 'F');
const l314 = chordLesson('3.1.4', 'Bm');

// ───────────── 3.2 · Cejilla forma de E ─────────────

/** 3.2.1: la F con cejilla completa (el álbum ya tiene F con media cejilla). */
const l321 = chordLesson('3.2.1', 'F', 'barre-f');
const l322 = chordLesson('3.2.2', 'Fm');
const l323 = chordLesson('3.2.3', 'F7');

/** 3.2.4: la misma forma, movida: Fm en el 1, F#m en el 2, Gm en el 3. */
const l324 = changeLesson('3.2.4', 12, ['Fm', 'F#m', 'Gm', 'F#m'], HALVES, [null, 'barre-fsm', 'barre-gm', null], [
  tap('3.2.4', 'tap', chordFretted('F#m')),
  tap('3.2.4', 'tap2', chordFretted('Gm')),
]);

/** 3.2.5: de abierto a cejilla y vuelta. */
const l325 = changeLesson('3.2.5', 14, ['C', 'F', 'G', 'C'], QUARTERS, ['chord-c', 'chord-f-half', 'chord-g', null], [
  strum('3.2.5', 'strum1', ['Am', 'F#m', 'D', 'E'], QUARTERS),
]);

// ───────────── 3.3 · Cejilla forma de A ─────────────

const l331 = chordLesson('3.3.1', 'Bb');
const l332 = chordLesson('3.3.2', 'Bbm');
const l333 = chordLesson('3.3.3', 'Bm7');

/** 3.3.4: la forma de A menor movida: Cm en el 3, C#m en el 4. */
const l334 = changeLesson('3.3.4', 12, ['Cm', 'C#m', 'Cm', 'C#m'], HALVES, [null, 'barre-cm', 'barre-csm', null], [
  tap('3.3.4', 'tap', chordFretted('C#m')),
  quiz('3.3.4', 'q1', ['=2', '=3', '=4', '=5'], 2),
]);

/** 3.3.5: progresión solo con cejillas. */
const l335 = changeLesson('3.3.5', 14, ['Bb', 'Gm', 'Cm', 'F7'], QUARTERS, ['barre-bb', 'barre-gm', 'barre-cm', 'barre-f7']);

// ───────────── 3.4 · Séptimas y blues ─────────────

/** 3.4.1: la séptima dominante, de oído (C contra C7), y el acorde C7. */
const l341 = lesson('3.4.1', 12, {
  visuals: ['chord-c', 'chord-c7', 'chord-c7', null],
  sounds: [strumListen(['C'], WHOLES, 60), strumListen(['C7'], WHOLES, 60), strumListen(['C7', 'F'], HALVES, 70), null],
  cards: [{ figure: 'chord-c7', listen: strumListen(['C', 'C7'], WHOLES, 60) }, { listen: strumListen(['C7', 'F'], WHOLES, 60) }],
  exercises: [
    ear('3.4.1', 'ear1', [k('3.4.1', 'triad'), k('3.4.1', 'seventh')], 1, { example: strumListen(['C7'], WHOLES, 60) }),
    ear('3.4.1', 'ear2', [k('3.4.1', 'triad'), k('3.4.1', 'seventh')], 0, { example: strumListen(['G'], WHOLES, 60) }),
    tap('3.4.1', 'tap', chordFretted('C7')),
    strum('3.4.1', 'strum', ['C7', 'C7', 'F', 'F'], QUARTERS),
  ],
});

const l342 = chordLesson('3.4.2', 'B7');

/** 3.4.3: bajo de boogie (tónica, tercera, quinta y sexta) sobre E7 y A7: el pulgar camina. */
export const BOOGIE_E: ScoreEvent[] = [
  n('E', 0), n('E', 4), n('A', 2), n('A', 4),
  n('A', 0), n('A', 4), n('D', 2), n('D', 4),
  n('E', 0), n('E', 4), n('A', 2), n('A', 4),
  n('A', 2), n('A', 0), n('E', 4), n('E', 0),
];

const l343 = lesson('3.4.3', 12, {
  visuals: [null, 'pima-hand', null, null],
  sounds: [listen(BOOGIE_E, 80), null, listen(BOOGIE_E.slice(0, 4), 60), null],
  cards: [{ listen: listen(BOOGIE_E, 70, { click: true }) }, {}],
  exercises: [
    { id: '3.4.3-tap', kind: 'tapRhythm', needsBass: false, skills: ['rhythm'], promptKey: k('3.4.3', 'tap'), bpm: 70, beats: 16, pads: ['p', 'i'] },
    playScore('3.4.3', 'play', BOOGIE_E),
  ],
});

/** Blues de 12 compases en Mi y en La. */
export const BLUES_E = ['E7', 'E7', 'E7', 'E7', 'A7', 'A7', 'E7', 'E7', 'B7', 'A7', 'E7', 'B7'];
export const BLUES_A = ['A7', 'A7', 'A7', 'A7', 'D7', 'D7', 'A7', 'A7', 'E7', 'D7', 'A7', 'E7'];

const l344 = lesson('3.4.4', 14, {
  visuals: ['chord-e7', 'chord-a7', 'chord-b7', null],
  sounds: [strumListen(BLUES_E.slice(0, 4), QUARTERS, 70), null, strumListen(BLUES_E.slice(8), QUARTERS, 70), null],
  cards: [{ listen: strumListen(BLUES_E, QUARTERS, 70, { click: true }) }, { listen: strumListen(BLUES_A, QUARTERS, 70, { click: true }) }],
  exercises: [
    quiz('3.4.4', 'q1', ['=B7', '=A7', '=E7', '=D7'], 0),
    strum('3.4.4', 'strum1', BLUES_E, QUARTERS, 70),
    strum('3.4.4', 'strum2', BLUES_A, QUARTERS, 70),
  ],
});

/** 3.4.5: turnaround en Mi (los dos últimos compases del blues): baja por semitonos y termina en B7. */
export const TURNAROUND_E: ScoreEvent[] = [
  n('e', 0), n('B', 3), n('B', 2), n('B', 1),
  n('A', 2, 2), n('B', 0, 2),
];

const l345 = lesson('3.4.5', 12, {
  visuals: [null, 'chord-b7', null, null],
  sounds: [listen(TURNAROUND_E, 70), null, listen(TURNAROUND_E, 60), null],
  cards: [{ listen: listen(TURNAROUND_E, 60, { click: true }) }, { figure: 'chord-b7' }],
  exercises: [
    quiz('3.4.5', 'q1', [k('3.4.5', 'q1o1'), k('3.4.5', 'q1o2'), k('3.4.5', 'q1o3')], 0),
    playScore('3.4.5', 'play', TURNAROUND_E),
    play('3.4.5', 'b7', chordFretted('B7'), null),
  ],
});

export const NYLON_LEVEL3_LESSONS: Lesson[] = [l311, l312, l313, l314, l321, l322, l323, l324, l325, l331, l332, l333, l334, l335, l341, l342, l343, l344, l345];
