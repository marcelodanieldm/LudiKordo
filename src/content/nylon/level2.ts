/**
 * Guitarra criolla, nivel 2: 2.1 primeros acordes, 2.2 más acordes abiertos,
 * 2.3 cambiar sin parar (llegan las séptimas), 2.4 rasgueos, 2.5 arpegios con
 * p-i-m-a, 2.6 teoría (intervalos y tríadas), 2.7 pentatónica menor y el
 * checkpoint 2. Cada acorde nuevo entra al álbum de acordes (chordbook.ts) y
 * habilita canciones.
 *
 * Como en la eléctrica, la app todavía no reconoce acordes: cada acorde se
 * practica en dos partes, sus notas de a una (`playAlong` sin tempo) y el
 * rasgueo a tiempo (`strum`, que escucha los golpes). En la criolla se rasguea
 * con el pulgar o con el índice, sin púa. Textos en `content.n.l21x…l27x` y
 * `content.n.cp2`.
 */
import type { Checkpoint } from '../checkpoints';
import type { Card, Exercise, Figure, Lesson, ListenExample, ScoreEvent } from '../types';
import type { StringId } from '../../instruments/profiles';
import type { OpenChordId } from '../../music/chords';
import { BALLAD, EIGHTHS, HALVES, QUARTERS, WHOLES, type Stroke } from '../../music/strum';
import { type AlbumChord, chordFigure, altBassBar, arpScore, balladBar, chordArp, chordFretted, hz, k, listen, n, notesOf, pamiBar, pimaBar, pimiBar, scenes, scoreNotes, steadyBassBar, strumListen } from './helpers';

export const STEPS = [60, 70, 80];

// ───────────── Constructores ─────────────

interface CardSpec {
  figure?: Figure;
  listen?: ListenExample;
}

export function lesson(
  id: string,
  minutes: number,
  spec: { visuals: (Figure | null)[]; sounds: (ListenExample | null)[]; cards: CardSpec[]; exercises: Exercise[]; mastery?: number },
): Lesson {
  return {
    id,
    minutes,
    titleKey: k(id, 'title'),
    objectiveKey: k(id, 'objective'),
    cartoon: { riveResource: `kordi_n_${id.replace(/\./g, '_')}`, durationSec: 100, sceneKeys: scenes(id), visuals: spec.visuals, sounds: spec.sounds },
    cards: spec.cards.map((c, i): Card => ({ titleKey: k(id, `c${i + 1}t`), bodyKey: k(id, `c${i + 1}b`), ...c })),
    exercises: spec.exercises,
    mastery: spec.mastery ?? 0.8,
  };
}

export const strum = (lessonId: string, key: string, chords: AlbumChord[], pattern: Stroke[], bpm = 60): Exercise => ({
  id: `${lessonId}-${key}`,
  kind: 'strum',
  needsBass: true,
  skills: ['rhythm', 'technique'],
  promptKey: k(lessonId, key),
  bpm,
  pattern,
  chords,
  tempoSteps: STEPS,
});

export const play = (lessonId: string, key: string, notes: { string: StringId; fret: number }[], bpm: number | null, score?: ScoreEvent[]): Exercise => ({
  id: `${lessonId}-${key}`,
  kind: 'playAlong',
  needsBass: true,
  skills: ['technique', 'fretboard'],
  promptKey: k(lessonId, key),
  notes,
  bpm,
  ...(bpm !== null ? { tempoSteps: STEPS } : {}),
  ...(score ? { score } : {}),
});

/** Partitura a tocar a tempo (con corcheas o silencios, `notes` sale de la partitura). */
export const playScore = (lessonId: string, key: string, score: ScoreEvent[], bpm = 60): Exercise => play(lessonId, key, scoreNotes(score), bpm, score);

