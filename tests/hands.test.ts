import { test } from 'node:test';
import assert from 'node:assert/strict';
import en from '../src/i18n/locales/en.json';
import es from '../src/i18n/locales/es.json';
import pt from '../src/i18n/locales/pt.json';
import { HAND_SPAN, bendHands, fingering, handPlan, improvHands, openShape, plucking, strumHands, vibratoHands, type HandInstrument } from '../src/music/hands';
import { BALLAD, BOSSA_FINGERS, EIGHTHS, QUARTERS } from '../src/music/strum';
import { FINGERINGS, drillFingering } from '../src/content/fingerings';
import { BASS_DRILLS, GUITAR_DRILLS } from '../src/content/practice';
import { NYLON_DRILLS } from '../src/content/nylon/practice';
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
  // Criolla: arpegio (bordón y agudas, cada nota en otra cuerda) → p-i-m-a por cuerda; melodía → i-m alternados.
  assert.deepEqual(plucking([n('A', 0), n('G', 2), n('B', 1), n('e', 0)], 'nylon'), ['p', 'i', 'm', 'a']);
  assert.deepEqual(plucking([n('e', 0), n('e', 1), n('e', 3), n('B', 1)], 'nylon'), ['i', 'm', 'i', 'm']);
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
  assert.equal(strumHands(['C5'], QUARTERS, 'nylon')[0].key, 'hand.strumThumb', 'sin diagrama abierto no hay «arma el acorde»');
  // Solo el acorde con el que empieza: si no es abierto, no se dibuja otro.
  assert.ok(!strumHands(['Gm7', 'Am'], QUARTERS, 'guitar').some((t) => t.key === 'hand.chord'));
  assert.equal(strumHands(['Am'], BOSSA_FINGERS, 'nylon').find((t) => t.key.startsWith('hand.strum'))?.key, 'hand.strumBossa');
  assert.equal(strumHands(['Am'], EIGHTHS, 'nylon').find((t) => t.key.startsWith('hand.strum'))?.key, 'hand.strumIndex');
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
        const plan = handPlan(e.notes, inst, e.score, FINGERINGS[inst][e.id]);
        assert.equal(plan.steps.length, e.notes.length, e.id);
        for (const s of plan.steps) {
          assert.ok(s.finger >= 0 && s.finger <= 4, `${e.id}: dedo ${s.finger}`);
          if (s.fret > 0 && s.finger > 0) assert.ok(s.fret >= s.pos && s.fret < s.pos + HAND_SPAN, `${e.id}: ${s.string}${s.fret} fuera de la posición ${s.pos}`);
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

const playOf = (lessons: Record<string, Lesson>, id: string) => {
  const e = lessons[id.split('-')[0]].exercises.find((x) => x.id === id);
  assert.ok(e && e.kind === 'playAlong', id);
  return e as Extract<typeof e, { kind: 'playAlong' }>;
};

test('manos: la digitación coincide con lo que dicen las lecciones', () => {
  const fingersOf = (inst: HandInstrument, lessons: Record<string, Lesson>, id: string) => {
    const e = playOf(lessons, id);
    return handPlan(e.notes, inst, e.score, FINGERINGS[inst][e.id]).steps.map((s) => s.finger);
  };
  // Octavas (3.7.3): «dedo 1 en la 6.ª y dedo 3 en la 4.ª».
  assert.deepEqual(fingersOf('guitar', GUITAR_LESSONS, '3.7.3-play'), [1, 3, 1, 3, 1, 3]);
  // Slide (3.2.2): «con el mismo dedo».
  assert.equal(new Set(fingersOf('guitar', GUITAR_LESSONS, '3.2.2-play')).size, 1);
  // Power chords (2.4.2): la tónica siempre con el dedo 1.
  assert.ok(fingersOf('guitar', GUITAR_LESSONS, '2.4.2-play').every((f) => f === 1));
  // Arpegios de acordes en la criolla: sin números.
  const pimi = playOf(NYLON_LESSONS, '3.3.5-pimi');
  assert.ok(handPlan(pimi.notes, 'nylon', pimi.score, FINGERINGS.nylon[pimi.id]).tips.some((t) => t.key === 'hand.chordShape'));
  // Todas las digitaciones fijas apuntan a ejercicios que existen y tienen tantas notas como dedos.
  for (const [inst, lessons] of Object.entries(lessonsOf) as [HandInstrument, Record<string, Lesson>][]) {
    // Las de lecciones (los ids de la Práctica, como «g-power», se prueban aparte).
    for (const [id, f] of Object.entries(FINGERINGS[inst]).filter(([id]) => /^\d/.test(id))) {
      const e = playOf(lessons, id);
      if (Array.isArray(f)) assert.equal(f.length, e.notes.length, id);
    }
  }
});

test('manos: en la criolla, las melodías de una cuerda alternan i-m (1.2.3)', () => {
  const e = Object.values(NYLON_LESSONS['1.2.3'].exercises).find((x) => x.kind === 'playAlong');
  if (!e || e.kind !== 'playAlong') return;
  const plucks = handPlan(e.notes, 'nylon', e.score).steps.map((s) => s.pluck);
  assert.ok(plucks.every((p, k) => p === (k % 2 === 0 ? 'i' : 'm')), plucks.join(''));
});

test('manos en la Práctica: cada ejercicio de las tres apps tiene un plan de manos válido', () => {
  const lists: [HandInstrument, typeof BASS_DRILLS][] = [['bass', BASS_DRILLS], ['guitar', GUITAR_DRILLS], ['nylon', NYLON_DRILLS]];
  for (const [inst, drills] of lists) {
    let lines = 0;
    for (const d of drills) {
      if (d.kind !== 'line' || !d.line) continue;
      lines++;
      const notes = d.line.flatMap((e) => ('rest' in e ? [] : [{ string: e.string, fret: e.fret }]));
      const plan = handPlan(notes, inst, d.line, drillFingering(inst, d.id, d.lessonId));
      assert.equal(plan.steps.length, notes.length, d.id);
      assert.ok(plan.tips.length >= 2, d.id);
      for (const s of plan.steps) assert.ok(s.finger >= 0 && s.finger <= 4, `${d.id}: dedo ${s.finger}`);
    }
    assert.ok(lines > 3, `${inst}: ejercicios de línea`);
  }
  // El riff de power chords de la Práctica va con el dedo 1, como en la lección 2.4.
  assert.equal(drillFingering('guitar', 'g-power'), 1);
  // La criolla toma la digitación de la lección de la que sale el ejercicio.
  assert.equal(drillFingering('nylon', 'n-l335', '3.3.5'), false);
});
