import { test } from 'node:test';
import assert from 'node:assert/strict';
import { barStarts, sectionsOf, sliceDrill, sliceLine } from '../src/music/section';
import { songDrill } from '../src/content/practice';
import { BASS_SONGS } from '../src/content/songs';
import { GUITAR_SONGS } from '../src/content/guitar/songs';
import { NYLON_SONGS } from '../src/content/nylon/songs';
import { barBeatsOfStyle } from '../src/music/drums';
import type { ScoreEvent } from '../src/content/types';

const n = (beats: 0.5 | 1 | 2 | 4): ScoreEvent => ({ string: 'A', fret: 0, beats });
const beatsOf = (line: ScoreEvent[]) => line.reduce((a, e) => a + e.beats, 0);

test('tramos: de a 4 en piezas de 8 o más, de a 2 en las cortas, ninguno con menos de 4', () => {
  assert.deepEqual(sectionsOf(3), []);
  assert.deepEqual(sectionsOf(4), [{ from: 0, to: 1 }, { from: 2, to: 3 }]);
  assert.deepEqual(sectionsOf(8), [{ from: 0, to: 3 }, { from: 4, to: 7 }]);
  // 12 compases (blues): tres tramos; 13, el último de uno solo.
  assert.equal(sectionsOf(12).length, 3);
  assert.deepEqual(sectionsOf(13).at(-1), { from: 12, to: 12 });
});

test('cortes: en las barras de compás; una nota que cruza la barra no se corta', () => {
  const line = [n(2), n(1), n(1), n(4), n(0.5), n(0.5), n(1), n(2)];
  assert.deepEqual(barStarts(line, 4), [0, 3, 4]);
  assert.deepEqual(sliceLine(line, 4, { from: 1, to: 2 }), [n(4), n(0.5), n(0.5), n(1), n(2)]);
  assert.equal(barStarts([n(1), n(1), n(1), n(2), n(1), n(2)], 4), null);
  // En 3/4.
  assert.deepEqual(barStarts([n(2), n(1), n(1), n(2)], 3), [0, 2]);
  assert.equal(sliceLine(line, 4, { from: 2, to: 5 }), null);
});

test('todas las canciones se pueden practicar por tramos: línea y acordes recortados juntos', () => {
  for (const song of [...BASS_SONGS, ...GUITAR_SONGS, ...NYLON_SONGS]) {
    const drill = songDrill(song);
    const bb = barBeatsOfStyle(drill.style);
    for (const s of sectionsOf(drill.chords.length)) {
      const part = sliceDrill(drill, s, bb);
      assert.ok(part, `${song.id} ${s.from}-${s.to}`);
      assert.equal(part.chords.length, s.to - s.from + 1);
      assert.equal(beatsOf(part.line ?? []), part.chords.length * bb, `${song.id} ${s.from}-${s.to}`);
      assert.equal(part.id, drill.id);
    }
  }
});
