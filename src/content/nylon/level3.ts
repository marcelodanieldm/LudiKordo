/**
 * Guitarra criolla, nivel 3: 3.1 preparar la cejilla, 3.2 cejilla forma de E,
 * 3.3 cejilla forma de A, 3.4 séptimas y blues, 3.5 ligados y arrastres, 3.6
 * escala de blues y pentatónica mayor, 3.7 ritmos de música popular (6/8,
 * zamba, chacarera, tango y milonga, vals criollo) y el checkpoint 3. Cada
 * acorde nuevo entra al álbum de acordes (chordbook.ts). En la criolla la
 * cejilla cuesta más que en la eléctrica (cuerdas más tensas y mástil más ancho):
 * por eso el módulo 3.1 arranca con media cejilla.
 * Textos en `content.n.l31x…l36x` y `content.n.cp3`.
 */
import type { Checkpoint } from '../checkpoints';
import type { Exercise, Lesson, PlayAlongExercise, ScoreEvent } from '../types';
import type { StringId } from '../../instruments/profiles';
import { PENTA_BOXES } from '../../music/chords';
import { CHACARERA, MILONGA, QUARTERS, HALVES, SIX8_PULSE, VALS, WHOLES, ZAMBA } from '../../music/strum';
import { chordFretted, k, listen, n, strumListen } from './helpers';
import { changeLesson, chordLesson, ear, lesson, play, playScore, quiz, strum, tap } from './level2';
import { tabOf, waltzBar } from './helpers';

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


// ───────────── 3.5 · Ligados y arrastres ─────────────

const seq = (...xs: [StringId, number][]) => xs.map(([s, fret]) => ({ string: s, fret }));
const rep = <T,>(xs: T[], times: number) => Array.from({ length: times }, () => xs).flat();
const quarters = (xs: { string: StringId; fret: number }[]) => xs.map((x) => n(x.string, x.fret));

/** 3.5.5: frase con ligados en la pentatónica de La (primera posición). Sin notas iguales seguidas. */
export const SLUR_PHRASE: ScoreEvent[] = [
  n('G', 0), n('G', 2), n('B', 1), n('B', 3),
  n('e', 0), n('e', 3), n('e', 0), n('B', 3),
  n('B', 1), n('G', 2), n('G', 0), n('D', 2),
  n('G', 2, 4),
];
const SLUR_NOTES = tabOf(SLUR_PHRASE).map(({ string, fret }) => ({ string, fret }));

const l351 = lesson('3.5.1', 10, {
  visuals: ['hammer-on', 'hammer-on', null, null],
  sounds: [listen(quarters(rep(seq(['G', 0], ['G', 2]), 2)), 80), null, listen(quarters(seq(['B', 1], ['B', 3])), 60), null],
  cards: [{ figure: 'hammer-on' }, { listen: listen(quarters([...seq(['G', 0], ['G', 2]), ...seq(['B', 1], ['B', 3])]), 70) }],
  exercises: [
    quiz('3.5.1', 'q1', [k('3.5.1', 'q1o1'), k('3.5.1', 'q1o2'), k('3.5.1', 'q1o3')], 0),
    play('3.5.1', 'play', rep(seq(['G', 0], ['G', 2]), 4), null),
    play('3.5.1', 'play2', rep(seq(['B', 1], ['B', 3]), 4), null),
  ],
});

const l352 = lesson('3.5.2', 10, {
  visuals: ['pull-off', 'pull-off', null, null],
  sounds: [listen(quarters(rep(seq(['B', 3], ['B', 1]), 2)), 80), null, listen(quarters(seq(['e', 3], ['e', 0])), 60), null],
  cards: [{ figure: 'pull-off' }, { listen: listen(quarters([...seq(['B', 3], ['B', 1]), ...seq(['e', 3], ['e', 0])]), 70) }],
  exercises: [
    quiz('3.5.2', 'q1', [k('3.5.2', 'q1o1'), k('3.5.2', 'q1o2'), k('3.5.2', 'q1o3')], 1),
    play('3.5.2', 'play', rep(seq(['B', 3], ['B', 1]), 4), null),
    play('3.5.2', 'play2', rep(seq(['e', 3], ['e', 0]), 4), null),
  ],
});

const l353 = lesson('3.5.3', 10, {
  visuals: ['slide', 'slide', null, null],
  sounds: [listen(quarters(rep(seq(['e', 3], ['e', 5]), 2)), 80), null, listen([n('e', 3), n('e', 5, 2), n('e', 3)], 60), null],
  cards: [{ figure: 'slide' }, { listen: listen(quarters(rep(seq(['e', 3], ['e', 5]), 2)), 70) }],
  exercises: [play('3.5.3', 'play', rep(seq(['e', 3], ['e', 5]), 3), null), play('3.5.3', 'play2', rep(seq(['B', 3], ['B', 5]), 3), null)],
});

