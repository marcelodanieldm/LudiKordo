import { test } from 'node:test';
import assert from 'node:assert/strict';
import en from '../src/i18n/locales/en.json';
import es from '../src/i18n/locales/es.json';
import pt from '../src/i18n/locales/pt.json';
import { GUITAR_LEVELS } from '../src/content/guitar/curriculum';
import { FIRST_RIFF, GUITAR_LESSONS } from '../src/content/guitar/lessons';
import { lessonIdsOf } from '../src/content/curriculum';
import { GUITAR } from '../src/instruments/profiles';
import { LEGEND_COUNT, isGuitarFigure } from '../src/components/guitarFigureMeta';
import { withInstrumentTexts } from '../src/i18n/overlay';
import { LEGACY_VOICE, VOICES, peakGain, ringSec, voiceFor } from '../src/music/timbre';
import type { Lesson, ScoreEvent } from '../src/content/types';
import { CP1_RIFF, FULL_SPIDER, GUITAR_CP1, SIGHT_RIFF } from '../src/content/guitar/level1';
import { CHORDS, chordMidi, triadPitchClasses, type ChordId } from '../src/music/chords';
import { barsAreComplete, figureOf, isTabRest, layoutTab } from '../src/music/tab';
import { tabOf } from '../src/content/guitar/helpers';

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

function keys(obj: Tree, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => (typeof v === 'string' ? [`${prefix}${k}`] : keys(v, `${prefix}${k}.`)));
}

const lessons = Object.values(GUITAR_LESSONS);
const guitarStrings = new Set(GUITAR.strings.map((s) => s.id));
const isNote = (e: ScoreEvent): e is Extract<ScoreEvent, { string: unknown }> => !('rest' in e);

test('ruta de guitarra: 4 niveles, 28 módulos, 132 lecciones, con el módulo de efectos antes del proyecto final', () => {
  assert.equal(GUITAR_LEVELS.length, 4);
  const modules = GUITAR_LEVELS.flatMap((l) => l.modules);
  assert.equal(modules.length, 28);
  assert.equal(modules.reduce((a, m) => a + m.lessonCount, 0), 132);
  const ids = modules.map((m) => m.id);
  assert.ok(ids.indexOf('4.9') === ids.indexOf('4.10') - 1);
  assert.equal(new Set(ids).size, ids.length);
});

test('el nivel 1 está completo y todas las lecciones existen en la ruta', () => {
  const route = new Set(GUITAR_LEVELS.flatMap((l) => l.modules.flatMap(lessonIdsOf)));
  for (const mod of GUITAR_LEVELS[0].modules) {
    for (const id of lessonIdsOf(mod)) assert.ok(GUITAR_LESSONS[id], `falta la lección ${id}`);
  }
  for (const id of Object.keys(GUITAR_LESSONS)) assert.ok(route.has(id), `${id} no está en la ruta`);
});

test('cada clave de la ruta, las lecciones y las figuras de guitarra existe en los 3 idiomas', () => {
  const used = new Set<string>();
  for (const l of GUITAR_LEVELS) {
    used.add(l.titleKey);
    used.add(l.checkpointKey);
    for (const m of l.modules) [m.titleKey, m.goalKey, m.starExerciseKey].forEach((k) => used.add(k));
  }
  for (const lesson of lessons) {
    [lesson.titleKey, lesson.objectiveKey, ...lesson.cartoon.sceneKeys].forEach((k) => used.add(k));
    for (const c of lesson.cards) {
      used.add(c.titleKey);
      used.add(c.bodyKey);
      const figs = [c.figure, ...(lesson.cartoon.visuals ?? [])].filter((f): f is NonNullable<typeof f> => Boolean(f) && isGuitarFigure(f!));
      for (const f of figs) {
        const base = `ui.gfig.${f.replace(/-/g, '_')}`;
        used.add(`${base}.a11y`);
        for (let i = 1; i <= (LEGEND_COUNT[f] ?? 0); i++) used.add(`${base}.l${i}`);
      }
    }
    for (const ex of lesson.exercises) {
      used.add(ex.promptKey);
      if ('options' in ex) ex.options.filter((o) => !o.startsWith('=')).forEach((o) => used.add(o));
    }
  }
  for (const [code, tree] of Object.entries(locales)) {
    for (const k of used) assert.ok(lookup(tree, k), `${code}: falta ${k}`);
  }
});

