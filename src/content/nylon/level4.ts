/**
 * Guitarra criolla, nivel 4 (primera parte): 4.1 campo armónico, 4.2 acordes de
 * jazz y 4.3 bossa nova. Cada acorde nuevo entra al álbum (chordbook.ts): 4.1
 * Cmaj7, Dm7, Gmaj7 y Bm7b5; 4.2 Gm7, Bbmaj7, Em7b5 y A7b9; 4.3 C6/9, Dm6, G13 y
 * G#dim7. Todos tienen la 1.ª sonando, así que sirven con cualquier patrón de
 * mano derecha. Textos en `content.n.l41x…l43x`.
 */
import type { Lesson, ScoreEvent } from '../types';
import { BOSSA_FINGERS, CHARLESTON, QUARTERS } from '../../music/strum';
import { chordArp, chordFigure, chordFretted, k, listen, n, strumListen, type AlbumChord } from './helpers';
import { changeLesson, chordLesson, ear, lesson, playScore, quiz, strum, tap } from './level2';

const fig = chordFigure;
const q3 = (id: string, correct = 0) => quiz(id, 'q1', [k(id, 'q1o1'), k(id, 'q1o2'), k(id, 'q1o3')], correct);

// ───────────── 4.1 · Campo armónico ─────────────

/** Los acordes de Do mayor que ya están en el álbum (falta el VII, Bdim). */
export const C_FIELD = ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'G', 'C'];

const l411 = changeLesson('4.1.1', 12, C_FIELD, QUARTERS, ['chord-c', 'chord-dm', 'chord-g', null], [q3('4.1.1', 2)]);

const l412 = chordLesson('4.1.2', 'Cmaj7');

/** Funciones: tónica (Cmaj7), subdominante (Dm7), dominante (G7) y vuelta a la tónica. */
export const FUNCTIONS = ['Cmaj7', 'Dm7', 'G7', 'Cmaj7'];
const l413 = changeLesson('4.1.3', 12, FUNCTIONS, QUARTERS, [fig('Cmaj7'), fig('Dm7'), 'chord-g7', null], [
  q3('4.1.3', 1),
  tap('4.1.3', 'tap', chordFretted('Dm7')),
]);

/** II-V-I en Sol mayor. */
export const II_V_I_G = ['Am7', 'D7', 'Gmaj7', 'Gmaj7'];
const l414 = changeLesson('4.1.4', 12, II_V_I_G, QUARTERS, ['chord-am7', 'chord-d7', fig('Gmaj7'), null], [
  q3('4.1.4', 0),
  tap('4.1.4', 'tap', chordFretted('Gmaj7')),
]);

/** II-V-I en La menor: el II es semidisminuido. */
export const II_V_I_AM = ['Bm7b5', 'E7', 'Am7', 'Am7'];
const l415 = changeLesson('4.1.5', 12, II_V_I_AM, QUARTERS, [fig('Bm7b5'), 'chord-e7', 'chord-am7', null], [
  q3('4.1.5', 0),
  tap('4.1.5', 'tap', chordFretted('Bm7b5')),
]);

// ───────────── 4.2 · Acordes de jazz ─────────────

const l421 = chordLesson('4.2.1', 'Gm7');
const l422 = chordLesson('4.2.2', 'Bbmaj7');

/** II-V-I en Fa mayor. */
export const II_V_I_F = ['Gm7', 'C7', 'Fmaj7', 'Fmaj7'];
const l423 = changeLesson('4.2.3', 12, II_V_I_F, QUARTERS, [fig('Gm7'), 'chord-c7', 'chord-fmaj7', null], [q3('4.2.3', 0)]);

/** II-V-I en Re menor, con la novena bemol en el V. */
export const II_V_I_DM = ['Em7b5', 'A7b9', 'Dm7', 'Dm7'];
const l424 = changeLesson('4.2.4', 14, II_V_I_DM, QUARTERS, [fig('Em7b5'), fig('A7b9'), fig('Dm7'), null], [
  tap('4.2.4', 'tap1', chordFretted('Em7b5')),
  tap('4.2.4', 'tap2', chordFretted('A7b9')),
]);

/** Comping: el ritmo charleston sobre dos II-V-I. */
export const COMPING = ['Gm7', 'C7', 'Fmaj7', 'Fmaj7', 'Dm7', 'G7', 'Cmaj7', 'Cmaj7'];
const l425 = lesson('4.2.5', 12, {
  visuals: [null, fig('Gm7'), 'chord-c7', null],
  sounds: [strumListen(COMPING, CHARLESTON, 80), null, strumListen(COMPING.slice(4), CHARLESTON, 70), null],
  cards: [
    { listen: strumListen(COMPING.slice(0, 4), CHARLESTON, 70, { click: true }) },
    { listen: strumListen(COMPING.slice(0, 4), QUARTERS, 70, { click: true }) },
  ],
  exercises: [
    q3('4.2.5', 0),
    ear('4.2.5', 'ear', [k('4.2.5', 'quarters'), k('4.2.5', 'charleston')], 1, { example: strumListen(COMPING.slice(0, 4), CHARLESTON, 70) }),
    strum('4.2.5', 'strum', COMPING, CHARLESTON, 70),
  ],
});

