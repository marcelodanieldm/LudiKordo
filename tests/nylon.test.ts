import { test } from 'node:test';
import assert from 'node:assert/strict';
import en from '../src/i18n/locales/en.json';
import es from '../src/i18n/locales/es.json';
import pt from '../src/i18n/locales/pt.json';
import { NYLON_LEVELS } from '../src/content/nylon/curriculum';
import { FIRST_ARPEGGIO, FOUR_FINGERS, NYLON_LESSONS, THUMB_BASSES } from '../src/content/nylon/lessons';
import { lessonIdsOf } from '../src/content/curriculum';
import { BASS, GUITAR, NYLON, isSixString, midiOn, resolveInstrument } from '../src/instruments/profiles';
import { LEGEND_COUNT, RATIO, isGuitarFigure } from '../src/components/guitarFigureMeta';
import { withInstrumentTexts } from '../src/i18n/overlay';
import { VOICES, peakGain, voiceFor } from '../src/music/timbre';
import { midiToFreq } from '../src/music/notes';
import type { ListenExample, ScoreEvent } from '../src/content/types';
import { CP1_MELODY, CP1_TAB, EIGHTHS, FULL_SPIDER, NYLON_CP1, SIGHT_TAB, STOP_NOTES } from '../src/content/nylon/level1';

type Tree = { [k: string]: string | Tree };
const locales = { en, es, pt } as unknown as Record<string, Tree>;

function lookup(obj: Tree, path: string): string | undefined {
  let cur: string | Tree | undefined = obj;
  for (const part of path.split('.')) {
    if (typeof cur !== 'object' || cur === null) return undefined;
    cur = cur[part];
  }
  return typeof cur === 'string' ? cur : undefined;
}

const lessons = Object.values(NYLON_LESSONS);
const isNote = (e: ScoreEvent): e is Extract<ScoreEvent, { string: unknown }> => !('rest' in e);
const nylonStrings = new Set(NYLON.strings.map((s) => s.id));

test('la criolla tiene la afinación de la guitarra, sin ampli y tocada con los dedos', () => {
  assert.deepEqual(NYLON.strings.map((s) => s.openMidi), [40, 45, 50, 55, 59, 64]);
  assert.deepEqual(NYLON.strings, GUITAR.strings);
  assert.equal(NYLON.amplified, false);
  assert.deepEqual(NYLON.scoredTones, ['clean']);
  assert.ok(NYLON.techniques.includes('fingerstyle'));
  assert.ok(!NYLON.techniques.includes('pick') && !NYLON.techniques.includes('bending'));
  // El traste 19 de la 1.ª (Si 5) entra en el rango del detector.
  assert.ok(midiToFreq(midiOn(NYLON, 'e', NYLON.frets)) < NYLON.pitchRangeHz.max);
  assert.ok(midiToFreq(NYLON.strings[0].openMidi) > NYLON.pitchRangeHz.min);
});

test('la variante de build elige la criolla con «nylon»; cualquier otro valor sigue siendo bajo', () => {
  assert.equal(resolveInstrument('nylon'), NYLON);
  assert.equal(resolveInstrument('guitar'), GUITAR);
  assert.equal(resolveInstrument(undefined), BASS);
  assert.equal(resolveInstrument('classical'), BASS);
  assert.ok(isSixString(NYLON) && isSixString(GUITAR) && !isSixString(BASS));
});

test('ruta de criolla: 5 niveles, 31 módulos, 151 lecciones en 60 semanas seguidas', () => {
  assert.equal(NYLON_LEVELS.length, 5);
  const modules = NYLON_LEVELS.flatMap((l) => l.modules);
  assert.equal(modules.length, 31);
  assert.equal(modules.reduce((a, m) => a + m.lessonCount, 0), 151);
  assert.equal(new Set(modules.map((m) => m.id)).size, modules.length);
  for (const level of NYLON_LEVELS) assert.ok(level.modules.every((m) => m.id.startsWith(`${level.id}.`)), `nivel ${level.id}`);
  assert.equal(NYLON_LEVELS[0].weeks[0], 1);
  assert.equal(NYLON_LEVELS[4].weeks[1], 60);
  for (let i = 1; i < NYLON_LEVELS.length; i++) assert.equal(NYLON_LEVELS[i].weeks[0], NYLON_LEVELS[i - 1].weeks[1] + 1);
});

test('el nivel 1 está completo (25 lecciones) y toda lección está en la ruta', () => {
  const route = new Set(NYLON_LEVELS.flatMap((l) => l.modules.flatMap(lessonIdsOf)));
  assert.equal(NYLON_LEVELS[0].modules.reduce((a, m) => a + m.lessonCount, 0), 25);
  for (const mod of NYLON_LEVELS[0].modules) {
    for (const id of lessonIdsOf(mod)) assert.ok(NYLON_LESSONS[id], `falta la lección ${id}`);
  }
  for (const id of Object.keys(NYLON_LESSONS)) assert.ok(route.has(id), `${id} no está en la ruta`);
});

