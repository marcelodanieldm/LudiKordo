/**
 * Guitarra eléctrica, nivel 3: expresión y paso a intermedio.
 * 3.1 ligados · 3.2 slides · 3.3 bending · 3.4 vibrato · 3.5 cejilla forma de E ·
 * 3.6 cejilla forma de A · 3.7 mapa del mástil · checkpoint 3.
 *
 * Ligados y slides se practican sin tempo: la app sigue la altura y espera cada
 * nota (un ligado no tiene ataque de púa, así que el detector de golpes no lo vería).
 * Bends y vibrato tienen sus propios ejercicios, que miden la altura en el tiempo.
 * Todo es material original. Textos en `content.g.l31x…l37x` y `content.g.cp3`.
 */
import type { Checkpoint } from '../checkpoints';
import type { Exercise, Figure, Lesson, ScoreEvent } from '../types';
import type { StringId } from '../../instruments/profiles';
import { BARRES, diagramMidi, type BarreId } from '../../music/chords';
import { BALLAD, HALVES, QUARTERS } from '../../music/strum';
import { gridNotes, k, listen, n, strumListen, tabOf } from './helpers';
import { CRUNCH, lesson, play, quiz, strum, tab, tap } from './level2';

const bend = (lessonId: string, key: string, s: StringId, fret: number, semitones: 1 | 2, reps: number, release = false): Exercise => ({
  id: `${lessonId}-${key}`,
  kind: 'bend',
  needsBass: true,
  skills: ['technique', 'ear'],
  promptKey: k(lessonId, key),
  string: s,
  fret,
  semitones,
  reps,
  ...(release ? { release } : {}),
});

const vibrato = (lessonId: string, key: string, s: StringId, fret: number, minDepthCents: number, seconds: number): Exercise => ({
  id: `${lessonId}-${key}`,
  kind: 'vibrato',
  needsBass: true,
  skills: ['technique', 'ear'],
  promptKey: k(lessonId, key),
  string: s,
  fret,
  minDepthCents,
  seconds,
});

const seq = (...xs: [StringId, number][]) => xs.map(([s, fret]) => ({ string: s, fret }));
const rep = <T,>(xs: T[], times: number) => Array.from({ length: times }, () => xs).flat();
const quarters = (xs: { string: StringId; fret: number }[]) => xs.map((x) => n(x.string, x.fret));
const bent = (s: StringId, fret: number, beats: 1 | 2 | 4, semis: 1 | 2): ScoreEvent => ({ string: s, fret, beats, bend: semis });
const vib = (s: StringId, fret: number, beats: 1 | 2 | 4, wide = false): ScoreEvent => ({ string: s, fret, beats, vibrato: wide ? 'wide' : true });

// ───────────── 3.1 · Ligados ─────────────

/** Frase con ligados (original): de a dos notas por cuerda, de la 1.ª a la 4.ª. */
export const LEG_PHRASE: ScoreEvent[] = [
  n('e', 5), n('e', 8), n('e', 5), n('B', 8),
  n('B', 5), n('B', 8), n('B', 5), n('G', 7),
  n('G', 5), n('G', 7), n('G', 5), n('D', 7),
  n('D', 5, 2), n('D', 7, 2),
];
const PENTA_PAIRS = seq(['E', 5], ['E', 8], ['A', 5], ['A', 7], ['D', 5], ['D', 7], ['G', 5], ['G', 7], ['B', 5], ['B', 8], ['e', 5], ['e', 8]);

const l311 = lesson('3.1.1', 10, {
  visuals: ['hammer-on', 'hammer-on', null, null],
  sounds: [listen(quarters(rep(seq(['G', 5], ['G', 7]), 2)), 80), null, listen(quarters(seq(['G', 5], ['G', 7])), 60), null],
  cards: [{ figure: 'hammer-on' }, { listen: listen(quarters(rep(seq(['G', 5], ['G', 7]), 2)), 70, { show: 'tab' }) }],
  exercises: [quiz('3.1.1', 'q1', [k('3.1.1', 'q1o1'), k('3.1.1', 'q1o2'), k('3.1.1', 'q1o3')], 0), play('3.1.1', 'play', rep(seq(['G', 5], ['G', 7]), 4), null)],
});

