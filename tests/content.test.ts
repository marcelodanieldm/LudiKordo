import { test } from 'node:test';
import assert from 'node:assert/strict';
import en from '../src/i18n/locales/en.json';
import es from '../src/i18n/locales/es.json';
import pt from '../src/i18n/locales/pt.json';
import { LESSONS } from '../src/content/lessons';
import { LEVELS } from '../src/content/curriculum';
import { midiToFreq } from '../src/music/notes';

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
      used.add(m.goalKey);
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
      if (ex.kind === 'tabReading') {
        assert.ok(barsAreComplete(ex.notes), ex.id);
        // Cada nota tiene que poder tocarse en el diapasón del ejercicio.
        for (const n of ex.notes) assert.ok(n.fret >= 0 && n.fret <= ex.frets, `${ex.id}: traste ${n.fret}`);
      }
      if (ex.kind === 'fretboardTap') for (const n of ex.sequence) assert.ok(n.fret >= 1 && n.fret <= ex.frets, ex.id);
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

test('módulo 1.5: raíces de I–IV–V correctas y Kordi Groove 1 de 8 compases', async () => {
  const { midiAt, noteName } = await import('../src/music/notes');
  const { totalBeats } = await import('../src/music/tab');
  const name = (s: 'E' | 'A' | 'D' | 'G', f: number) => noteName(midiAt(s, f), 'en', 'letters');
  // Tono de Mi: I = E, IV = A, V = B (cuerda La, traste 2).
  assert.deepEqual([name('E', 0), name('A', 0), name('A', 2)], ['E', 'A', 'B']);
  // Tono de La: I = A, IV = D, V = E.
  assert.deepEqual([name('A', 0), name('D', 0), name('E', 0)], ['A', 'D', 'E']);
  const ex = (id: string) => Object.values(LESSONS).flatMap((l) => l.exercises).find((e) => e.id === id)!;
  const where = ex('1.5.2-where');
  if (where.kind !== 'quiz') throw new Error('quiz');
  assert.equal(lookup(locales.en, where.options[where.correctIndex]), 'A string, fret 2');
  const iv = ex('1.5.4-q');
  if (iv.kind !== 'quiz') throw new Error('quiz');
  assert.equal(lookup(locales.en, iv.options[iv.correctIndex]), 'D');
  const groove = ex('1.5.5-groove');
  if (groove.kind !== 'playAlong') throw new Error('playAlong');
  const notes = groove.notes.map((n) => ({ ...n, beats: n.beats ?? 1 }));
  assert.equal(totalBeats(notes), 32);
  // Compás 3 = Si (V): cuerda La, traste 2.
  assert.deepEqual(notes.slice(6, 9).map((n) => [n.string, n.fret]), [['A', 2], ['A', 2], ['A', 2]]);
  // Solo raíces de I, IV y V en tono de Mi.
  for (const n of notes) assert.ok(['E0', 'A0', 'A2'].includes(`${n.string}${n.fret}`));
});

test('nivel 1 completo: las 25 lecciones de la ruta tienen contenido', async () => {
  const { lessonIdsOf } = await import('../src/content/curriculum');
  const level1 = LEVELS[0].modules.flatMap((m) => lessonIdsOf(m));
  assert.equal(level1.length, 25);
  for (const id of level1) assert.ok(LESSONS[id], `falta la lección ${id}`);
});

test('módulos 1.1 y 1.2: solo cuerdas al aire y oído con referencia', async () => {
  const { freqToMidi, midiAt } = await import('../src/music/notes');
  for (const id of ['1.1.2', '1.1.3', '1.1.5', '1.2.2', '1.2.3', '1.2.4', '1.2.5']) {
    for (const ex of LESSONS[id].exercises) {
      // La mano izquierda se enseña en el módulo 1.3: antes, todo es al aire.
      if (ex.kind === 'playAlong') for (const n of ex.notes) assert.equal(n.fret, 0, `${ex.id}`);
      if (ex.kind === 'ear') {
        assert.equal(freqToMidi(ex.tones![0]), midiAt('E', 0), `${ex.id}: referencia Mi`);
        const answer = ex.options[ex.correctIndex].slice(1) as 'E' | 'A' | 'D' | 'G';
        assert.equal(freqToMidi(ex.tones![1]), midiAt(answer, 0), ex.id);
      }
    }
  }
  // Cruzar de cuerda: en 1.2.3 cada nota cambia de cuerda respecto de la anterior (salvo los extremos de la escalera).
  const ea = LESSONS['1.2.3'].exercises.find((e) => e.id === '1.2.3-EA')!;
  if (ea.kind !== 'playAlong') throw new Error('playAlong');
  const changes = ea.notes.slice(1).filter((n, i) => n.string !== ea.notes[i].string).length;
  assert.ok(changes >= 14);
});