export const ear = (lessonId: string, key: string, options: string[], correctIndex: number, extra: { tones?: number[]; example?: ListenExample }): Exercise => ({
  id: `${lessonId}-${key}`,
  kind: 'ear',
  needsBass: false,
  skills: ['ear'],
  promptKey: k(lessonId, key),
  options,
  correctIndex,
  ...extra,
});

export const tap = (lessonId: string, key: string, sequence: { string: StringId; fret: number }[]): Exercise => ({
  id: `${lessonId}-${key}`,
  kind: 'fretboardTap',
  needsBass: false,
  skills: ['fretboard'],
  promptKey: k(lessonId, key),
  sequence,
  // Diapasón de 4 trastes, o más si el acorde llega más arriba (G13, Gm7).
  frets: Math.max(4, ...sequence.map((x) => x.fret)),
});

export const quiz = (lessonId: string, key: string, options: string[], correctIndex: number): Exercise => ({
  id: `${lessonId}-${key}`,
  kind: 'quiz',
  needsBass: false,
  skills: ['theory'],
  promptKey: k(lessonId, key),
  options,
  correctIndex,
});

export const CHORD_FIG: Record<OpenChordId, Figure> = {
  Em: 'chord-em',
  E: 'chord-e',
  Am: 'chord-am',
  A: 'chord-a',
  C: 'chord-c',
  G: 'chord-g',
  D: 'chord-d',
  Dm: 'chord-dm',
  E7: 'chord-e7',
  A7: 'chord-a7',
  D7: 'chord-d7',
  G7: 'chord-g7',
  Em7: 'chord-em7',
  Am7: 'chord-am7',
};

/** Un compás p-i-m-i por acorde (acompañamiento con los dedos, como en 1.3.5). */
export const pimi = (chords: AlbumChord[]) => chords.flatMap(pimiBar);

/** Lección de un acorde nuevo: diagrama, sus notas de a una y rasgueo en negras. */
export function chordLesson(id: string, chord: AlbumChord, figure?: Figure): Lesson {
  const fig = figure ?? chordFigure(chord);
  return lesson(id, 12, {
    visuals: [null, fig, fig, null],
    sounds: [strumListen([chord], QUARTERS, 70), listen(arpScore(chord), 80), null, listen(pimi([chord, chord]), 70)],
    cards: [{ figure: fig, listen: listen(arpScore(chord), 70) }, { listen: listen(pimi([chord, chord]), 70) }],
    exercises: [tap(id, 'tap', chordFretted(chord)), play(id, 'arp', chordArp(chord), null), strum(id, 'strum', [chord, chord], QUARTERS)],
  });
}

/** Lección de cambio entre acordes: escuchar, rasguear y tocar p-i-m-i a tempo. */
export function changeLesson(id: string, minutes: number, chords: AlbumChord[], pattern: Stroke[], figs: (Figure | null)[], extra: Exercise[] = []): Lesson {
  return lesson(id, minutes, {
    visuals: figs,
    sounds: [strumListen(chords, pattern, 70), null, listen(pimi(chords), 70), null],
    cards: [{ listen: strumListen(chords, pattern, 70, { click: true }) }, { listen: listen(pimi(chords), 70, { click: true }) }],
    exercises: [...extra, strum(id, 'strum', chords, pattern), play(id, 'pimi', scoreNotes(pimi(chords)), 60)],
  });
}

// ───────────── 2.1 · Primeros acordes ─────────────

const l211 = chordLesson('2.1.1', 'Em');
const l212 = chordLesson('2.1.2', 'Am');
const l213 = chordLesson('2.1.3', 'E');
const l214 = chordLesson('2.1.4', 'A');
const l215 = chordLesson('2.1.5', 'D');

// ───────────── 2.2 · Más acordes abiertos ─────────────

const l221 = chordLesson('2.2.1', 'C');
const l222 = chordLesson('2.2.2', 'G');
const l223 = chordLesson('2.2.3', 'Dm');
const l224 = chordLesson('2.2.4', 'E7');
const l225 = chordLesson('2.2.5', 'A7');