const TRILL = rep(seq(['e', 0], ['e', 1]), 4).map((x) => n(x.string, x.fret, 0.5));

const l354 = lesson('3.5.4', 10, {
  visuals: ['hammer-on', 'pull-off', null, null],
  sounds: [listen([...TRILL, ...TRILL], 80), null, null, null],
  cards: [{ listen: listen([...TRILL, ...TRILL], 70) }, {}],
  // Sin notas iguales seguidas: en el modo sin tempo, una nota repetida se daría por tocada sola.
  exercises: [play('3.5.4', 'play', [...rep(seq(['e', 0], ['e', 1]), 6), ...seq(['e', 0])], null)],
});

const l355 = lesson('3.5.5', 12, {
  visuals: [null, 'hammer-on', 'pull-off', null],
  sounds: [listen(SLUR_PHRASE, 80), null, null, listen(SLUR_PHRASE, 70)],
  cards: [{ listen: listen(SLUR_PHRASE, 70) }, {}],
  exercises: [
    { id: '3.5.5-tab', kind: 'tabReading', needsBass: false, skills: ['theory', 'fretboard'], promptKey: k('3.5.5', 'tab'), notes: tabOf(SLUR_PHRASE), frets: 4 },
    play('3.5.5', 'play', SLUR_NOTES, null),
  ],
});

// ───────────── 3.6 · Escala de blues y pentatónica mayor ─────────────

/** Escala de blues de La en primera posición: la pentatónica más la blue note (Mi♭). */
export const BLUES_SCALE: { string: StringId; fret: number }[] = seq(
  ['E', 0], ['E', 3], ['A', 0], ['A', 3], ['D', 0], ['D', 1], ['D', 2], ['G', 0], ['G', 2], ['B', 1], ['B', 3], ['B', 4], ['e', 0], ['e', 3],
);
/** Clases de altura de la escala de blues de La (La, Do, Re, Mi♭, Mi, Sol). */
export const BLUES_AM = [9, 0, 2, 3, 4, 7];
/** Pentatónica mayor de Do: las mismas notas que la menor de La, centradas en Do. */
export const PENTA_C_MAJOR = seq(['A', 3], ['D', 0], ['D', 2], ['G', 0], ['G', 2], ['B', 1], ['B', 3], ['e', 0], ['e', 3], ['e', 5]);
export const PENTA_C = [0, 2, 4, 7, 9];
const BOX1 = PENTA_BOXES[1].map(([s, fret]) => ({ string: s, fret }));
const BOX2 = PENTA_BOXES[2].map(([s, fret]) => ({ string: s, fret }));

const BLUE_LICK: ScoreEvent[] = [n('D', 0), n('D', 1), n('D', 2), n('G', 0), n('G', 2, 2), n('A', 3, 2)];
const C_BACK = strumListen(['C', 'Am', 'F', 'G'], QUARTERS, 70);

const l361 = lesson('3.6.1', 10, {
  visuals: [null, 'fret-hand', null, null],
  sounds: [listen(BLUE_LICK, 70), null, listen([n('D', 0), n('D', 2), n('G', 0), n('G', 2)], 70), null],
  cards: [{ listen: listen(BLUE_LICK, 60) }, {}],
  exercises: [
    quiz('3.6.1', 'q1', [k('3.6.1', 'q1o1'), k('3.6.1', 'q1o2'), k('3.6.1', 'q1o3')], 0),
    playScore('3.6.1', 'play', BLUE_LICK),
  ],
});

const l362 = lesson('3.6.2', 10, {
  visuals: [null, 'fret-hand', null, null],
  sounds: [null, listen(quarters([...BLUES_SCALE, ...seq(['e', 0], ['B', 4])]), 80), null, null],
  cards: [{ listen: listen(quarters([...BLUES_SCALE, ...seq(['e', 0], ['B', 4])]), 70) }, {}],
  exercises: [tap('3.6.2', 'tap', BLUES_SCALE.slice(4, 7)), play('3.6.2', 'play', BLUES_SCALE, null)],
});

const l363 = lesson('3.6.3', 10, {
  visuals: [null, 'chord-c', null, null],
  sounds: [C_BACK, listen(quarters([...PENTA_C_MAJOR, ...seq(['e', 3], ['e', 0])]), 80), null, null],
  cards: [{ listen: listen(quarters([...PENTA_C_MAJOR, ...seq(['e', 3], ['e', 0])]), 70) }, {}],
  exercises: [
    quiz('3.6.3', 'q1', [k('3.6.3', 'q1o1'), k('3.6.3', 'q1o2'), k('3.6.3', 'q1o3')], 0),
    play('3.6.3', 'play', PENTA_C_MAJOR, null),
  ],
});