const l312 = lesson('3.1.2', 10, {
  visuals: ['pull-off', 'pull-off', null, null],
  sounds: [listen(quarters(rep(seq(['G', 7], ['G', 5]), 2)), 80), null, listen(quarters(seq(['G', 7], ['G', 5])), 60), null],
  cards: [{ figure: 'pull-off' }, { listen: listen(quarters(rep(seq(['G', 7], ['G', 5]), 2)), 70, { show: 'tab' }) }],
  exercises: [quiz('3.1.2', 'q1', [k('3.1.2', 'q1o1'), k('3.1.2', 'q1o2'), k('3.1.2', 'q1o3')], 1), play('3.1.2', 'play', rep(seq(['G', 7], ['G', 5]), 4), null)],
});

const l313 = lesson('3.1.3', 12, {
  visuals: ['penta-box', 'hammer-on', null, null],
  sounds: [listen(quarters(PENTA_PAIRS), 110), null, null, null],
  cards: [{ listen: listen(quarters(PENTA_PAIRS), 80, { show: 'tab' }) }, { figure: 'penta-box' }],
  exercises: [play('3.1.3', 'play', PENTA_PAIRS, null)],
});

const TRILL = rep(seq(['G', 5], ['G', 7]), 4).map((x) => n(x.string, x.fret, 0.5));

const l314 = lesson('3.1.4', 10, {
  visuals: ['hammer-on', 'pull-off', null, null],
  sounds: [listen([...TRILL, ...TRILL], 80), null, null, null],
  cards: [{ listen: listen([...TRILL, ...TRILL], 70, { show: 'tab' }) }, {}],
  // Sin notas iguales seguidas: en el modo sin tempo, una nota repetida se daría por tocada sola.
  exercises: [play('3.1.4', 'play', [...rep(seq(['G', 5], ['G', 7]), 6), ...seq(['G', 5])], null)],
});

const l315 = lesson('3.1.5', 12, {
  visuals: [null, 'hammer-on', 'pull-off', null],
  sounds: [listen(LEG_PHRASE, 90, CRUNCH), null, null, listen(LEG_PHRASE, 70)],
  cards: [{ listen: listen(LEG_PHRASE, 70, { show: 'tab' }) }, {}],
  exercises: [tab('3.1.5', 'tab', LEG_PHRASE, 9), play('3.1.5', 'play', tabOf(LEG_PHRASE).map(({ string, fret }) => ({ string, fret })), null)],
});

// ───────────── 3.2 · Slides ─────────────

export const SLIDE_PHRASE: ScoreEvent[] = [
  n('e', 8), n('e', 10), n('e', 8), n('e', 5),
  n('B', 8), n('B', 10), n('B', 8), n('B', 5),
  n('G', 7), n('G', 9), n('G', 7), n('G', 5),
  n('D', 7, 4),
];

const l321 = lesson('3.2.1', 10, {
  visuals: ['slide', 'slide', null, null],
  sounds: [listen(quarters(rep(seq(['G', 7], ['G', 9]), 2)), 80), null, listen([n('G', 7), n('G', 9, 2)], 60), null],
  cards: [{ figure: 'slide' }, { listen: listen(quarters(rep(seq(['G', 7], ['G', 9]), 2)), 70, { show: 'tab' }) }],
  exercises: [play('3.2.1', 'play', rep(seq(['G', 7], ['G', 9]), 3), null)],
});

const l322 = lesson('3.2.2', 10, {
  visuals: ['slide', null, null, null],
  sounds: [listen(quarters(rep(seq(['B', 10], ['B', 8]), 2)), 80), null, null, null],
  cards: [{ listen: listen(quarters(rep(seq(['B', 10], ['B', 8]), 2)), 70, { show: 'tab' }) }, {}],
  exercises: [play('3.2.2', 'play', rep(seq(['B', 10], ['B', 8]), 3), null)],
});

