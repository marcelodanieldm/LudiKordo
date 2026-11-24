import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chordTargets, improvPhrase } from '../src/music/phrase';
import { eventAtMs } from '../src/music/examples';
import { LISTEN_COUNT_IN } from '../src/music/listen';
import { BASS, GUITAR, NYLON, type InstrumentProfile } from '../src/instruments/profiles';
import { BASS_DRILLS, GUITAR_DRILLS } from '../src/content/practice';
import { NYLON_DRILLS } from '../src/content/nylon/practice';
import { barBeatsOfStyle } from '../src/music/drums';
import { chordFromName } from '../src/music/chords';
import { exampleBacking } from '../src/music/jam';
import type { ScoreEvent } from '../src/content/types';

const midiOf = (p: InstrumentProfile, e: ScoreEvent) => ('rest' in e ? -1 : p.strings.find((s) => s.id === e.string)!.openMidi + e.fret);
const PENTA_AM = [9, 0, 2, 4, 7];

/** Las notas que cierran cada compás (la última de cada compás). */
function barEnds(ev: ScoreEvent[], barBeats: number): ScoreEvent[] {
  const out: ScoreEvent[] = [];
  let beat = 0;
  for (const e of ev) {
    beat += e.beats;
    if (Math.abs(beat % barBeats) < 1e-9) out.push(e);
  }
  return out;
}

test('improvPhrase: Am-G-F-G cae en una nota de cada acorde al final de cada compás', () => {
  const chords = ['Am', 'G', 'F', 'G'];
  const ev = improvPhrase(PENTA_AM, chords, GUITAR.strings);
  assert.equal(ev.reduce((a, e) => a + e.beats, 0), 16);
  const ends = barEnds(ev, 4);
  assert.equal(ends.length, 4);
  ends.forEach((e, i) => {
    const pcs = (chordFromName(chords[i]) ?? []).map((m) => m % 12);
    assert.ok(pcs.includes(midiOf(GUITAR, e) % 12), `compás ${i + 1}`);
    assert.equal(e.beats, 2, 'la nota del acorde es larga');
  });
  // Pregunta (sin silencio) y respuesta (empieza con silencio).
  assert.ok(!('rest' in ev[0]));
  assert.ok(ev.some((e) => 'rest' in e));
});

test('improvPhrase: termina en la tónica si el último acorde la tiene', () => {
  const ev = improvPhrase(PENTA_AM, ['Am', 'Dm', 'Am', 'Am'], GUITAR.strings);
  const last = ev[ev.length - 1];
  assert.equal(midiOf(GUITAR, last) % 12, 9);
});

test('improvPhrase en 3/4: compases de 3 pulsos', () => {
  const ev = improvPhrase(PENTA_AM, ['Am', 'Dm', 'E7'], NYLON.strings, 3);
  assert.equal(ev.reduce((a, e) => a + e.beats, 0), 9);
  assert.equal(barEnds(ev, 3).length, 3);
});

test('chordTargets: solo las notas del acorde que están en la escala, la fundamental primero', () => {
  // E7 = Mi Sol# Si Re: Sol# y Si no están en la pentatónica de La menor.
  assert.deepEqual(chordTargets('E7', PENTA_AM), [4, 2]);
  assert.equal(chordTargets('D7', PENTA_AM)[0], 2);
});

test('improvPhrase: con dos acordes en el compás, la nota larga es del segundo', () => {
  const ev = improvPhrase(PENTA_AM, ['Am', 'Dm G', 'C', 'Am'], GUITAR.strings);
  const second = barEnds(ev, 4)[1];
  assert.ok([7, 11, 2].includes(midiOf(GUITAR, second) % 12));
});

test('exampleBacking: la misma regla que la pista en vivo', () => {
  assert.deepEqual(exampleBacking(['Am', 'G'], 4)?.pattern, ['D', '-', '-', '-', 'D', '-', '-', '-']);
  assert.equal(exampleBacking(['Am', 'G'], 4)?.chords.length, 2);
  // Dos acordes en un compás: golpes de medio compás, el segundo desde el tercer tiempo.
  const split = exampleBacking(['Am', 'Dm G'], 4);
  assert.deepEqual(split?.pattern, ['D', '-', '-', '-']);
  assert.deepEqual(split?.chords, [chordFromName('Am'), chordFromName('Am'), chordFromName('Dm'), chordFromName('G')]);
  assert.equal(exampleBacking(['Am', 'E7', 'Am'], 3)?.pattern.length, 6);
  assert.equal(exampleBacking(['Am', 'Xyz'], 4), null);
  // Lo que dura el fondo es lo que dura la línea del ejercicio.
  for (const d of [...GUITAR_DRILLS, ...BASS_DRILLS, ...NYLON_DRILLS]) {
    const meter = barBeatsOfStyle(d.style) === 3 ? 3 : 4;
    const b = exampleBacking(d.chords, meter);
    assert.ok(b, d.id);
    assert.equal((b.chords.length * b.pattern.length) / 2, d.chords.length * meter, d.id);
  }
});

test('improvPhrase: todos los ejercicios de improvisación, en la escala, en posición y sin repetir notas seguidas', () => {
  for (const [profile, drills] of [[BASS, BASS_DRILLS], [GUITAR, GUITAR_DRILLS], [NYLON, NYLON_DRILLS]] as const) {
    for (const d of drills.filter((x) => x.kind === 'improv')) {
      const meter = barBeatsOfStyle(d.style) === 3 ? 3 : 4;
      const ev = improvPhrase(d.scale ?? [], d.chords, profile.strings, meter);
      assert.ok(ev.length >= d.chords.length * 2, d.id);
      assert.equal(ev.reduce((a, e) => a + e.beats, 0), d.chords.length * meter, `${d.id}: compases completos`);
      const pcs = new Set((d.scale ?? []).map((p) => p % 12));
      let prev = -1;
      for (const e of ev) {
        if ('rest' in e) continue;
        const m = midiOf(profile, e);
        assert.ok(pcs.has(m % 12), `${d.id}: ${m} en la escala`);
        assert.ok(e.fret >= 0 && e.fret <= 4, `${d.id}: primera posición`);
        assert.notEqual(m, prev, `${d.id}: ${m} repetida`);
        prev = m;
      }
    }
  }
});

test('eventAtMs: sigue la nota que suena, después de la cuenta previa', () => {
  const ex = { events: [{ string: 'A', fret: 0, beats: 1 }, { rest: true, beats: 1 }, { string: 'D', fret: 2, beats: 2 }] as ScoreEvent[], bpm: 60, click: true };
  const at = (beat: number) => eventAtMs(ex, (LISTEN_COUNT_IN + beat) * 1000);
  assert.equal(eventAtMs(ex, 500), -1);
  assert.equal(at(0.1), 0);
  assert.equal(at(1.5), 1);
  assert.equal(at(3.9), 2);
  assert.equal(at(4.1), -1);
  assert.equal(eventAtMs({ ...ex, click: false }, 100), 0);
});