const l364 = lesson('3.6.4', 12, {
  visuals: ['penta-box', 'penta-box', 'penta-box-2', null],
  sounds: [null, listen(quarters(BOX1), 80), listen(quarters(BOX2), 80), null],
  cards: [{ figure: 'penta-box', listen: listen(quarters(BOX1), 70) }, { figure: 'penta-box-2', listen: listen(quarters(BOX2), 70) }],
  exercises: [tap('3.6.4', 'tap', BOX2.slice(0, 6)), play('3.6.4', 'play', BOX1, null), play('3.6.4', 'play2', BOX2, null)],
});

const l365 = lesson('3.6.5', 14, {
  visuals: [null, 'chord-a7', 'chord-c', null],
  sounds: [strumListen(BLUES_A.slice(0, 4), QUARTERS, 70), null, C_BACK, null],
  cards: [{ listen: strumListen(BLUES_A, QUARTERS, 70) }, { listen: C_BACK }],
  exercises: [
    { id: '3.6.5-blues', kind: 'improvise', needsBass: true, skills: ['ear', 'technique'], promptKey: k('3.6.5', 'blues'), backing: strumListen(BLUES_A, QUARTERS, 70), loops: 1, scale: BLUES_AM, minNotes: 16 },
    { id: '3.6.5-major', kind: 'improvise', needsBass: true, skills: ['ear', 'technique'], promptKey: k('3.6.5', 'major'), backing: C_BACK, loops: 2, scale: PENTA_C, minNotes: 12 },
  ],
});

// ───────────── 3.7 · Ritmos de música popular ─────────────
// Compases de 6 corcheas (3 pulsos de negra): el 6/8 de la zamba y la chacarera y
// el 3/4 del vals. El tango y la milonga son de 4/4.

/** Ejercicio de tocar con la banda en compases de 3 pulsos. */
const play3 = (lessonId: string, key: string, score: ScoreEvent[], bpm = 60): Exercise => {
  const ex = playScore(lessonId, key, score, bpm) as PlayAlongExercise;
  return { ...ex, beatsPerBar: 3 };
};
const three = { beatsPerBar: 3 as const };

export const SIX8_CHORDS = ['Am', 'E7', 'Am', 'E7'];
export const ZAMBA_CHORDS = ['Am', 'Dm', 'E7', 'Am'];
export const CHACARERA_CHORDS = ['Am', 'E7', 'Dm', 'E7'];
export const TANGO_CHORDS = ['Am', 'Dm', 'E7', 'Am'];
export const VALS_CHORDS = ['C', 'G7', 'G7', 'C'];
export const ZAMBA_LINE = ZAMBA_CHORDS.flatMap(waltzBar);
export const VALS_LINE = VALS_CHORDS.flatMap(waltzBar);

const l371 = lesson('3.7.1', 10, {
  visuals: [null, 'chord-am', 'chord-e7', null],
  sounds: [strumListen(SIX8_CHORDS, SIX8_PULSE, 60, three), null, strumListen(SIX8_CHORDS, QUARTERS, 60), null],
  cards: [{ listen: strumListen(SIX8_CHORDS, SIX8_PULSE, 60, { ...three, click: true }) }, { listen: strumListen(SIX8_CHORDS, QUARTERS, 60, { click: true }) }],
  exercises: [
    quiz('3.7.1', 'q1', [k('3.7.1', 'q1o1'), k('3.7.1', 'q1o2'), k('3.7.1', 'q1o3')], 0),
    ear('3.7.1', 'ear', [k('3.7.1', 'four'), k('3.7.1', 'six')], 1, { example: strumListen(SIX8_CHORDS, SIX8_PULSE, 60, three) }),
    strum('3.7.1', 'strum', SIX8_CHORDS, SIX8_PULSE, 60),
  ],
});

const l372 = lesson('3.7.2', 12, {
  visuals: ['chord-am', 'chord-dm', 'chord-e7', null],
  sounds: [strumListen(ZAMBA_CHORDS, ZAMBA, 60, three), null, listen(ZAMBA_LINE, 60, three), null],
  cards: [{ listen: strumListen(ZAMBA_CHORDS, ZAMBA, 60, { ...three, click: true }) }, { listen: listen(ZAMBA_LINE, 60, { ...three, click: true }) }],
  exercises: [
    quiz('3.7.2', 'q1', [k('3.7.2', 'q1o1'), k('3.7.2', 'q1o2'), k('3.7.2', 'q1o3')], 0),
    strum('3.7.2', 'strum', ZAMBA_CHORDS, ZAMBA, 60),
    play3('3.7.2', 'play', ZAMBA_LINE, 60),
  ],
});

