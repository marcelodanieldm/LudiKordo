import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHACARERA, QUARTERS, SIX8_PULSE, VALS, ZAMBA, barBeatsOf, isValidPattern, scoreStrum, strokeTimes, strumSchedule } from '../src/music/strum';
import { DRUM_STYLES, barBeatsOfStyle, drumSchedule, type DrumStyle } from '../src/music/drums';
import { jamSchedule } from '../src/music/jam';
import { exampleSchedule } from '../src/music/examples';
import { barsAreComplete, layoutTab, placeNotes } from '../src/music/tab';
import type { ScoreEvent } from '../src/content/types';

test('patrones de 6 corcheas (3/4 y 6/8): válidos y de 3 pulsos', () => {
  for (const p of [ZAMBA, CHACARERA, VALS, SIX8_PULSE]) {
    assert.ok(isValidPattern(p));
    assert.equal(barBeatsOf(p), 3);
  }
  assert.equal(barBeatsOf(QUARTERS), 4);
  assert.ok(!isValidPattern(['D', '-', 'D', '-', 'D', '-', 'D']));
  // Arriba en el pulso: inválido también en 6.
  assert.ok(!isValidPattern(['U', '-', 'D', '-', 'D', '-']));
});

test('rasgueo en 6/8: cada compás dura 6 corcheas', () => {
  const bpm = 60; // corchea = 500 ms
  const times = strokeTimes(ZAMBA, 2, bpm, 1000);
  assert.deepEqual(times.filter((t) => t.bar === 1).map((t) => t.timeMs), [1000 + 6 * 500, 1000 + 8 * 500, 1000 + 9 * 500, 1000 + 10 * 500]);
  const sched = strumSchedule([[40, 47, 52], [45, 52, 57]], ZAMBA, bpm);
  const last = sched.reduce((a, n) => Math.max(a, n.startSec + n.durSec), 0);
  assert.ok(last <= 6 + 0.01, `el rasgueo termina en el compás 2 (6 s), no en ${last}`);
});

test('puntaje de rasgueo en 3/4: golpes justos dan 100 %, un golpe donde no va cuenta como extra', () => {
  const bpm = 80;
  const start = 2000;
  const exact = strokeTimes(VALS, 4, bpm, start).map((s) => s.timeMs);
  assert.equal(scoreStrum(VALS, 4, bpm, start, exact, 80).accuracy, 1);
  const eighthMs = 60000 / bpm / 2;
  const extra = [...exact, start + eighthMs]; // la corchea 2 del primer compás es '-'
  const r = scoreStrum(VALS, 4, bpm, start, extra, 80);
  assert.equal(r.extras, 1);
  assert.ok(r.accuracy < 1);
});

test('batería: los estilos nuevos son de 3 pulsos (salvo el tango) y sus golpes caen dentro del compás', () => {
  const three: DrumStyle[] = ['zamba', 'chacarera', 'vals'];
  for (const s of three) assert.equal(barBeatsOfStyle(s), 3, s);
  assert.equal(barBeatsOfStyle('tango'), 4);
  assert.equal(barBeatsOfStyle('rock'), 4);
  for (const [style, p] of Object.entries(DRUM_STYLES)) {
    for (const kind of ['kick', 'snare', 'hat', 'ride', 'rim'] as const) for (const step of p[kind] ?? []) assert.ok(step >= 0 && step < p.steps, `${style}.${kind}`);
  }
  const bpm = 60;
  const hits = drumSchedule('zamba', 2, bpm);
  const kicks = hits.filter((h) => h.kind === 'kick').map((h) => h.startSec);
  // Parche en el 1 y en el 4 (pulso 1,5) de cada compás de 3 pulsos.
  assert.deepEqual(kicks, [0, 1.5, 3, 4.5]);
  assert.ok(hits.every((h) => h.startSec < 6));
});

test('banda en vals: compases de 3 pulsos, bajo en el 1 y acordes en el 2 y el 3', () => {
  const s = jamSchedule({ chords: ['C', 'G7'], bpm: 60, style: 'vals', loops: 1, parts: ['bass', 'keys', 'drums'], countIn: 6 });
  assert.equal(s.bodyBeats, 6);
  assert.equal(s.lengthSec, 12);
  const bass = s.notes.filter((n) => n.tone === 'ebass').map((n) => n.startSec);
  assert.deepEqual(bass, [6, 9]);
  const keys = [...new Set(s.notes.filter((n) => n.tone === 'keys').map((n) => n.startSec))];
  assert.deepEqual(keys, [7, 8, 10, 11]);
  // Y el 4/4 sigue igual.
  assert.equal(jamSchedule({ chords: ['C', 'G7'], bpm: 60, style: 'rock', loops: 1, parts: ['drums'], countIn: 4 }).bodyBeats, 8);
});

test('ejemplo rasgueado en 6/8: dura 3 pulsos por acorde', () => {
  const ex = exampleSchedule({ events: [], bpm: 60, strum: { chords: [[40, 47, 52], [45, 52, 57], [40, 47, 52]], pattern: ZAMBA } });
  assert.equal(ex.beats, 9);
});

test('tablatura en compases de 3 pulsos', () => {
  const vals: ScoreEvent[] = [
    { string: 'A', fret: 3, beats: 1 }, { string: 'G', fret: 0, beats: 1 }, { string: 'B', fret: 1, beats: 1 },
    { string: 'E', fret: 3, beats: 2 }, { string: 'B', fret: 0, beats: 1 },
  ];
  assert.ok(barsAreComplete(vals, 3));
  assert.ok(!barsAreComplete(vals));
  assert.deepEqual(placeNotes(vals, 3).map((n) => [n.bar, n.beatInBar]), [[0, 0], [0, 1], [0, 2], [1, 0], [1, 2]]);
  const layout = layoutTab(vals, 400, 3);
  assert.equal(layout.barsInRow.reduce((a, b) => a + b, 0), 2);
  // La primera nota del compás 2 cae a 3 pulsos de la primera del compás 1.
  assert.ok(Math.abs(layout.notes[3].x - layout.notes[0].x - 3 * layout.beatW) < 0.01);
});
