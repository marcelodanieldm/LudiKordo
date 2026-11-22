/**
 * Guitarra criolla, nivel 4: 4.1 campo armónico, 4.2 acordes de
 * jazz, 4.3 bossa nova, 4.4 las cinco cajas pentatónicas, 4.5 escalas mayor y
 * menor natural, 4.6 fraseo e improvisación, y el checkpoint 4. Cada acorde nuevo entra al álbum (chordbook.ts): 4.1
 * Cmaj7, Dm7, Gmaj7 y Bm7b5; 4.2 Gm7, Bbmaj7, Em7b5 y A7b9; 4.3 C6/9, Dm6, G13 y
 * G#dim7. Todos tienen la 1.ª sonando, así que sirven con cualquier patrón de
 * mano derecha. Textos en `content.n.l41x…l46x` y `content.n.cp4`.
 */
import type { Checkpoint } from '../checkpoints';
import type { Exercise, ListenExample, Lesson, ScoreEvent } from '../types';
import type { StringId } from '../../instruments/profiles';
import { MAJOR_G_NOTES, MINOR_A_NOTES, PENTA_BOXES, chordFromName } from '../../music/chords';
import { BOSSA_FINGERS, CHARLESTON, QUARTERS } from '../../music/strum';
import { chordArp, chordFigure, chordFretted, k, listen, n, strumListen, type AlbumChord } from './helpers';
import { PENTA_AM, changeLesson, chordLesson, ear, lesson, play, playScore, quiz, strum, tap } from './level2';
import { BLUES_A, BLUES_AM } from './level3';

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

// ───────────── 4.4 · Las 5 cajas pentatónicas (La menor) ─────────────

const asNotes = (xs: [StringId, number][]) => xs.map(([string, fret]) => ({ string, fret }));
const quarters = (xs: { string: StringId; fret: number }[]) => xs.map((x) => n(x.string, x.fret));
const BOX = (i: 1 | 2 | 3 | 4 | 5) => asNotes(PENTA_BOXES[i]);
const AM_BACK = strumListen(['Am7', 'Dm7', 'Am7', 'E7'], QUARTERS, 70);

const improvise = (lessonId: string, key: string, backing: ListenExample, scale: number[], minNotes: number, loops = 2, targets?: number[][]): Exercise => ({
  id: `${lessonId}-${key}`,
  kind: 'improvise',
  needsBass: true,
  skills: ['ear', 'technique'],
  promptKey: k(lessonId, key),
  backing,
  loops,
  scale,
  minNotes,
  ...(targets ? { targets } : {}),
});

/** Clases de altura de cada acorde de una vuelta: las notas a las que llegar en cada cambio. */
export const targetsOf = (chords: string[]) => chords.map((c) => [...new Set((chordFromName(c) ?? []).map((m) => m % 12))]);

const boxLesson = (id: string, box: 3 | 4 | 5, figure: 'penta-box-3' | 'penta-box-4' | 'penta-box-5', correct: number, extra: Exercise[] = []): Lesson =>
  lesson(id, 10, {
    visuals: [null, figure, figure, null],
    sounds: [AM_BACK, listen(quarters(BOX(box)), 80), null, null],
    cards: [{ figure, listen: listen(quarters(BOX(box)), 70) }, { listen: AM_BACK }],
    exercises: [q3(id, correct), ...extra, play(id, 'play', BOX(box), null)],
  });

const l441 = boxLesson('4.4.1', 3, 'penta-box-3', 0);
const l442 = boxLesson('4.4.2', 4, 'penta-box-4', 1);
const l443 = boxLesson('4.4.3', 5, 'penta-box-5', 0, [tap('4.4.3', 'tap', BOX(5).slice(0, 6))]);

/** Una frase que sube y baja por las cajas 1, 2 y 3 en las tres cuerdas agudas. */
export const ACROSS_BOXES: ScoreEvent[] = [
  n('e', 5), n('e', 8), n('e', 10), n('e', 12),
  n('B', 13), n('B', 10), n('B', 8), n('B', 5),
  n('G', 5), n('G', 7), n('G', 9), n('G', 12),
  n('e', 5, 4),
];

