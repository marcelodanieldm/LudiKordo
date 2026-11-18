/**
 * Guitarra eléctrica, nivel 4: improvisación y nivel intermedio.
 * 4.1 las 5 cajas pentatónicas · 4.2 todo el mástil · 4.3 escala mayor y menor
 * natural · 4.4 modos · 4.5 fraseo · 4.6 púa rápida · 4.7 notas dobles y
 * tríadas · 4.8 tapping · 4.9 efectos · 4.10 proyecto final · checkpoint 4.
 *
 * Improvisar se practica con el ejercicio `improvise`: la app toca una pista de
 * acompañamiento sintetizada y escucha si las notas caen en la escala (y, cuando
 * la lección lo pide, si se llega a una nota del acorde en cada cambio). Lo que
 * se puntúa se toca en limpio o crunch; los efectos se aprenden de oído (ADR 0009).
 * Todo es material original. Textos en `content.g.l41x…l410x` y `content.g.cp4`.
 */
import type { Checkpoint } from '../checkpoints';
import type { Exercise, Figure, Lesson, ListenExample, PlayAlongExercise, ScoreEvent } from '../types';
import type { StringId } from '../../instruments/profiles';
import { BARRES, DORIAN_A_NOTES, MAJOR_G_NOTES, MINOR_A_NOTES, MIXO_A_NOTES, PENTA_BOXES, PHRYG_A_NOTES, chordMidi, diagramMidi, type ChordId } from '../../music/chords';
import type { Fx } from '../../music/fx';
import { BALLAD, HALVES, QUARTERS, type Stroke } from '../../music/strum';
import type { Tone } from '../../music/timbre';
import { k, listen, n, notesOf, rest, strumListen } from './helpers';
import { STEPS, lesson, play, quiz, strum, tab, tap } from './level2';

// ───────────── Constructores ─────────────

type Pos = { string: StringId; fret: number };
const seq = (...xs: [StringId, number][]): Pos[] => xs.map(([s, fret]) => ({ string: s, fret }));
const rep = <T,>(xs: T[], times: number) => Array.from({ length: times }, () => xs).flat();
const quarters = (xs: Pos[]) => xs.map((x) => n(x.string, x.fret));
const eighths = (xs: Pos[]) => xs.map((x) => n(x.string, x.fret, 0.5));
/** Ida y vuelta sin repetir la nota de arriba (en el modo sin tempo, una nota repetida se daría por tocada sola). */
const upDown = (xs: Pos[]) => [...xs, ...xs.slice(0, -1).reverse()];
const box = (b: 1 | 2 | 3 | 4 | 5) => seq(...PENTA_BOXES[b]);

/** Partitura con tempo y escalones propios (púa rápida). */
const fast = (lessonId: string, key: string, score: ScoreEvent[], steps: number[]): Exercise => ({
  ...(play(lessonId, key, notesOf(score), steps[0], score) as PlayAlongExercise),
  tempoSteps: steps,
});
const playScore = (lessonId: string, key: string, score: ScoreEvent[]) => play(lessonId, key, notesOf(score), STEPS[0], score);

/** Pregunta de oído: se escucha un ejemplo y se elige qué es. */
const ear = (lessonId: string, key: string, example: ListenExample, options: string[], correctIndex: number): Exercise => ({
  id: `${lessonId}-${key}`,
  kind: 'ear',
  needsBass: false,
  skills: ['ear'],
  promptKey: k(lessonId, key),
  options,
  correctIndex,
  example,
});

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

// ───────────── Pistas de acompañamiento ─────────────

type BackChord = ChordId | 'F' | 'Bb';
const midiOf = (c: BackChord) => (c === 'F' ? diagramMidi(BARRES['bar-f']) : c === 'Bb' ? diagramMidi(BARRES['bar-bb']) : chordMidi(c));
/** Pista: acordes rasgueados en limpio y más bajos, para tocar encima. */
const backing = (chords: BackChord[], bpm = 80, pattern: Stroke[] = BALLAD): ListenExample => ({
  events: [],
  bpm,
  strum: { chords: chords.map(midiOf), pattern, tone: 'clean', level: 0.4 },
});
/** Melodía sobre una pista (los dos a la vez). */
const over = (melody: ScoreEvent[], track: ListenExample, tone: Tone = 'crunch', fx?: Fx): ListenExample => ({
  ...track,
  events: melody,
  tone,
  ...(fx ? { fx } : {}),
});

/** La pista del nivel: Am – G – F – G. */
const BACK = backing(['Am', 'G', 'F', 'G']);
const BACK_SLOW = backing(['Am', 'G', 'F', 'G'], 70);
const BACK_TWICE = backing(['Am', 'G', 'F', 'G', 'Am', 'G', 'F', 'G'], 80);

// Clases de altura (0 = Do … 11 = Si).
const PENTA_AM = [9, 0, 2, 4, 7];
const DORIAN_A = [9, 11, 0, 2, 4, 6, 7];
const MIXO_A = [9, 11, 1, 2, 4, 6, 7];
const PHRYG_A = [9, 10, 0, 2, 4, 5, 7];
/** Notas de llegada sobre Am – G – F – G: las notas de cada acorde que están en la pentatónica. */
const TARGETS_AM = [[9, 0, 4], [7, 2], [9, 0], [7, 2]];

// ───────────── 4.1 · Las cinco cajas ─────────────

/** Un lick corto en cada caja (original), para las escenas. */
const boxLick = (b: 1 | 2 | 3 | 4 | 5) => quarters(box(b).slice(6, 12));