// ───────────── 2.3 · Cambiar sin parar ─────────────

/** 2.3.1: dedo guía. De Em a Em7 y de Am a Am7 se mueve un solo dedo. */
const l231 = changeLesson('2.3.1', 12, ['Em', 'Em7', 'Am', 'Am7'], HALVES, [null, 'chord-em7', 'chord-am7', null], [
  tap('2.3.1', 'tap', chordFretted('Em7')),
  play('2.3.1', 'arp', chordArp('Am7'), null),
]);

/** 2.3.2: dedos en bloque. E y Am tienen la misma forma, una cuerda más abajo. */
const l232 = changeLesson('2.3.2', 12, ['E', 'Am', 'E', 'Am'], HALVES, ['chord-e', 'chord-am', null, null], [
  quiz('2.3.2', 'q1', ['=E', '=Am', '=D', '=G'], 1),
]);

/** 2.3.3: anticipar. D7 y G7, cambiando en el último pulso del compás. */
const l233 = changeLesson('2.3.3', 12, ['D', 'D7', 'G', 'G7'], QUARTERS, [null, 'chord-d7', 'chord-g7', null], [
  tap('2.3.3', 'tap', chordFretted('G7')),
  play('2.3.3', 'arp', chordArp('D7'), null),
]);

/** 2.3.4: cambios de un minuto, en pares que cuestan. */
const l234 = changeLesson('2.3.4', 12, ['C', 'G', 'C', 'G'], QUARTERS, ['chord-c', 'chord-g', null, null], [
  strum('2.3.4', 'strum1', ['Em', 'Am', 'Em', 'Am'], QUARTERS),
  strum('2.3.4', 'strum2', ['D', 'A', 'D', 'A'], QUARTERS),
]);

/** 2.3.5: progresiones de 4 acordes. */
const l235 = changeLesson('2.3.5', 14, ['G', 'Em7', 'Am7', 'D7'], QUARTERS, ['chord-g', 'chord-em7', 'chord-am7', 'chord-d7'], [
  strum('2.3.5', 'strum1', ['Am', 'Dm', 'E7', 'Am'], QUARTERS),
]);


// ───────────── 2.4 · Rasgueos ─────────────

/** Balada lenta: abajo, arriba en el «y» del 2, abajo en el 3 y abajo-arriba en el 4. */
export const SLOW_BALLAD: Stroke[] = ['D', '-', '-', 'U', 'D', '-', 'D', 'U'];

/** Lección de rasgueo: un patrón sobre una progresión, con un ejercicio previo sin guitarra. */
function strumLesson(id: string, chords: OpenChordId[], pattern: Stroke[], pre: Exercise, more: Exercise[] = []): Lesson {
  return lesson(id, 12, {
    visuals: [null, CHORD_FIG[chords[0]], CHORD_FIG[chords[1]], null],
    sounds: [strumListen(chords, pattern, 70), null, strumListen(chords.slice(0, 2), pattern, 60, { click: true }), null],
    cards: [{ listen: strumListen(chords.slice(0, 2), pattern, 60, { click: true }) }, { listen: strumListen(chords, pattern, 70, { click: true }) }],
    exercises: [pre, strum(id, 'strum', chords, pattern), ...more],
  });
}

const tapStrokes = (id: string, bpm: number): Exercise => ({ id: `${id}-tap`, kind: 'tapRhythm', needsBass: false, skills: ['rhythm'], promptKey: k(id, 'tap'), bpm, beats: 16, pads: ['↓', '↑'] });
const pulse = (id: string, bpm: number): Exercise => ({ id: `${id}-pulse`, kind: 'tempoTrainer', needsBass: false, skills: ['rhythm'], promptKey: k(id, 'pulse'), bpm, beats: 16, audibleBeats: 8 });