const SHIFT = seq(['G', 5], ['G', 7], ['G', 9], ['B', 8], ['B', 10]);

const l323 = lesson('3.2.3', 12, {
  visuals: ['penta-box', 'slide', null, null],
  sounds: [null, null, null, listen([...quarters(SHIFT.slice(0, 4)), n('B', 10, 4)], 80)],
  cards: [{ listen: listen([...quarters(SHIFT.slice(0, 4)), n('B', 10, 4)], 70, { show: 'tab' }) }, {}],
  exercises: [play('3.2.3', 'play', SHIFT, null)],
});

const l324 = lesson('3.2.4', 12, {
  visuals: [null, 'slide', null, null],
  sounds: [listen(SLIDE_PHRASE, 90, CRUNCH), null, null, listen(SLIDE_PHRASE, 70)],
  cards: [{ listen: listen(SLIDE_PHRASE, 70, { show: 'tab' }) }, {}],
  exercises: [tab('3.2.4', 'tab', SLIDE_PHRASE, 11), play('3.2.4', 'play', tabOf(SLIDE_PHRASE).map(({ string, fret }) => ({ string, fret })), null)],
});

// ───────────── 3.3 · Bending ─────────────

const l331 = lesson('3.3.1', 12, {
  visuals: ['bend', 'bend', null, null],
  sounds: [listen([bent('B', 8, 4, 1)], 60, CRUNCH), null, listen([n('B', 9, 2), bent('B', 8, 2, 1)], 60), null],
  cards: [{ figure: 'bend' }, { listen: listen([n('B', 9, 2), bent('B', 8, 2, 1)], 60, { show: 'tab' }) }],
  exercises: [quiz('3.3.1', 'q1', [k('3.3.1', 'q1o1'), k('3.3.1', 'q1o2'), k('3.3.1', 'q1o3')], 0), bend('3.3.1', 'bend', 'B', 8, 1, 3)],
});

const l332 = lesson('3.3.2', 12, {
  visuals: ['bend', null, null, null],
  sounds: [listen([bent('G', 7, 4, 2)], 60, CRUNCH), null, null, null],
  cards: [{ listen: listen([n('G', 9, 2), bent('G', 7, 2, 2)], 60, { show: 'tab' }) }, { figure: 'bend' }],
  exercises: [bend('3.3.2', 'bend', 'G', 7, 2, 4)],
});

const l333 = lesson('3.3.3', 12, {
  visuals: [null, 'bend', null, null],
  sounds: [listen([n('G', 9, 2), bent('G', 7, 2, 2)], 60), null, null, null],
  cards: [{ listen: listen([n('G', 9, 2), bent('G', 7, 2, 2), n('G', 9, 2), bent('G', 7, 2, 2)], 60, { show: 'tab' }) }, {}],
  exercises: [play('3.3.3', 'play', seq(['G', 9], ['G', 7], ['G', 9]), null), bend('3.3.3', 'bend', 'G', 7, 2, 3)],
});

const l334 = lesson('3.3.4', 12, {
  visuals: ['bend', null, null, null],
  sounds: [listen([bent('G', 7, 2, 2), n('G', 7, 2)], 60, CRUNCH), null, null, null],
  cards: [{ listen: listen([bent('G', 7, 2, 2), n('G', 7, 2), bent('G', 7, 2, 2), n('G', 7, 2)], 60, { show: 'tab' }) }, {}],
  exercises: [bend('3.3.4', 'bend', 'G', 7, 2, 3, true)],
});

export const BEND_PHRASE: ScoreEvent[] = [n('e', 5), n('e', 8), bent('B', 8, 2, 2), n('B', 8, 2), n('B', 5, 2), vib('D', 7, 4)];

const l335 = lesson('3.3.5', 12, {
  visuals: ['bend', null, null, null],
  sounds: [listen(BEND_PHRASE, 80, CRUNCH), null, null, null],
  cards: [{ listen: listen(BEND_PHRASE, 70, { show: 'tab' }) }, {}],
  exercises: [bend('3.3.5', 'bend1', 'B', 8, 2, 3), bend('3.3.5', 'bend2', 'G', 7, 2, 3)],
});