const boxLesson = (id: string, b: 2 | 3 | 4 | 5, fig: Figure, frets: number): Lesson =>
  lesson(id, 12, {
    visuals: [null, fig, fig, null],
    sounds: [listen(boxLick(b), 90, { tone: 'crunch' }), null, listen(quarters(box(b)), 100), null],
    cards: [{ figure: fig }, { listen: listen(quarters(box(b)), 80, { show: 'tab' }) }],
    exercises: [tap(id, 'tap', box(b), frets), play(id, 'play', upDown(box(b)), null)],
  });

const l411 = lesson('4.1.1', 12, {
  visuals: ['penta-box', 'penta-box', 'penta-box-2', null],
  sounds: [listen(boxLick(1), 90, { tone: 'crunch' }), null, null, listen(quarters(box(1)), 100)],
  cards: [{ figure: 'penta-box' }, { listen: listen(quarters(box(1)), 80, { show: 'tab' }) }],
  exercises: [quiz('4.1.1', 'q1', ['=3', '=5', '=7', '=12'], 1), quiz('4.1.1', 'q2', ['=A', '=C', '=E', '=G'], 0), play('4.1.1', 'play', upDown(box(1)), null)],
});
const l412 = boxLesson('4.1.2', 2, 'penta-box-2', 12);
const l413 = boxLesson('4.1.3', 3, 'penta-box-3', 15);
const l414 = boxLesson('4.1.4', 4, 'penta-box-4', 15);
const l415 = lesson('4.1.5', 12, {
  visuals: [null, 'penta-box-5', 'penta-box', null],
  sounds: [listen(boxLick(5), 90, { tone: 'crunch' }), null, null, listen(quarters(box(5)), 100)],
  cards: [{ figure: 'penta-box-5' }, { listen: listen(quarters(box(5)), 80, { show: 'tab' }) }],
  exercises: [quiz('4.1.5', 'q1', [k('4.1.5', 'q1o1'), k('4.1.5', 'q1o2'), k('4.1.5', 'q1o3')], 0), tap('4.1.5', 'tap', box(5), 6), play('4.1.5', 'play', upDown(box(5)), null)],
});

// ───────────── 4.2 · Todo el mástil ─────────────

const LINK_12 = seq(['E', 5], ['E', 8], ['A', 5], ['A', 7], ['D', 5], ['D', 7], ['G', 5], ['G', 7], ['G', 9], ['B', 8], ['B', 10], ['e', 8], ['e', 10]);
const LINK_234 = seq(['G', 7], ['G', 9], ['B', 8], ['B', 10], ['e', 8], ['e', 10], ['e', 12], ['e', 15], ['e', 12], ['B', 13], ['B', 10], ['G', 12], ['G', 9]);
const ONE_STRING = seq(['e', 5], ['e', 8], ['e', 10], ['e', 12], ['e', 15], ['e', 17]);
export const DIAGONAL = seq(['E', 5], ['E', 8], ['A', 5], ['A', 7], ['D', 7], ['D', 10], ['G', 9], ['G', 12], ['B', 13], ['B', 15], ['e', 15], ['e', 17]);
const BOX1_EM = seq(['E', 12], ['E', 15], ['A', 12], ['A', 14], ['D', 12], ['D', 14], ['G', 12], ['G', 14], ['B', 12], ['B', 15], ['e', 12], ['e', 15]);

const l421 = lesson('4.2.1', 12, {
  visuals: ['penta-box', 'slide', 'penta-box-2', null],
  sounds: [listen(quarters(LINK_12.slice(4)), 90, { tone: 'crunch' }), null, null, listen([...quarters(LINK_12.slice(0, 12)), n('e', 10, 4)], 90)],
  cards: [{ figure: 'penta-box-2' }, { listen: listen([...quarters(LINK_12.slice(0, 12)), n('e', 10, 4)], 80, { show: 'tab' }) }],
  exercises: [play('4.2.1', 'play', LINK_12, null)],
});
const l422 = lesson('4.2.2', 12, {
  visuals: ['penta-box-2', 'penta-box-3', 'penta-box-4', null],
  sounds: [listen([...quarters(LINK_234.slice(0, 12)), n('G', 9, 4)], 100, { tone: 'crunch' }), null, null, null],
  cards: [{ figure: 'penta-box-3' }, { listen: listen([...quarters(LINK_234.slice(0, 12)), n('G', 9, 4)], 80, { show: 'tab' }) }],
  exercises: [play('4.2.2', 'play', LINK_234, null)],
});
const l423 = lesson('4.2.3', 10, {
  visuals: [null, 'slide', null, null],
  sounds: [listen([...quarters(ONE_STRING), n('e', 15, 2)], 90, { tone: 'crunch' }), null, listen([...quarters(ONE_STRING), n('e', 15, 2)], 70), null],
  cards: [{ listen: listen([...quarters(ONE_STRING), n('e', 15, 2)], 70, { show: 'tab' }) }, {}],
  exercises: [tap('4.2.3', 'tap', ONE_STRING, 17), play('4.2.3', 'play', upDown(ONE_STRING), null)],
});
const l424 = lesson('4.2.4', 12, {
  visuals: ['penta-box', 'penta-box-3', 'penta-box-4', null],
  sounds: [listen(quarters(DIAGONAL), 100, { tone: 'crunch' }), null, null, null],
  cards: [{ listen: listen(quarters(DIAGONAL), 80, { show: 'tab' }) }, {}],
  exercises: [tap('4.2.4', 'tap', DIAGONAL, 17), play('4.2.4', 'play', DIAGONAL, null)],
});
const l425 = lesson('4.2.5', 12, {
  visuals: ['penta-box', null, null, null],
  sounds: [null, null, listen(quarters(BOX1_EM), 100, { tone: 'crunch' }), null],
  cards: [{ figure: 'penta-box' }, { listen: listen(quarters(BOX1_EM), 80, { show: 'tab' }) }],
  exercises: [quiz('4.2.5', 'q1', ['=3', '=7', '=10', '=12'], 3), quiz('4.2.5', 'q2', ['=1', '=3', '=5', '=8'], 1), play('4.2.5', 'play', upDown(BOX1_EM), null)],
});

