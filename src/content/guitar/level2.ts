/**
 * Guitarra eléctrica, nivel 2: acordes, ritmo y riffs.
 * 2.1 primeros acordes · 2.2 más acordes abiertos · 2.3 cambiar sin parar ·
 * 2.4 power chords · 2.5 palm muting · 2.6 pentatónica menor · checkpoint 2.
 *
 * Mientras la app no reconoce acordes, cada acorde se practica en dos partes:
 * sus notas de a una (`playAlong` sin tempo) y el rasgueo a tiempo (`strum`,
 * que escucha los golpes). En los power chords la app escucha la nota grave.
 * Todo es material original. Textos en `content.g.l21x…l26x` y `content.g.cp2`.
 */
import type { Checkpoint } from '../checkpoints';
import type { Card, Exercise, Figure, Lesson, ListenExample, ScoreEvent } from '../types';
import type { StringId } from '../../instruments/profiles';
import type { ChordId } from '../../music/chords';
import { chordMidi, powerMidi } from '../../music/chords';
import { midiToFreq } from '../../music/notes';
import { BALLAD, DOWN_EIGHTHS, EIGHTHS, HALVES, QUARTERS, type Stroke } from '../../music/strum';
import { chordArp, chordFretted, k, listen, n, notesOf, scenes, strumListen, tabOf } from './helpers';

const STEPS = [60, 70, 80];

// ───────────── Constructores ─────────────

interface CardSpec {
  figure?: Figure;
  listen?: ListenExample;
}

function lesson(
  id: string,
  minutes: number,
  spec: { visuals: (Figure | null)[]; sounds: (ListenExample | null)[]; cards: CardSpec[]; exercises: Exercise[]; mastery?: number },
): Lesson {
  return {
    id,
    minutes,
    titleKey: k(id, 'title'),
    objectiveKey: k(id, 'objective'),
    cartoon: { riveResource: `kordi_g_${id.replace(/\./g, '_')}`, durationSec: 100, sceneKeys: scenes(id), visuals: spec.visuals, sounds: spec.sounds },
    cards: spec.cards.map((c, i): Card => ({ titleKey: k(id, `c${i + 1}t`), bodyKey: k(id, `c${i + 1}b`), ...c })),
    exercises: spec.exercises,
    mastery: spec.mastery ?? 0.8,
  };
}