// ───────────── 3.4 · Vibrato ─────────────

const l341 = lesson('3.4.1', 10, {
  visuals: ['vibrato', 'vibrato', null, null],
  sounds: [listen([vib('B', 10, 4)], 60, CRUNCH), null, listen([n('B', 10, 4)], 60), listen([vib('B', 10, 4)], 60)],
  cards: [{ figure: 'vibrato' }, { listen: listen([vib('B', 10, 4)], 60) }],
  exercises: [vibrato('3.4.1', 'vib', 'B', 10, 12, 4)],
});

const l342 = lesson('3.4.2', 10, {
  visuals: ['vibrato', null, null, null],
  sounds: [listen([vib('e', 5, 4)], 60), null, null, null],
  cards: [{ listen: listen([vib('e', 5, 4), vib('e', 5, 4)], 60) }, {}],
  exercises: [vibrato('3.4.2', 'vib', 'e', 5, 15, 6)],
});

const l343 = lesson('3.4.3', 10, {
  visuals: ['vibrato', 'bend', null, null],
  sounds: [listen([vib('D', 7, 4, true)], 60, CRUNCH), null, null, null],
  cards: [{ listen: listen([vib('D', 7, 4, true)], 60, CRUNCH) }, {}],
  exercises: [vibrato('3.4.3', 'vib', 'D', 7, 22, 5)],
});

export const VIB_PHRASE: ScoreEvent[] = [n('e', 8), n('e', 5), n('B', 8), n('B', 5), vib('D', 7, 4)];

const l344 = lesson('3.4.4', 12, {
  visuals: [null, 'vibrato', null, null],
  sounds: [listen(VIB_PHRASE, 80, CRUNCH), null, null, null],
  cards: [{ listen: listen(VIB_PHRASE, 70, { show: 'tab' }) }, {}],
  exercises: [play('3.4.4', 'play', seq(['e', 8], ['e', 5], ['B', 8], ['B', 5], ['D', 7]), null), vibrato('3.4.4', 'vib', 'D', 7, 15, 4)],
});

// ───────────── 3.5 y 3.6 · Cejillas ─────────────

const BARRE_FIG: Record<BarreId, Figure> = {
  'bar-f': 'barre-f',
  'bar-fm': 'barre-fm',
  'bar-g': 'barre-g',
  'bar-am': 'barre-am',
  'bar-bb': 'barre-bb',
  'bar-c': 'barre-c',
  'bar-cm': 'barre-cm',
  'bar-dm': 'barre-dm',
  'bar-c8': 'barre-c8',
  'bar-only': 'barre-only',
};
const bm = (id: BarreId) => diagramMidi(BARRES[id]);
const name = (id: BarreId) => BARRES[id].name;

/** Arpegio de un acorde con cejilla como ejemplo en compases completos (5 o 6 notas → 8 pulsos). */
function barreArpScore(id: BarreId): ScoreEvent[] {
  const notes = gridNotes(BARRES[id]);
  const beats: (1 | 2 | 4)[] = notes.length === 5 ? [1, 1, 1, 1, 4] : [1, 1, 1, 1, 2, 2];
  return notes.map((x, i) => n(x.string, x.fret, beats[i]));
}

/** Lección de un acorde con cejilla: diagrama, notas de a una y rasgueo. */
function barreLesson(id: string, chord: BarreId): Lesson {
  const fig = BARRE_FIG[chord];
  const d = BARRES[chord];
  return lesson(id, 14, {
    visuals: [null, fig, fig, null],
    sounds: [strumListen([bm(chord)], QUARTERS, 70), null, listen(barreArpScore(chord), 90), strumListen([bm(chord), bm(chord)], BALLAD, 80)],
    cards: [{ figure: fig, listen: listen(barreArpScore(chord), 70, { show: 'tab' }) }, {}],
    exercises: [
      tap(id, 'tap', d.dots.map((dot) => ({ string: (['E', 'A', 'D', 'G', 'B', 'e'] as StringId[])[dot.string], fret: dot.fret })), Math.max(5, d.startFret + 3)),
      play(id, 'arp', gridNotes(d), null),
      strum(id, 'strum', [name(chord), name(chord)], QUARTERS),
    ],
  });
}