// ───────────── 4.3 · Escala mayor y menor natural ─────────────

const C_ONE_STRING = seq(['A', 3], ['A', 5], ['A', 7], ['A', 8], ['A', 10], ['A', 12], ['A', 14], ['A', 15]);
export const G_MAJOR: ScoreEvent[] = quarters(seq(...MAJOR_G_NOTES.slice(0, 8)));
export const C_MAJOR: ScoreEvent[] = quarters(seq(['A', 3], ['A', 5], ['D', 2], ['D', 3], ['D', 5], ['G', 2], ['G', 4], ['G', 5]));
export const A_MINOR: ScoreEvent[] = quarters(seq(...MINOR_A_NOTES.slice(0, 8)));
export const D_MINOR: ScoreEvent[] = quarters(seq(['A', 5], ['A', 7], ['A', 8], ['D', 5], ['D', 7], ['D', 8], ['G', 5], ['G', 7]));
/** Frases originales: la misma idea en mayor y en menor, para el oído. */
const MAJ_TUNE: ScoreEvent[] = [n('A', 3), n('D', 2), n('D', 5), n('G', 2), n('G', 5, 2), n('G', 4), n('D', 5), n('D', 2, 4)];
const MIN_TUNE: ScoreEvent[] = [n('E', 5), n('A', 5), n('A', 7), n('A', 8), n('D', 7, 2), n('D', 5), n('A', 7), n('E', 5, 4)];

const l431 = lesson('4.3.1', 12, {
  visuals: ['scale-major', null, null, null],
  sounds: [listen(quarters(C_ONE_STRING), 90), null, listen(quarters(C_ONE_STRING), 70), null],
  cards: [{ listen: listen(quarters(C_ONE_STRING), 70, { show: 'tab' }) }, {}],
  exercises: [quiz('4.3.1', 'q1', [k('4.3.1', 'q1o1'), k('4.3.1', 'q1o2'), k('4.3.1', 'q1o3')], 0), tap('4.3.1', 'tap', C_ONE_STRING, 15), play('4.3.1', 'play', C_ONE_STRING, null)],
});
const l432 = lesson('4.3.2', 12, {
  visuals: ['scale-major', 'scale-major', null, null],
  sounds: [listen(G_MAJOR, 90), null, null, listen([...G_MAJOR].reverse(), 90)],
  cards: [{ figure: 'scale-major' }, { listen: listen(G_MAJOR, 70, { show: 'tab' }) }],
  exercises: [tab('4.3.2', 'tab', G_MAJOR, 6), play('4.3.2', 'play', upDown(notesOf(G_MAJOR)), null)],
});
const l433 = lesson('4.3.3', 12, {
  visuals: ['scale-major', null, null, null],
  sounds: [listen(C_MAJOR, 90), null, listen(MAJ_TUNE, 80), null],
  cards: [{ listen: listen(C_MAJOR, 70, { show: 'tab' }) }, { listen: listen(MAJ_TUNE, 80) }],
  exercises: [tab('4.3.3', 'tab', C_MAJOR, 6), play('4.3.3', 'play', upDown(notesOf(C_MAJOR)), null)],
});
const l434 = lesson('4.3.4', 12, {
  visuals: ['scale-minor', 'scale-minor', null, null],
  sounds: [listen(MIN_TUNE, 80), null, listen(A_MINOR, 90), null],
  cards: [{ figure: 'scale-minor' }, { listen: listen(A_MINOR, 70, { show: 'tab' }) }],
  exercises: [quiz('4.3.4', 'q1', [k('4.3.4', 'q1o1'), k('4.3.4', 'q1o2'), k('4.3.4', 'q1o3')], 0), play('4.3.4', 'play', upDown(notesOf(A_MINOR)), null)],
});
const l435 = lesson('4.3.5', 12, {
  visuals: [null, 'scale-major', 'scale-minor', null],
  sounds: [listen(MAJ_TUNE, 80), listen(MIN_TUNE, 80), null, null],
  cards: [{ listen: listen(D_MINOR, 70, { show: 'tab' }) }, {}],
  exercises: [
    quiz('4.3.5', 'q1', ['=A', '=D', '=E', '=G'], 0),
    ear('4.3.5', 'ear1', listen(MIN_TUNE, 80), [k('4.3.5', 'major'), k('4.3.5', 'minor')], 1),
    ear('4.3.5', 'ear2', listen(MAJ_TUNE, 80), [k('4.3.5', 'major'), k('4.3.5', 'minor')], 0),
    play('4.3.5', 'play', upDown(notesOf(D_MINOR)), null),
  ],
});

// ───────────── 4.4 · Modos ─────────────

