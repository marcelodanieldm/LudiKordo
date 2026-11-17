import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutScore, ledgerLines, placeScore, scoreBarsComplete, spell, staffPos, stemUp, writtenMidi } from '../src/music/staff';
import { listenLengthSec, listenSchedule, PLAYBACK_OCTAVE_UP } from '../src/music/listen';
import { midiAt, midiToFreq } from '../src/music/notes';
import type { ScoreEvent } from '../src/content/types';

test('pentagrama: el bajo se escribe una octava arriba de lo que suena', () => {
  assert.equal(writtenMidi('E', 0), 40); // suena E1 (28), se escribe E2
  assert.deepEqual(spell(writtenMidi('E', 0)), { letter: 'E', sharp: false, octave: 2 });
});

test('pentagrama: cuerdas al aire en clave de fa', () => {
  // Mi: 1.ª línea adicional abajo; La: 1.er espacio; Re: línea del medio; Sol: 4.º espacio.
  assert.equal(staffPos(writtenMidi('E', 0)), -2);
  assert.equal(staffPos(writtenMidi('A', 0)), 1);
  assert.equal(staffPos(writtenMidi('D', 0)), 4);
  assert.equal(staffPos(writtenMidi('G', 0)), 7);
  // La clave de fa marca Fa en la 4.ª línea: cuerda Re, traste 3.
  assert.equal(staffPos(writtenMidi('D', 3)), 6);
  // Líneas Sol Si Re Fa La y espacios La Do Mi Sol.
  assert.deepEqual([['E', 3], ['A', 2], ['D', 0], ['D', 3], ['D', 7]].map(([s, f]) => staffPos(writtenMidi(s as 'E', f as number))), [0, 2, 4, 6, 8]);
  assert.deepEqual([['A', 0], ['A', 3], ['D', 2], ['D', 5]].map(([s, f]) => staffPos(writtenMidi(s as 'E', f as number))), [1, 3, 5, 7]);
});

test('pentagrama: sostenidos, líneas adicionales y plicas', () => {
  const fs = writtenMidi('E', 2);
  assert.equal(spell(fs).sharp, true);
  assert.equal(staffPos(fs), staffPos(writtenMidi('E', 1))); // Fa♯ en el lugar de Fa
  assert.deepEqual(ledgerLines(-2), [-2]);
  assert.deepEqual(ledgerLines(-1), []);
  assert.deepEqual(ledgerLines(-4), [-2, -4]);
  assert.deepEqual(ledgerLines(8), []);
  assert.deepEqual(ledgerLines(10), [10]);
  assert.equal(stemUp(3), true);
  assert.equal(stemUp(4), false);
});

test('pentagrama: compases, silencios y corcheas unidas', () => {
  const bar: ScoreEvent[] = [{ string: 'A', fret: 0, beats: 0.5 }, { string: 'A', fret: 0, beats: 0.5 }, { rest: true, beats: 1 }, { string: 'A', fret: 0, beats: 2 }];
  assert.ok(scoreBarsComplete(bar));
  assert.ok(!scoreBarsComplete(bar.slice(1)));
  // Una blanca que cruza la barra está mal escrita.
  assert.ok(!scoreBarsComplete([{ rest: true, beats: 1 }, { string: 'A', fret: 0, beats: 1 }, { string: 'A', fret: 0, beats: 1 }, { string: 'A', fret: 0, beats: 2 }, { string: 'A', fret: 0, beats: 2 }, { rest: true, beats: 1 }]));
  const p = placeScore(bar);
  assert.equal(p[0].beamWith, 1);
  assert.equal(p[1].beamWith, 0);
  assert.equal(p[2].pos, undefined); // los silencios no tienen altura
  assert.equal(p[3].startBeat, 2);
  // Corcheas sueltas (que empiezan a mitad de pulso) no se unen.
  const off = placeScore([{ rest: true, beats: 0.5 }, { string: 'A', fret: 0, beats: 0.5 }, { string: 'A', fret: 0, beats: 0.5 }, { rest: true, beats: 0.5 }, { rest: true, beats: 2 }]);
  assert.equal(off[1].beamWith, undefined);
});

test('pentagrama: los renglones tienen compases enteros y entran en el ancho', () => {
  const eight: ScoreEvent[] = Array.from({ length: 8 }, () => ({ string: 'A' as const, fret: 0, beats: 2 as const }));
  const wide = layoutScore(eight, 900);
  assert.equal(wide.rows, 1);
  const narrow = layoutScore(eight, 320);
  assert.ok(narrow.rows > 1);
  assert.ok(narrow.width <= 320 || narrow.barsPerRow === 1);
  // La segunda nota del segundo renglón empieza otra vez a la izquierda.
  const firstOfRow2 = narrow.items.findIndex((it) => it.row === 1);
  assert.ok(narrow.items[firstOfRow2].x < narrow.items[firstOfRow2 - 1].x);
});

test('ejemplos sonoros: tiempos, silencios y octava de reproducción', () => {
  const ev: ScoreEvent[] = [{ string: 'E', fret: 0, beats: 1 }, { rest: true, beats: 1 }, { string: 'A', fret: 0, beats: 2 }];
  const s = listenSchedule(ev, 60);
  assert.equal(s.length, 2); // el silencio no suena
  assert.equal(s[0].startSec, 0);
  assert.equal(s[1].startSec, 2);
  assert.ok(s[1].durSec < 2 && s[1].durSec > 1.5);
  assert.ok(Math.abs(s[0].freq - midiToFreq(midiAt('E', 0) + PLAYBACK_OCTAVE_UP)) < 1e-9);
  // Con clic, todo se corre la cuenta previa.
  assert.equal(listenSchedule(ev, 120, 4)[0].startSec, 2);
  assert.equal(listenLengthSec(ev, 60), 4);
  assert.equal(listenLengthSec(ev, 60, true), 8);
});
