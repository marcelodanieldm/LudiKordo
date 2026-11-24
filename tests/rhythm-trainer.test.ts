import { test } from 'node:test';
import assert from 'node:assert/strict';
import es from '../src/i18n/locales/es.json';
import en from '../src/i18n/locales/en.json';
import pt from '../src/i18n/locales/pt.json';
import {
  BARS_PER_ROUND,
  BAR_POOL,
  BEATS_PER_BAR,
  MARK_MS,
  TEMPOS,
  attackBeats,
  cellsOf,
  countsOf,
  gradeRhythm,
  hasPlayed,
  makeRound,
  poolFor,
  rhythmFeedback,
  type Bar,
} from '../src/music/rhythmTrainer';

const sum = (bar: Bar) => bar.reduce((a, e) => a + e.beats, 0);

test('cada compás dura 4 pulsos y tiene al menos una nota; los niveles suben de dificultad', () => {
  for (const level of [1, 2, 3] as const) {
    for (const bar of BAR_POOL[level]) {
      assert.equal(sum(bar), BEATS_PER_BAR);
      assert.ok(bar.some((e) => !e.rest));
      assert.equal(cellsOf(bar).length, 8);
    }
  }
  // Nivel 1 sin corcheas; nivel 3 con algún contratiempo (nota que empieza en una «y»).
  assert.ok(BAR_POOL[1].every((b) => b.every((e) => e.beats >= 1)));
  assert.ok(BAR_POOL[3].every((b) => attackBeats([b]).some((x) => x % 1 !== 0)));
  assert.ok(poolFor(3).length > poolFor(1).length);
});

test('ronda: 4 compases, sin repetir el anterior, con al menos uno del nivel', () => {
  let seed = 0.13;
  const rand = () => (seed = (seed * 9301 + 0.49297) % 1);
  for (let i = 0; i < 30; i++) {
    const level = ((i % 3) + 1) as 1 | 2 | 3;
    const round = makeRound(level, rand);
    assert.equal(round.length, BARS_PER_ROUND);
    for (let k = 1; k < round.length; k++) assert.notEqual(round[k], round[k - 1]);
    assert.ok(round.some((b) => BAR_POOL[level].includes(b)));
  }
});

test('grilla y ataques: «1 y 2 y»', () => {
  const bar: Bar = [{ beats: 1 }, { beats: 0.5, rest: true }, { beats: 0.5 }, { beats: 2 }];
  assert.deepEqual(cellsOf(bar), ['start', 'hold', 'rest', 'start', 'start', 'hold', 'hold', 'hold']);
  assert.deepEqual(attackBeats([bar, bar]), [0, 1.5, 2, 4, 5.5, 6]);
});

test('evaluación: a tiempo, adelantadas, perdidas y de más', () => {
  const bars: Bar[] = [[{ beats: 1 }, { beats: 1 }, { beats: 1, rest: true }, { beats: 0.5, rest: true }, { beats: 0.5 }], [{ beats: 4 }], [{ beats: 4 }], [{ beats: 4 }]];
  const bpm = 60; // 1 pulso = 1000 ms
  const start = 10_000;
  // Notas en los pulsos 0, 1, 3,5, 4, 8, 12.
  const taps = [start - 5, start + 1000 - MARK_MS - 20, start + 2000 /* silencio: de más */, start + 4000, start + 8000 + MARK_MS + 30, start - 3000 /* cuenta: no cuenta */];
  const r = gradeRhythm(bars, bpm, start, taps, 80);
  assert.equal(r.total, 6);
  assert.equal(r.hits, 4);
  assert.equal(r.extras, 1);
  assert.deepEqual(r.marks, ['ok', 'early', 'miss', 'ok', 'late', 'miss']);
  // La perdida en 3,5 es un contratiempo; la del 12, un pulso.
  assert.equal(r.missedOff, 1);
  assert.equal(r.missedOn, 1);
  assert.equal(r.accuracy, 4 / 7);
});

test('devolución: tempo siguiente y consejos que existen en los 3 idiomas', () => {
  const base = { hits: 10, total: 10, extras: 0, accuracy: 1, meanOffset: 0, missedOff: 0, missedOn: 0, marks: [] };
  assert.equal(rhythmFeedback(base, 70, 'bass').nextBpm, 80);
  assert.equal(rhythmFeedback(base, TEMPOS[TEMPOS.length - 1], 'bass').nextBpm, TEMPOS[TEMPOS.length - 1]);
  assert.equal(rhythmFeedback({ ...base, accuracy: 0.5 }, 70, 'bass').nextBpm, 60);
  assert.equal(rhythmFeedback({ ...base, accuracy: 0.75 }, 70, 'bass').nextBpm, 70);
  assert.equal(rhythmFeedback({ ...base, meanOffset: -40 }, 70, 'guitar').tips[0], 'rushing');
  assert.equal(rhythmFeedback({ ...base, meanOffset: 40 }, 70, 'guitar').tips[0], 'dragging');
  const lookup = (dict: unknown, key: string): unknown => key.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], dict);
  for (const inst of ['bass', 'guitar', 'nylon'] as const) {
    const fb = rhythmFeedback({ ...base, accuracy: 0.6, meanOffset: -50, extras: 2, missedOff: 3, missedOn: 1 }, 80, inst);
    assert.ok(fb.tips.length <= 3);
    // Siempre hay un consejo para la mano, aunque haya varios errores.
    assert.ok(fb.tips.some((tip) => tip.startsWith('hand')), inst);
    assert.ok(rhythmFeedback({ ...base, extras: 2 }, 80, inst, true).tips.includes('restsTap'));
    for (const dict of [es, en, pt]) {
      for (const tip of fb.tips) assert.equal(typeof lookup(dict, `ui.rhythmTrainer.tip.${tip}`), 'string', tip);
      assert.equal(typeof lookup(dict, `ui.rhythmTrainer.result.${fb.headline}`), 'string');
    }
  }
});

test('al tocar la pantalla se descuenta el retraso fijo del teléfono', () => {
  const bars: Bar[] = [[{ beats: 1 }, { beats: 1 }, { beats: 1 }, { beats: 1 }], [{ beats: 4 }], [{ beats: 4 }], [{ beats: 4 }]];
  const start = 5000;
  // Todo llega 120 ms tarde (latencia del equipo), parejo.
  const taps = [0, 1000, 2000, 3000, 4000, 8000, 12000].map((x) => start + x + 120);
  const raw = gradeRhythm(bars, 60, start, taps, 90);
  assert.equal(raw.hits, 0);
  const fixed = gradeRhythm(bars, 60, start, taps, 90, true);
  assert.equal(fixed.hits, 7);
  assert.ok(Math.abs(fixed.meanOffset) < 1);
  assert.ok(hasPlayed(fixed));
  assert.ok(!hasPlayed(gradeRhythm(bars, 60, start, [], 90)));
});

test('cómo se cuenta cada compás, para el lector de pantalla', () => {
  assert.deepEqual(countsOf([{ beats: 1 }, { beats: 0.5, rest: true }, { beats: 0.5 }, { beats: 2 }], 'y'), ['1', '2 y', '3']);
  assert.deepEqual(countsOf([{ beats: 0.5, rest: true }, { beats: 0.5 }, { beats: 1, rest: true }, { beats: 2 }], '&'), ['1 &', '3']);
});