const A_DORIAN = seq(...DORIAN_A_NOTES);
const A_MIXO = seq(...MIXO_A_NOTES);
const A_PHRYG = seq(...PHRYG_A_NOTES);
const BACK_DORIAN = backing(['Am', 'D', 'Am', 'D'], 90);
const BACK_MIXO = backing(['A', 'G', 'A', 'G'], 90);
const BACK_PHRYG = backing(['Am', 'Bb', 'Am', 'Bb'], 80, HALVES);
const DORIAN_LICK: ScoreEvent[] = [n('A', 7), n('A', 9), n('D', 7, 2), n('A', 9), n('A', 7), n('E', 8), n('E', 5), ...[n('A', 9, 2), n('A', 7, 2)], n('E', 5, 4)];
const MIXO_LICK: ScoreEvent[] = [n('E', 9), n('A', 7), n('A', 9), n('D', 5), n('D', 7, 4), n('D', 5), n('A', 9), n('A', 7), n('E', 9), n('E', 5, 4)];
const PHRYG_LICK: ScoreEvent[] = [n('E', 5), n('E', 6), n('E', 8), n('E', 6), n('E', 5, 4), n('A', 5), n('E', 8), n('E', 6, 2), n('E', 5, 4)];

const l441 = lesson('4.4.1', 12, {
  visuals: ['scale-major', null, null, null],
  sounds: [listen(C_MAJOR, 90), null, listen(quarters(seq(['A', 5], ['D', 2], ['D', 3], ['D', 5], ['G', 2], ['G', 4], ['G', 5], ['G', 7])), 90), null],
  cards: [{ listen: listen(quarters(seq(['A', 5], ['D', 2], ['D', 3], ['D', 5], ['G', 2], ['G', 4], ['G', 5], ['G', 7])), 70, { show: 'tab' }) }, {}],
  exercises: [quiz('4.4.1', 'q1', [k('4.4.1', 'q1o1'), k('4.4.1', 'q1o2'), k('4.4.1', 'q1o3')], 1), quiz('4.4.1', 'q2', ['=5', '=7', '=8', '=12'], 1)],
});
const l442 = lesson('4.4.2', 14, {
  visuals: ['mode-dorian', 'mode-dorian', null, null],
  sounds: [over(DORIAN_LICK, BACK_DORIAN), null, listen(quarters(A_DORIAN), 80), null],
  cards: [{ listen: listen(quarters(A_DORIAN), 70, { show: 'tab' }) }, { listen: over(DORIAN_LICK, BACK_DORIAN) }],
  exercises: [play('4.4.2', 'play', upDown(A_DORIAN), null), improvise('4.4.2', 'improv', BACK_DORIAN, DORIAN_A, 12)],
});
const l443 = lesson('4.4.3', 14, {
  visuals: ['mode-mixo', 'mode-mixo', null, null],
  sounds: [over(MIXO_LICK, BACK_MIXO), null, listen(quarters(A_MIXO), 80), null],
  cards: [{ listen: listen(quarters(A_MIXO), 70, { show: 'tab' }) }, { listen: over(MIXO_LICK, BACK_MIXO) }],
  exercises: [quiz('4.4.3', 'q1', ['=G', '=G#', '=F#', '=C#'], 0), play('4.4.3', 'play', upDown(A_MIXO), null), improvise('4.4.3', 'improv', BACK_MIXO, MIXO_A, 12)],
});
const l444 = lesson('4.4.4', 14, {
  visuals: ['mode-phryg', 'mode-phryg', null, null],
  sounds: [over(PHRYG_LICK, BACK_PHRYG, 'lead'), null, listen(quarters(A_PHRYG), 80), null],
  cards: [{ listen: listen(quarters(A_PHRYG), 70, { show: 'tab' }) }, { listen: over(PHRYG_LICK, BACK_PHRYG, 'lead') }],
  exercises: [quiz('4.4.4', 'q1', [k('4.4.4', 'q1o1'), k('4.4.4', 'q1o2'), k('4.4.4', 'q1o3')], 0), play('4.4.4', 'play', upDown(A_PHRYG), null), improvise('4.4.4', 'improv', BACK_PHRYG, PHRYG_A, 12)],
});

// ───────────── 4.5 · Fraseo ─────────────

/** Un motivo de un compás y sus variaciones, sobre Am – G – F – G (original). */
export const MOTIF_PHRASE: ScoreEvent[] = [
  n('B', 5, 0.5), n('G', 7, 0.5), n('B', 5), rest(2),
  n('B', 8, 0.5), n('B', 5, 0.5), n('G', 7), rest(2),
  n('B', 5, 0.5), n('G', 7, 0.5), n('G', 5), rest(2),
  n('G', 7, 0.5), n('G', 5, 0.5), n('D', 7, 2), rest(1),
];
/** Pregunta (sube y queda abierta) y respuesta (baja y cierra en La). */
export const CALL4: ScoreEvent[] = [n('G', 5, 0.5), n('G', 7, 0.5), n('B', 5), n('B', 8), rest(1), n('e', 5), n('B', 5), rest(2)];
export const RESP4: ScoreEvent[] = [n('e', 5, 0.5), n('B', 8, 0.5), n('B', 5), n('G', 7), rest(1), n('G', 5), n('D', 7, 2), rest(1)];
/** Pocas notas y mucho aire. */
export const SPACE_PHRASE: ScoreEvent[] = [
  n('D', 7, 2), rest(2),
  n('G', 7), n('G', 5), rest(2),
  n('B', 5, 2), rest(2),
  n('G', 7, 4),
];
/** Llegar a una nota del acorde en cada cambio: La sobre Am, Sol sobre G, Do sobre F, Re sobre G. */
export const TARGET_PHRASE: ScoreEvent[] = [
  n('e', 5, 2), n('B', 8), n('B', 5),
  n('B', 8, 2), n('G', 7), n('G', 5),
  n('G', 5, 2), n('G', 7), n('B', 5),
  n('G', 7, 2), n('G', 5), n('G', 7),
];