test('checkpoints: reglas de aprobación y contenido del nivel 1', async () => {
  const { CHECKPOINTS, checkpointResult } = await import('../src/content/checkpoints');
  const { barsAreComplete } = await import('../src/music/tab');
  const { freqToMidi, midiAt } = await import('../src/music/notes');
  // Aprobar: al menos 1 estrella en cada prueba y 2 de promedio.
  assert.deepEqual(checkpointResult([3, 3, 2, 2, 3]), { stars: 2, passed: true });
  assert.deepEqual(checkpointResult([3, 3, 3, 3, 3]), { stars: 3, passed: true });
  assert.equal(checkpointResult([3, 3, 3, 3, 0]).passed, false); // una prueba en 0
  assert.equal(checkpointResult([2, 2, 1, 2, 2]).passed, false); // promedio 1,8
  assert.deepEqual(checkpointResult([]), { stars: 0, passed: false });

  const cp1 = CHECKPOINTS[1];
  assert.ok(cp1.parts.length >= 4);
  assert.ok(lookup(locales.es, cp1.titleKey));
  for (const ex of cp1.parts) {
    assert.ok(lookup(locales.es, ex.promptKey) && lookup(locales.en, ex.promptKey) && lookup(locales.pt, ex.promptKey), ex.id);
    if (ex.kind === 'tabReading') {
      assert.ok(barsAreComplete(ex.notes), ex.id);
      for (const n of ex.notes) assert.ok(n.fret <= ex.frets, ex.id);
    }
    if (ex.kind === 'ear') {
      const answer = ex.options[ex.correctIndex].slice(1) as 'E' | 'A' | 'D' | 'G';
      assert.equal(freqToMidi(ex.tones![1]), midiAt(answer, 0));
    }
  }
  // El hito del documento de producto: Kordi Groove 1 completo a 80 bpm.
  const groove = cp1.parts.find((e) => e.id === 'cp1-groove')!;
  if (groove.kind !== 'playAlong') throw new Error('playAlong');
  assert.equal(groove.bpm, 80);
  assert.equal(groove.notes.reduce((a, n) => a + (n.beats ?? 1), 0), 32);
  // Cada id de prueba es único en todo el contenido (el progreso se guarda por id).
  const ids = [...Object.values(LESSONS).flatMap((l) => l.exercises.map((e) => e.id)), ...cp1.parts.map((e) => e.id)];
  assert.equal(new Set(ids).size, ids.length);
});

test('ejemplos sonoros y pentagramas: bien escritos y tocables', async () => {
  const { scoreBarsComplete, isRest } = await import('../src/music/staff');
  const { barsAreComplete } = await import('../src/music/tab');
  for (const lesson of Object.values(LESSONS)) {
    for (const card of lesson.cards) {
      const ex = card.listen;
      if (!ex) continue;
      assert.ok(ex.events.length > 0 && ex.bpm >= 40 && ex.bpm <= 200, `${lesson.id}: ${card.titleKey}`);
      for (const e of ex.events) if (!isRest(e)) assert.ok(e.fret >= 0 && e.fret <= 12, `${lesson.id}: traste ${e.fret}`);
      if (ex.show) assert.ok(scoreBarsComplete(ex.events), `${lesson.id}: ${card.titleKey} con compases incompletos`);
      // La tablatura solo dibuja negras, blancas y redondas sin silencios.
      if (ex.show === 'tab') assert.ok(ex.events.every((e) => !isRest(e) && e.beats >= 1), `${lesson.id}: ejemplo en tablatura con corcheas o silencios`);
    }
    for (const ex of lesson.exercises) {
      if (ex.kind === 'quiz' && ex.staff) assert.ok(scoreBarsComplete(ex.staff), `${ex.id}: pentagrama incompleto`);
      if (ex.kind === 'playAlong' && ex.notation === 'staff') assert.ok(barsAreComplete(ex.notes.map((n) => ({ ...n, beats: n.beats ?? 1 }))), ex.id);
    }
  }
});

