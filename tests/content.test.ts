import { test } from 'node:test';
import assert from 'node:assert/strict';
import en from '../src/i18n/locales/en.json';
import es from '../src/i18n/locales/es.json';
import pt from '../src/i18n/locales/pt.json';
import { LESSONS } from '../src/content/lessons';
import { LEVELS } from '../src/content/curriculum';

type Tree = { [k: string]: string | Tree };

function keys(obj: Tree, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => (typeof v === 'string' ? [`${prefix}${k}`] : keys(v, `${prefix}${k}.`)));
}

function lookup(obj: Tree, path: string): string | undefined {
  let cur: string | Tree | undefined = obj;
  for (const part of path.split('.')) {
    if (typeof cur !== 'object' || cur === null) return undefined;
    cur = cur[part];
  }
  return typeof cur === 'string' ? cur : undefined;
}

const locales = { en, es, pt } as unknown as Record<string, Tree>;

test('los 3 idiomas tienen exactamente las mismas claves', () => {
  const base = new Set(keys(locales.es));
  for (const [code, tree] of Object.entries(locales)) {
    const k = new Set(keys(tree));
    const missing = [...base].filter((x) => !k.has(x));
    const extra = [...k].filter((x) => !base.has(x));
    assert.deepEqual(missing, [], `${code}: faltan ${missing.join(', ')}`);
    assert.deepEqual(extra, [], `${code}: sobran ${extra.join(', ')}`);
  }
});

test('ninguna traducción está vacía', () => {
  for (const [code, tree] of Object.entries(locales)) {
    for (const k of keys(tree)) assert.ok(lookup(tree, k)!.trim().length > 0, `${code}.${k} vacío`);
  }
});

test('cada clave usada por el currículo y las lecciones existe en los 3 idiomas', () => {
  const used = new Set<string>();
  for (const l of LEVELS) {
    used.add(l.titleKey);
    used.add(l.checkpointKey);
    for (const m of l.modules) {
      used.add(m.titleKey);
      used.add(m.starExerciseKey);
    }
  }
  for (const lesson of Object.values(LESSONS)) {
    used.add(lesson.titleKey);
    used.add(lesson.objectiveKey);
    lesson.cartoon.sceneKeys.forEach((k) => used.add(k));
    lesson.cards.forEach((c) => {
      used.add(c.titleKey);
      used.add(c.bodyKey);
    });
    for (const ex of lesson.exercises) {
      used.add(ex.promptKey);
      if ('options' in ex) ex.options.filter((o) => !o.startsWith('=')).forEach((o) => used.add(o));
      if ('hintKey' in ex && ex.hintKey) used.add(ex.hintKey);
    }
  }
  for (const [code, tree] of Object.entries(locales)) {
    for (const k of used) assert.ok(lookup(tree, k), `${code}: falta ${k}`);
  }
});

test('las respuestas correctas de los quiz apuntan a una opción válida', () => {
  for (const lesson of Object.values(LESSONS)) {
    for (const ex of lesson.exercises) {
      if (ex.kind === 'quiz' || ex.kind === 'ear') {
        assert.ok(ex.correctIndex >= 0 && ex.correctIndex < ex.options.length, ex.id);
      }
    }
  }
  // 1.1.1: la cuerda más gruesa es Mi.
  const q = LESSONS['1.1.1'].exercises[0];
  if (q.kind !== 'quiz') throw new Error('1.1.1 debería empezar con un quiz');
  assert.equal(lookup(locales.es, q.options[q.correctIndex]), 'Mi (E)');
  // 1.3.1: dedo 3 en el traste 3.
  const q2 = LESSONS['1.3.1'].exercises.find((e) => e.id === '1.3.1-q')!;
  if (q2.kind !== 'quiz') throw new Error('1.3.1-q debería ser un quiz');
  assert.equal(q2.options[q2.correctIndex], '=3');
});

