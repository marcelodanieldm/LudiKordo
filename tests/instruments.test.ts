import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BASS, GUITAR, midiOn, resolveInstrument, stringIntervals } from '../src/instruments/profiles';
import { STRINGS, midiToFreq } from '../src/music/notes';

test('el perfil de bajo coincide con la afinación de notes.ts', () => {
  assert.deepEqual(
    BASS.strings.map((s) => [s.id, s.number, s.openMidi]),
    STRINGS.map((s) => [s.id, s.number, s.openMidi]),
  );
});

test('afinación estándar de guitarra: E2 A2 D3 G3 B3 E4', () => {
  assert.deepEqual(GUITAR.strings.map((s) => s.openMidi), [40, 45, 50, 55, 59, 64]);
  assert.deepEqual(GUITAR.strings.map((s) => s.number), [6, 5, 4, 3, 2, 1]);
  assert.equal(midiToFreq(GUITAR.strings[1].openMidi), 110);
});

test('la guitarra está una octava arriba del bajo en las 4 cuerdas compartidas', () => {
  for (let i = 0; i < 4; i++) assert.equal(GUITAR.strings[i].openMidi - BASS.strings[i].openMidi, 12);
});

test('intervalos entre cuerdas: cuartas, salvo Sol–Si (tercera mayor)', () => {
  assert.deepEqual(stringIntervals(BASS), [5, 5, 5]);
  assert.deepEqual(stringIntervals(GUITAR), [5, 5, 5, 4, 5]);
  // Por eso en guitarra el traste 4 de la 3.ª cuerda (no el 5) da la 2.ª al aire.
  assert.equal(midiOn(GUITAR, 'G', 4), midiOn(GUITAR, 'B', 0));
  assert.equal(midiOn(GUITAR, 'B', 5), midiOn(GUITAR, 'e', 0));
});

test('las dos Mi de la guitarra están a dos octavas', () => {
  assert.equal(midiOn(GUITAR, 'e', 0) - midiOn(GUITAR, 'E', 0), 24);
});

test('el rango del detector cubre todo el diapasón y un bend de un tono', () => {
  for (const p of [BASS, GUITAR]) {
    const lowest = midiToFreq(p.strings[0].openMidi);
    const highest = midiToFreq(p.strings[p.strings.length - 1].openMidi + p.frets + (p.id === 'guitar' ? 2 : 0));
    assert.ok(p.pitchRangeHz.min < lowest, `${p.id}: mínimo`);
    assert.ok(p.pitchRangeHz.max > highest, `${p.id}: máximo`);
  }
});

test('resolveInstrument: guitarra solo si se pide; cualquier otra cosa es bajo', () => {
  assert.equal(resolveInstrument('guitar').id, 'guitar');
  assert.equal(resolveInstrument('bass').id, 'bass');
  assert.equal(resolveInstrument(undefined).id, 'bass');
  assert.equal(resolveInstrument('ukelele').id, 'bass');
});

test('trastes fuera de rango y cuerdas inexistentes fallan', () => {
  assert.throws(() => midiOn(GUITAR, 'E', 23));
  assert.throws(() => midiOn(BASS, 'B', 0));
});