const l241 = strumLesson('2.4.1', ['Em', 'Am', 'Em', 'Am'], QUARTERS, pulse('2.4.1', 70), [strum('2.4.1', 'strum2', ['G', 'C', 'G', 'C'], QUARTERS)]);
const l242 = strumLesson('2.4.2', ['C', 'G', 'C', 'G'], EIGHTHS, tapStrokes('2.4.2', 60));
const l243 = strumLesson('2.4.3', ['G', 'C', 'D', 'Em'], BALLAD, quiz('2.4.3', 'q1', [k('2.4.3', 'q1o1'), k('2.4.3', 'q1o2'), k('2.4.3', 'q1o3')], 1));
const l244 = strumLesson('2.4.4', ['Am', 'Dm', 'E7', 'Am'], SLOW_BALLAD, tapStrokes('2.4.4', 60));
const l245 = strumLesson('2.4.5', ['Am', 'E7', 'Am', 'E7'], QUARTERS, quiz('2.4.5', 'q1', [k('2.4.5', 'q1o1'), k('2.4.5', 'q1o2'), k('2.4.5', 'q1o3')], 0), [strum('2.4.5', 'strum2', ['D', 'A7', 'D', 'A7'], QUARTERS)]);

// ───────────── 2.5 · Arpegios con p-i-m-a ─────────────

export const PIMA = (chords: OpenChordId[]) => chords.flatMap(pimaBar);
export const PAMI = (chords: OpenChordId[]) => chords.flatMap(pamiBar);
export const ALT_BASS = (chords: OpenChordId[]) => chords.flatMap(altBassBar);
export const BALLAD_ARP = (chords: OpenChordId[]) => chords.flatMap(balladBar);
export const STEADY_BASS = (chords: OpenChordId[]) => chords.flatMap(steadyBassBar);

/** Lección de arpegio: escuchar, el patrón de dedos sin guitarra y la progresión a tempo. */
function arpLesson(id: string, score: ScoreEvent[], pads: string[], fig: Figure): Lesson {
  return lesson(id, 12, {
    visuals: [null, 'pima-hand', fig, null],
    sounds: [listen(score, 70), null, listen(score, 60), null],
    cards: [{ figure: 'pima-hand', listen: listen(score, 60, { click: true }) }, {}],
    exercises: [
      { id: `${id}-pads`, kind: 'tapRhythm', needsBass: false, skills: ['rhythm', 'technique'], promptKey: k(id, 'pads'), bpm: 60, beats: 16, pads },
      playScore(id, 'play', score),
    ],
  });
}

export const ARP_251 = PIMA(['C', 'Am', 'Dm', 'G7']);
export const ARP_252 = PAMI(['G', 'Em', 'C', 'D']);
export const ARP_253 = ALT_BASS(['C', 'C', 'G', 'G']);
export const ARP_254 = BALLAD_ARP(['Am', 'Dm', 'E7', 'Am']);
export const ARP_255 = STEADY_BASS(['C', 'Am', 'Dm', 'G7']);

const l251 = arpLesson('2.5.1', ARP_251, ['p', 'i', 'm', 'a'], 'chord-c');
const l252 = arpLesson('2.5.2', ARP_252, ['p', 'a', 'm', 'i'], 'chord-g');
const l253 = arpLesson('2.5.3', ARP_253, ['p', 'm'], 'chord-c');
const l254 = arpLesson('2.5.4', ARP_254, ['p', 'i', 'm', 'a'], 'chord-am');
const l255 = arpLesson('2.5.5', ARP_255, ['p', 'm'], 'chord-c');

// ───────────── 2.6 · Teoría: intervalos y tríadas ─────────────

/** Escala de Do mayor en primera posición: Do, Re, Mi, Fa, Sol, La, Si, Do. */
export const C_MAJOR_UP: ScoreEvent[] = [n('A', 3), n('D', 0), n('D', 2), n('D', 3), n('G', 0), n('G', 2), n('B', 0), n('B', 1)];