test('cada clave de la ruta, las lecciones y las figuras de criolla existe en los 3 idiomas', () => {
  const used = new Set<string>();
  for (const l of NYLON_LEVELS) {
    used.add(l.titleKey);
    used.add(l.checkpointKey);
    for (const m of l.modules) [m.titleKey, m.goalKey, m.starExerciseKey].forEach((k) => used.add(k));
  }
  for (const lesson of lessons) {
    [lesson.titleKey, lesson.objectiveKey, ...lesson.cartoon.sceneKeys].forEach((k) => used.add(k));
    const figs = [...lesson.cards.map((c) => c.figure), ...(lesson.cartoon.visuals ?? [])].filter((f): f is NonNullable<typeof f> => Boolean(f));
    for (const f of figs) {
      assert.ok(isGuitarFigure(f), `${lesson.id}: la figura ${f} no se dibuja en la app de guitarra`);
      const base = `ui.gfig.${f.replace(/-/g, '_')}`;
      used.add(`${base}.a11y`);
      for (let i = 1; i <= (LEGEND_COUNT[f] ?? 0); i++) used.add(`${base}.l${i}`);
    }
    for (const c of lesson.cards) [c.titleKey, c.bodyKey].forEach((k) => used.add(k));
    for (const ex of lesson.exercises) {
      used.add(ex.promptKey);
      if ('options' in ex) ex.options.filter((o) => !o.startsWith('=')).forEach((o) => used.add(o));
    }
  }
  used.add(NYLON_CP1.titleKey);
  used.add(NYLON_CP1.introKey);
  for (const ex of NYLON_CP1.parts) {
    used.add(ex.promptKey);
    if ('options' in ex) ex.options.filter((o) => !o.startsWith('=')).forEach((o) => used.add(o));
  }
  for (const [code, tree] of Object.entries(locales)) {
    for (const k of used) assert.ok(lookup(tree, k), `${code}: falta ${k}`);
  }
});

test('las lecciones de criolla tienen 4 escenas, respuestas válidas y solo cuerdas de guitarra', () => {
  const check = (s: string, where: string) => assert.ok(nylonStrings.has(s as never), `${where}: cuerda «${s}»`);
  for (const lesson of lessons) {
    assert.equal(lesson.cartoon.sceneKeys.length, 4, lesson.id);
    assert.equal(lesson.cartoon.visuals?.length, 4, `${lesson.id}: visuals`);
    assert.equal(lesson.cartoon.sounds?.length, 4, `${lesson.id}: sounds`);
    assert.ok(lesson.mastery > 0 && lesson.mastery <= 1, lesson.id);
    assert.ok(lesson.exercises.some((e) => e.needsBass), `${lesson.id}: al menos un ejercicio con la guitarra`);
    assert.equal(new Set(lesson.exercises.map((e) => e.id)).size, lesson.exercises.length, `${lesson.id}: ids repetidos`);
    for (const ex of lesson.exercises) {
      assert.ok(ex.id.startsWith(`${lesson.id}-`), ex.id);
      if (ex.kind === 'quiz' || ex.kind === 'ear') {
        assert.ok(ex.correctIndex >= 0 && ex.correctIndex < ex.options.length, ex.id);
        if (ex.timbres) assert.equal(ex.timbres.length, ex.tones?.length, `${ex.id}: un timbre por tono`);
      }
      if (ex.kind === 'playAlong') {
        ex.notes.forEach((n) => {
          check(n.string, ex.id);
          assert.ok(n.fret >= 0 && n.fret <= NYLON.frets, ex.id);
        });
        if (ex.bpm !== null) assert.ok(ex.bpm <= 80, `${ex.id}: empieza a 80 bpm o menos`);
        if (ex.score) {
          assert.deepEqual(ex.score.filter(isNote).map((e) => [e.string, e.fret]), ex.notes.map((x) => [x.string, x.fret]), `${ex.id}: notes = score sin silencios`);
          assert.equal(ex.score.reduce((a, e) => a + e.beats, 0) % 4, 0, `${ex.id}: compases completos`);
        }
      }
      if (ex.kind === 'tabReading') {
        assert.equal(ex.notes.reduce((a, x) => a + x.beats, 0) % 4, 0, `${ex.id}: compases completos`);
        ex.notes.forEach((x) => check(x.string, ex.id));
      }
      if (ex.kind === 'fretboardTap') ex.sequence.forEach((n) => check(n.string, ex.id));
    }
    const examples = [...lesson.cards.map((c) => c.listen), ...(lesson.cartoon.sounds ?? [])].filter((x): x is ListenExample => x != null);
    for (const ex of examples) ex.events.filter(isNote).forEach((n) => check(n.string, `${lesson.id} ejemplo`));
  }
});

