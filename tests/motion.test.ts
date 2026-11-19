import { test } from 'node:test';
import assert from 'node:assert/strict';
import { motionLengthSec, motionNotes, motionPositions, motionStarts, motionStepAt, MOTION_LEAD_SEC } from '../src/music/motion';
import { PLAYBACK_OCTAVE_UP } from '../src/music/listen';
import { midiAt, midiToFreq } from '../src/music/notes';
import { LESSONS } from '../src/content/lessons';
import { LEGACY_VOICE } from '../src/music/timbre';
import type { FigureMotion } from '../src/content/types';

const m: FigureMotion = { bpm: 60, steps: [{ beats: 1, note: { string: 'E', fret: 0 } }, { beats: 2 }, { beats: 1, note: { string: 'A', fret: 0 }, muted: true }] };

test('movimiento: inicio de cada paso, duración y paso visible', () => {
  assert.deepEqual(motionStarts(m), [MOTION_LEAD_SEC, MOTION_LEAD_SEC + 1, MOTION_LEAD_SEC + 3]);
  assert.equal(motionLengthSec(m), MOTION_LEAD_SEC + 4);
  const starts = motionStarts(m);
  const total = motionLengthSec(m);
  assert.equal(motionStepAt(starts, total, 0), -1); // dibujo quieto antes de empezar
  assert.equal(motionStepAt(starts, total, MOTION_LEAD_SEC + 0.5), 0);
  assert.equal(motionStepAt(starts, total, MOTION_LEAD_SEC + 2), 1);
  assert.equal(motionStepAt(starts, total, total - 0.01), 2);
  assert.equal(motionStepAt(starts, total, total + 0.1), -1); // al terminar vuelve a quieto
});

test('movimiento: suenan solo los pasos con nota, una octava arriba, y los mal pisados apagados', () => {
  const notes = motionNotes(m);
  assert.equal(notes.length, 2);
  assert.ok(Math.abs(notes[0].freq - midiToFreq(midiAt('E', 0) + PLAYBACK_OCTAVE_UP)) < 1e-9);
  assert.equal(notes[1].startSec, MOTION_LEAD_SEC + 3);
  assert.equal(notes[0].muted, false);
  assert.equal(notes[1].muted, true);
  assert.deepEqual(motionPositions(m), [{ string: 'E', fret: 0 }, { string: 'A', fret: 0 }]);
});

test('el tono del bajo tiene armónicos para oírse en el parlante del teléfono', () => {
  // Una onda triangular sola a 41–98 Hz casi no sale por un parlante chico.
  assert.ok(LEGACY_VOICE.partials.length >= 2);
  assert.ok(LEGACY_VOICE.partials.some((p) => p.type === 'sawtooth' || p.detune >= 1200));
});

test('dibujos de las manos: todos se mueven con sonido y coinciden con su tarjeta', () => {
  const withFigure = Object.values(LESSONS).flatMap((l) => l.cards.map((c) => ({ id: l.id, c })));
  for (const fig of ['right-hand', 'left-hand', 'fretboard-1234', 'strings', 'fret5'] as const) {
    const cards = withFigure.filter((x) => x.c.figure === fig);
    for (const { id, c } of cards) {
      assert.ok(c.motion, `${id} ${c.titleKey}: ${fig} sin movimiento`);
      assert.ok(c.motion!.steps.some((s) => s.note), `${id}: sin sonido`);
      for (const s of c.motion!.steps) {
        if (s.note) assert.ok(s.note.fret >= 0 && s.note.fret <= 5, `${id}: traste ${s.note.fret} fuera del dibujo`);
        if (fig === 'right-hand') {
          assert.ok(s.finger === 'i' || s.finger === 'm', `${id}: la mano que pulsa usa i y m`);
          // Pulgar en la pastilla para la cuerda Mi; sobre la Mi para las demás (1.2.2).
          if (s.note) assert.equal(s.thumb, s.note.string === 'E' ? 'pickup' : 'E', `${id}: pulgar`);
        }
        if ((fig === 'fretboard-1234' || fig === 'left-hand') && typeof s.finger === 'number' && s.note) assert.equal(s.finger, s.note.fret, `${id}: un dedo por traste`);
      }
      if (fig === 'right-hand') {
        // i y m se alternan, nunca el mismo dedo dos veces seguidas.
        const fs = c.motion!.steps.map((s) => s.finger);
        fs.forEach((f, i) => i > 0 && assert.notEqual(f, fs[i - 1], `${id}: alternancia`));
      }
    }
  }
  // 1.1.4: el traste 5 suena igual que la cuerda siguiente al aire.
  const f5 = LESSONS['1.1.4'].cards.find((c) => c.figure === 'fret5')!.motion!.steps;
  for (let i = 0; i < f5.length; i += 2) assert.equal(midiAt(f5[i].note!.string, f5[i].note!.fret), midiAt(f5[i + 1].note!.string, f5[i + 1].note!.fret));
  // 1.3.2: bien, encima del traste (apagado), en el medio (apagado), bien.
  const place = LESSONS['1.3.2'].cards.find((c) => c.figure === 'left-hand')!.motion!.steps;
  assert.deepEqual(place.map((s) => [s.mark, Boolean(s.muted)]), [['ok', false], ['onFret', true], ['middle', true], ['ok', false]]);
});