const l351 = lesson('3.5.1', 12, {
  visuals: ['barre-only', 'barre-only', null, null],
  sounds: [null, null, listen([n('E', 5), n('A', 5), n('D', 5), n('G', 5), n('B', 5, 2), n('e', 5, 2)], 80), null],
  cards: [{ figure: 'barre-only' }, {}],
  exercises: [quiz('3.5.1', 'q1', [k('3.5.1', 'q1o1'), k('3.5.1', 'q1o2'), k('3.5.1', 'q1o3')], 2), play('3.5.1', 'play', seq(['E', 5], ['A', 5], ['D', 5], ['G', 5], ['B', 5], ['e', 5]), null)],
});
const l352 = barreLesson('3.5.2', 'bar-f');
const l353 = barreLesson('3.5.3', 'bar-fm');

const l354 = lesson('3.5.4', 12, {
  visuals: ['barre-f', 'barre-g', 'barre-am', null],
  sounds: [null, null, null, strumListen([bm('bar-f'), bm('bar-g'), bm('bar-am'), bm('bar-g')], HALVES, 80)],
  cards: [{ figure: 'barre-g', listen: strumListen([bm('bar-g'), bm('bar-g')], QUARTERS, 70) }, { figure: 'barre-am', listen: strumListen([bm('bar-am'), bm('bar-am')], QUARTERS, 70) }],
  exercises: [
    quiz('3.5.4', 'q1', ['=A', '=G', '=C', '=E'], 0),
    play('3.5.4', 'arp', gridNotes(BARRES['bar-g']), null),
    strum('3.5.4', 'strum', ['G', 'G', 'Am', 'Am'], HALVES),
  ],
});

const l355 = lesson('3.5.5', 14, {
  visuals: ['barre-f', 'barre-g', 'barre-am', null],
  sounds: [strumListen([bm('bar-f'), bm('bar-g'), bm('bar-am'), bm('bar-g')], BALLAD, 80), null, null, null],
  cards: [{ listen: strumListen([bm('bar-f'), bm('bar-g'), bm('bar-am'), bm('bar-g')], QUARTERS, 70, { click: true }) }, {}],
  exercises: [strum('3.5.5', 'strum1', ['F', 'G', 'Am', 'G'], QUARTERS), strum('3.5.5', 'strum2', ['F', 'G', 'Am', 'G'], BALLAD)],
});

const l361 = barreLesson('3.6.1', 'bar-bb');
const l362 = barreLesson('3.6.2', 'bar-c');
const l363 = barreLesson('3.6.3', 'bar-cm');
const l364 = barreLesson('3.6.4', 'bar-dm');

const l365 = lesson('3.6.5', 14, {
  visuals: ['barre-am', 'barre-dm', 'barre-g', 'barre-c'],
  sounds: [strumListen([bm('bar-am'), bm('bar-dm'), bm('bar-g'), bm('bar-c')], BALLAD, 80), null, null, null],
  cards: [{ listen: strumListen([bm('bar-am'), bm('bar-dm'), bm('bar-g'), bm('bar-c')], QUARTERS, 70, { click: true }) }, {}],
  exercises: [strum('3.6.5', 'strum1', ['Am', 'Dm', 'G', 'C'], QUARTERS), strum('3.6.5', 'strum2', ['Am', 'Dm', 'G', 'C'], BALLAD)],
});

// ───────────── 3.7 · Mapa del mástil ─────────────

const NAT6 = seq(['E', 1], ['E', 3], ['E', 5], ['E', 7], ['E', 8], ['E', 10], ['E', 12]);
const NAT5 = seq(['A', 2], ['A', 3], ['A', 5], ['A', 7], ['A', 8], ['A', 10], ['A', 12]);
const OCTAVES = seq(['E', 3], ['D', 5], ['E', 5], ['D', 7], ['E', 8], ['D', 10]);

