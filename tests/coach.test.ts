import { test } from 'node:test';
import assert from 'node:assert/strict';
import en from '../src/i18n/locales/en.json';
import es from '../src/i18n/locales/es.json';
import pt from '../src/i18n/locales/pt.json';
import { coach, improvExample, MAX_TIPS, type CoachInput } from '../src/music/coach';
import { BASS, GUITAR, midiOn } from '../src/instruments/profiles';
import { DRILL_CATEGORIES, BASS_DRILLS, GUITAR_DRILLS } from '../src/content/practice';
import { totalBeats } from '../src/music/staff';

const counts = (c: Partial<CoachInput['counts']>) => ({ hit: 0, early: 0, late: 0, wrong: 0, miss: 0, ...c });
const base = (over: Partial<CoachInput> = {}): CoachInput => ({
  category: 'riffs',
  stars: 2,
  accuracy: 0.85,
  counts: counts({ hit: 17, miss: 3 }),
  meanOffset: 5,
  bpm: 80,
  tempos: [65, 80, 90, 100],
  ...over,
});
const keys = (input: CoachInput) => coach(input).tips.map((t) => t.key.replace('ui.drills.coach.', ''));

test('coach: el titular sigue a las estrellas', () => {
  for (const stars of [0, 1, 2, 3]) assert.equal(coach(base({ stars })).headline, `ui.drills.coach.headline.${stars}`);
});

test('coach: siempre termina con el consejo de la categoría y no pasa de 3', () => {
  for (const category of DRILL_CATEGORIES) {
    const c = coach(base({ category, stars: 0, accuracy: 0.3, meanOffset: -60, counts: counts({ hit: 3, wrong: 4, miss: 5 }) }));
    assert.ok(c.tips.length <= MAX_TIPS);
    assert.equal(c.tips[c.tips.length - 1].key, `ui.drills.coach.cat.${category}`);
  }
});

test('coach: muchas notas perdidas va primero, con la cantidad', () => {
  const c = coach(base({ counts: counts({ hit: 10, miss: 6 }) }));
  assert.deepEqual(c.tips[0], { key: 'ui.drills.coach.misses', params: { n: 6 } });
});

test('coach: notas equivocadas', () => {
  assert.deepEqual(keys(base({ counts: counts({ hit: 16, wrong: 4 }) })).slice(0, 1), ['wrong']);
});

test('coach: adelantarse, atrasarse o ir y venir', () => {
  assert.equal(keys(base({ counts: counts({ hit: 20 }), meanOffset: -40 }))[0], 'rushing');
  assert.equal(keys(base({ counts: counts({ hit: 20 }), meanOffset: 40 }))[0], 'dragging');
  assert.equal(keys(base({ counts: counts({ hit: 10, early: 5, late: 5 }), meanOffset: 0 }))[0], 'unsteady');
});

test('coach: con poca precisión propone el tempo lento, salvo que ya esté en él', () => {
  const slow = coach(base({ accuracy: 0.4, counts: counts({ hit: 20 }) })).tips.find((t) => t.key.endsWith('slower'));
  assert.deepEqual(slow?.params, { bpm: 65 });
  assert.ok(!keys(base({ accuracy: 0.4, bpm: 65, counts: counts({ hit: 20 }) })).includes('slower'));
});

test('coach: 3 estrellas → subir de tempo o, en el más rápido, cambiar la banda', () => {
  assert.deepEqual(coach(base({ stars: 3, accuracy: 1, counts: counts({ hit: 20 }), unlocked: 90 })).tips[0], { key: 'ui.drills.coach.faster', params: { bpm: 90 } });
  assert.equal(keys(base({ stars: 3, accuracy: 1, counts: counts({ hit: 20 }), bpm: 100 }))[0], 'mastered');
});

test('coach: improvisación — pocas notas, fuera de la escala, o apuntar a la tónica', () => {
  const imp = (notes: number, inScale: number) => keys(base({ category: 'improv', counts: counts({}), meanOffset: null, improv: { notes, inScale, required: 16 } }));
  assert.deepEqual(imp(6, 0.9).slice(0, 1), ['improvFew']);
  assert.deepEqual(imp(20, 0.5).slice(0, 1), ['improvOutside']);
  assert.deepEqual(imp(20, 0.95).slice(0, 1), ['improvTarget']);
});

test('coach: sin micrófono, solo el consejo de la categoría', () => {
  const c = coach(base({ unscored: true }));
  assert.equal(c.headline, 'ui.drills.coach.unscored');
  assert.deepEqual(c.tips, [{ key: 'ui.drills.coach.cat.riffs' }]);
});

type Dict = { [k: string]: string | Dict };
const lookup = (d: Dict, key: string) => key.split('.').reduce<string | Dict | undefined>((o, k) => (o && typeof o === 'object' ? o[k] : undefined), d);

test('coach: todas las claves que puede devolver existen en los 3 idiomas', () => {
  const inputs: CoachInput[] = [];
  for (const category of DRILL_CATEGORIES) {
    for (const stars of [0, 1, 2, 3]) {
      inputs.push(base({ category, stars, accuracy: 0.3, meanOffset: -50, counts: counts({ hit: 2, early: 3, wrong: 4, miss: 5 }) }));
      inputs.push(base({ category, stars, meanOffset: 50, unlocked: stars === 3 ? 90 : undefined }));
      inputs.push(base({ category, stars, bpm: 100, counts: counts({ hit: 10, early: 5, late: 5 }), meanOffset: 0 }));
      inputs.push(base({ category, stars, improv: { notes: 3, inScale: 0.4, required: 16 } }));
      inputs.push(base({ category, stars, improv: { notes: 20, inScale: 1, required: 16 } }));
    }
    inputs.push(base({ category, unscored: true }));
  }
  for (const dict of [es, en, pt] as unknown as Dict[]) {
    for (const input of inputs) {
      const c = coach(input);
      for (const key of [c.headline, ...c.tips.map((t) => t.key)]) assert.equal(typeof lookup(dict, key), 'string', key);
    }
    for (const category of DRILL_CATEGORIES) assert.equal(typeof lookup(dict, `ui.drills.howTo.cat.${category}`), 'string', category);
  }
});

test('improvExample: la pentatónica de La en el bajo, de la tónica y de vuelta, en dos compases', () => {
  const ev = improvExample([9, 0, 2, 4, 7], BASS.strings);
  const midis = ev.map((e) => ('rest' in e ? -1 : midiOn(BASS, e.string, e.fret)));
  assert.deepEqual(midis, [33, 36, 38, 40, 38, 36, 33]);
  assert.equal(totalBeats(ev), 8);
  for (const e of ev) if (!('rest' in e)) assert.ok(e.fret >= 0 && e.fret <= 4);
});

test('improvExample: cada ejercicio de improvisación tiene ejemplo, solo con notas de su escala', () => {
  for (const [profile, drills] of [[BASS, BASS_DRILLS], [GUITAR, GUITAR_DRILLS]] as const) {
    for (const d of drills.filter((x) => x.kind === 'improv')) {
      const ev = improvExample(d.scale ?? [], profile.strings);
      assert.ok(ev.length >= 5, d.id);
      const pcs = new Set((d.scale ?? []).map((p) => p % 12));
      for (const e of ev) if (!('rest' in e)) assert.ok(pcs.has(midiOn(profile, e.string, e.fret) % 12), d.id);
    }
  }
});
