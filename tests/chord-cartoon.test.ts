import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diagramOf, eShape } from '../src/music/chords';
import { BEAT_MS, MIN_SPEED_SCALE, beatAt, chordBeats, fitScale, fretWindow, isHandChord, loopMs, soundingStrings, stringNumber } from '../src/music/chordCartoon';
import { MIN_SCENE_MS } from '../src/content/cartoon';
import { CHORD_FIGURES } from '../src/components/guitarFigureMeta';

test('Am: pulgar, dedos 1-2-3 en orden, rasgueo desde la 5.ª y sostener', () => {
  const beats = chordBeats(diagramOf('Am'));
  assert.deepEqual(beats.map((b) => b.kind), ['thumb', 'place', 'place', 'place', 'strum', 'hold']);
  const places = beats.filter((b) => b.kind === 'place');
  assert.deepEqual(places.map((b) => b.kind === 'place' && b.finger), [1, 2, 3]);
  // Dedo 1 en el traste 1 de la 2.ª cuerda (Do).
  const one = places[0];
  assert.ok(one.kind === 'place' && one.fret === 1 && stringNumber(one.strings[0]) === 2);
  const strum = beats.find((b) => b.kind === 'strum');
  assert.ok(strum && strum.kind === 'strum');
  // La 6.ª no suena: el rasgueo empieza en la 5.ª.
  assert.equal(stringNumber(strum.strings[0]), 5);
  assert.equal(strum.strings.length, 5);
});

test('cejilla: el dedo 1 se acuesta primero sobre las 6 cuerdas y no se repite', () => {
  const d = eShape('F#m', 2, true);
  const places = chordBeats(d).filter((b) => b.kind === 'place');
  assert.ok(places[0].kind === 'place' && places[0].barre && places[0].finger === 1);
  assert.deepEqual(places[0].kind === 'place' && places[0].strings, [0, 1, 2, 3, 4, 5]);
  assert.equal(places.filter((b) => b.kind === 'place' && b.finger === 1).length, 1);
  assert.deepEqual(soundingStrings(d), [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(fretWindow(d), { first: 1, count: 4 });
});

test('ventana de trastes: desde la cejuela si entra en 4, si no desde la posición', () => {
  assert.deepEqual(fretWindow(diagramOf('G')), { first: 1, count: 4 });
  assert.deepEqual(fretWindow(eShape('Bm', 7, true)), { first: 7, count: 4 });
});

test('las cuerdas con × nunca suenan', () => {
  for (const id of ['D', 'C', 'Dm', 'A7'] as const) {
    const d = diagramOf(id);
    for (const s of soundingStrings(d)) assert.notEqual(d.marks[s], 'x', `${id} cuerda ${s}`);
  }
});

test('beatAt recorre el guion y da la vuelta', () => {
  const beats = chordBeats(diagramOf('Em'));
  assert.deepEqual(beatAt(beats, 0), { index: 0, progress: 0 });
  assert.equal(beatAt(beats, BEAT_MS.thumb + 1).index, 1);
  assert.equal(beatAt(beats, loopMs(beats) + 10).index, 0);
  assert.equal(beatAt(beats, loopMs(beats) - 1).index, beats.length - 1);
});

test('todas las figuras de acorde se animan con la mano y suenan al menos dos cuerdas', () => {
  for (const [figure, id] of Object.entries(CHORD_FIGURES)) {
    const d = diagramOf(id!);
    // Las cajas de escala tienen varias notas por cuerda: se quedan con su dibujo.
    if (!isHandChord(d)) {
      assert.ok(d.dots.length > 6 || new Set(d.dots.map((x) => x.string)).size < d.dots.length, figure);
      continue;
    }
    const beats = chordBeats(d);
    const fingers = beats.flatMap((b) => (b.kind === 'place' ? [b.finger] : []));
    assert.equal(new Set(fingers).size, fingers.length, `${figure}: un tiempo por dedo`);
    assert.deepEqual([...fingers].sort((a, b) => a - b), fingers, `${figure}: dedos del 1 al 4`);
    const strum = beats.find((b) => b.kind === 'strum');
    assert.ok(strum && strum.kind === 'strum' && strum.strings.length >= 2, `${figure}: suenan ≥ 2 cuerdas`);
    const { first, count } = fretWindow(d);
    for (const dot of d.dots) assert.ok(dot.fret >= first && dot.fret < first + count, `${figure}: traste ${dot.fret} visible`);
  }
});

test('el guion entra en la escena más corta: se ve el rasgueo', () => {
  for (const id of ['Am', 'G'] as const) {
    const beats = chordBeats(diagramOf(id));
    const scale = fitScale(beats, MIN_SCENE_MS);
    assert.ok(loopMs(beats, scale) <= MIN_SCENE_MS, id);
    assert.ok(scale >= MIN_SPEED_SCALE && scale <= 1);
  }
  // Con tiempo de sobra, a velocidad normal.
  assert.equal(fitScale(chordBeats(diagramOf('Em')), 60_000), 1);
});

test('isHandChord: un dedo en dos trastes, o el dedo 1 fuera de la cejilla, no se anima', () => {
  const base = diagramOf('Am');
  assert.equal(isHandChord({ ...base, dots: [...base.dots, { string: 0, fret: 3, finger: base.dots[0].finger }] }), false);
  const barre = eShape('Gm', 3, true);
  assert.equal(isHandChord({ ...barre, dots: [...barre.dots.filter((d) => d.finger !== 1 || d.fret === 3), { string: 5, fret: 4, finger: 1 }] }), false);
  assert.equal(isHandChord(barre), true);
});