// ───────────── 4.3 · Bossa nova ─────────────

/** Bajo de bossa: el pulgar en el 1 (tónica) y en el 3 (otra nota grave del acorde). */
export function bossaThumbBar(id: AlbumChord): ScoreEvent[] {
  const [b, alt] = chordArp(id);
  return [n(b.string, b.fret, 2), n(alt.string, alt.fret, 2)];
}

export const BOSSA_I = ['Cmaj7', 'Dm7', 'G7', 'Cmaj7'];
export const BOSSA_THUMB = BOSSA_I.flatMap(bossaThumbBar);

const l431 = lesson('4.3.1', 10, {
  visuals: [null, fig('Cmaj7'), fig('Dm7'), null],
  sounds: [listen(BOSSA_THUMB, 70), null, strumListen(BOSSA_I, BOSSA_FINGERS, 70), null],
  cards: [{ listen: listen(BOSSA_THUMB, 70, { click: true }) }, { figure: fig('Cmaj7') }],
  exercises: [q3('4.3.1', 0), playScore('4.3.1', 'play', BOSSA_THUMB, 70)],
});

const l432 = lesson('4.3.2', 12, {
  visuals: [null, fig('Cmaj7'), 'chord-g7', null],
  sounds: [strumListen(BOSSA_I, BOSSA_FINGERS, 70), null, strumListen(BOSSA_I, QUARTERS, 70), null],
  cards: [
    { listen: strumListen(BOSSA_I, BOSSA_FINGERS, 60, { click: true }) },
    { listen: strumListen(BOSSA_I, BOSSA_FINGERS, 70, { click: true }) },
  ],
  exercises: [
    q3('4.3.2', 1),
    ear('4.3.2', 'ear', [k('4.3.2', 'straight'), k('4.3.2', 'bossa')], 1, { example: strumListen(BOSSA_I, BOSSA_FINGERS, 70) }),
    strum('4.3.2', 'strum', BOSSA_I, BOSSA_FINGERS, 60),
  ],
});

/** La batida: pulgar y dedos juntos, sobre Dm6 y G13. */
export const BATIDA = ['Dm6', 'G13', 'Cmaj7', 'Cmaj7'];
const l433 = lesson('4.3.3', 14, {
  visuals: [fig('Dm6'), fig('G13'), null, null],
  sounds: [strumListen(BATIDA, BOSSA_FINGERS, 70), null, listen(BATIDA.flatMap(bossaThumbBar), 70), null],
  cards: [{ figure: fig('Dm6'), listen: strumListen(['Dm6', 'Dm6'], BOSSA_FINGERS, 60) }, { figure: fig('G13'), listen: strumListen(['G13', 'G13'], BOSSA_FINGERS, 60) }],
  exercises: [
    tap('4.3.3', 'tap1', chordFretted('Dm6')),
    tap('4.3.3', 'tap2', chordFretted('G13')),
    strum('4.3.3', 'strum', BATIDA, BOSSA_FINGERS, 60),
  ],
});

/** El disminuido de paso: G#dim7 está medio tono debajo de Am7 y lo prepara. */
export const PASSING = ['C6/9', 'G#dim7', 'Am7', 'D7'];
const l434 = lesson('4.3.4', 12, {
  visuals: [fig('C6/9'), fig('G#dim7'), 'chord-am7', null],
  sounds: [strumListen(PASSING, QUARTERS, 70), null, strumListen(PASSING, BOSSA_FINGERS, 70), null],
  cards: [{ figure: fig('C6/9'), listen: strumListen(['C6/9', 'C6/9'], QUARTERS, 60) }, { figure: fig('G#dim7'), listen: strumListen(['G#dim7', 'Am7'], QUARTERS, 60) }],
  exercises: [
    q3('4.3.4', 0),
    tap('4.3.4', 'tap1', chordFretted('C6/9')),
    tap('4.3.4', 'tap2', chordFretted('G#dim7')),
    strum('4.3.4', 'strum', PASSING, QUARTERS, 70),
  ],
});

/** Una vuelta de bossa de 8 compases con todo el módulo. */
export const BOSSA_TURN = ['C6/9', 'G#dim7', 'Am7', 'D7', 'Dm6', 'G13', 'C6/9', 'C6/9'];
const l435 = changeLesson('4.3.5', 14, BOSSA_TURN, BOSSA_FINGERS, [fig('C6/9'), fig('Dm6'), fig('G13'), null]);

export const NYLON_LEVEL4_LESSONS: Lesson[] = [
  l411, l412, l413, l414, l415,
  l421, l422, l423, l424, l425,
  l431, l432, l433, l434, l435,
];