test('las lecciones de guitarra usan solo cuerdas de guitarra y respuestas válidas', () => {
  const check = (s: string, where: string) => assert.ok(guitarStrings.has(s as never), `${where}: cuerda «${s}»`);
  for (const lesson of lessons) {
    for (const ex of lesson.exercises) {
      if (ex.kind === 'quiz' || ex.kind === 'ear') {
        assert.ok(ex.correctIndex >= 0 && ex.correctIndex < ex.options.length, ex.id);
        if (ex.timbres) assert.equal(ex.timbres.length, ex.tones?.length, `${ex.id}: un timbre por tono`);
      }
      if (ex.kind === 'playAlong' || ex.kind === 'tabReading') ex.notes.forEach((n) => check(n.string, ex.id));
      if (ex.kind === 'playAlong' && ex.score) {
        const notes = ex.score.filter(isNote);
        assert.deepEqual(notes.map((n) => [n.string, n.fret]), ex.notes.map((n) => [n.string, n.fret]), `${ex.id}: notes = score sin silencios`);
        // Con corcheas, empezar a 80 bpm o menos (límite del detector de ataques).
        if (ex.score.some((e) => e.beats === 0.5)) assert.ok((ex.bpm ?? 0) <= 80, ex.id);
      }
      if (ex.kind === 'tabReading') {
        const beats = ex.notes.reduce((a, n) => a + n.beats, 0);
        assert.equal(beats % 4, 0, `${ex.id}: compases completos`);
      }
    }
    for (const c of lesson.cards) c.listen?.events.filter(isNote).forEach((n) => check(n.string, `${lesson.id} tarjeta`));
  }
});

test('el cartoon de cada lección trae una ilustración y un sonido (o null) por escena', () => {
  for (const lesson of lessons) {
    const n = lesson.cartoon.sceneKeys.length;
    assert.equal(n, 4, lesson.id);
    assert.equal(lesson.cartoon.visuals?.length, n, `${lesson.id}: visuals`);
    assert.equal(lesson.cartoon.sounds?.length, n, `${lesson.id}: sounds`);
    assert.ok((lesson.cartoon.visuals ?? []).some(Boolean), `${lesson.id}: al menos una ilustración`);
  }
  const withSound = lessons.filter((l: Lesson) => (l.cartoon.sounds ?? []).some(Boolean));
  assert.ok(withSound.length >= 8, 'casi todas las lecciones tienen sonido en el cartoon');
});

test('el primer riff son 4 compases de 4/4 en cuerdas al aire', () => {
  assert.equal(FIRST_RIFF.reduce((a, e) => a + e.beats, 0), 16);
  assert.ok(FIRST_RIFF.filter(isNote).every((e) => e.fret === 0));
});

test('textos de guitarra: reemplazan solo claves de ui que ya existen', () => {
  for (const [code, tree] of Object.entries(locales)) {
    const over = (tree.guitar as Tree).ui as Tree;
    for (const k of keys(over)) assert.ok(lookup(tree.ui as Tree, k), `${code}: guitar.ui.${k} no existe en ui`);
  }
  const g = withInstrumentTexts(es, true) as unknown as Tree;
  const b = withInstrumentTexts(es, false) as unknown as Tree;
  assert.equal(lookup(g, 'ui.lesson.steps.withBass'), 'Con guitarra');
  assert.equal(lookup(b, 'ui.lesson.steps.withBass'), 'Con bajo');
  assert.equal(lookup(g, 'ui.lesson.steps.watch'), lookup(b, 'ui.lesson.steps.watch'));
});

test('timbres: el bajo suena como siempre y la guitarra limpia por defecto', () => {
  assert.equal(voiceFor(undefined, false), LEGACY_VOICE);
  assert.equal(voiceFor(undefined, true), VOICES.clean);
  assert.equal(voiceFor('crunch', false), VOICES.crunch);
  // El tono de siempre cae hasta el final de la nota, sin cortarse antes.
  assert.equal(ringSec(LEGACY_VOICE, 2), 2);
  // La cuerda pulsada se apaga sola; la saturada dura toda la nota; el palm mute es cortísimo.
  assert.ok(ringSec(VOICES.clean, 4) < 4);
  assert.equal(ringSec(VOICES.crunch, 4), 4);
  assert.ok(ringSec(VOICES.muted, 1) <= 0.15);
  for (const v of Object.values(VOICES)) assert.ok(peakGain(v) > 0 && peakGain(v) <= 0.6);
});

