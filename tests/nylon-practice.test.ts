import { test } from 'node:test';
import assert from 'node:assert/strict';
import es from '../src/i18n/locales/es.json';
import en from '../src/i18n/locales/en.json';
import pt from '../src/i18n/locales/pt.json';
import { NYLON, midiOn, type StringId } from '../src/instruments/profiles';
import { chordFromName } from '../src/music/chords';
import { barBeatsOfStyle } from '../src/music/drums';
import { barsAreComplete } from '../src/music/tab';
import { NYLON_LEVELS } from '../src/content/nylon/curriculum';
import { NYLON_LESSONS } from '../src/content/nylon/lessons';
import { NYLON_DRILLS, NYLON_LESSON_DRILLS, NYLON_REVIEW_DRILLS, asQuarters, chordName, harmonize, styleFor } from '../src/content/nylon/practice';
import { albumMidi } from '../src/content/nylon/helpers';
import { DRILL_CATEGORIES, drillState } from '../src/content/practice';
import { ZAMBA } from '../src/music/strum';
import type { ScoreEvent } from '../src/content/types';

const n = (string: StringId, fret: number, beats: 0.5 | 1 | 2 | 4 = 1): ScoreEvent => ({ string, fret, beats });
const pc = (e: ScoreEvent) => ('rest' in e ? -1 : midiOn(NYLON, e.string as StringId, e.fret) % 12);

test('práctica de criolla: un ejercicio por lección, más repasos de los niveles 1 a 4', () => {
  const lessons = Object.keys(NYLON_LESSONS);
  assert.equal(NYLON_LESSON_DRILLS.length, lessons.length);
  for (const id of lessons) assert.ok(NYLON_LESSON_DRILLS.some((d) => d.lessonId === id), `sin ejercicio: ${id}`);
  assert.equal(new Set(NYLON_DRILLS.map((d) => d.id)).size, NYLON_DRILLS.length, 'ids únicos');
  assert.deepEqual([...new Set(NYLON_REVIEW_DRILLS.map((d) => d.level))], [1, 2, 3, 4]);
  // Todas las categorías, salvo los riffs (que en la criolla son las canciones), tienen ejercicios.
  for (const c of DRILL_CATEGORIES.filter((x) => x !== 'riffs')) assert.ok(NYLON_DRILLS.some((d) => d.category === c), c);
});

test('práctica de criolla: cada ejercicio es tocable con la banda', () => {
  const modules = NYLON_LEVELS.flatMap((l) => l.modules.map((m) => m.id));
  for (const d of NYLON_DRILLS) {
    for (const m of d.requires) assert.ok(modules.includes(m), `${d.id}: módulo ${m}`);
    assert.equal(d.level, Math.max(...d.requires.map((m) => Number(m.split('.')[0]))), `${d.id}: nivel`);
    assert.ok(d.tempoSteps.every((b, i) => i === 0 || b > d.tempoSteps[i - 1]), `${d.id}: tempos`);
    for (const c of d.chords) assert.ok(chordFromName(c), `${d.id}: acorde ${c}`);
    assert.ok(d.parts.length > 0 && !d.parts.includes('guitar'), `${d.id}: la banda no suma otra guitarra`);
    if (d.kind === 'line') {
      const bar = barBeatsOfStyle(d.style);
      const line = d.line!;
      assert.ok(barsAreComplete(line, bar), `${d.id}: compases de ${bar}`);
      assert.equal(line.reduce((a, e) => a + e.beats, 0), d.chords.length * bar, `${d.id}: un acorde por compás`);
      if (line.some((e) => e.beats < 1)) assert.ok(d.tempoSteps[0] <= 80, `${d.id}: corcheas a ${d.tempoSteps[0]}`);
      for (const e of line) {
        if ('rest' in e) continue;
        assert.ok(Number.isFinite(midiOn(NYLON, e.string as StringId, e.fret)) && e.fret <= NYLON.frets, `${d.id}: ${e.string}${e.fret}`);
      }
      // Sobre los acordes de un rasgueo, cada compás empieza en una nota del acorde.
      if (d.category === 'arpeggios') {
        let t = 0;
        for (const e of line) {
          if (t % bar === 0 && !('rest' in e)) {
            const chord = d.chords[t / bar];
            assert.ok(new Set(chordFromName(chord)!.map((m) => m % 12)).has(pc(e)), `${d.id}: compás ${t / bar + 1} fuera de ${chord}`);
          }
          t += e.beats;
        }
      }
    } else {
      assert.ok(d.scale && d.scale.length >= 5 && d.minNotes && d.minNotes > 0, d.id);
      assert.ok(d.tempoSteps[0] >= 70, `${d.id}: la pista no va demasiado lenta para improvisar`);
    }
  }
});