const l261 = lesson('2.6.1', 10, {
  visuals: [null, 'fret-hand', null, null],
  sounds: [null, listen([n('e', 0, 2), n('e', 1, 2)], 60), listen([n('e', 0, 2), n('e', 2, 2)], 60), null],
  cards: [{ listen: listen([n('e', 0, 2), n('e', 1, 2)], 60) }, { listen: listen([n('e', 0, 2), n('e', 2, 2)], 60) }],
  exercises: [
    quiz('2.6.1', 'q1', ['=1', '=2', '=3'], 1),
    ear('2.6.1', 'ear', [k('2.6.1', 'semi'), k('2.6.1', 'tone')], 0, { tones: [hz('e'), hz('e', 1)] }),
    ear('2.6.1', 'ear2', [k('2.6.1', 'semi'), k('2.6.1', 'tone')], 1, { tones: [hz('B'), hz('B', 2)] }),
    tap('2.6.1', 'tap', [{ string: 'e', fret: 1 }, { string: 'e', fret: 3 }]),
    play('2.6.1', 'play', [{ string: 'e', fret: 0 }, { string: 'e', fret: 1 }, { string: 'e', fret: 0 }, { string: 'e', fret: 2 }], null),
  ],
});

const l262 = lesson('2.6.2', 12, {
  visuals: [null, 'fret-hand', null, null],
  sounds: [null, listen(C_MAJOR_UP, 70), null, null],
  cards: [{ listen: listen(C_MAJOR_UP, 60) }, {}],
  exercises: [
    quiz('2.6.2', 'q1', [k('2.6.2', 'q1o1'), k('2.6.2', 'q1o2'), k('2.6.2', 'q1o3')], 0),
    tap('2.6.2', 'tap', scoreNotes(C_MAJOR_UP)),
    play('2.6.2', 'play', scoreNotes(C_MAJOR_UP), 60),
  ],
});

const l263 = lesson('2.6.3', 12, {
  visuals: [null, 'chord-c', 'chord-am', null],
  sounds: [null, strumListen(['C'], WHOLES, 60), strumListen(['Am'], WHOLES, 60), null],
  cards: [{ figure: 'chord-c', listen: strumListen(['C', 'Am'], WHOLES, 60) }, {}],
  exercises: [
    quiz('2.6.3', 'q1', [k('2.6.3', 'q1o1'), k('2.6.3', 'q1o2'), k('2.6.3', 'q1o3')], 0),
    ear('2.6.3', 'ear1', [k('2.6.3', 'major'), k('2.6.3', 'minor')], 0, { example: strumListen(['G'], WHOLES, 60) }),
    ear('2.6.3', 'ear2', [k('2.6.3', 'major'), k('2.6.3', 'minor')], 1, { example: strumListen(['Dm'], WHOLES, 60) }),
    ear('2.6.3', 'ear3', [k('2.6.3', 'major'), k('2.6.3', 'minor')], 0, { example: strumListen(['A'], WHOLES, 60) }),
    play('2.6.3', 'play', [{ string: 'A', fret: 3 }, { string: 'D', fret: 2 }, { string: 'G', fret: 0 }, { string: 'A', fret: 0 }, { string: 'B', fret: 1 }, { string: 'e', fret: 0 }], null),
  ],
});

const l264 = lesson('2.6.4', 12, {
  visuals: ['chord-c', 'chord-g', 'chord-d', null],
  sounds: [strumListen(['G', 'C', 'D', 'G'], QUARTERS, 70), null, strumListen(['C', 'G', 'C', 'G'], QUARTERS, 70), null],
  cards: [{ listen: strumListen(['G', 'C', 'D', 'G'], QUARTERS, 70, { click: true }) }, {}],
  exercises: [
    quiz('2.6.4', 'q1', ['=F', '=G', '=Am', '=Dm'], 0),
    quiz('2.6.4', 'q2', ['=D', '=C', '=Em', '=A'], 0),
    strum('2.6.4', 'strum', ['G', 'C', 'D', 'G'], QUARTERS),
  ],
});