const l444 = lesson('4.4.4', 12, {
  visuals: ['penta-box', 'penta-box-2', 'penta-box-3', null],
  sounds: [listen(ACROSS_BOXES, 70), null, AM_BACK, null],
  cards: [{ listen: listen(ACROSS_BOXES, 60, { click: true }) }, { figure: 'penta-box-2' }],
  exercises: [q3('4.4.4', 0), playScore('4.4.4', 'play', ACROSS_BOXES, 70)],
});

const l445 = lesson('4.4.5', 14, {
  visuals: ['penta-box', 'penta-box-3', 'penta-box-5', null],
  sounds: [AM_BACK, null, AM_BACK, null],
  cards: [{ listen: AM_BACK }, { figure: 'penta-box-5' }],
  exercises: [q3('4.4.5', 0), improvise('4.4.5', 'improv', AM_BACK, PENTA_AM, 20, 2)],
});

// ───────────── 4.5 · Escala mayor y menor natural ─────────────

/** Do mayor en primera posición (cuerdas al aire). */
export const C_MAJOR_OPEN: [StringId, number][] = [['A', 3], ['D', 0], ['D', 2], ['D', 3], ['G', 0], ['G', 2], ['B', 0], ['B', 1]];
/** La menor natural en primera posición: las mismas notas que Do mayor, desde La. */
export const A_MINOR_OPEN: [StringId, number][] = [['A', 0], ['A', 2], ['A', 3], ['D', 0], ['D', 2], ['D', 3], ['G', 0], ['G', 2]];
const G_MAJOR = asNotes(MAJOR_G_NOTES);
const A_MINOR = asNotes(MINOR_A_NOTES);

const l451 = lesson('4.5.1', 12, {
  visuals: [null, 'scale-major', 'scale-major', null],
  sounds: [null, listen(quarters(asNotes(C_MAJOR_OPEN)), 80), listen(quarters(G_MAJOR.slice(0, 8)), 80), null],
  cards: [{ listen: listen(quarters(asNotes(C_MAJOR_OPEN)), 70) }, { figure: 'scale-major', listen: listen(quarters(G_MAJOR.slice(0, 8)), 70) }],
  exercises: [q3('4.5.1', 0), play('4.5.1', 'open', asNotes(C_MAJOR_OPEN), null), play('4.5.1', 'play', G_MAJOR, null)],
});

const l452 = lesson('4.5.2', 12, {
  visuals: [null, 'scale-minor', 'scale-minor', null],
  sounds: [AM_BACK, listen(quarters(A_MINOR.slice(0, 8)), 80), null, null],
  cards: [{ figure: 'scale-minor', listen: listen(quarters(A_MINOR.slice(0, 8)), 70) }, { listen: listen(quarters(BOX(1).slice(0, 6)), 70) }],
  exercises: [q3('4.5.2', 1), play('4.5.2', 'play', A_MINOR, null)],
});

const l453 = lesson('4.5.3', 10, {
  visuals: ['chord-c', 'chord-am', null, null],
  sounds: [listen(quarters(asNotes(C_MAJOR_OPEN)), 80), listen(quarters(asNotes(A_MINOR_OPEN)), 80), null, null],
  cards: [{ listen: listen(quarters(asNotes(C_MAJOR_OPEN)), 70) }, { listen: listen(quarters(asNotes(A_MINOR_OPEN)), 70) }],
  exercises: [
    q3('4.5.3', 0),
    ear('4.5.3', 'ear', [k('4.5.3', 'major'), k('4.5.3', 'minor')], 1, { example: listen(quarters(asNotes(A_MINOR_OPEN)), 70) }),
    play('4.5.3', 'play', asNotes(A_MINOR_OPEN), null),
  ],
});

/** Secuencia de a cuatro en Sol mayor (2.ª posición): 1234, 2345, 3456, 4567 y Sol. */
const G = MAJOR_G_NOTES;
export const G_SEQUENCE: ScoreEvent[] = [
  ...[0, 1, 2, 3].flatMap((start) => G.slice(start, start + 4).map(([s, f]) => n(s, f))),
  n('D', 5, 4),
];

const l454 = lesson('4.5.4', 12, {
  visuals: [null, 'scale-major', null, null],
  sounds: [listen(G_SEQUENCE, 70), null, listen(G_SEQUENCE, 60), null],
  cards: [{ listen: listen(G_SEQUENCE, 60, { click: true }) }, { figure: 'scale-major' }],
  exercises: [q3('4.5.4', 0), playScore('4.5.4', 'play', G_SEQUENCE, 60)],
});