test('checkpoint 1 de guitarra: claves en 3 idiomas, cuerdas de guitarra y compases completos', () => {
  const used = [GUITAR_CP1.titleKey, GUITAR_CP1.introKey, ...GUITAR_CP1.parts.map((p) => p.promptKey)];
  for (const [code, tree] of Object.entries(locales)) for (const k of used) assert.ok(lookup(tree, k), `${code}: falta ${k}`);
  for (const p of GUITAR_CP1.parts) {
    if (p.kind === 'playAlong') p.notes.forEach((n) => assert.ok(guitarStrings.has(n.string), p.id));
    if (p.kind === 'ear' || p.kind === 'quiz') assert.ok(p.correctIndex < p.options.length, p.id);
  }
  assert.ok(barsAreComplete(CP1_RIFF) && barsAreComplete(SIGHT_RIFF));
  assert.equal(FULL_SPIDER.length, 48);
});

test('las partituras de las lecciones de guitarra tienen compases completos', () => {
  for (const lesson of lessons) {
    for (const ex of lesson.exercises) {
      if (ex.kind === 'playAlong' && ex.score) assert.ok(barsAreComplete(ex.score), `${ex.id}: compases`);
    }
    for (const c of lesson.cards) if (c.listen?.show === 'tab') assert.ok(barsAreComplete(c.listen.events), `${lesson.id}: ejemplo en tablatura con compases completos`);
  }
});

test('tablatura con corcheas y silencios: más ancho por pulso y corcheas a medio pulso', () => {
  const quarters = layoutTab([{ string: 'E', fret: 0, beats: 1 }, { string: 'E', fret: 0, beats: 1 }, { string: 'E', fret: 0, beats: 2 }], 400);
  const eighths = layoutTab([{ string: 'E', fret: 0, beats: 0.5 }, { string: 'E', fret: 0, beats: 0.5 }, { rest: true, beats: 1 }, { string: 'A', fret: 2, beats: 2 }], 400);
  assert.ok(eighths.beatW >= 40);
  // Dos corcheas en el mismo pulso, separadas medio pulso.
  assert.ok(Math.abs(eighths.notes[1].x - eighths.notes[0].x - eighths.beatW / 2) < 0.001);
  // La negra queda centrada en su pulso, como siempre.
  assert.ok(Math.abs(quarters.notes[0].x - (26 + quarters.beatW / 2)) < 0.001);
});

test('acordes abiertos: cada diagrama suena a su tríada y tiene un dedo por nota pisada', () => {
  for (const id of Object.keys(CHORDS) as ChordId[]) {
    const pcs = new Set(chordMidi(id).map((m) => m % 12));
    assert.deepEqual([...pcs].sort(), [...triadPitchClasses(id)].sort(), id);
    const { frets, fingers } = CHORDS[id];
    frets.forEach((f, i) => assert.equal(f > 0, fingers[i] > 0, `${id}: cuerda ${6 - i}`));
    // La nota más grave es la tónica (posición fundamental).
    assert.equal(Math.min(...chordMidi(id)) % 12, CHORDS[id].root, `${id}: bajo`);
  }
});

test('figuras y silencios de la tablatura', () => {
  assert.deepEqual([0.5, 1, 2, 4].map(figureOf), ['eighth', 'quarter', 'half', 'whole']);
  assert.equal(isTabRest({ rest: true, beats: 2 }), true);
  assert.equal(isTabRest({ string: 'E', fret: 0, beats: 1 }), false);
  assert.throws(() => tabOf([{ string: 'E', fret: 0, beats: 0.5 }]));
  assert.throws(() => tabOf([{ rest: true, beats: 1 }]));
  // Un silencio de blanca o de redonda ocupa su lugar en el compás.
  const l = layoutTab([{ string: 'E', fret: 0, beats: 1 }, { rest: true, beats: 2 }, { string: 'A', fret: 0, beats: 1 }, { rest: true, beats: 4 }], 600);
  assert.equal(l.notes.length, 4);
  assert.ok(l.notes[2].x > l.notes[1].x + l.beatW * 1.5);
  assert.equal(l.barsInRow.reduce((a, b) => a + b, 0), 2);
});