const l373 = lesson('3.7.3', 12, {
  visuals: ['chord-am', 'chord-e7', 'chord-dm', null],
  sounds: [strumListen(CHACARERA_CHORDS, CHACARERA, 66, three), null, strumListen(CHACARERA_CHORDS, ZAMBA, 60, three), null],
  cards: [{ listen: strumListen(CHACARERA_CHORDS, CHACARERA, 60, { ...three, click: true }) }, { listen: strumListen(CHACARERA_CHORDS, ZAMBA, 60, { ...three, click: true }) }],
  exercises: [
    quiz('3.7.3', 'q1', [k('3.7.3', 'q1o1'), k('3.7.3', 'q1o2'), k('3.7.3', 'q1o3')], 0),
    ear('3.7.3', 'ear', [k('3.7.3', 'zamba'), k('3.7.3', 'chacarera')], 1, { example: strumListen(CHACARERA_CHORDS, CHACARERA, 66, three) }),
    strum('3.7.3', 'strum', CHACARERA_CHORDS, CHACARERA, 60),
  ],
});

const l374 = lesson('3.7.4', 12, {
  visuals: ['chord-am', 'chord-dm', 'chord-e7', null],
  sounds: [strumListen(TANGO_CHORDS, QUARTERS, 66), null, strumListen(TANGO_CHORDS, MILONGA, 66), null],
  cards: [{ listen: strumListen(TANGO_CHORDS, QUARTERS, 60, { click: true }) }, { listen: strumListen(TANGO_CHORDS, MILONGA, 60, { click: true }) }],
  exercises: [
    quiz('3.7.4', 'q1', [k('3.7.4', 'q1o1'), k('3.7.4', 'q1o2'), k('3.7.4', 'q1o3')], 0),
    strum('3.7.4', 'tango', TANGO_CHORDS, QUARTERS, 66),
    strum('3.7.4', 'milonga', TANGO_CHORDS, MILONGA, 60),
  ],
});

const l375 = lesson('3.7.5', 12, {
  visuals: ['chord-c', 'chord-g7', null, null],
  sounds: [strumListen(VALS_CHORDS, VALS, 72, three), null, listen(VALS_LINE, 72, three), null],
  cards: [{ listen: strumListen(VALS_CHORDS, VALS, 70, { ...three, click: true }) }, { listen: listen(VALS_LINE, 70, { ...three, click: true }) }],
  exercises: [
    quiz('3.7.5', 'q1', [k('3.7.5', 'q1o1'), k('3.7.5', 'q1o2'), k('3.7.5', 'q1o3')], 0),
    strum('3.7.5', 'strum', VALS_CHORDS, VALS, 70),
    play3('3.7.5', 'play', VALS_LINE, 70),
  ],
});

export const NYLON_LEVEL3_LESSONS: Lesson[] = [
  l311, l312, l313, l314, l321, l322, l323, l324, l325, l331, l332, l333, l334, l335, l341, l342, l343, l344, l345,
  l351, l352, l353, l354, l355, l361, l362, l363, l364, l365,
  l371, l372, l373, l374, l375,
];

// ───────────── Checkpoint 3 ─────────────

const ck = (key: string) => `content.n.cp3.${key}`;

export const NYLON_CP3: Checkpoint = {
  level: 3,
  titleKey: 'content.n.checkpoint.3',
  introKey: ck('intro'),
  mastery: 0.8,
  parts: [
    { id: 'ncp3-ear', kind: 'ear', needsBass: false, skills: ['ear'], promptKey: ck('ear'), options: [k('3.4.1', 'triad'), k('3.4.1', 'seventh')], correctIndex: 1, example: strumListen(['B7'], WHOLES, 60) },
    { id: 'ncp3-barres', kind: 'strum', needsBass: true, skills: ['rhythm', 'technique'], promptKey: ck('barres'), bpm: 70, pattern: QUARTERS, chords: ['Bb', 'Gm', 'Cm', 'F7', 'F', 'F#m', 'Bm7', 'E7'] },
    { id: 'ncp3-blues', kind: 'strum', needsBass: true, skills: ['rhythm'], promptKey: ck('blues'), bpm: 72, pattern: QUARTERS, chords: BLUES_E },
    { id: 'ncp3-solo', kind: 'playAlong', needsBass: true, skills: ['technique', 'fretboard'], promptKey: ck('solo'), notes: SLUR_NOTES, bpm: null },
  ],
};