test('el primer arpegio: 4 compases, pulgar en una grave y luego 3.ª, 2.ª y 1.ª, todo al aire', () => {
  assert.equal(FIRST_ARPEGGIO.reduce((a, e) => a + e.beats, 0), 16);
  const notes = FIRST_ARPEGGIO.filter(isNote);
  assert.ok(notes.every((e) => e.fret === 0));
  for (let bar = 0; bar < 3; bar++) {
    const group = notes.slice(bar * 4, bar * 4 + 4).map((e) => e.string);
    assert.ok(['E', 'A', 'D'].includes(group[0]), `compás ${bar + 1}: p en una grave`);
    assert.deepEqual(group.slice(1), ['G', 'B', 'e']);
  }
  for (const score of [THUMB_BASSES, FOUR_FINGERS]) assert.equal(score.reduce((a, e) => a + e.beats, 0) % 4, 0);
  assert.ok(THUMB_BASSES.filter(isNote).every((e) => ['E', 'A', 'D'].includes(e.string)), 'el pulgar solo toca graves');
});

test('textos: en la criolla «guitarra criolla» reemplaza a «guitarra eléctrica»; bajo y eléctrica no cambian', () => {
  const nylon = withInstrumentTexts(es, true, true) as unknown as Tree;
  const guitar = withInstrumentTexts(es, true) as unknown as Tree;
  const bass = withInstrumentTexts(es, false, true) as unknown as Tree;
  assert.equal(lookup(nylon, 'ui.onboarding.appTag'), 'Aprende guitarra criolla desde cero');
  assert.equal(lookup(guitar, 'ui.onboarding.appTag'), 'Aprende guitarra eléctrica desde cero');
  assert.notEqual(lookup(bass, 'ui.onboarding.appTag'), lookup(nylon, 'ui.onboarding.appTag'));
  // Lo que la criolla no redefine sale de la guitarra.
  assert.equal(lookup(nylon, 'ui.lesson.steps.withBass'), 'Con guitarra');
  for (const [code, tree] of Object.entries(locales)) {
    const t = withInstrumentTexts(tree, true, true) as unknown as Tree;
    assert.ok(!/el[ée]tric/i.test(lookup(t, 'ui.onboarding.appTag') ?? ''), `${code}: appTag`);
    assert.ok(!/el[ée]tric/i.test(lookup(t, 'ui.onboarding.hasBass') ?? ''), `${code}: hasBass`);
  }
});

test('timbre de nylon: por defecto en la criolla, pulsado y sin saturar', () => {
  assert.equal(voiceFor(undefined, true, true), VOICES.nylon);
  assert.equal(voiceFor(undefined, true), VOICES.clean);
  assert.equal(voiceFor('crunch', true, true), VOICES.crunch);
  assert.equal(VOICES.nylon.envelope, 'pluck');
  assert.ok(peakGain(VOICES.nylon) > 0 && peakGain(VOICES.nylon) <= 0.6);
});

test('figuras nuevas de criolla: con proporción y leyenda', () => {
  for (const f of ['nylon-parts', 'nylon-posture', 'pima-hand'] as const) {
    assert.ok(isGuitarFigure(f), f);
    assert.ok((RATIO[f] ?? 0) > 0, `${f}: proporción`);
    assert.ok((LEGEND_COUNT[f] ?? 0) > 0, `${f}: leyenda`);
  }
  assert.equal(LEGEND_COUNT['nylon-parts'], 9);
  assert.equal(LEGEND_COUNT['pima-hand'], 4);
});

test('checkpoint 1 de criolla: oído, lectura, pulso a 80, cromático y melodía con corcheas', () => {
  assert.equal(NYLON_CP1.level, 1);
  assert.deepEqual(NYLON_CP1.parts.map((p) => p.kind), ['ear', 'tabReading', 'tempoTrainer', 'playAlong', 'playAlong']);
  const ear = NYLON_CP1.parts[0];
  assert.ok(ear.kind === 'ear' && ear.options[ear.correctIndex] === '=G' && ear.tones?.[1] === midiToFreq(midiOn(NYLON, 'G', 0)));
  const melody = NYLON_CP1.parts[4];
  assert.ok(melody.kind === 'playAlong' && melody.bpm === 80 && melody.score === CP1_MELODY);
  assert.ok(CP1_MELODY.some((e) => e.beats === 0.5) && CP1_MELODY.some((e) => 'rest' in e));
  // La tablatura del checkpoint es nueva (no la de la lectura a primera vista).
  assert.notDeepEqual(CP1_TAB, SIGHT_TAB);
  assert.equal(FULL_SPIDER.length, 48);
});

test('partituras del nivel 1: compases de 4/4 completos', () => {
  for (const [name, score] of Object.entries({ CP1_MELODY, CP1_TAB, EIGHTHS, SIGHT_TAB, STOP_NOTES })) {
    let bar = 0;
    for (const e of score) {
      bar += e.beats;
      assert.ok(bar <= 4, `${name}: una nota cruza la barra de compás`);
      if (bar === 4) bar = 0;
    }
    assert.equal(bar, 0, `${name}: último compás incompleto`);
  }
});
