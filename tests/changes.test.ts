import { test } from 'node:test';
import assert from 'node:assert/strict';
import es from '../src/i18n/locales/es.json';
import en from '../src/i18n/locales/en.json';
import pt from '../src/i18n/locales/pt.json';
import {
  BASS_PAIRS,
  GUITAR_PAIRS,
  HISTORY_MAX,
  MIN_GAP_MS,
  anchorsOf,
  bestOf,
  changesFeedback,
  countNoteChanges,
  countStrumChanges,
  nextGoal,
  pairById,
  pushScore,
  shapeShift,
  suggestedPair,
} from '../src/music/changes';
import { shapeOf } from '../src/music/chords';
import { BASS } from '../src/instruments/profiles';

test('rasgueos: el primero es el acorde de partida; los rebotes no cuentan', () => {
  assert.equal(countStrumChanges([]), 0);
  assert.equal(countStrumChanges([1000]), 0);
  assert.equal(countStrumChanges([1000, 2000, 3000]), 2);
  // Un rebote a 100 ms del golpe es el mismo rasgueo.
  assert.equal(countStrumChanges([1000, 1100, 2000, 2000 + MIN_GAP_MS - 1, 3000]), 2);
  // Desordenados (llegan del puente nativo) dan lo mismo.
  assert.equal(countStrumChanges([3000, 1000, 2000]), 2);
});

test('notas del bajo: solo cuenta llegar a la otra nota del par', () => {
  // Sol (4.ª cuerda, traste 3) = 28 + 3; Do (3.ª, traste 3) = 33 + 3.
  const [g, c] = [31, 36];
  assert.equal(countNoteChanges([g, c, g, c], g, c), 3);
  // Repetir la misma nota o tocar otra no suma.
  assert.equal(countNoteChanges([g, g, 40, c, c, 41, g], g, c), 2);
  assert.equal(countNoteChanges([40, 41], g, c), 0);
});

test('historial, récord y meta', () => {
  let h: number[] = [];
  for (let i = 0; i < HISTORY_MAX + 3; i++) h = pushScore(h, i);
  assert.equal(h.length, HISTORY_MAX);
  assert.equal(h[h.length - 1], HISTORY_MAX + 2);
  assert.equal(bestOf(undefined), 0);
  assert.equal(bestOf([12, 30, 25]), 30);
  assert.equal(nextGoal(0), 10);
  assert.equal(nextGoal(12), 15);
  assert.equal(nextGoal(15), 20);
  assert.equal(nextGoal(58), 60);
});

test('par sugerido: el primero que no llega a 30', () => {
  assert.equal(suggestedPair(GUITAR_PAIRS, {})?.id, GUITAR_PAIRS[0].id);
  assert.equal(suggestedPair(GUITAR_PAIRS, { [GUITAR_PAIRS[0].id]: [31] })?.id, GUITAR_PAIRS[1].id);
  const all = Object.fromEntries(GUITAR_PAIRS.map((p) => [p.id, [40]]));
  assert.equal(suggestedPair(GUITAR_PAIRS, all)?.id, GUITAR_PAIRS[0].id);
});

test('dedo guía: La→Re desliza el 3 en la 2.ª; Do→Lam deja quietos el 1 y el 2', () => {
  assert.deepEqual(anchorsOf(shapeOf('A'), shapeOf('D')), [{ finger: 3, kind: 'slide', string: 2 }]);
  const stays = anchorsOf(shapeOf('C'), shapeOf('Am')).filter((a) => a.kind === 'stay').map((a) => a.finger).sort();
  assert.deepEqual(stays, [1, 2]);
});

test('bloque: Mim→Lam corre 2 y 3 una cuerda hacia las agudas; La→Mi, dos hacia las graves', () => {
  assert.deepEqual(shapeShift(shapeOf('Em'), shapeOf('Am')), { fingers: [2, 3], strings: 1, toward: 'treble' });
  assert.deepEqual(shapeShift(shapeOf('A'), shapeOf('E')), { fingers: [2, 3], strings: 2, toward: 'bass' });
  assert.equal(shapeShift(shapeOf('G'), shapeOf('D')), null);
});

test('devolución: titular según el récord y consejos que existen en los 3 idiomas', () => {
  const lookup = (dict: unknown, key: string): unknown => key.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], dict);
  for (const pair of [...GUITAR_PAIRS, ...BASS_PAIRS]) {
    for (const [count, best, had] of [[10, 0, false], [25, 20, true], [19, 20, true], [50, 60, true]] as const) {
      const fb = changesFeedback(pair, count, best, had);
      assert.ok(fb.tips.length >= 1 && fb.tips.length <= 3, pair.id);
      for (const dict of [es, en, pt]) {
        // Los textos con cantidad tienen singular y plural (i18next, `count`).
        const forms = (base: string, plural: boolean) => (plural ? [`${base}_one`, `${base}_other`] : [base]);
        for (const key of forms(`ui.changes.result.${fb.headline}`, fb.headline === 'first')) assert.equal(typeof lookup(dict, key), 'string', key);
        for (const tip of fb.tips) {
          for (const key of forms(`ui.changes.tip.${tip.key}`, tip.key.startsWith('shapeShift'))) assert.equal(typeof lookup(dict, key), 'string', `${pair.id} ${key}`);
        }
      }
    }
  }
  assert.equal(changesFeedback(GUITAR_PAIRS[0], 10, 0, false).headline, 'first');
  assert.equal(changesFeedback(GUITAR_PAIRS[0], 25, 20, true).headline, 'record');
  assert.equal(changesFeedback(GUITAR_PAIRS[0], 19, 20, true).headline, 'close');
  assert.equal(changesFeedback(GUITAR_PAIRS[0], 10, 20, true).headline, 'below');
});

test('pares: ids únicos y válidos en la URL; las notas del bajo existen y caen en el rango del curso', () => {
  for (const [instrument, pairs] of [['guitar', GUITAR_PAIRS], ['bass', BASS_PAIRS]] as const) {
    const ids = pairs.map((p) => p.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const p of pairs) {
      assert.match(p.id, /^[A-Za-z0-9-]+$/);
      assert.equal(pairById(instrument, p.id), p);
    }
  }
  for (const p of BASS_PAIRS) {
    assert.equal(p.kind, 'notes');
    if (p.kind !== 'notes') continue;
    for (const n of [p.a, p.b]) {
      assert.ok(BASS.strings.some((s) => s.id === n.string));
      assert.ok(n.fret >= 0 && n.fret <= 7);
    }
    // Las dos notas son distintas (si no, no hay cambio que contar).
    const midi = (n: typeof p.a) => BASS.strings.find((s) => s.id === n.string)!.openMidi + n.fret;
    assert.notEqual(midi(p.a), midi(p.b), p.id);
  }
});