test('módulo 1.3: la araña usa un dedo por traste y la teoría es correcta', async () => {
  const { freqToMidi, midiAt, noteName } = await import('../src/music/notes');
  // Las 5 lecciones del módulo existen y solo usan los trastes 1 a 4.
  for (const id of ['1.3.1', '1.3.2', '1.3.3', '1.3.4', '1.3.5']) {
    const lesson = LESSONS[id];
    assert.ok(lesson, id);
    for (const ex of lesson.exercises) {
      const notes = ex.kind === 'playAlong' ? ex.notes : ex.kind === 'fretboardTap' ? ex.sequence : [];
      for (const n of notes) assert.ok(n.fret >= 1 && n.fret <= 4, `${ex.id}: traste ${n.fret}`);
    }
  }
  // 1.3.5: el tono del ejercicio de oído es la opción correcta (cuerda Mi, traste 3 = Sol).
  const ear = LESSONS['1.3.5'].exercises.find((e) => e.id === '1.3.5-ear')!;
  if (ear.kind !== 'ear' || !ear.tones) throw new Error('1.3.5-ear debería ser de oído con tono');
  assert.equal(ear.tones.length, 2, 'primero la referencia (Mi al aire), después la nota');
  assert.equal(freqToMidi(ear.tones[0]) % 12, midiAt('E', 0) % 12);
  const midi = freqToMidi(ear.tones[1]);
  assert.equal(midi % 12, midiAt('E', 3) % 12);
  assert.equal(lookup(locales.en, ear.options[ear.correctIndex]), noteName(midi, 'en', 'letters'));
  // Las cuatro opciones son los trastes 1 a 4 de la cuerda Mi, en orden.
  ear.options.forEach((key, i) => assert.equal(lookup(locales.en, key), noteName(midiAt('E', i + 1), 'en', 'letters')));
  // 1.3.5: la araña completa sube por las 4 cuerdas y vuelve a bajar (32 notas).
  const full = LESSONS['1.3.5'].exercises.find((e) => e.id === '1.3.5-full')!;
  if (full.kind !== 'playAlong') throw new Error('1.3.5-full debería ser playAlong');
  assert.equal(full.notes.length, 32);
  assert.deepEqual(full.notes.slice(0, 4).map((n) => n.fret), [1, 2, 3, 4]);
  assert.deepEqual(full.notes.slice(16, 20), [4, 3, 2, 1].map((fret) => ({ string: 'G', fret })));
  assert.deepEqual(full.notes.at(-1), { string: 'E', fret: 1 });
});

test('tablaturas y líneas con figuras: compases completos en todas las lecciones', async () => {
  const { barsAreComplete } = await import('../src/music/tab');
  for (const lesson of Object.values(LESSONS)) {
    for (const ex of lesson.exercises) {
      if (ex.kind === 'tabReading') assert.ok(barsAreComplete(ex.notes), ex.id);
      if (ex.kind === 'playAlong' && ex.notes.some((n) => n.beats && n.beats !== 1)) {
        assert.ok(barsAreComplete(ex.notes.map((n) => ({ ...n, beats: n.beats ?? 1 }))), ex.id);
      }
      if (ex.kind === 'tempoTrainer') assert.ok(ex.audibleBeats >= 4 && ex.audibleBeats <= ex.beats, ex.id);
    }
  }
});

test('módulo 1.4: respuestas de ritmo correctas', () => {
  const opt = (id: string) => {
    const ex = Object.values(LESSONS).flatMap((l) => l.exercises).find((e) => e.id === id)!;
    if (ex.kind !== 'quiz') throw new Error(`${id} debería ser un quiz`);
    return ex.options[ex.correctIndex];
  };
  assert.equal(opt('1.4.2-q'), '=4'); // compás de 4
  assert.equal(opt('1.4.3-half'), '=2'); // la blanca dura 2
  assert.equal(lookup(locales.es, opt('1.4.3-whole')), 'Redonda');
  assert.equal(opt('1.4.4-q'), '=4'); // blanca (1-2), negra (3), negra (4)
  assert.equal(lookup(locales.es, opt('1.4.1-line')), 'Mi (E), la más gruesa');
});
