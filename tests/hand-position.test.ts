import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chordDiagram, diagramOf, type GridDiagram } from '../src/music/chords';
import { ARP_MS, STRUM_GAP_MS, listenPlan, notesOfPosture, postureFromDiagram, soundingFromDiagram, soundingOf, spiderPosture, stepOfBarre, stepOfDot, thumbFretOf } from '../src/music/handPosition';

// Guitarra afinada E A D G B E (índice 0 = 6.ª).
const OPEN = [40, 45, 50, 55, 59, 64];

test('Mi menor: dedos 2 y 3 en el traste 2, cuatro cuerdas al aire y el pulgar detrás del dedo 2', () => {
  const em = postureFromDiagram(chordDiagram('Em'));
  assert.deepEqual(em.dots.map((d) => [d.string, d.fret, d.finger]), [[1, 2, 2], [2, 2, 3]]);
  assert.deepEqual(em.open, [0, 3, 4, 5]);
  assert.deepEqual(em.muted, []);
  assert.equal(em.thumbFret, 2);
  assert.deepEqual(em.steps.map((s) => s.kind), ['finger', 'finger', 'open']);
  assert.deepEqual(notesOfPosture(em, OPEN), [40, 47, 52, 55, 59, 64]);
});

test('Do mayor: la 6.ª no suena y los dedos se colocan del 1 al 3', () => {
  const c = postureFromDiagram(chordDiagram('C'));
  assert.deepEqual(c.muted, [0]);
  assert.deepEqual(c.dots.map((d) => d.finger), [1, 2, 3]);
  assert.deepEqual(c.steps.map((s) => s.kind), ['finger', 'finger', 'finger', 'open', 'mute']);
  assert.deepEqual(soundingOf(c, OPEN), [1, 2, 3, 4, 5]);
  assert.deepEqual(notesOfPosture(c, OPEN), [null, 48, 52, 55, 60, 64]);
});

test('con cejilla, la cejilla es el primer paso y sus cuerdas suenan en su traste', () => {
  const f: GridDiagram = diagramOf('bar-f7');
  const p = postureFromDiagram(f);
  assert.equal(p.steps[0].kind, 'barre');
  assert.equal(stepOfBarre(p), 0);
  // Ningún dedo 1 suelto: está en la cejilla.
  assert.ok(p.dots.every((d) => d.finger !== 1));
  const notes = notesOfPosture(p, OPEN);
  assert.equal(notes[0], 40 + f.barre!.fret);
  // La misma regla de «qué suena» que el cartoon del acorde.
  assert.deepEqual(soundingOf(p, OPEN), soundingFromDiagram(f));
  for (const id of ['Em', 'C', 'G', 'D', 'Am', 'E7'] as const) {
    const d = chordDiagram(id);
    assert.deepEqual(soundingOf(postureFromDiagram(d), OPEN), soundingFromDiagram(d), id);
  }
});

test('la araña: un dedo por traste, colocación en orden y escucha de ida y vuelta', () => {
  const s = spiderPosture(0);
  assert.deepEqual(s.dots.map((d) => [d.fret, d.finger]), [[1, 1], [2, 2], [3, 3], [4, 4]]);
  assert.deepEqual([0, 1, 2, 3].map((k) => stepOfDot(s, k)), [0, 1, 2, 3]);
  const plan = listenPlan(s, OPEN);
  assert.deepEqual(plan.events.map((e) => e.notes[0].midi), [41, 42, 43, 44, 43, 42, 41]);
  assert.deepEqual(plan.events.map((e) => e.dot), [0, 1, 2, 3, 2, 1, 0]);
});

test('escuchar un acorde: cuerda por cuerda de la grave a la aguda y después el rasgueo', () => {
  const c = postureFromDiagram(chordDiagram('C'));
  const { events, totalMs } = listenPlan(c, OPEN);
  const arp = events.slice(0, -1);
  assert.deepEqual(arp.map((e) => e.strings[0]), [1, 2, 3, 4, 5]);
  assert.deepEqual(arp.map((e) => e.atMs), [0, 1, 2, 3, 4].map((k) => k * ARP_MS));
  // En el arpegio se resalta el dedo de esa cuerda (o ninguno si está al aire).
  assert.deepEqual(arp.map((e) => e.dot), [2, 1, -1, 0, -1]);
  const strum = events[events.length - 1];
  assert.deepEqual(strum.strings, [1, 2, 3, 4, 5]);
  assert.deepEqual(strum.notes.map((n) => n.offsetMs), [0, 1, 2, 3, 4].map((k) => k * STRUM_GAP_MS));
  assert.ok(totalMs > strum.atMs);
});

test('el pulgar: detrás del dedo 2, o en medio si no hay dedo 2', () => {
  assert.equal(thumbFretOf([{ string: 1, fret: 3, finger: 3 }, { string: 4, fret: 1, finger: 1 }], undefined, 1), 2);
  assert.equal(thumbFretOf([], { fret: 5, from: 0, to: 5 }, 5), 5);
  assert.equal(thumbFretOf([], undefined, 1), 2);
});

test('lecciones de criolla: cada lección de acorde trae su tarjeta de manos, y las de postura sus guías', async () => {
  const { NYLON_LESSONS } = await import('../src/content/nylon/lessons');
  const cards = Object.values(NYLON_LESSONS).flatMap((l) => l.cards.map((c) => ({ id: l.id, c })));
  const chords = cards.filter((x) => x.c.hands?.kind === 'chord');
  assert.ok(chords.length >= 20, `tarjetas de acorde: ${chords.length}`);
  for (const { id, c } of chords) {
    const h = c.hands;
    const p = h && h.kind !== 'guide' ? h.posture : null;
    assert.ok(p && (p.dots.length > 0 || p.barre), `${id}: sin dedos`);
    // Cada dedo en un traste dentro de la ventana dibujada.
    for (const d of p!.dots) assert.ok(d.fret >= p!.first && d.fret < p!.first + p!.count, `${id}: traste ${d.fret}`);
  }
  assert.ok(cards.some((x) => x.id === '1.2.3' && x.c.hands?.kind === 'guide'));
  assert.ok(cards.some((x) => x.id === '1.2.2' && x.c.hands?.kind === 'guide'));
  assert.ok(cards.some((x) => x.id === '1.4.2' && x.c.hands?.kind === 'spider'));
});

test('los textos de la tarjeta de manos existen en los 3 idiomas', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync('src/components/HandsCard.tsx', 'utf8');
  const used = [...new Set([...src.matchAll(/'(ui\.hands\.[A-Za-z.]+)'/g)].map((m) => m[1]))];
  const keys = [...used, ...[1, 2, 3, 4].map((f) => `ui.hands.finger.${f}`), ...['p', 'i', 'm', 'a'].map((r) => `ui.hands.guide.role.${r}`)];
  assert.ok(used.length > 15);
  for (const lang of ['es', 'en', 'pt']) {
    const tree = JSON.parse(readFileSync(`src/i18n/locales/${lang}.json`, 'utf8'));
    for (const k of keys) {
      const v = k.split('.').reduce<unknown>((o, p) => (o as Record<string, unknown> | undefined)?.[p], tree);
      assert.equal(typeof v, 'string', `${lang}: ${k}`);
    }
  }
});
