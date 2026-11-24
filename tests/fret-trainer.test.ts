import { test } from 'node:test';
import assert from 'node:assert/strict';
import es from '../src/i18n/locales/es.json';
import en from '../src/i18n/locales/en.json';
import pt from '../src/i18n/locales/pt.json';
import { BASS, GUITAR } from '../src/instruments/profiles';
import {
  SCOPES,
  SLOW_MS,
  answersOf,
  isHeardRight,
  isTapRight,
  keyOf,
  minBoardWidth,
  nextQuestion,
  questionsFor,
  record,
  trainerFeedback,
  weakest,
  weightOf,
  type Stats,
} from '../src/music/fretTrainer';

const [LOW, TWELVE, ALL] = SCOPES;

test('preguntas: trastes 0-5 naturales en el bajo', () => {
  const qs = questionsFor(LOW, BASS.strings);
  // Cuerda Mi (4.ª) en 0-5: Mi Fa (Fa♯) Sol (Sol♯) La → naturales Mi, Fa, Sol, La.
  assert.deepEqual(qs.filter((q) => q.string === 'E').map((q) => q.pc), [4, 5, 7, 9]);
  for (const q of qs) assert.ok([0, 2, 4, 5, 7, 9, 11].includes(q.pc));
  // Hasta el 12, cada cuerda tiene las 7 naturales; con alteraciones, las 12.
  assert.equal(questionsFor(TWELVE, BASS.strings).filter((q) => q.string === 'A').length, 7);
  assert.equal(questionsFor(ALL, GUITAR.strings).filter((q) => q.string === 'B').length, 12);
});

test('respuestas: Sol en la 4.ª del bajo es el traste 3; Mi, al aire y en el 12', () => {
  const q = { string: 'E' as const, pc: 7 };
  assert.deepEqual(answersOf(q, LOW, BASS.strings), [3]);
  assert.deepEqual(answersOf(q, TWELVE, BASS.strings), [3]);
  // Mi en la 4.ª: al aire y en el 12.
  assert.deepEqual(answersOf({ string: 'E', pc: 4 }, TWELVE, BASS.strings), [0, 12]);
  assert.ok(isTapRight(q, 'E', 3, LOW, BASS.strings));
  assert.ok(!isTapRight(q, 'A', 3, LOW, BASS.strings));
  assert.ok(!isTapRight(q, 'E', 5, LOW, BASS.strings));
});

test('micrófono: la altura exacta de esa cuerda; la octava no cuenta', () => {
  const q = { string: 'A' as const, pc: 0 }; // Do en la 3.ª del bajo: traste 3 = MIDI 36.
  assert.ok(isHeardRight(q, 36, LOW, BASS.strings));
  assert.ok(!isHeardRight(q, 48, LOW, BASS.strings));
  assert.ok(!isHeardRight(q, 38, LOW, BASS.strings));
  // En la guitarra, Mi en la 1.ª: al aire (64) y en el 12 (76).
  const e = { string: 'e' as const, pc: 4 };
  assert.ok(isHeardRight(e, 64, TWELVE, GUITAR.strings));
  assert.ok(isHeardRight(e, 76, TWELVE, GUITAR.strings));
  assert.ok(!isHeardRight(e, 76, LOW, GUITAR.strings));
  // Límite conocido: el micrófono oye la altura, no la cuerda. La en la 4.ª (traste 5)
  // suena igual que la 3.ª al aire, y se acepta.
  assert.ok(isHeardRight({ string: 'E', pc: 9 }, 33, LOW, BASS.strings));
});

test('diapasón tocable: el último traste mide al menos 44 dp', () => {
  for (const frets of [5, 12]) {
    const w = minBoardWidth(frets);
    const inner = w - 56;
    const raw = (n: number) => 1 - Math.pow(2, -n / 12);
    const last = (inner * (raw(frets) - raw(frets - 1))) / raw(frets);
    assert.ok(last >= 44 - 1e-9, `${frets}: ${last}`);
  }
  assert.ok(minBoardWidth(12) > minBoardWidth(5));
});