const l451 = lesson('4.5.1', 12, {
  visuals: ['penta-box', null, null, null],
  sounds: [over(MOTIF_PHRASE, BACK), null, listen(MOTIF_PHRASE.slice(0, 4), 70), over(MOTIF_PHRASE, BACK)],
  cards: [{ listen: listen(MOTIF_PHRASE, 70, { show: 'tab' }) }, { listen: over(MOTIF_PHRASE, BACK) }],
  exercises: [playScore('4.5.1', 'play', MOTIF_PHRASE)],
});
const l452 = lesson('4.5.2', 12, {
  visuals: ['penta-box', null, null, null],
  sounds: [over([...CALL4, ...RESP4], backing(['Am', 'G', 'F', 'G'])), null, listen(CALL4, 70), listen(RESP4, 70)],
  cards: [{ listen: listen(CALL4, 70, { show: 'tab' }) }, { listen: listen(RESP4, 70, { show: 'tab' }) }],
  exercises: [playScore('4.5.2', 'call', CALL4), playScore('4.5.2', 'resp', RESP4)],
});
const l453 = lesson('4.5.3', 14, {
  visuals: ['penta-box', null, null, null],
  sounds: [over(TARGET_PHRASE, BACK), null, null, null],
  cards: [{ listen: listen(TARGET_PHRASE, 70, { show: 'tab' }) }, { listen: over(TARGET_PHRASE, BACK_SLOW) }],
  exercises: [
    quiz('4.5.3', 'q1', ['=G', '=C', '=E', '=A'], 0),
    playScore('4.5.3', 'play', TARGET_PHRASE),
    improvise('4.5.3', 'improv', BACK_SLOW, PENTA_AM, 12, 2, TARGETS_AM),
  ],
});
const l454 = lesson('4.5.4', 12, {
  visuals: ['penta-box', null, null, null],
  sounds: [over(SPACE_PHRASE, BACK), null, null, null],
  cards: [{ listen: listen(SPACE_PHRASE, 70, { show: 'tab' }) }, {}],
  exercises: [playScore('4.5.4', 'play', SPACE_PHRASE)],
});
const l455 = lesson('4.5.5', 15, {
  visuals: ['penta-box', null, null, null],
  sounds: [over([...MOTIF_PHRASE, ...TARGET_PHRASE], BACK_TWICE), null, null, null],
  cards: [{ listen: BACK }, {}],
  exercises: [improvise('4.5.5', 'improv', BACK, PENTA_AM, 16)],
});

// ───────────── 4.6 · Púa rápida ─────────────

export const EVEN_EIGHTHS: ScoreEvent[] = eighths(rep(seq(['e', 5], ['e', 8], ['e', 5], ['e', 8], ['B', 5], ['B', 8], ['B', 5], ['B', 8]), 2));
export const BOX_RUN: ScoreEvent[] = [...eighths(upDown(box(1))), rest(0.5)];
export const BURSTS: ScoreEvent[] = [
  ...eighths(seq(['e', 5], ['e', 8], ['B', 8], ['B', 5])), n('G', 7), rest(1),
  ...eighths(seq(['B', 8], ['B', 5], ['G', 7], ['G', 5])), n('D', 7), rest(1),
  ...eighths(seq(['G', 7], ['G', 5], ['D', 7], ['D', 5])), n('A', 7), rest(1),
  ...eighths(seq(['D', 7], ['D', 5], ['A', 7], ['A', 5])), n('E', 5, 2),
];
const B1 = box(1);
/** Grupos de cuatro que suben por la caja 1. */
export const FOURS: ScoreEvent[] = eighths(Array.from({ length: 8 }, (_, i) => B1.slice(i, i + 4)).flat());

const l461 = lesson('4.6.1', 10, {
  visuals: ['pick-alternate', 'pick-alternate', null, null],
  sounds: [listen(EVEN_EIGHTHS, 100), null, listen(EVEN_EIGHTHS, 70, { click: true }), null],
  cards: [{ figure: 'pick-alternate' }, { listen: listen(EVEN_EIGHTHS, 70, { show: 'tab', click: true }) }],
  exercises: [fast('4.6.1', 'play', EVEN_EIGHTHS, [70, 85, 100])],
});
const l462 = lesson('4.6.2', 12, {
  visuals: ['string-crossing', null, null, null],
  sounds: [listen(BOX_RUN, 100, { tone: 'crunch' }), null, listen(BOX_RUN, 60, { click: true }), null],
  cards: [{ listen: listen(BOX_RUN, 60, { show: 'tab', click: true }) }, {}],
  exercises: [fast('4.6.2', 'play', BOX_RUN, [60, 75, 90])],
});
const l463 = lesson('4.6.3', 12, {
  visuals: ['pick-alternate', null, null, null],
  sounds: [listen(BURSTS, 110, { tone: 'crunch' }), null, null, null],
  cards: [{ listen: listen(BURSTS, 80, { show: 'tab', click: true }) }, {}],
  exercises: [fast('4.6.3', 'play', BURSTS, [80, 100, 120])],
});
const l464 = lesson('4.6.4', 12, {
  visuals: ['penta-box', 'pick-alternate', null, null],
  sounds: [listen(FOURS, 110, { tone: 'crunch' }), null, listen(FOURS, 70, { click: true }), null],
  cards: [{ listen: listen(FOURS, 70, { show: 'tab', click: true }) }, {}],
  exercises: [fast('4.6.4', 'play', FOURS, [70, 90, 110])],
});

// ───────────── 4.7 · Notas dobles y tríadas ─────────────