const l265 = lesson('2.6.5', 10, {
  visuals: [null, 'chord-g', null, null],
  sounds: [null, strumListen(['G', 'C', 'D', 'G'], QUARTERS, 70), null, null],
  cards: [{}, { figure: 'chord-g' }],
  exercises: [
    quiz('2.6.5', 'q1', ['=G', '=A', '=B', '=F'], 1),
    quiz('2.6.5', 'q2', [k('2.6.5', 'q2o1'), k('2.6.5', 'q2o2'), k('2.6.5', 'q2o3')], 0),
    strum('2.6.5', 'strum', ['G', 'C', 'D', 'G'], QUARTERS),
  ],
});

// ───────────── 2.7 · Pentatónica menor ─────────────

/** Pentatónica menor de La en primera posición (La, Do, Re, Mi, Sol), de la 6.ª a la 1.ª. */
export const PENTA_OPEN: { string: StringId; fret: number }[] = [
  { string: 'E', fret: 0 }, { string: 'E', fret: 3 },
  { string: 'A', fret: 0 }, { string: 'A', fret: 3 },
  { string: 'D', fret: 0 }, { string: 'D', fret: 2 },
  { string: 'G', fret: 0 }, { string: 'G', fret: 2 },
  { string: 'B', fret: 1 }, { string: 'B', fret: 3 },
  { string: 'e', fret: 0 }, { string: 'e', fret: 3 },
];
/** Clases de altura de la pentatónica menor de La. */
export const PENTA_AM = [9, 0, 2, 4, 7];

const asScore = (notes: { string: StringId; fret: number }[]): ScoreEvent[] => notes.map((x) => n(x.string, x.fret));
export const PENTA_UP_DOWN = asScore([...PENTA_OPEN, ...[...PENTA_OPEN].reverse()]);

/** 2.7.3: pregunta y respuesta en las agudas (originales). */
export const PENTA_CALL: ScoreEvent[] = [n('G', 2), n('B', 1), n('B', 3), n('e', 0), n('B', 3), n('B', 1), n('G', 2, 2)];
export const PENTA_ANSWER: ScoreEvent[] = [n('e', 0), n('e', 3), n('e', 0), n('B', 3), n('B', 1), n('G', 2), n('G', 0), n('G', 2)];

const AM_BACK = strumListen(['Am', 'Am', 'Dm', 'Am'], QUARTERS, 70);
export const BLUES_12: OpenChordId[] = ['A7', 'A7', 'A7', 'A7', 'D7', 'D7', 'A7', 'A7', 'E7', 'D7', 'A7', 'E7'];

const l271 = lesson('2.7.1', 10, {
  visuals: [null, 'fret-hand', null, null],
  sounds: [null, listen(asScore(PENTA_OPEN), 70), null, null],
  cards: [{ listen: listen(asScore(PENTA_OPEN), 60) }, {}],
  exercises: [
    quiz('2.7.1', 'q1', [k('2.7.1', 'q1o1'), k('2.7.1', 'q1o2'), k('2.7.1', 'q1o3')], 0),
    tap('2.7.1', 'tap', PENTA_OPEN.slice(0, 6)),
    play('2.7.1', 'play', PENTA_OPEN, null),
  ],
});

const l272 = lesson('2.7.2', 10, {
  visuals: [null, 'pima-hand', 'fret-hand', null],
  sounds: [null, listen(PENTA_UP_DOWN, 80), null, null],
  cards: [{ listen: listen(PENTA_UP_DOWN, 60, { click: true }) }, {}],
  exercises: [
    { id: '2.7.2-pads', kind: 'tapRhythm', needsBass: false, skills: ['rhythm', 'technique'], promptKey: k('2.7.2', 'pads'), bpm: 70, beats: 16, pads: ['i', 'm'] },
    play('2.7.2', 'play', scoreNotes(PENTA_UP_DOWN), 60),
  ],
});