test('las falladas y lentas pesan más; nunca se repite la anterior', () => {
  const q = { string: 'E' as const, pc: 5 };
  let st: Stats = {};
  assert.equal(weightOf(st, q), 3);
  st = record(st, q, true, 1000);
  const easy = weightOf(st, q);
  st = record(st, q, false, 1000);
  st = record(st, q, true, SLOW_MS + 1);
  assert.ok(weightOf(st, q) > easy);
  assert.deepEqual(st[keyOf(q)], { right: 2, wrong: 1, slow: 1 });

  const pool = questionsFor(LOW, BASS.strings);
  let prev = pool[0];
  for (let i = 0; i < 50; i++) {
    const next = nextQuestion(pool, {}, prev, () => (i * 0.137) % 1);
    assert.notEqual(keyOf(next), keyOf(prev));
    prev = next;
  }
  // Con rand = 0 se elige la primera opción; con rand casi 1, la última.
  assert.equal(keyOf(nextQuestion(pool, {}, null, () => 0)), keyOf(pool[0]));
  assert.equal(keyOf(nextQuestion(pool, {}, null, () => 0.9999)), keyOf(pool[pool.length - 1]));
});

test('para repasar: primero las de más errores, después las lentas', () => {
  let st: Stats = {};
  st = record(st, { string: 'E', pc: 5 }, false, 1000);
  st = record(st, { string: 'E', pc: 5 }, false, 1000);
  st = record(st, { string: 'A', pc: 0 }, true, SLOW_MS + 500);
  st = record(st, { string: 'D', pc: 2 }, true, 800);
  // La lenta también se repasa, después de la fallada; la rápida y correcta no.
  assert.deepEqual(weakest(st), [{ string: 'E', pc: 5 }, { string: 'A', pc: 0 }]);
  // Solo las de la etapa que se tocó.
  assert.deepEqual(weakest(st, 3, [{ string: 'A', pc: 0 }]), [{ string: 'A', pc: 0 }]);
});

test('devolución: titular según el récord y consejos que existen en los 3 idiomas', () => {
  const lookup = (dict: unknown, key: string): unknown => key.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], dict);
  assert.equal(trainerFeedback({ right: 10, wrong: 0, meanMs: 2000 }, 0, false, LOW, [], 'bass').headline, 'first');
  assert.equal(trainerFeedback({ right: 12, wrong: 1, meanMs: 2000 }, 10, true, LOW, [], 'bass').headline, 'record');
  assert.equal(trainerFeedback({ right: 9, wrong: 1, meanMs: 2000 }, 10, true, LOW, [], 'bass').headline, 'good');
  assert.equal(trainerFeedback({ right: 5, wrong: 5, meanMs: 5000 }, 10, true, ALL, [{ string: 'E', pc: 5 }], 'guitar').headline, 'keepGoing');
  for (const scope of SCOPES) {
    for (const inst of ['bass', 'guitar', 'nylon'] as const) {
      for (const r of [{ right: 3, wrong: 5, meanMs: 6000 }, { right: 20, wrong: 0, meanMs: 1500 }]) {
        const fb = trainerFeedback(r, 5, true, scope, [{ string: 'A', pc: 0 }], inst);
        assert.ok(fb.tips.length >= 1 && fb.tips.length <= 3);
        for (const dict of [es, en, pt]) {
          for (const tip of fb.tips) assert.equal(typeof lookup(dict, `ui.fretTrainer.tip.${tip}`), 'string', tip);
          const head = fb.headline === 'first' ? 'first_other' : fb.headline;
          assert.equal(typeof lookup(dict, `ui.fretTrainer.result.${head}`), 'string');
        }
      }
    }
  }
  // El consejo del traste 5 es el del instrumento.
  assert.ok(trainerFeedback({ right: 10, wrong: 0, meanMs: 1000 }, 0, false, LOW, [], 'bass').tips.includes('fifthBass'));
  assert.ok(trainerFeedback({ right: 10, wrong: 0, meanMs: 1000 }, 0, false, LOW, [], 'nylon').tips.includes('fifthGuitar'));
});