const DS12 = [67, 72];
const DS23 = [62, 67];
const TRI = { Am: [69, 72, 76], G: [67, 71, 74], F: [65, 69, 72], D: [62, 66, 69], Dm: [62, 65, 69] };
/** Arpegios de tríadas en las tres cuerdas agudas: Am (14-13-12), G (12-12-10), F (10-10-8), G. */
const triArp = (g: number, b: number, e: number): ScoreEvent[] => [n('G', g), n('B', b), n('e', e), n('B', b)];
export const TRIAD_ARPS: ScoreEvent[] = [...triArp(14, 13, 12), ...triArp(12, 12, 10), ...triArp(10, 10, 8), ...triArp(12, 12, 10)];

const l471 = lesson('4.7.1', 12, {
  visuals: ['dstop-12', 'dstop-12', null, null],
  sounds: [strumListen([DS12, DS12], QUARTERS, 90, { tone: 'crunch' }), null, null, strumListen([DS12, DS23], QUARTERS, 80, { tone: 'crunch' })],
  cards: [{ figure: 'dstop-12', listen: strumListen([DS12, DS12], QUARTERS, 70, { tone: 'crunch' }) }, {}],
  exercises: [play('4.7.1', 'play', rep(seq(['B', 8], ['e', 8]), 3), null), strum('4.7.1', 'strum', ['C5', 'C5'], QUARTERS)],
});
const l472 = lesson('4.7.2', 12, {
  visuals: ['dstop-23', 'dstop-23', null, null],
  sounds: [strumListen([DS23, DS12, DS23, DS12], HALVES, 90, { tone: 'crunch' }), null, null, null],
  cards: [{ figure: 'dstop-23', listen: strumListen([DS23, DS23], QUARTERS, 70, { tone: 'crunch' }) }, {}],
  exercises: [play('4.7.2', 'play', rep(seq(['G', 7], ['B', 8]), 3), null), strum('4.7.2', 'strum', ['G5', 'C5', 'G5', 'C5'], HALVES)],
});
const l473 = lesson('4.7.3', 12, {
  visuals: ['triad-d', 'triad-d', null, null],
  sounds: [strumListen([TRI.D, TRI.D], BALLAD, 80), null, listen(triArp(7, 7, 5), 80), null],
  cards: [{ figure: 'triad-d', listen: listen(triArp(7, 7, 5), 70, { show: 'tab' }) }, {}],
  exercises: [tap('4.7.3', 'tap', seq(['G', 7], ['B', 7], ['e', 5]), 9), play('4.7.3', 'play', seq(['G', 7], ['B', 7], ['e', 5], ['B', 7], ['G', 7], ['B', 7], ['e', 5]), null)],
});
const l474 = lesson('4.7.4', 12, {
  visuals: ['triad-d', 'triad-dm', null, null],
  sounds: [strumListen([TRI.D, TRI.Dm], HALVES, 80), null, listen(triArp(7, 6, 5), 80), null],
  cards: [{ figure: 'triad-dm', listen: listen(triArp(7, 6, 5), 70, { show: 'tab' }) }, {}],
  exercises: [quiz('4.7.4', 'q1', [k('4.7.4', 'q1o1'), k('4.7.4', 'q1o2'), k('4.7.4', 'q1o3')], 1), play('4.7.4', 'play', seq(['G', 7], ['B', 6], ['e', 5], ['B', 6], ['G', 7], ['B', 6], ['e', 5]), null)],
});
const l475 = lesson('4.7.5', 14, {
  visuals: ['triad-d', null, null, null],
  sounds: [over(TRIAD_ARPS, BACK, 'clean'), null, strumListen([TRI.Am, TRI.G, TRI.F, TRI.G], HALVES, 80), null],
  cards: [{ listen: listen(TRIAD_ARPS, 70, { show: 'tab' }) }, { listen: over(TRIAD_ARPS, BACK_SLOW, 'clean') }],
  exercises: [playScore('4.7.5', 'play', TRIAD_ARPS)],
});

// ───────────── 4.8 · Tapping ─────────────

const TAP_A = seq(['e', 12], ['e', 5], ['e', 8]);
export const TAP_MOVE = [...rep(TAP_A, 2), ...rep(seq(['e', 13], ['e', 5], ['e', 8]), 2), ...rep(seq(['e', 15], ['e', 5], ['e', 8]), 2), ...TAP_A];
// En la 2.ª cuerda el tapping va al 15: el 13 sonaría igual que el 8 de la 1.ª que viene antes.
export const TAP_TWO = [...rep(TAP_A, 2), ...rep(seq(['B', 15], ['B', 5], ['B', 8]), 2), ...TAP_A];
const TAP_TWO_SCORE = [...quarters(TAP_TWO), n('e', 12)];

const l481 = lesson('4.8.1', 12, {
  visuals: ['tapping', 'tapping', null, null],
  sounds: [listen(quarters(rep(seq(['e', 12], ['e', 5]), 4)), 100, { tone: 'lead' }), null, listen(quarters(rep(seq(['e', 12], ['e', 5]), 2)), 70), null],
  cards: [{ figure: 'tapping' }, { listen: listen(quarters(rep(seq(['e', 12], ['e', 5]), 2)), 70, { show: 'tab' }) }],
  exercises: [quiz('4.8.1', 'q1', [k('4.8.1', 'q1o1'), k('4.8.1', 'q1o2'), k('4.8.1', 'q1o3')], 0), play('4.8.1', 'play', rep(seq(['e', 12], ['e', 5]), 4), null)],
});
const l482 = lesson('4.8.2', 12, {
  visuals: ['tapping', null, null, null],
  sounds: [listen([...quarters(rep(TAP_A, 5)), n('e', 12)], 120, { tone: 'lead' }), null, listen([...quarters(rep(TAP_A, 1)), n('e', 12)], 70), null],
  cards: [{ listen: listen([...quarters(rep(TAP_A, 5)), n('e', 12)], 80, { show: 'tab' }) }, {}],
  exercises: [play('4.8.2', 'play', rep(TAP_A, 4), null)],
});
const l483 = lesson('4.8.3', 12, {
  visuals: ['tapping', null, null, null],
  sounds: [listen([...quarters(TAP_MOVE), n('e', 12, 2), rest(1)], 120, { tone: 'lead' }), null, null, null],
  cards: [{ listen: listen([...quarters(TAP_MOVE), n('e', 12, 2), rest(1)], 80, { show: 'tab' }) }, {}],
  exercises: [play('4.8.3', 'play', TAP_MOVE, null)],
});
const l484 = lesson('4.8.4', 12, {
  visuals: ['tapping', null, null, null],
  sounds: [listen(TAP_TWO_SCORE, 120, { tone: 'lead' }), null, null, null],
  cards: [{ listen: listen(TAP_TWO_SCORE, 80, { show: 'tab' }) }, {}],
  exercises: [play('4.8.4', 'play', TAP_TWO, null)],
});