test('módulo 2.6: pentagrama con la teoría correcta', async () => {
  const { staffPos, writtenMidi, spell } = await import('../src/music/staff');
  const { CANON_BASS } = await import('../src/content/lessons26');
  for (const id of ['2.6.1', '2.6.2', '2.6.3', '2.6.4', '2.6.5']) {
    const l = LESSONS[id];
    assert.ok(l, `falta ${id}`);
    assert.ok(l.exercises.some((e) => e.needsBass) && l.exercises.some((e) => !e.needsBass), `${id}: con y sin bajo`);
    assert.ok(l.cards.some((c) => c.listen || c.figure), `${id}: al menos un ejemplo o figura`);
  }
  const at = (id: string, exId: string) => LESSONS[id].exercises.find((e) => e.id === exId)!;
  // 2.6.1: la nota de la línea de la clave es Fa.
  const f = at('2.6.1', '2.6.1-f');
  assert.ok(f.kind === 'quiz' && f.staff);
  if (f.kind === 'quiz' && f.staff && !('rest' in f.staff[0])) {
    assert.equal(staffPos(writtenMidi(f.staff[0].string, f.staff[0].fret)), 6);
    assert.equal(f.options[f.correctIndex], '=F');
  }
  // 2.6.2 y 2.6.4: la respuesta es la nota que muestra el pentagrama.
  const letterOf = (s: 'E' | 'A' | 'D' | 'G', fret: number) => {
    const sp = spell(writtenMidi(s, fret));
    return sp.letter + (sp.sharp ? '♯' : '');
  };
  for (const exId of ['2.6.4-c', '2.6.4-fsharp']) {
    const ex = at('2.6.4', exId);
    if (ex.kind === 'quiz' && ex.staff && !('rest' in ex.staff[0])) assert.equal(ex.options[ex.correctIndex], `=${letterOf(ex.staff[0].string, ex.staff[0].fret)}`, exId);
  }
  const stringKey = { A: 'oA', E: 'oE', D: 'oD', G: 'oG' } as const;
  for (const exId of ['2.6.2-a', '2.6.2-g', '2.6.2-e']) {
    const ex = at('2.6.2', exId);
    if (ex.kind === 'quiz' && ex.staff && !('rest' in ex.staff[0])) assert.ok(ex.options[ex.correctIndex].endsWith(stringKey[ex.staff[0].string]), exId);
  }
  // 2.6.3: dos blancas = 2 pulsos cada una; negra-silencio-negra-silencio = 2 notas.
  const half = at('2.6.3', '2.6.3-half');
  assert.ok(half.kind === 'quiz' && half.options[half.correctIndex] === '=2');
  // 2.6.4: el dictado suena Mi, Sol, La.
  const dict = at('2.6.4', '2.6.4-dictation');
  if (dict.kind === 'ear') assert.deepEqual(dict.tones!.map((hz) => Math.round(hz * 100)), [midiToFreq(28), midiToFreq(31), midiToFreq(33)].map((hz) => Math.round(hz * 100)));
  // 2.6.5: el bajo del Canon es Re La Si Fa♯ Sol Re Sol La.
  assert.deepEqual(CANON_BASS.map((n) => letterOf(n.string, n.fret)), ['D', 'A', 'B', 'F♯', 'G', 'D', 'G', 'A']);
  const sharp = at('2.6.5', '2.6.5-sharp');
  assert.ok(sharp.kind === 'quiz' && sharp.options[sharp.correctIndex] === '=F♯');
});

test('ficha teórica: junta las tarjetas del módulo y respeta Premium', async () => {
  const { theorySheet } = await import('../src/content/theory');
  const free = theorySheet('1.1', () => true)!;
  assert.equal(free.sections.length, 5);
  assert.equal(free.locked, 0);
  const locked = theorySheet('2.6', () => false)!;
  assert.equal(locked.sections.length, 0);
  assert.equal(locked.locked, 5);
  const open = theorySheet('2.6', () => true)!;
  assert.ok(open.sections.flatMap((s) => s.cards).some((c) => c.listen));
  assert.equal(theorySheet('9.9', () => true), null);
  // Un módulo sin lecciones escritas da una ficha vacía, no un error.
  assert.equal(theorySheet('4.7', () => true)!.sections.length, 0);
});
