import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_TIPS,
  countPattern,
  howToImprovise,
  howToPlayAlong,
  howToStrum,
  improvFeedback,
  strumFeedback,
  timedFeedback,
  untimedFeedback,
  whereOf,
  worstBar,
} from '../src/music/feedback';
import { scoreStrum, strokeTimes, QUARTERS, ZAMBA } from '../src/music/strum';
import { scoreImprov } from '../src/music/improv';
import { midiToFreq } from '../src/music/notes';
import type { NoteVerdict } from '../src/music/live';

const guitarNumber = (id: string) => ({ E: 6, A: 5, D: 4, G: 3, B: 2, e: 1 })[id] ?? 0;
const keys = (tips: { key: string }[]) => tips.map((t) => t.key);

test('explicación: tempo, cuerdas, trastes y figuras de una partitura', () => {
  const notes = [{ string: 'A', fret: 3 }, { string: 'D', fret: 2 }, { string: 'G', fret: 0 }, { string: 'B', fret: 1 }];
  assert.deepEqual(whereOf(notes, guitarNumber), { strings: [5, 4, 3, 2], from: 0, to: 3 });
  const timed = howToPlayAlong({ bpm: 70, notes, score: [{ beats: 1, string: 'A', fret: 3 }, { beats: 0.5, string: 'D', fret: 2 }, { beats: 0.5, string: 'G', fret: 0 }, { beats: 2, string: 'B', fret: 1 }] }, guitarNumber);
  assert.deepEqual(keys(timed), ['howTo.timed', 'howTo.where', 'howTo.eighths', 'howTo.long']);
  assert.equal(timed[0].params?.bpm, 70);
  assert.equal(timed[1].params?.strings, '5, 4, 3, 2');
  // Con silencios, el consejo es sobre los silencios.
  assert.ok(keys(howToPlayAlong({ bpm: 60, notes, score: [{ beats: 2, string: 'A', fret: 3 }, { beats: 2, rest: true }] }, guitarNumber)).includes('howTo.rests'));
  // Sin tempo: la app espera cada nota; en 3/4 la cuenta es otra.
  assert.equal(howToPlayAlong({ bpm: null, notes }, guitarNumber)[0].key, 'howTo.untimed');
  assert.equal(howToPlayAlong({ bpm: 60, notes, beatsPerBar: 3 }, guitarNumber)[0].key, 'howTo.timed3');
  // Una sola cuerda y un solo traste.
  assert.equal(howToPlayAlong({ bpm: null, notes: [{ string: 'E', fret: 0 }, { string: 'E', fret: 0 }] }, guitarNumber)[1].key, 'howTo.whereOne');
});

test('explicación: el patrón de rasgueo se cuenta en voz alta', () => {
  assert.equal(countPattern(['D', '-', 'D', 'U'], 'y'), '1 ↓  y ·  2 ↓  y ↑');
  const tips = howToStrum({ bpm: 70, chords: ['Am', 'Dm'], pattern: ZAMBA }, 'y');
  assert.deepEqual(keys(tips), ['howTo.strum', 'howTo.pattern', 'howTo.air', 'howTo.up']);
  assert.equal(tips[0].params?.chords, 'Am – Dm');
  assert.deepEqual(keys(howToStrum({ bpm: 60, chords: ['C'], pattern: QUARTERS }, 'y')), ['howTo.strum', 'howTo.pattern', 'howTo.air']);
  assert.deepEqual(keys(howToImprovise({ minNotes: 12, loops: 2, targets: [[0, 4, 7]] }, 'La · Do')), ['howTo.improv', 'howTo.improvCount', 'howTo.targets']);
});

test('devolución a tempo: cuenta cada veredicto, marca los problemas y da consejos concretos', () => {
  // 8 notas en 2 compases: el 2.º compás junta las equivocadas y perdidas.
  const verdicts: NoteVerdict[] = ['hit', 'late', 'late', 'hit', 'wrong', 'miss', 'wrong', 'late'];
  const fb = timedFeedback({
    verdicts,
    offsets: [5, 70, 90, 0, null, null, null, 60],
    played: [null, null, null, null, 62, null, 64, null],
    targets: [45, 47, 48, 50, 52, 53, 55, 57],
    startBeats: [0, 1, 2, 3, 4, 5, 6, 7],
    beatsPerBar: 4,
    accuracy: 5 / 8,
    stars: 1,
  });
  assert.deepEqual(fb.counts, { hit: 2, early: 0, late: 3, wrong: 2, miss: 1 });
  // Primero equivocadas y perdidas, en orden; hasta 3.
  assert.deepEqual(fb.problems.map((p) => [p.index, p.bar, p.verdict]), [[4, 2, 'wrong'], [5, 2, 'miss'], [6, 2, 'wrong']]);
  assert.equal(fb.problems[0].played, 62);
  assert.deepEqual(keys(fb.tips), ['tip.wrong', 'tip.late', 'tip.bar']);
  assert.equal(fb.tips[2].params?.bar, 2);
  assert.ok(fb.tips.length <= MAX_TIPS);
  // Todo perfecto: felicitar, sin problemas.
  const ok = timedFeedback({ verdicts: ['hit', 'hit', 'hit', 'hit'], offsets: [0, 5, -5, 0], played: [null, null, null, null], targets: [40, 41, 42, 43], startBeats: [0, 1, 2, 3], beatsPerBar: 4, accuracy: 1, stars: 3 });
  assert.deepEqual(keys(ok.tips), ['tip.great']);
  assert.equal(ok.problems.length, 0);
  // Casi todo perdido: pulsar más firme y escuchar antes.
  const lost = timedFeedback({ verdicts: ['miss', 'miss', 'miss', 'hit'], offsets: [null, null, null, 0], played: [null, null, null, null], targets: [40, 41, 42, 43], startBeats: [0, 1, 2, 3], beatsPerBar: 4, accuracy: 0.25, stars: 0 });
  assert.deepEqual(keys(lost.tips), ['tip.miss', 'tip.listenFirst']);
  // Se adelanta: el consejo es esperar el clic.
  const early = timedFeedback({ verdicts: ['early', 'early', 'early', 'hit'], offsets: [-60, -70, -55, 0], played: [null, null, null, null], targets: [40, 41, 42, 43], startBeats: [0, 1, 2, 3], beatsPerBar: 4, accuracy: 1, stars: 3 });
  assert.deepEqual(keys(early.tips), ['tip.great', 'tip.early']);
  assert.equal(worstBar([1, 1, 0]), undefined);
  assert.equal(worstBar([0, 3, 2]), 2);
});