// ───────────── 4.9 · Tu sonido: efectos ─────────────

/** El mismo lick para comparar efectos (original). */
export const FX_LICK: ScoreEvent[] = [n('G', 5, 0.5), n('G', 7, 0.5), n('B', 5), n('B', 8), n('e', 5, 0.5), rest(0.5), n('B', 8, 0.5), n('B', 5, 0.5), n('G', 7), n('D', 7, 2)];
const LICK_NOTES = notesOf(FX_LICK).filter((x, i, a) => i === 0 || x.string !== a[i - 1].string || x.fret !== a[i - 1].fret);
const DELAY: Fx = { delay: { ms: 375, repeats: 3, feedback: 0.45 } };
const SLAPBACK: Fx = { delay: { ms: 110, repeats: 1, feedback: 0.5 } };
const REVERB: Fx = { reverb: 0.9 };
const CHORUS: Fx = { chorus: true };
const lick = (tone: Tone, fx?: Fx) => listen(FX_LICK, 80, { tone, ...(fx ? { fx } : {}) });
const CHORDS_CLEAN = (fx?: Fx) => strumListen(['Am', 'G'], BALLAD, 80, fx ? { fx } : {});
const EFFECT_OPTS = (id: string) => [k(id, 'dry'), k(id, 'delay'), k(id, 'reverb'), k(id, 'chorus')];

const l491 = lesson('4.9.1', 12, {
  visuals: ['amp-clean', 'fx-drive', 'amp-crunch', null],
  sounds: [lick('clean'), lick('crunch'), lick('lead'), null],
  cards: [{ figure: 'fx-drive' }, { listen: lick('lead') }],
  exercises: [
    ear('4.9.1', 'ear1', lick('lead'), [k('4.9.1', 'clean'), k('4.9.1', 'od'), k('4.9.1', 'dist')], 2),
    ear('4.9.1', 'ear2', lick('crunch'), [k('4.9.1', 'clean'), k('4.9.1', 'od'), k('4.9.1', 'dist')], 1),
    play('4.9.1', 'play', LICK_NOTES, null),
  ],
});
const l492 = lesson('4.9.2', 12, {
  visuals: ['fx-delay', null, 'fx-delay', null],
  sounds: [lick('crunch', DELAY), null, lick('clean', SLAPBACK), null],
  cards: [{ figure: 'fx-delay' }, { listen: lick('crunch', DELAY) }],
  exercises: [
    ear('4.9.2', 'ear1', lick('crunch', DELAY), EFFECT_OPTS('4.9.2'), 1),
    quiz('4.9.2', 'q1', [k('4.9.2', 'q1o1'), k('4.9.2', 'q1o2'), k('4.9.2', 'q1o3')], 0),
    play('4.9.2', 'play', LICK_NOTES, null),
  ],
});
const l493 = lesson('4.9.3', 12, {
  visuals: ['fx-chain', null, null, null],
  sounds: [lick('clean', REVERB), null, lick('clean'), null],
  cards: [{ listen: lick('clean', REVERB) }, {}],
  exercises: [
    ear('4.9.3', 'ear1', lick('clean', REVERB), EFFECT_OPTS('4.9.3'), 2),
    quiz('4.9.3', 'q1', [k('4.9.3', 'q1o1'), k('4.9.3', 'q1o2'), k('4.9.3', 'q1o3')], 1),
  ],
});
const l494 = lesson('4.9.4', 12, {
  visuals: ['fx-chain', null, null, null],
  sounds: [CHORDS_CLEAN(CHORUS), null, CHORDS_CLEAN(), null],
  cards: [{ listen: CHORDS_CLEAN(CHORUS) }, {}],
  exercises: [
    ear('4.9.4', 'ear1', CHORDS_CLEAN(CHORUS), EFFECT_OPTS('4.9.4'), 3),
    quiz('4.9.4', 'q1', [k('4.9.4', 'q1o1'), k('4.9.4', 'q1o2'), k('4.9.4', 'q1o3')], 2),
  ],
});
const l495 = lesson('4.9.5', 14, {
  visuals: ['fx-chain', 'fx-chain', null, null],
  sounds: [null, null, strumListen(['Am', 'G'], BALLAD, 80, { tone: 'crunch' }), lick('lead', { delay: { ms: 375, repeats: 2, feedback: 0.35 }, reverb: 0.4 })],
  cards: [{ figure: 'fx-chain' }, { listen: lick('lead', { delay: { ms: 375, repeats: 2, feedback: 0.35 }, reverb: 0.4 }) }],
  exercises: [
    quiz('4.9.5', 'q1', [k('4.9.5', 'q1o1'), k('4.9.5', 'q1o2'), k('4.9.5', 'q1o3')], 0),
    quiz('4.9.5', 'q2', [k('4.9.5', 'q2o1'), k('4.9.5', 'q2o2'), k('4.9.5', 'q2o3')], 1),
  ],
});

