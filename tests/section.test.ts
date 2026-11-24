import { test } from 'node:test';
import assert from 'node:assert/strict';
import { barStarts, sectionsOf, sliceDrill, sliceLine } from '../src/music/section';
import { DRILLS, songDrill } from '../src/content/practice';
import { practiceOutcome } from '../src/state/rules';
import { coach } from '../src/music/coach';
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

test('todas las canciones y ejercicios de línea se pueden practicar por tramos: línea y acordes recortados juntos', () => {
  const drills = [...[...BASS_SONGS, ...GUITAR_SONGS, ...NYLON_SONGS].map(songDrill), ...DRILLS.filter((d) => d.kind === 'line')];
  for (const drill of drills) {
    const bb = barBeatsOfStyle(drill.style);
    for (const s of sectionsOf(drill.chords.length)) {
      const part = sliceDrill(drill, s, bb);
      assert.ok(part, `${drill.id} ${s.from}-${s.to}`);
      assert.equal(part.chords.length, s.to - s.from + 1);
      assert.equal(beatsOf(part.line ?? []), part.chords.length * bb, `${drill.id} ${s.from}-${s.to}`);
      assert.equal(part.id, drill.id);
    }
  }
});

test('un tramo se evalúa pero no guarda estrellas ni desbloquea tempo', () => {
  const steps = [70, 80, 90];
  assert.deepEqual(practiceOutcome({ stars: 3, bpm: 70, unlockedBpm: 70, tempoSteps: steps, section: false }), { record: 3, unlock: 80 });
  assert.deepEqual(practiceOutcome({ stars: 3, bpm: 70, unlockedBpm: 70, tempoSteps: steps, section: true }), { record: 0 });
  assert.deepEqual(practiceOutcome({ stars: 2, bpm: 70, unlockedBpm: 70, tempoSteps: steps, section: false }), { record: 2 });
  // En el tempo más alto no hay nada más que desbloquear.
  assert.deepEqual(practiceOutcome({ stars: 3, bpm: 90, unlockedBpm: 90, tempoSteps: steps, section: false }), { record: 3 });
  // Tres estrellas en un tempo ya superado no desbloquean de nuevo.
  assert.deepEqual(practiceOutcome({ stars: 3, bpm: 70, unlockedBpm: 90, tempoSteps: steps, section: false }), { record: 3 });
});

test('con un tramo, la devolución no dice que la pieza está dominada', () => {
  const base = { category: 'riffs', stars: 3, accuracy: 1, counts: { hit: 8, early: 0, late: 0, wrong: 0, miss: 0 }, meanOffset: 0, bpm: 90, tempos: [55, 70, 80, 90] };
  assert.ok(coach(base).tips.some((x) => x.key.endsWith('mastered')));
  assert.ok(!coach({ ...base, section: true }).tips.some((x) => x.key.endsWith('mastered') || x.key.endsWith('faster')));
});