const strum = (lessonId: string, key: string, chords: string[], pattern: Stroke[], bpm = 60): Exercise => ({
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

const play = (lessonId: string, key: string, notes: { string: StringId; fret: number; beats?: 1 | 2 | 4 }[], bpm: number | null, score?: ScoreEvent[]): Exercise => ({
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

const playScore = (lessonId: string, key: string, score: ScoreEvent[]): Exercise => play(lessonId, key, notesOf(score), 60, score);

const tap = (lessonId: string, key: string, sequence: { string: StringId; fret: number }[], frets: number): Exercise => ({
  id: `${lessonId}-${key}`,
  kind: 'fretboardTap',
  needsBass: false,
  skills: ['fretboard'],
  promptKey: k(lessonId, key),
  sequence,
  frets,
});

const quiz = (lessonId: string, key: string, options: string[], correctIndex: number): Exercise => ({
  id: `${lessonId}-${key}`,
  kind: 'quiz',
  needsBass: false,
  skills: ['theory'],
  promptKey: k(lessonId, key),
  options,
  correctIndex,
});

const tab = (lessonId: string, key: string, score: ScoreEvent[], frets: number): Exercise => ({
  id: `${lessonId}-${key}`,
  kind: 'tabReading',
  needsBass: false,
  skills: ['theory', 'fretboard'],
  promptKey: k(lessonId, key),
  notes: tabOf(score),
  frets,
});

/** Las notas de un acorde como ejemplo de tablatura en compases completos (4, 5 o 6 notas → 4 u 8 pulsos). */
export function arpScore(id: ChordId): ScoreEvent[] {
  const notes = chordArp(id);
  const beats: (1 | 2 | 4)[] = notes.length === 4 ? [1, 1, 1, 1] : notes.length === 5 ? [1, 1, 1, 1, 4] : [1, 1, 1, 1, 2, 2];
  return notes.map((x, i) => n(x.string, x.fret, beats[i]));
}

const CHORD_FIG: Record<ChordId, Figure> = {
  Em: 'chord-em',
  E: 'chord-e',
  Am: 'chord-am',
  A: 'chord-a',
  C: 'chord-c',
  G: 'chord-g',
  D: 'chord-d',
  Dm: 'chord-dm',
};

/** Lección de un acorde nuevo: diagrama, sus notas de a una y rasgueo en negras. */
function chordLesson(id: string, chord: ChordId): Lesson {
  const fig = CHORD_FIG[chord];
  return lesson(id, 12, {
    visuals: [null, fig, fig, null],
    sounds: [strumListen([chord], QUARTERS, 70), listen(arpScore(chord), 90), null, strumListen([chord, chord], BALLAD, 80)],
    cards: [{ figure: fig, listen: listen(arpScore(chord), 70, { show: 'tab' }) }, {}],
    exercises: [
      tap(id, 'tap', chordFretted(chord), 4),
      play(id, 'arp', chordArp(chord), null),
      strum(id, 'strum', [chord, chord], QUARTERS),
    ],
  });
}

// ───────────── 2.1 y 2.2 · Acordes abiertos ─────────────

const l211 = chordLesson('2.1.1', 'Em');
const l212 = chordLesson('2.1.2', 'E');
const l213 = chordLesson('2.1.3', 'Am');
const l214 = chordLesson('2.1.4', 'A');

const l215 = lesson('2.1.5', 12, {
  visuals: ['chord-em', 'chord-am', 'chord-e', 'chord-a'],
  sounds: [strumListen(['Em', 'Am', 'E', 'A'], HALVES, 80), strumListen(['Em', 'Em', 'Am', 'Am'], HALVES, 70), strumListen(['E', 'E', 'A', 'A'], HALVES, 70), null],
  cards: [
    { figure: 'chord-am', listen: strumListen(['Em', 'Em', 'Am', 'Am'], HALVES, 70, { click: true }) },
    { figure: 'chord-a', listen: strumListen(['E', 'E', 'A', 'A'], HALVES, 70, { click: true }) },
  ],
  exercises: [
    strum('2.1.5', 'strum1', ['Em', 'Em', 'Am', 'Am'], HALVES),
    strum('2.1.5', 'strum2', ['E', 'E', 'A', 'A'], HALVES),
    strum('2.1.5', 'strum3', ['Em', 'Am', 'E', 'A'], QUARTERS),
  ],
});

const l221 = chordLesson('2.2.1', 'D');
const l222 = chordLesson('2.2.2', 'Dm');
const l223 = chordLesson('2.2.3', 'C');
const l224 = chordLesson('2.2.4', 'G');

const l225 = lesson('2.2.5', 14, {
  visuals: ['chord-c', 'chord-g', 'chord-am', 'chord-em'],
  sounds: [strumListen(['C', 'G', 'Am', 'Em'], QUARTERS, 80), null, null, strumListen(['G', 'D', 'Em', 'C'], BALLAD, 80)],
  cards: [{ listen: strumListen(['C', 'G', 'Am', 'Em'], QUARTERS, 70, { click: true }) }, { figure: 'chord-d' }],
  exercises: [
    quiz('2.2.5', 'q1', ['=C', '=G', '=Dm', '=A'], 2),
    quiz('2.2.5', 'q2', ['=D', '=G', '=C', '=Em'], 0),
    strum('2.2.5', 'strum1', ['C', 'G', 'Am', 'Em'], QUARTERS),
    strum('2.2.5', 'strum2', ['G', 'D', 'Em', 'C'], QUARTERS),
  ],
});

// ───────────── 2.3 · Cambiar sin parar ─────────────

const l231 = lesson('2.3.1', 10, {
  visuals: ['pick-down', 'chord-em', null, null],
  sounds: [strumListen(['Em', 'Em'], QUARTERS, 70), null, strumListen(['Em', 'Em'], QUARTERS, 70, { click: true }), null],
  cards: [{ figure: 'pick-down', listen: strumListen(['Em', 'Em'], QUARTERS, 70, { click: true }) }, {}],
  exercises: [
    { id: '2.3.1-pulse', kind: 'tempoTrainer', needsBass: false, skills: ['rhythm'], promptKey: k('2.3.1', 'pulse'), bpm: 70, beats: 16, audibleBeats: 8 },
    strum('2.3.1', 'strum', ['Em', 'Em', 'Em', 'Em'], QUARTERS),
  ],
});

const l232 = lesson('2.3.2', 10, {
  visuals: ['pick-alternate', 'chord-am', null, null],
  sounds: [strumListen(['Am', 'Am'], EIGHTHS, 70), null, null, null],
  cards: [{ figure: 'pick-alternate', listen: strumListen(['Am', 'Am'], EIGHTHS, 70, { click: true }) }, {}],
  exercises: [
    { id: '2.3.2-tap', kind: 'tapRhythm', needsBass: false, skills: ['rhythm'], promptKey: k('2.3.2', 'tap'), bpm: 70, beats: 16, pads: ['↓', '↑'] },
    strum('2.3.2', 'strum', ['Am', 'Am', 'Am', 'Am'], EIGHTHS),
  ],
});

const l233 = lesson('2.3.3', 12, {
  visuals: [null, 'pick-alternate', 'chord-g', null],
  sounds: [strumListen(['G', 'G'], BALLAD, 80), null, strumListen(['G'], BALLAD, 60, { click: true }), null],
  cards: [{ listen: strumListen(['G', 'G'], BALLAD, 70, { click: true }) }, {}],
  exercises: [strum('2.3.3', 'strum', ['G', 'G', 'G', 'G'], BALLAD)],
});

const l234 = lesson('2.3.4', 12, {
  visuals: ['chord-c', 'chord-am', 'chord-g', null],
  sounds: [strumListen(['C', 'Am', 'C', 'Am'], BALLAD, 80), null, null, strumListen(['C', 'Am', 'C', 'Am'], BALLAD, 70)],
  cards: [{ listen: strumListen(['C', 'Am', 'C', 'Am'], BALLAD, 70, { click: true }) }, { figure: 'chord-am' }],
  exercises: [strum('2.3.4', 'strum1', ['C', 'Am', 'C', 'Am'], BALLAD), strum('2.3.4', 'strum2', ['G', 'C', 'G', 'C'], BALLAD)],
});

const l235 = lesson('2.3.5', 14, {
  visuals: ['chord-em', 'chord-c', 'chord-g', 'chord-d'],
  sounds: [strumListen(['Em', 'C', 'G', 'D'], BALLAD, 80), null, null, null],
  cards: [{ listen: strumListen(['Em', 'C', 'G', 'D'], BALLAD, 70, { click: true }) }, {}],
  exercises: [strum('2.3.5', 'strum1', ['Em', 'C', 'G', 'D'], BALLAD), strum('2.3.5', 'strum2', ['G', 'D', 'Em', 'C'], BALLAD)],
});

// ───────────── 2.4 · Power chords ─────────────

const G5 = powerMidi('E', 3);
const A5 = powerMidi('E', 5);
const C5_6 = powerMidi('E', 8);
const D5_6 = powerMidi('E', 10);
const C5 = powerMidi('A', 3);
const D5 = powerMidi('A', 5);
const E5_5 = powerMidi('A', 7);
const E5 = powerMidi('E', 0);
const CRUNCH = { tone: 'crunch' as const };

/** Rasgueo del riff de quintas: abajo, abajo, abajo-arriba, abajo (por compás). */
const RIFF_STROKES: Stroke[] = ['D', '-', 'D', '-', 'D', 'U', 'D', '-'];
const riffBar = (s: StringId, fret: number): ScoreEvent[] => [n(s, fret), n(s, fret), n(s, fret, 0.5), n(s, fret, 0.5), n(s, fret)];
/** Riff de quintas (original): la app escucha la nota grave de cada quinta. */
export const POWER_RIFF: ScoreEvent[] = [...riffBar('E', 3), ...riffBar('E', 5), ...riffBar('A', 3), ...riffBar('E', 3)];

const l241 = lesson('2.4.1', 12, {
  visuals: ['power-6', 'power-6', 'palm-mute', null],
  sounds: [strumListen([G5, G5], QUARTERS, 80, CRUNCH), null, null, strumListen([G5, G5], QUARTERS, 80, { tone: 'clean' })],
  cards: [{ figure: 'power-6', listen: strumListen([G5, G5], QUARTERS, 70, CRUNCH) }, {}],
  exercises: [
    tap('2.4.1', 'tap', [
      { string: 'E', fret: 3 },
      { string: 'A', fret: 5 },
    ], 6),
    play('2.4.1', 'play', [
      { string: 'E', fret: 3 },
      { string: 'E', fret: 3 },
      { string: 'E', fret: 3 },
      { string: 'E', fret: 3 },
    ], 60),
    strum('2.4.1', 'strum', ['G5', 'G5'], QUARTERS),
  ],
});

const l242 = lesson('2.4.2', 12, {
  visuals: ['power-6', null, null, null],
  sounds: [strumListen([G5, A5, C5_6, D5_6], HALVES, 80, CRUNCH), null, null, strumListen([G5, A5, C5_6, D5_6], HALVES, 80, CRUNCH)],
  cards: [{ listen: strumListen([G5, A5, C5_6, D5_6], HALVES, 70, CRUNCH) }, { figure: 'power-6' }],
  exercises: [
    quiz('2.4.2', 'q1', ['=3', '=5', '=7', '=8'], 1),
    play('2.4.2', 'play', [
      { string: 'E', fret: 3, beats: 2 },
      { string: 'E', fret: 5, beats: 2 },
      { string: 'E', fret: 8, beats: 2 },
      { string: 'E', fret: 10, beats: 2 },
    ], 60),
  ],
});

const l243 = lesson('2.4.3', 12, {
  visuals: ['power-5', 'power-5', null, null],
  sounds: [strumListen([C5, D5, E5_5, D5], HALVES, 80, CRUNCH), null, null, strumListen([C5, D5, E5_5, D5], HALVES, 80, CRUNCH)],
  cards: [{ figure: 'power-5', listen: strumListen([C5, D5, E5_5, D5], HALVES, 70, CRUNCH) }, {}],
  exercises: [
    tap('2.4.3', 'tap', [
      { string: 'A', fret: 3 },
      { string: 'D', fret: 5 },
    ], 6),
    play('2.4.3', 'play', [
      { string: 'A', fret: 3, beats: 2 },
      { string: 'A', fret: 5, beats: 2 },
      { string: 'A', fret: 7, beats: 2 },
      { string: 'A', fret: 5, beats: 2 },
    ], 60),
  ],
});

const SIX_FIVE: ScoreEvent[] = [n('E', 3, 2), n('A', 3, 2), n('A', 5, 2), n('E', 3, 2)];

const l244 = lesson('2.4.4', 12, {
  visuals: ['power-6', 'power-5', null, null],
  sounds: [strumListen([G5, C5, D5, G5], HALVES, 80, CRUNCH), null, null, null],
  cards: [{ listen: strumListen([G5, C5, D5, G5], HALVES, 70, CRUNCH) }, {}],
  exercises: [tab('2.4.4', 'tab', SIX_FIVE, 7), play('2.4.4', 'play', tabOf(SIX_FIVE), 60)],
});

const l245 = lesson('2.4.5', 14, {
  visuals: [null, 'power-6', 'power-5', null],
  sounds: [strumListen([G5, A5, C5, G5], RIFF_STROKES, 80, CRUNCH), null, null, null],
  cards: [{ listen: strumListen([G5, A5, C5, G5], RIFF_STROKES, 70, { ...CRUNCH, click: true }) }, {}],
  exercises: [strum('2.4.5', 'strum', ['G5', 'A5', 'C5', 'G5'], RIFF_STROKES), playScore('2.4.5', 'play', POWER_RIFF)],
});

// ───────────── 2.5 · Palm muting ─────────────

/** Corcheas con palm mute: en los ejemplos suenan apagadas aunque el resto vaya con crunch. */
const chug = (s: StringId, fret: number, count: number): ScoreEvent[] => Array.from({ length: count }, () => ({ string: s, fret, beats: 0.5, tone: 'muted' as const }));
const MUTED = { tone: 'muted' as const };
/** Las mismas corcheas sin palm mute, para comparar. */
const OPEN_8: ScoreEvent[] = Array.from({ length: 8 }, () => n('E', 0, 0.5));

/** Corcheas apagadas y una nota abierta de acento por compás. */
export const PM_ACCENT: ScoreEvent[] = [...chug('E', 0, 6), n('A', 0), ...chug('E', 0, 6), n('D', 0), ...chug('E', 0, 6), n('A', 0), ...chug('E', 0, 6), n('G', 0)];
/** Riff con palm mute (original). */
export const PM_RIFF: ScoreEvent[] = [
  ...chug('E', 0, 4), n('E', 3), n('E', 5),
  ...chug('E', 0, 4), n('E', 5), n('E', 3),
  ...chug('E', 0, 4), n('A', 3), n('A', 5),
  ...chug('E', 0, 4), n('E', 0, 2),
];

const l251 = lesson('2.5.1', 10, {
  visuals: ['palm-mute', 'palm-mute', null, null],
  sounds: [listen(chug('E', 0, 8), 70), null, null, listen([...OPEN_8, ...chug('E', 0, 8)], 70, CRUNCH)],
  cards: [{ figure: 'palm-mute' }, { listen: listen(chug('E', 0, 8), 70) }, { listen: listen(OPEN_8, 70, CRUNCH) }],
  exercises: [
    { id: '2.5.1-ear1', kind: 'ear', needsBass: false, skills: ['ear'], promptKey: k('2.5.1', 'ear'), options: [k('2.5.1', 'open'), k('2.5.1', 'muted')], correctIndex: 1, tones: [midiToFreq(40), midiToFreq(40), midiToFreq(40)], timbres: ['muted', 'muted', 'muted'] },
    { id: '2.5.1-ear2', kind: 'ear', needsBass: false, skills: ['ear'], promptKey: k('2.5.1', 'ear'), options: [k('2.5.1', 'open'), k('2.5.1', 'muted')], correctIndex: 0, tones: [midiToFreq(40), midiToFreq(40), midiToFreq(40)], timbres: ['crunch', 'crunch', 'crunch'] },
    play('2.5.1', 'play', Array.from({ length: 8 }, () => ({ string: 'E' as StringId, fret: 0 })), 60),
  ],
});

const PM_EIGHTHS = chug('E', 0, 16);

const l252 = lesson('2.5.2', 10, {
  visuals: ['palm-mute', null, null, null],
  sounds: [listen(PM_EIGHTHS, 80), null, null, null],
  cards: [{ listen: listen(PM_EIGHTHS, 70, { show: 'tab', click: true }) }, {}],
  exercises: [playScore('2.5.2', 'play', PM_EIGHTHS)],
});

const l253 = lesson('2.5.3', 12, {
  visuals: ['palm-mute', null, null, null],
  sounds: [listen(PM_ACCENT.slice(0, 7), 80, CRUNCH), null, null, null],
  cards: [{ listen: listen(PM_ACCENT, 70, { ...CRUNCH, show: 'tab', click: true }) }, {}],
  exercises: [playScore('2.5.3', 'play', PM_ACCENT)],
});

const PM_POWER: ScoreEvent[] = [...chug('E', 0, 8), ...chug('E', 0, 8), ...chug('E', 3, 8), ...chug('E', 5, 8)];

const l254 = lesson('2.5.4', 12, {
  visuals: ['power-6', 'palm-mute', null, null],
  sounds: [strumListen([E5, E5, G5, A5], DOWN_EIGHTHS, 70, MUTED), null, null, null],
  cards: [{ listen: strumListen([E5, E5, G5, A5], DOWN_EIGHTHS, 70, { ...MUTED, click: true }) }, {}],
  exercises: [strum('2.5.4', 'strum', ['E5', 'E5', 'G5', 'A5'], DOWN_EIGHTHS), playScore('2.5.4', 'play', PM_POWER)],
});

const l255 = lesson('2.5.5', 14, {
  visuals: [null, 'palm-mute', 'power-6', null],
  sounds: [listen(PM_RIFF, 80, CRUNCH), null, null, null],
  cards: [{ listen: listen(PM_RIFF, 70, { ...CRUNCH, show: 'tab', click: true }) }, {}],
  exercises: [playScore('2.5.5', 'play', PM_RIFF)],
});

// ───────────── 2.6 · Pentatónica menor (La, traste 5) ─────────────

export const PENTA_UP: { string: StringId; fret: number }[] = [
  { string: 'E', fret: 5 },
  { string: 'E', fret: 8 },
  { string: 'A', fret: 5 },
  { string: 'A', fret: 7 },
  { string: 'D', fret: 5 },
  { string: 'D', fret: 7 },
  { string: 'G', fret: 5 },
  { string: 'G', fret: 7 },
  { string: 'B', fret: 5 },
  { string: 'B', fret: 8 },
  { string: 'e', fret: 5 },
  { string: 'e', fret: 8 },
];
export const PENTA_DOWN = [...PENTA_UP].reverse();
const asQuarters = (xs: { string: StringId; fret: number }[]) => xs.map((x) => n(x.string, x.fret));

/** Subida y bajada en corcheas y la tónica al final: 4 compases. */
export const PENTA_EIGHTHS: ScoreEvent[] = [...PENTA_UP, ...PENTA_DOWN].map((x) => n(x.string, x.fret, 0.5)).concat([n('E', 5, 4)]);
/** Frase de cuatro compases (original), en negras para leerla en tablatura. */
export const PENTA_LICK: ScoreEvent[] = [
  n('e', 8), n('e', 5), n('B', 8), n('B', 5),
  n('G', 7), n('G', 5), n('D', 7, 2),
  n('D', 5), n('D', 7), n('G', 5), n('G', 7),
  n('D', 7, 4),
];
/** Pregunta: sube y queda en Mi (abierta). Respuesta: baja y vuelve a La (la tónica). */
export const CALL: ScoreEvent[] = [n('G', 5), n('G', 7), n('B', 8), n('e', 5), n('B', 5, 4)];
export const RESPONSE: ScoreEvent[] = [n('B', 8), n('B', 5), n('G', 7), n('G', 5), n('D', 7, 4)];

const l261 = lesson('2.6.1', 12, {
  visuals: ['penta-box', 'penta-box', null, null],
  sounds: [listen(asQuarters(PENTA_UP), 100), null, null, listen(asQuarters(PENTA_UP), 70)],
  cards: [{ figure: 'penta-box' }, { listen: listen(asQuarters(PENTA_UP), 70, { show: 'tab' }) }],
  exercises: [quiz('2.6.1', 'q1', ['=A', '=C', '=E', '=G'], 0), tap('2.6.1', 'tap', PENTA_UP.slice(0, 6), 9)],
});

const l262 = lesson('2.6.2', 12, {
  visuals: ['penta-box', null, null, null],
  sounds: [listen(asQuarters([...PENTA_UP, ...PENTA_DOWN]), 100), null, null, null],
  cards: [{ listen: listen(asQuarters([...PENTA_UP, ...PENTA_DOWN]), 70, { show: 'tab', click: true }) }, { figure: 'penta-box' }],
  exercises: [play('2.6.2', 'play', [...PENTA_UP, ...PENTA_DOWN], 60)],
});

const l263 = lesson('2.6.3', 12, {
  visuals: ['pick-alternate', 'penta-box', null, null],
  sounds: [listen(PENTA_EIGHTHS, 80), null, null, null],
  cards: [{ listen: listen(PENTA_EIGHTHS, 70, { show: 'tab', click: true }) }, {}],
  exercises: [playScore('2.6.3', 'play', PENTA_EIGHTHS)],
});

const l264 = lesson('2.6.4', 12, {
  visuals: [null, 'penta-box', null, null],
  sounds: [listen(PENTA_LICK, 80, CRUNCH), null, null, null],
  cards: [{ listen: listen(PENTA_LICK, 70, { show: 'tab', click: true }) }, {}],
  exercises: [tab('2.6.4', 'tab', PENTA_LICK, 9), play('2.6.4', 'play', tabOf(PENTA_LICK), 60)],
});

const l265 = lesson('2.6.5', 14, {
  visuals: [null, 'penta-box', null, null],
  sounds: [listen(CALL, 70, CRUNCH), listen(RESPONSE, 70, CRUNCH), listen([...CALL, ...RESPONSE], 70, CRUNCH), null],
  cards: [{ listen: listen(CALL, 70, { show: 'tab' }) }, { listen: listen(RESPONSE, 70, { show: 'tab' }) }],
  exercises: [play('2.6.5', 'play1', tabOf(RESPONSE), 60), play('2.6.5', 'play2', tabOf([...CALL, ...RESPONSE]), 60)],
});

export const GUITAR_LEVEL2_LESSONS: Lesson[] = [
  l211, l212, l213, l214, l215,
  l221, l222, l223, l224, l225,
  l231, l232, l233, l234, l235,
  l241, l242, l243, l244, l245,
  l251, l252, l253, l254, l255,
  l261, l262, l263, l264, l265,
];

// ───────────── Checkpoint 2 ─────────────

const ck = (key: string) => `content.g.cp2.${key}`;
/** Tablatura nueva del checkpoint: quintas en la 6.ª y la 5.ª (se lee la nota grave). */
export const CP2_TAB: ScoreEvent[] = [n('E', 3), n('E', 3), n('E', 5), n('E', 5), n('A', 3, 2), n('A', 5, 2), n('E', 8), n('E', 8), n('E', 5), n('E', 5), n('E', 3, 4)];

export const GUITAR_CP2: Checkpoint = {
  level: 2,
  titleKey: 'content.g.checkpoint.2',
  introKey: ck('intro'),
  mastery: 0.8,
  parts: [
    {
      id: 'gcp2-ear',
      kind: 'ear',
      needsBass: false,
      skills: ['ear'],
      promptKey: ck('ear'),
      options: [ck('major'), ck('minor')],
      correctIndex: 1,
      // La, Do, Mi: la tríada de La menor (cuerdas 3, 2 y 1 del acorde).
      tones: chordMidi('Am').slice(2).map(midiToFreq),
    },
    {
      id: 'gcp2-tab',
      kind: 'tabReading',
      needsBass: false,
      skills: ['theory', 'fretboard'],
      promptKey: ck('tab'),
      notes: tabOf(CP2_TAB),
      frets: 9,
    },
    { id: 'gcp2-strum', kind: 'strum', needsBass: true, skills: ['rhythm', 'technique'], promptKey: ck('strum'), bpm: 70, pattern: BALLAD, chords: ['Em', 'C', 'G', 'D'] },
    { id: 'gcp2-riff', kind: 'playAlong', needsBass: true, skills: ['rhythm', 'technique'], promptKey: ck('riff'), notes: notesOf(PM_RIFF), score: PM_RIFF, bpm: 70 },
    { id: 'gcp2-penta', kind: 'playAlong', needsBass: true, skills: ['technique', 'fretboard'], promptKey: ck('penta'), notes: [...PENTA_UP, ...PENTA_DOWN], bpm: 70 },
  ],
};