test('práctica de criolla: la banda acompaña las líneas sin cifrado con acordes que calzan', () => {
  // Arpegio de Do y de Sol: C y G.
  assert.deepEqual(harmonize([n('A', 3), n('D', 2), n('G', 0), n('B', 1), n('E', 3), n('A', 2), n('D', 0), n('G', 0)]), ['C', 'G']);
  // Un compás cromático (1-2-3-4) no cambia el acorde: la banda sostiene el anterior.
  assert.deepEqual(harmonize([n('A', 0), n('D', 2), n('G', 2), n('B', 1), n('E', 1), n('E', 2), n('E', 3), n('E', 4)]), ['Am', 'Am']);
  // En los niveles 1 y 2, cuando la banda arma la armonía (escalas, lectura, técnica), no usa cuatríadas de color.
  for (const d of NYLON_LESSON_DRILLS.filter((x) => x.level <= 2 && ['scales', 'reading', 'technique'].includes(x.category))) {
    for (const c of d.chords) assert.ok(!/maj7|m7/.test(c), `${d.id}: ${c}`);
  }
  // Negras: la última nota se estira para cerrar el compás, con duraciones válidas.
  const q = asQuarters([{ string: 'E', fret: 0 }, { string: 'A', fret: 0 }, { string: 'D', fret: 0 }, { string: 'G', fret: 0 }, { string: 'B', fret: 0 }, { string: 'e', fret: 0 }]);
  assert.ok(barsAreComplete(q));
  assert.equal(q.reduce((a, e) => a + e.beats, 0), 8);
  // Las pistas de improvisación guardan notas: se recupera el nombre del acorde.
  assert.equal(chordName(albumMidi('A7')), 'A7');
  assert.equal(chordName(albumMidi('Gmaj7')), 'Gmaj7');
  // El estilo sale del patrón, el compás o el módulo.
  assert.equal(styleFor('3.7', ZAMBA, 3), 'zamba');
  assert.equal(styleFor('2.7', undefined, 4, ['A7', 'A7', 'D7', 'A7']), 'shuffle');
  assert.equal(styleFor('4.3'), 'bossa');
});

test('práctica de criolla: se abre al terminar la lección, sin esperar al módulo', () => {
  const d = NYLON_LESSON_DRILLS.find((x) => x.lessonId === '3.7.2')!;
  const all = () => true;
  assert.equal(drillState(d, new Set(), new Set(), all), 'locked');
  assert.equal(drillState(d, new Set(['3.7.2']), new Set(), all), 'open');
  assert.equal(drillState(d, new Set(['3.7.2']), new Set(), () => false), 'premium');
  // (El nivel saltado con el checkpoint se prueba en practice.test.ts: las pruebas corren con el currículo del bajo.)
});

test('práctica de criolla: títulos, descripciones y textos nuevos en los 3 idiomas', () => {
  for (const [lang, tree] of Object.entries({ es, en, pt })) {
    const get = (key: string) => key.split('.').reduce<unknown>((o, p) => (o as Record<string, unknown> | undefined)?.[p], tree);
    for (const d of NYLON_DRILLS) {
      assert.equal(typeof get(d.titleKey), 'string', `${lang}: ${d.titleKey}`);
      assert.equal(typeof get(d.descKey), 'string', `${lang}: ${d.descKey}`);
    }
    for (const k of ['ui.drills.allLevels', 'ui.drills.level', 'ui.drills.lessonMeta', 'ui.drills.needsLesson', 'ui.lesson.practiceDrill']) assert.equal(typeof get(k), 'string', `${lang}: ${k}`);
  }
});