test('devolución sin tempo: la nota que más costó y si sonaba alta o baja', () => {
  const fb = untimedFeedback([{ ms: 800, cents: null }, { ms: 900, cents: null }, { ms: 6000, cents: 35 }, { ms: 1000, cents: null }]);
  assert.equal(fb.hardest, 2);
  assert.deepEqual(keys(fb.tips), ['tip.hardestNote', 'tip.sharp']);
  assert.deepEqual(keys(untimedFeedback([{ ms: 500, cents: null }, { ms: 700, cents: null }]).tips), ['tip.untimedGreat']);
  assert.deepEqual(keys(untimedFeedback([{ ms: 2500, cents: -30 }, { ms: 2400, cents: -25 }, { ms: 2600, cents: -40 }]).tips), ['tip.flat']);
});

test('devolución del rasgueo: golpes que faltan, golpes de más, tendencia y compás difícil', () => {
  const bpm = 60;
  const exact = strokeTimes(QUARTERS, 2, bpm, 1000).map((s) => s.timeMs);
  // Tarde por 50 ms en todo el primer compás; el segundo compás, sin golpes.
  const late = exact.slice(0, 4).map((t) => t + 50);
  const s = scoreStrum(QUARTERS, 2, bpm, 1000, late, 80);
  assert.equal(s.hits, 4);
  assert.deepEqual(s.missedByBar, [0, 4]);
  assert.ok(s.meanOffsetMs !== null && Math.abs(s.meanOffsetMs - 50) < 1);
  const fb = strumFeedback({ ...s, stars: 0 });
  assert.deepEqual(keys(fb.tips), ['tip.strumMissed', 'tip.strumLate', 'tip.bar']);
  // Golpes de más en los «·»: dejar la mano al aire.
  const withExtras = [...exact, 1000 + 500, 1000 + 1500, 1000 + 2500];
  const s2 = scoreStrum(QUARTERS, 2, bpm, 1000, withExtras, 80);
  assert.equal(s2.extras, 3);
  assert.ok(keys(strumFeedback({ ...s2, stars: 2 }).tips).includes('tip.strumExtras'));
  assert.deepEqual(keys(strumFeedback({ ...scoreStrum(QUARTERS, 2, bpm, 1000, exact, 80), stars: 3 }).tips), ['tip.great']);
});

test('devolución de la improvisación: pocas notas, fuera de escala, metas y variedad', () => {
  const f = (midi: number, timeMs: number) => ({ freq: midiToFreq(midi), timeMs });
  // Solo dos notas distintas de la escala de La menor pentatónica, muchas veces.
  const played = Array.from({ length: 12 }, (_, i) => f(i % 2 ? 57 : 60, i * 300));
  const r = scoreImprov(played, [9, 0, 2, 4, 7], 12);
  assert.equal(r.distinct, 2);
  assert.deepEqual(improvFeedback(r, 12, 1), ['tip.improvVariety'].map((key) => ({ key })));
  assert.deepEqual(keys(improvFeedback({ notes: 4, inScale: 0.5, distinct: 3, targetHits: 1, targetTotal: 4 }, 12, 0)), ['tip.improvFew', 'tip.improvOut', 'tip.improvTargets']);
  assert.deepEqual(keys(improvFeedback({ notes: 20, inScale: 1, distinct: 5, targetHits: 4, targetTotal: 4 }, 12, 3)), ['tip.improvGreat']);
});

test('cada clave de la explicación y la devolución existe en los 3 idiomas', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../src/music/feedback.ts', import.meta.url), 'utf8');
  const used = [...new Set([...src.matchAll(/'((?:howTo|tip)\.[A-Za-z0-9]+)'/g)].map((m) => m[1]))];
  assert.ok(used.length > 30);
  const extra = ['howTo.title', 'howTo.example', 'feedback.title', 'feedback.problem', 'feedback.problemWrong', 'and'];
  for (const lang of ['es', 'en', 'pt']) {
    const tree = JSON.parse(readFileSync(new URL(`../src/i18n/locales/${lang}.json`, import.meta.url), 'utf8'));
    for (const k of [...used, ...extra]) {
      const v = k.split('.').reduce((o: Record<string, unknown> | undefined, p) => o?.[p] as Record<string, unknown> | undefined, tree.ui.exercise);
      assert.equal(typeof v, 'string', `${lang}: ui.exercise.${k}`);
    }
  }
});
