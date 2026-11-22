import { test } from 'node:test';
import assert from 'node:assert/strict';
import en from '../src/i18n/locales/en.json';
import es from '../src/i18n/locales/es.json';
import pt from '../src/i18n/locales/pt.json';
import { HAND_SPAN, bendHands, fingering, handPlan, improvHands, openShape, plucking, strumHands, vibratoHands, type HandInstrument } from '../src/music/hands';
import { BALLAD, QUARTERS } from '../src/music/strum';
import { BASS_LESSONS } from '../src/content/lessons';
import { GUITAR_LESSONS } from '../src/content/guitar/lessons';
import { NYLON_LESSONS } from '../src/content/nylon/lessons';
import type { Lesson } from '../src/content/types';

const n = (string: string, fret: number) => ({ string, fret });

test('manos: un dedo por traste dentro de la posición', () => {
  // Caja 1 de La menor: trastes 5 y 8 → dedos 1 y 4; 5 y 7 → 1 y 3.
  const steps = fingering([n('E', 5), n('E', 8), n('A', 5), n('A', 7)]);
  assert.deepEqual(steps.map((s) => s.finger), [1, 4, 1, 3]);
  assert.ok(steps.every((s) => s.pos === 5 && !s.shift));
});

test('manos: las cuerdas al aire van con 0 y no mueven la mano', () => {
  const steps = fingering([n('A', 0), n('A', 2), n('D', 0), n('D', 3)]);
  assert.deepEqual(steps.map((s) => s.finger), [0, 2, 0, 3]);
  assert.ok(steps.every((s) => !s.shift));
});

test('manos: una nota fuera de los 4 trastes es un cambio de posición', () => {
  const steps = fingering([n('e', 5), n('e', 8), n('e', 10), n('e', 12)]);
  assert.deepEqual(steps.map((s) => s.pos), [5, 5, 10, 10]);
  assert.deepEqual(steps.map((s) => s.shift), [false, false, true, false]);
  assert.deepEqual(steps.map((s) => s.finger), [1, 4, 1, 3]);
});

test('manos: cómo toca la otra mano en cada instrumento', () => {
  const notes = [n('E', 0), n('G', 2), n('B', 1), n('e', 0)];
  assert.deepEqual(plucking(notes, 'nylon'), ['p', 'i', 'm', 'a']);
  assert.deepEqual(plucking(notes, 'bass'), ['i', 'm', 'i', 'm']);
  // Eléctrica con corcheas: abajo en el tiempo, arriba en la «y».
  assert.deepEqual(plucking(notes, 'guitar', [true, false, true, false]), ['down', 'up', 'down', 'up']);
  assert.deepEqual(plucking(notes, 'guitar'), ['down', 'down', 'down', 'down']);
});

test('manos: el plan dice posición, dedos, pulgar, cambios y la otra mano', () => {
  const score = [
    { string: 'e', fret: 5, beats: 0.5 },
    { string: 'e', fret: 8, beats: 0.5 },
    { string: 'e', fret: 10, beats: 1 },
    { rest: true, beats: 2 },
  ];
  const plan = handPlan(score.filter((e) => !('rest' in e)) as { string: string; fret: number }[], 'guitar', score);
  const keys = plan.tips.map((t) => t.key);
  assert.deepEqual(keys.slice(0, 3), ['hand.left', 'hand.fingers', 'hand.thumb.guitar']);
  assert.ok(keys.includes('hand.shiftOne') && keys.includes('hand.pickAlt'));
  assert.deepEqual(plan.steps.map((s) => s.pluck), ['down', 'up', 'down']);
  assert.equal(plan.shifts, 1);
  assert.equal(handPlan([n('A', 0)], 'bass').tips[0].key, 'hand.leftOpen');
});

test('manos: rasgueo con el acorde armado, cambios y brazo', () => {
  const tips = strumHands(['Am', 'G'], BALLAD, 'guitar').map((t) => t.key);
  assert.deepEqual(tips, ['hand.chord', 'hand.chordChange', 'hand.strumArm', 'hand.strumAir']);
  assert.equal(strumHands(['C5'], QUARTERS, 'nylon')[0].key, 'hand.strumNylon', 'sin diagrama abierto no hay «arma el acorde»');
  assert.ok(openShape('Am7') && !openShape('C5'));
});

const lessonsOf: Record<HandInstrument, Record<string, Lesson>> = { bass: BASS_LESSONS, guitar: GUITAR_LESSONS, nylon: NYLON_LESSONS };

test('manos: cada ejercicio de tocar notas de las tres apps tiene dedos válidos', () => {
  for (const [inst, lessons] of Object.entries(lessonsOf) as [HandInstrument, Record<string, Lesson>][]) {
    let count = 0;
    for (const l of Object.values(lessons)) {
      for (const e of l.exercises) {
        if (e.kind !== 'playAlong') continue;
        count++;
        const plan = handPlan(e.notes, inst, e.score);
        assert.equal(plan.steps.length, e.notes.length, e.id);
        for (const s of plan.steps) {
          assert.ok(s.finger >= 0 && s.finger <= 4, `${e.id}: dedo ${s.finger}`);
          if (s.fret > 0) assert.ok(s.fret >= s.pos && s.fret < s.pos + HAND_SPAN, `${e.id}: ${s.string}${s.fret} fuera de la posición ${s.pos}`);
        }
      }
    }
    assert.ok(count > 10, `${inst}: ejercicios revisados`);
  }
});

test('manos: todas las claves existen en los 3 idiomas', () => {
  const keys = new Set<string>(['hand.title', 'hand.thumbShort', 'hand.play', 'hand.playing', 'hand.mapA11y', 'hand.chordA11y']);
  for (const inst of ['bass', 'guitar', 'nylon'] as HandInstrument[]) {
    for (const t of handPlan([n('E', 5), n('E', 10), n('A', 0)], inst, [{ beats: 0.5 }, { beats: 0.5 }, { beats: 1 }]).tips) keys.add(t.key);
    for (const t of handPlan([n('E', 5), n('E', 10), n('A', 12)], inst).tips) keys.add(t.key);
    for (const t of handPlan([n('A', 0)], inst).tips) keys.add(t.key);
    for (const t of [...strumHands(['Am', 'G'], BALLAD, inst), ...vibratoHands(inst), ...improvHands(inst), ...bendHands()]) keys.add(t.key);
  }
  for (const [lang, tree] of Object.entries({ es, en, pt })) {
    const get = (key: string) => key.split('.').reduce<unknown>((o, p) => (o as Record<string, unknown> | undefined)?.[p], tree);
    for (const k of keys) assert.equal(typeof get(`ui.exercise.${k}`), 'string', `${lang}: ui.exercise.${k}`);
  }
});
