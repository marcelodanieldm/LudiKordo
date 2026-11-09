import { test } from 'node:test';
import assert from 'node:assert/strict';
import { centsOff, freqToMidi, midiAt, midiToFreq, noteName, openStringFreqs } from '../src/music/notes';
import { detectPitch } from '../src/music/yin';

test('afinación estándar del bajo: E1 A1 D2 G2', () => {
  const f = openStringFreqs();
  assert.ok(Math.abs(f.E - 41.2034) < 0.001);
  assert.equal(f.A, 55);
  assert.ok(Math.abs(f.D - 73.4162) < 0.001);
  assert.ok(Math.abs(f.G - 97.9989) < 0.001);
});

test('el traste 5 de una cuerda es la cuerda siguiente al aire', () => {
  assert.equal(midiAt('E', 5), midiAt('A', 0));
  assert.equal(midiAt('A', 5), midiAt('D', 0));
  assert.equal(midiAt('D', 5), midiAt('G', 0));
});

test('nombres de nota por idioma y notación', () => {
  assert.equal(noteName(midiAt('E', 1), 'es', 'both'), 'Fa (F)');
  assert.equal(noteName(midiAt('E', 2), 'es', 'solfege'), 'Fa♯');
  assert.equal(noteName(midiAt('E', 3), 'en', 'both'), 'G');
  assert.equal(noteName(midiAt('A', 0), 'pt', 'solfege'), 'Lá');
  assert.equal(noteName(midiAt('E', 0), 'en', 'letters', true), 'E1');
});

test('cents y conversiones', () => {
  assert.ok(Math.abs(centsOff(midiToFreq(33), 33)) < 1e-9);
  assert.ok(Math.abs(centsOff(midiToFreq(33.5), 33) - 50) < 1e-6);
  assert.ok(Math.abs(freqToMidi(440) - 69) < 1e-9);
});

function synth(freq: number, sr: number, n: number, harmonics = [1, 0.6, 0.4, 0.25], noise = 0): Float32Array {
  const out = new Float32Array(n);
  let seed = 1;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  for (let i = 0; i < n; i++) {
    let v = 0;
    harmonics.forEach((a, h) => (v += a * Math.sin((2 * Math.PI * freq * (h + 1) * i) / sr)));
    out[i] = 0.3 * v + noise * rand();
  }
  return out;
}

test('YIN detecta las 4 cuerdas al aire con armónicos, dentro de ±10 cents', () => {
  const sr = 44100;
  for (const [id, f] of Object.entries(openStringFreqs())) {
    const r = detectPitch(synth(f, sr, 4096), { sampleRate: sr });
    assert.ok(r.freq !== null, `sin detección en ${id}`);
    const c = 1200 * Math.log2(r.freq! / f);
    assert.ok(Math.abs(c) < 10, `${id}: ${c.toFixed(1)} cents`);
  }
});

test('YIN encuentra el Mi grave aunque la fundamental sea débil (micrófono de teléfono)', () => {
  const sr = 44100;
  const f = midiToFreq(28);
  const r = detectPitch(synth(f, sr, 4096, [0.15, 1, 0.7, 0.5], 0.02), { sampleRate: sr });
  assert.ok(r.freq !== null);
  assert.ok(Math.abs(1200 * Math.log2(r.freq! / f)) < 15, `detectó ${r.freq}`);
});

test('YIN no inventa notas en silencio', () => {
  const r = detectPitch(new Float32Array(4096), { sampleRate: 44100 });
  assert.equal(r.freq, null);
});

test('YIN distingue Fa de Fa♯ en la cuerda Mi', () => {
  const sr = 44100;
  for (const fret of [1, 2, 3, 4]) {
    const target = midiAt('E', fret);
    const r = detectPitch(synth(midiToFreq(target), sr, 4096), { sampleRate: sr });
    assert.equal(Math.round(freqToMidi(r.freq!)), target);
  }
});