/** Arpegios de Gmaj7, Am7, Bm7 y Cmaj7 en la 2.ª posición (los primeros cuatro acordes de Sol mayor). */
export const G_ARPEGGIOS: ScoreEvent[] = [
  n('E', 3), n('A', 2), n('A', 5), n('D', 4),
  n('E', 5), n('A', 3), n('D', 2), n('D', 5),
  n('A', 2), n('A', 5), n('D', 4), n('G', 2),
  n('A', 3), n('D', 2), n('D', 5), n('G', 4),
  n('D', 5, 4),
];

const l455 = lesson('4.5.5', 12, {
  visuals: [fig('Gmaj7'), 'chord-am7', null, null],
  sounds: [listen(G_ARPEGGIOS, 70), null, strumListen(['Gmaj7', 'Am7', 'Bm7', 'Cmaj7', 'Gmaj7'], QUARTERS, 70), null],
  cards: [{ listen: listen(G_ARPEGGIOS, 60, { click: true }) }, { listen: strumListen(['Gmaj7', 'Am7', 'Bm7', 'Cmaj7', 'Gmaj7'], QUARTERS, 60) }],
  exercises: [q3('4.5.5', 0), playScore('4.5.5', 'play', G_ARPEGGIOS, 60)],
});

// ───────────── 4.6 · Fraseo e improvisación ─────────────

/** Pregunta (termina en Re, abierta) y respuesta (termina en La, la tónica), en la caja 1. */
export const QUESTION_ANSWER: ScoreEvent[] = [
  n('e', 5), n('e', 8), n('B', 8), n('B', 5),
  n('G', 7, 2), { rest: true, beats: 2 },
  n('G', 7), n('G', 5), n('B', 5), n('B', 8),
  n('e', 5, 4),
];

const l461 = lesson('4.6.1', 12, {
  visuals: ['penta-box', null, null, null],
  sounds: [listen(QUESTION_ANSWER.slice(0, 6), 70), listen(QUESTION_ANSWER.slice(6), 70), null, null],
  cards: [{ listen: listen(QUESTION_ANSWER.slice(0, 6), 60, { click: true }) }, { listen: listen(QUESTION_ANSWER, 60, { click: true }) }],
  exercises: [q3('4.6.1', 0), playScore('4.6.1', 'play', QUESTION_ANSWER, 70), improvise('4.6.1', 'improv', AM_BACK, PENTA_AM, 12, 2)],
});

/** Am7 y Dm7: cada compás empieza en una nota del acorde. */
export const AM_DM = ['Am7', 'Dm7', 'Am7', 'Dm7'];
export const CHORD_TONES: ScoreEvent[] = [
  n('e', 5), n('B', 8), n('B', 5), n('G', 7),
  n('B', 6), n('B', 5), n('G', 7), n('G', 5),
  n('B', 5), n('B', 8), n('e', 5), n('e', 8),
  n('e', 10, 4),
];
const AM_DM_BACK = strumListen(AM_DM, QUARTERS, 70);

const l462 = lesson('4.6.2', 12, {
  visuals: ['chord-am7', fig('Dm7'), null, null],
  sounds: [AM_DM_BACK, listen(CHORD_TONES, 70), null, null],
  cards: [{ listen: listen(CHORD_TONES, 60, { click: true }) }, { listen: AM_DM_BACK }],
  exercises: [
    playScore('4.6.2', 'play', CHORD_TONES, 70),
    improvise('4.6.2', 'improv', AM_DM_BACK, PENTA_AM, 16, 2, targetsOf(AM_DM)),
  ],
});

const BLUES_BACK = strumListen(BLUES_A, QUARTERS, 70);
const l463 = lesson('4.6.3', 14, {
  visuals: ['chord-a7', 'chord-d7', 'chord-e7', null],
  sounds: [strumListen(BLUES_A.slice(0, 4), QUARTERS, 70), null, BLUES_BACK, null],
  cards: [{ listen: BLUES_BACK }, { listen: strumListen(BLUES_A.slice(8), QUARTERS, 70) }],
  exercises: [q3('4.6.3', 0), improvise('4.6.3', 'improv', BLUES_BACK, BLUES_AM, 24, 1, targetsOf(BLUES_A))],
});