const l273 = lesson('2.7.3', 12, {
  visuals: [null, 'fret-hand', null, null],
  sounds: [listen(PENTA_CALL, 70), null, listen(PENTA_ANSWER, 70), null],
  cards: [{ listen: listen(PENTA_CALL, 70, { click: true }) }, { listen: listen(PENTA_ANSWER, 70, { click: true }) }],
  exercises: [playScore('2.7.3', 'call', PENTA_CALL), playScore('2.7.3', 'answer', PENTA_ANSWER)],
});

const l274 = lesson('2.7.4', 14, {
  visuals: [null, 'fret-hand', 'chord-am', null],
  sounds: [AM_BACK, null, null, null],
  cards: [{ listen: AM_BACK }, {}],
  exercises: [
    { id: '2.7.4-improv', kind: 'improvise', needsBass: true, skills: ['ear', 'technique'], promptKey: k('2.7.4', 'improv'), backing: AM_BACK, loops: 2, scale: PENTA_AM, minNotes: 12 },
  ],
});

const l275 = lesson('2.7.5', 14, {
  visuals: ['chord-a7', 'chord-d7', 'chord-e7', null],
  sounds: [strumListen(BLUES_12.slice(0, 4), QUARTERS, 70), null, strumListen(BLUES_12.slice(8), QUARTERS, 70), null],
  cards: [{ listen: strumListen(BLUES_12, QUARTERS, 70, { click: true }) }, {}],
  exercises: [
    quiz('2.7.5', 'q1', ['=8', '=12', '=16'], 1),
    strum('2.7.5', 'strum', BLUES_12, QUARTERS, 70),
    { id: '2.7.5-improv', kind: 'improvise', needsBass: true, skills: ['ear', 'technique'], promptKey: k('2.7.5', 'improv'), backing: strumListen(BLUES_12, QUARTERS, 70), loops: 1, scale: PENTA_AM, minNotes: 16 },
  ],
});

export const NYLON_LEVEL2_LESSONS: Lesson[] = [
  l211, l212, l213, l214, l215, l221, l222, l223, l224, l225, l231, l232, l233, l234, l235,
  l241, l242, l243, l244, l245, l251, l252, l253, l254, l255, l261, l262, l263, l264, l265, l271, l272, l273, l274, l275,
];

// ───────────── Checkpoint 2 ─────────────

const ck = (key: string) => `content.n.cp2.${key}`;
export const CP2_CHORDS: OpenChordId[] = ['G', 'Em7', 'Am7', 'D7'];

export const NYLON_CP2: Checkpoint = {
  level: 2,
  titleKey: 'content.n.checkpoint.2',
  introKey: ck('intro'),
  mastery: 0.8,
  parts: [
    { id: 'ncp2-ear', kind: 'ear', needsBass: false, skills: ['ear'], promptKey: ck('ear'), options: [k('2.6.3', 'major'), k('2.6.3', 'minor')], correctIndex: 1, example: strumListen(['Em'], WHOLES, 60) },
    { id: 'ncp2-strum', kind: 'strum', needsBass: true, skills: ['rhythm', 'technique'], promptKey: ck('strum'), bpm: 70, pattern: BALLAD, chords: [...CP2_CHORDS, ...CP2_CHORDS] },
    { id: 'ncp2-arp', kind: 'playAlong', needsBass: true, skills: ['technique', 'rhythm'], promptKey: ck('arp'), notes: scoreNotes(PIMA(CP2_CHORDS)), bpm: 70 },
    { id: 'ncp2-penta', kind: 'playAlong', needsBass: true, skills: ['technique', 'fretboard'], promptKey: ck('penta'), notes: notesOf([...PENTA_CALL, ...PENTA_ANSWER]), bpm: 70 },
  ],
};