// ───────────── 4.10 · Proyecto final ─────────────

/** Solo modelo de 8 compases sobre dos vueltas de Am – G – F – G (original). */
export const FINAL_SOLO: ScoreEvent[] = [
  // Motivo.
  n('B', 5, 0.5), n('G', 7, 0.5), n('B', 5), n('B', 8), n('e', 5),
  { string: 'G', fret: 7, beats: 2, vibrato: true }, n('G', 5), n('G', 7),
  n('B', 5, 0.5), n('G', 7, 0.5), n('G', 5), rest(1), n('D', 7),
  { string: 'G', fret: 7, beats: 4, vibrato: true },
  // Sube a la caja 2 y baja.
  n('G', 9, 0.5), n('B', 8, 0.5), n('B', 10), n('e', 8), n('e', 10),
  { string: 'e', fret: 8, beats: 2 }, n('B', 10, 0.5), n('B', 8, 0.5), n('G', 9),
  n('B', 8, 0.5), n('G', 9, 0.5), n('G', 7), n('G', 5), n('D', 7),
  { string: 'D', fret: 7, beats: 4, vibrato: 'wide' },
];

const l4101 = lesson('4.10.1', 12, {
  visuals: [null, 'penta-box', null, null],
  sounds: [BACK, null, null, backing(['Am', 'Dm', 'Am', 'Em'], 80)],
  cards: [{ listen: BACK }, { listen: backing(['Am', 'Dm', 'Am', 'Em'], 80) }],
  exercises: [quiz('4.10.1', 'q1', [k('4.10.1', 'q1o1'), k('4.10.1', 'q1o2'), k('4.10.1', 'q1o3')], 0), quiz('4.10.1', 'q2', ['=A', '=G', '=F', '=C'], 0)],
});
const l4102 = lesson('4.10.2', 15, {
  visuals: ['penta-box', null, null, null],
  sounds: [over(FINAL_SOLO.slice(0, 14), BACK), null, null, null],
  cards: [{ listen: listen(FINAL_SOLO.slice(0, 14), 70, { show: 'tab' }) }, {}],
  exercises: [playScore('4.10.2', 'play', FINAL_SOLO.slice(0, 14)), improvise('4.10.2', 'improv', BACK_SLOW, PENTA_AM, 12, 2, TARGETS_AM)],
});
const l4103 = lesson('4.10.3', 15, {
  visuals: ['penta-box', 'penta-box-2', null, null],
  sounds: [over(FINAL_SOLO, BACK_TWICE, 'lead', { delay: { ms: 375, repeats: 2, feedback: 0.3 } }), null, null, null],
  cards: [{ listen: listen(FINAL_SOLO, 70, { show: 'tab' }) }, { listen: over(FINAL_SOLO, BACK_TWICE, 'lead', { delay: { ms: 375, repeats: 2, feedback: 0.3 } }) }],
  exercises: [playScore('4.10.3', 'play', FINAL_SOLO)],
});
const l4104 = lesson('4.10.4', 18, {
  visuals: [null, 'fx-chain', null, null],
  sounds: [over(FINAL_SOLO, BACK_TWICE, 'lead', { reverb: 0.4 }), null, null, BACK],
  cards: [{ listen: BACK }, {}],
  exercises: [improvise('4.10.4', 'improv', BACK, PENTA_AM, 24, 3, TARGETS_AM)],
});

export const GUITAR_LEVEL4_LESSONS: Lesson[] = [
  l411, l412, l413, l414, l415,
  l421, l422, l423, l424, l425,
  l431, l432, l433, l434, l435,
  l441, l442, l443, l444,
  l451, l452, l453, l454, l455,
  l461, l462, l463, l464,
  l471, l472, l473, l474, l475,
  l481, l482, l483, l484,
  l491, l492, l493, l494, l495,
  l4101, l4102, l4103, l4104,
];

// ───────────── Checkpoint 4: proyecto final ─────────────

const ck = (key: string) => `content.g.cp4.${key}`;

export const GUITAR_CP4: Checkpoint = {
  level: 4,
  titleKey: 'content.g.checkpoint.4',
  introKey: ck('intro'),
  mastery: 0.8,
  parts: [
    { id: 'gcp4-map', kind: 'fretboardTap', needsBass: false, skills: ['fretboard'], promptKey: ck('map'), sequence: box(3), frets: 15 },
    { id: 'gcp4-fast', kind: 'playAlong', needsBass: true, skills: ['technique', 'rhythm'], promptKey: ck('fast'), notes: notesOf(FOURS), bpm: 90, score: FOURS },
    { id: 'gcp4-chain', kind: 'quiz', needsBass: false, skills: ['theory'], promptKey: ck('chain'), options: [ck('chainO1'), ck('chainO2'), ck('chainO3')], correctIndex: 0 },
    { id: 'gcp4-solo', kind: 'playAlong', needsBass: true, skills: ['technique', 'rhythm'], promptKey: ck('solo'), notes: notesOf(FINAL_SOLO), bpm: 70, score: FINAL_SOLO },
    { id: 'gcp4-improv', kind: 'improvise', needsBass: true, skills: ['ear', 'technique'], promptKey: ck('improv'), backing: BACK, loops: 3, scale: PENTA_AM, minNotes: 24, targets: TARGETS_AM },
  ],
};