/** Una línea de arpegios sobre el II-V-I de Sol: Am7, D7, Gmaj7 y Sol. */
export const II_V_I_LINE: ScoreEvent[] = [
  n('E', 5), n('A', 3), n('D', 2), n('D', 5),
  n('A', 5), n('D', 4), n('G', 2), n('G', 5),
  n('E', 3), n('A', 2), n('A', 5), n('D', 4),
  n('D', 5, 4),
];
export const G_MAJOR_PCS = [7, 9, 11, 0, 2, 4, 6];
const II_V_I_BACK = strumListen(II_V_I_G, QUARTERS, 70);

const l464 = lesson('4.6.4', 14, {
  visuals: ['chord-am7', 'chord-d7', fig('Gmaj7'), null],
  sounds: [II_V_I_BACK, listen(II_V_I_LINE, 70), null, null],
  cards: [{ listen: listen(II_V_I_LINE, 60, { click: true }) }, { listen: II_V_I_BACK }],
  exercises: [
    playScore('4.6.4', 'play', II_V_I_LINE, 60),
    improvise('4.6.4', 'improv', II_V_I_BACK, G_MAJOR_PCS, 16, 2, targetsOf(II_V_I_G)),
  ],
});

/** Melodía original de bossa sobre Cmaj7, Dm7, G7 y Cmaj7, en primera posición. */
export const BOSSA_MELODY: ScoreEvent[] = [
  n('e', 0, 2), n('B', 0), n('B', 1),
  n('e', 1, 2), n('B', 3), n('B', 1),
  n('B', 3, 2), n('B', 0), n('G', 0),
  n('B', 1, 4),
];
const C_MAJOR_PCS = [0, 2, 4, 5, 7, 9, 11];
const BOSSA_BACK = strumListen(BOSSA_I, BOSSA_FINGERS, 70);

const l465 = lesson('4.6.5', 14, {
  visuals: [fig('Cmaj7'), null, null, null],
  sounds: [listen(BOSSA_MELODY, 70), BOSSA_BACK, null, null],
  cards: [{ listen: listen(BOSSA_MELODY, 60, { click: true }) }, { listen: BOSSA_BACK }],
  exercises: [
    playScore('4.6.5', 'play', BOSSA_MELODY, 70),
    improvise('4.6.5', 'improv', BOSSA_BACK, C_MAJOR_PCS, 16, 2, targetsOf(BOSSA_I)),
  ],
});

export const NYLON_LEVEL4_LESSONS: Lesson[] = [
  l411, l412, l413, l414, l415,
  l421, l422, l423, l424, l425,
  l431, l432, l433, l434, l435,
  l441, l442, l443, l444, l445,
  l451, l452, l453, l454, l455,
  l461, l462, l463, l464, l465,
];

// ───────────── Checkpoint 4 ─────────────

const ck = (key: string) => `content.n.cp4.${key}`;

export const NYLON_CP4: Checkpoint = {
  level: 4,
  titleKey: 'content.n.checkpoint.4',
  introKey: ck('intro'),
  mastery: 0.8,
  parts: [
    { id: 'ncp4-ear', kind: 'ear', needsBass: false, skills: ['ear'], promptKey: ck('ear'), options: [ck('major'), ck('minor')], correctIndex: 1, example: strumListen(II_V_I_AM, QUARTERS, 70) },
    { id: 'ncp4-comping', kind: 'strum', needsBass: true, skills: ['rhythm', 'technique'], promptKey: ck('comping'), bpm: 72, pattern: CHARLESTON, chords: COMPING },
    { id: 'ncp4-bossa', kind: 'strum', needsBass: true, skills: ['rhythm', 'technique'], promptKey: ck('bossa'), bpm: 70, pattern: BOSSA_FINGERS, chords: BOSSA_TURN },
    { id: 'ncp4-improv', kind: 'improvise', needsBass: true, skills: ['ear', 'technique'], promptKey: ck('improv'), backing: strumListen(COMPING, QUARTERS, 70), loops: 1, scale: [0, 2, 4, 5, 7, 9, 10, 11], minNotes: 24, targets: targetsOf(COMPING) },
  ],
};