const l371 = lesson('3.7.1', 12, {
  visuals: [null, 'guitar-strings', null, null],
  sounds: [listen([...quarters(NAT6), n('E', 12)], 90), null, null, null],
  cards: [{ figure: 'naturals-6' }, { listen: listen([n('E', 0), ...quarters(NAT6)], 70, { show: 'tab' }) }],
  exercises: [quiz('3.7.1', 'q1', ['=G', '=A', '=B', '=C'], 1), tap('3.7.1', 'tap', NAT6, 12)],
});

const l372 = lesson('3.7.2', 12, {
  visuals: [null, 'guitar-strings', null, null],
  sounds: [listen([...quarters(NAT5), n('A', 12)], 90), null, null, null],
  cards: [{ figure: 'naturals-5' }, { listen: listen([n('A', 0), ...quarters(NAT5)], 70, { show: 'tab' }) }],
  exercises: [quiz('3.7.2', 'q1', ['=B', '=C', '=D', '=E'], 1), tap('3.7.2', 'tap', NAT5, 12)],
});

const l373 = lesson('3.7.3', 12, {
  visuals: ['octave', 'octave', null, null],
  sounds: [null, null, listen([n('E', 3, 2), n('D', 5, 2)], 70), null],
  cards: [{ figure: 'octave', listen: listen(quarters(OCTAVES).concat([n('E', 3), n('D', 5)]), 70, { show: 'tab' }) }, {}],
  exercises: [tap('3.7.3', 'tap', OCTAVES, 12), play('3.7.3', 'play', OCTAVES, null)],
});

const l374 = lesson('3.7.4', 12, {
  visuals: [null, 'barre-c8', 'barre-c', 'barre-g'],
  sounds: [null, null, null, strumListen([bm('bar-g'), bm('bar-c')], HALVES, 80)],
  cards: [{ figure: 'naturals-6' }, { figure: 'naturals-5' }],
  exercises: [
    quiz('3.7.4', 'q1', ['=3', '=5', '=8', '=10'], 2),
    quiz('3.7.4', 'q2', ['=3', '=5', '=7', '=10'], 1),
    tap('3.7.4', 'tap', seq(['E', 3], ['A', 10]), 12),
  ],
});

export const GUITAR_LEVEL3_LESSONS: Lesson[] = [
  l311, l312, l313, l314, l315,
  l321, l322, l323, l324,
  l331, l332, l333, l334, l335,
  l341, l342, l343, l344,
  l351, l352, l353, l354, l355,
  l361, l362, l363, l364, l365,
  l371, l372, l373, l374,
];

// ───────────── Checkpoint 3 ─────────────

const ck = (key: string) => `content.g.cp3.${key}`;

export const GUITAR_CP3: Checkpoint = {
  level: 3,
  titleKey: 'content.g.checkpoint.3',
  introKey: ck('intro'),
  mastery: 0.8,
  parts: [
    { id: 'gcp3-legato', kind: 'playAlong', needsBass: true, skills: ['technique'], promptKey: ck('legato'), notes: tabOf(LEG_PHRASE).map(({ string, fret }) => ({ string, fret })), bpm: null },
    { id: 'gcp3-bend', kind: 'bend', needsBass: true, skills: ['technique', 'ear'], promptKey: ck('bend'), string: 'G', fret: 7, semitones: 2, release: true, reps: 2 },
    { id: 'gcp3-vib', kind: 'vibrato', needsBass: true, skills: ['technique'], promptKey: ck('vib'), string: 'e', fret: 5, minDepthCents: 15, seconds: 4 },
    { id: 'gcp3-strum', kind: 'strum', needsBass: true, skills: ['rhythm', 'technique'], promptKey: ck('strum'), bpm: 70, pattern: QUARTERS, chords: ['F', 'G', 'Am', 'G'] },
    { id: 'gcp3-map', kind: 'fretboardTap', needsBass: false, skills: ['fretboard'], promptKey: ck('map'), sequence: NAT5, frets: 12 },
  ],
};
