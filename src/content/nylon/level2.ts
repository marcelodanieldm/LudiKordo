/**
 * Guitarra criolla, nivel 2 (primera parte): 2.1 primeros acordes, 2.2 más
 * acordes abiertos y 2.3 cambiar sin parar, donde llegan las séptimas. Cada
 * acorde nuevo entra al álbum de acordes (chordbook.ts) y habilita canciones.
 *
 * Como en la eléctrica, la app todavía no reconoce acordes: cada acorde se
 * practica en dos partes, sus notas de a una (`playAlong` sin tempo) y el
 * rasgueo a tiempo (`strum`, que escucha los golpes). En la criolla se rasguea
 * con el pulgar o con el índice, sin púa. Textos en `content.n.l21x…l23x`.
 */
import type { Card, Exercise, Figure, Lesson, ListenExample } from '../types';
import type { StringId } from '../../instruments/profiles';
import type { OpenChordId } from '../../music/chords';
import { HALVES, QUARTERS, type Stroke } from '../../music/strum';
import { arpScore, chordArp, chordFretted, k, listen, pimiBar, scenes, strumListen } from './helpers';

export const STEPS = [60, 70, 80];

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
    cartoon: { riveResource: `kordi_n_${id.replace(/\./g, '_')}`, durationSec: 100, sceneKeys: scenes(id), visuals: spec.visuals, sounds: spec.sounds },
    cards: spec.cards.map((c, i): Card => ({ titleKey: k(id, `c${i + 1}t`), bodyKey: k(id, `c${i + 1}b`), ...c })),
    exercises: spec.exercises,
    mastery: spec.mastery ?? 0.8,
  };
}

const strum = (lessonId: string, key: string, chords: OpenChordId[], pattern: Stroke[], bpm = 60): Exercise => ({
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

const play = (lessonId: string, key: string, notes: { string: StringId; fret: number }[], bpm: number | null): Exercise => ({
  id: `${lessonId}-${key}`,
  kind: 'playAlong',
  needsBass: true,
  skills: ['technique', 'fretboard'],
  promptKey: k(lessonId, key),
  notes,
  bpm,
  ...(bpm !== null ? { tempoSteps: STEPS } : {}),
});

const tap = (lessonId: string, key: string, sequence: { string: StringId; fret: number }[]): Exercise => ({
  id: `${lessonId}-${key}`,
  kind: 'fretboardTap',
  needsBass: false,
  skills: ['fretboard'],
  promptKey: k(lessonId, key),
  sequence,
  frets: 4,
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
export const pimi = (chords: OpenChordId[]) => chords.flatMap(pimiBar);

/** Lección de un acorde nuevo: diagrama, sus notas de a una y rasgueo en negras. */
function chordLesson(id: string, chord: OpenChordId): Lesson {
  const fig = CHORD_FIG[chord];
  return lesson(id, 12, {
    visuals: [null, fig, fig, null],
    sounds: [strumListen([chord], QUARTERS, 70), listen(arpScore(chord), 80), null, listen(pimi([chord, chord]), 70)],
    cards: [{ figure: fig, listen: listen(arpScore(chord), 70) }, { listen: listen(pimi([chord, chord]), 70) }],
    exercises: [tap(id, 'tap', chordFretted(chord)), play(id, 'arp', chordArp(chord), null), strum(id, 'strum', [chord, chord], QUARTERS)],
  });
}

/** Lección de cambio entre acordes: escuchar, rasguear y tocar p-i-m-i a tempo. */
function changeLesson(id: string, minutes: number, chords: OpenChordId[], pattern: Stroke[], figs: (Figure | null)[], extra: Exercise[] = []): Lesson {
  return lesson(id, minutes, {
    visuals: figs,
    sounds: [strumListen(chords, pattern, 70), null, listen(pimi(chords), 70), null],
    cards: [{ listen: strumListen(chords, pattern, 70, { click: true }) }, { listen: listen(pimi(chords), 70, { click: true }) }],
    exercises: [...extra, strum(id, 'strum', chords, pattern), play(id, 'pimi', pimi(chords), 60)],
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

export const NYLON_LEVEL2_LESSONS: Lesson[] = [l211, l212, l213, l214, l215, l221, l222, l223, l224, l225, l231, l232, l233, l234, l235];
