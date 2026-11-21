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

import { CHORDS, SEVENTHS, chordDiagram, chordMidi as openChordMidi, chordFromName, diagramMidi, seventhPitchClasses, shapeOf, type SeventhId } from '../src/music/chords';
import { CHORD_UNLOCKS, allChords, chordModule, missingChords, songRequires, unlockedChords } from '../src/content/nylon/chordbook';
import { CHORD_FIG, NYLON_CP2, NYLON_LEVEL2_LESSONS, PENTA_AM, PENTA_OPEN } from '../src/content/nylon/level2';
import { NYLON_GENRES, NYLON_SONGS } from '../src/content/nylon/songs';
import { albumDiagram, albumMidi, altBassBar, balladBar, chordFigure, pamiBar, pimaBar, pimiBar, steadyBassBar, waltzBar } from '../src/content/nylon/helpers';
import { BLUES_AM, BLUES_SCALE, NYLON_CP3, NYLON_LEVEL3_LESSONS, SLUR_PHRASE, VALS_LINE, ZAMBA_LINE } from '../src/content/nylon/level3';
import { MILONGA, barBeatsOf, isValidPattern } from '../src/music/strum';
import { barBeatsOfStyle } from '../src/music/drums';
import { barsAreComplete } from '../src/music/tab';
import { CHORD_FIGURES } from '../src/components/guitarFigureMeta';

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
  for (const cp of [NYLON_CP1, NYLON_CP2, NYLON_CP3]) {
    used.add(cp.titleKey);
    used.add(cp.introKey);
    for (const ex of cp.parts) {
      used.add(ex.promptKey);
      if ('options' in ex) ex.options.filter((o) => !o.startsWith('=')).forEach((o) => used.add(o));
    }
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

// ───────────── Nivel 2 (2.1–2.3), álbum de acordes y cancionero ─────────────


test('séptimas abiertas: cada forma suena a tónica, tercera, quinta y séptima menor', () => {
  for (const id of Object.keys(SEVENTHS) as SeventhId[]) {
    const pcs = new Set(openChordMidi(id).map((m) => m % 12));
    const want = seventhPitchClasses(id);
    for (const pc of [want[0], want[1], want[3]]) assert.ok(pcs.has(pc), `${id}: falta la clase ${pc}`);
    for (const pc of pcs) assert.ok(want.includes(pc), `${id}: nota ajena ${pc}`);
    assert.equal(openChordMidi(id)[0] % 12, SEVENTHS[id].root, `${id}: la nota más grave es la tónica`);
    // El diagrama suena igual que la forma.
    assert.deepEqual(diagramMidi(chordDiagram(id)), [...openChordMidi(id)].sort((a, b) => a - b), id);
  }
  // Y coinciden con el cifrado que usa la banda.
  for (const id of ['E7', 'A7', 'Em7', 'Am7'] as SeventhId[]) {
    const band = new Set((chordFromName(id) ?? []).map((m) => m % 12));
    assert.ok(seventhPitchClasses(id).every((pc) => band.has(pc)), id);
  }
});

test('álbum de acordes: 28 acordes hasta 3.4, sin repetir, cada uno con su diagrama y su figura', () => {
  const all = allChords();
  assert.equal(all.length, 28);
  assert.equal(new Set(all).size, all.length);
  assert.deepEqual(Object.keys(CHORD_UNLOCKS), ['2.1', '2.2', '2.3', '3.1', '3.2', '3.3', '3.4']);
  for (const c of all) {
    if (c in CHORDS || c in SEVENTHS) {
      const fig = CHORD_FIG[c as keyof typeof CHORD_FIG];
      assert.ok(fig && CHORD_FIGURES[fig] === c, `${c}: figura`);
      assert.ok(shapeOf(c as keyof typeof CHORD_FIG));
    }
    assert.ok(CHORD_FIGURES[chordFigure(c)], `${c}: figura`);
    // Las notas del diagrama son las del acorde que nombra (mismas clases de altura que el cifrado de la banda).
    const pcs = new Set(albumMidi(c).map((m) => m % 12));
    const band = new Set((chordFromName(c) ?? []).map((m) => m % 12));
    assert.ok(band.size > 0, `${c}: la banda no conoce el cifrado`);
    for (const pc of pcs) assert.ok(band.has(pc), `${c}: nota ajena al acorde (${pc})`);
    // Puede faltar la quinta (como en C7 abierto), nunca la tónica ni la tercera.
    const fifth = ((chordFromName(c) ?? [0])[0] + 7) % 12;
    for (const pc of band) assert.ok(pcs.has(pc) || pc === fifth, `${c}: falta la clase ${pc}`);
    // Bm de 3.1 es la forma de 4 cuerdas (antes de la cejilla completa): su nota más grave es la quinta, Fa#.
    if (c !== 'Bm') assert.equal(albumMidi(c)[0] % 12, [...(chordFromName(c) ?? [])][0] % 12, `${c}: la nota más grave es la tónica`);
  }
  assert.equal(chordModule('G7'), '2.3');
  assert.equal(chordModule('F'), '3.1');
  assert.equal(chordModule('Ab'), undefined);
  assert.deepEqual(unlockedChords(new Set(['2.1'])), ['Em', 'Am', 'E', 'A', 'D']);
  assert.deepEqual(missingChords(['Em', 'D', 'C', 'C'], new Set(['2.1'])), ['C']);
  assert.deepEqual(missingChords(['Em', 'F'], new Set(['2.1', '2.2', '2.3'])), ['F']);
  assert.deepEqual(missingChords(['Em', 'Ab'], new Set(['2.1', '3.1'])), ['Ab']);
  assert.deepEqual(songRequires(['C', 'Em'], ['1.3']), ['1.3', '2.1', '2.2']);
  assert.throws(() => songRequires(['Ab']));
});

test('cada acorde nuevo del álbum tiene su lección y sale en el orden del álbum', () => {
  const taught = [...NYLON_LEVEL2_LESSONS, ...NYLON_LEVEL3_LESSONS].flatMap((l) => l.exercises)
    .filter((e) => e.kind === 'strum')
    .flatMap((e) => (e.kind === 'strum' ? e.chords : []));
  for (const c of allChords()) assert.ok(taught.includes(c), `${c} no se rasguea en ninguna lección`);
  for (const ex of [...NYLON_LEVEL2_LESSONS, ...NYLON_LEVEL3_LESSONS].flatMap((l) => l.exercises)) {
    if (ex.kind !== 'strum') continue;
    // Una lección solo rasguea acordes de su módulo o anteriores.
    const lessonModule = ex.id.split('.').slice(0, 2).join('.');
    for (const c of ex.chords) {
      const m = chordModule(c);
      assert.ok(m && m <= lessonModule, `${ex.id}: ${c} se enseña en ${m}`);
    }
    assert.ok(ex.bpm <= 80, ex.id);
  }
});

test('p-i-m-i: el pulgar toca la nota más grave del acorde y los dedos, notas del acorde', () => {
  for (const c of allChords()) {
    const bar = pimiBar(c).filter(isNote);
    const pcs = new Set(albumMidi(c).map((m) => m % 12));
    assert.equal(bar.length, 4);
    for (const x of bar) assert.ok(pcs.has(midiOn(NYLON, x.string, x.fret) % 12), `${c}: ${x.string}${x.fret}`);
  }
});

test('cancionero de criolla: reglas de las canciones y desbloqueo por acordes', () => {
  const chordPcs = (name: string) => new Set((chordFromName(name) ?? []).map((m) => m % 12));
  for (const s of NYLON_SONGS) {
    assert.ok((NYLON_GENRES as readonly string[]).includes(s.genre), `${s.id}: género`);
    const bar = s.beatsPerBar ?? 4;
    const beats = s.line.reduce((a, e) => a + e.beats, 0);
    assert.equal(beats, s.chords.length * bar, `${s.id}: un acorde por compás`);
    if (s.line.some((e) => e.beats === 0.5)) assert.ok(s.bpm <= 80, `${s.id}: corcheas a 80 o menos`);
    let t = 0;
    for (const e of s.line) {
      if (t % bar === 0 && isNote(e)) {
        const pc = midiOn(NYLON, e.string, e.fret) % 12;
        assert.ok(chordPcs(s.chords[t / bar]).has(pc), `${s.id}: compás ${t / bar + 1}, la nota del tiempo 1 no está en ${s.chords[t / bar]}`);
      }
      t += e.beats;
    }
    for (const m of s.requires) assert.ok(NYLON_LEVELS.some((l) => l.modules.some((x) => x.id === m)), `${s.id}: ${m}`);
    for (const k of [s.titleKey, s.descriptionKey]) for (const [code, tree] of Object.entries(locales)) assert.ok(lookup(tree, k), `${code}: falta ${k}`);
  }
  // Ruta 3 se toca con los acordes: se abre con 2.1 (Em, D, A) y la técnica de 1.3.
  const ruta = NYLON_SONGS.find((s) => s.id === 'n-rock-1')!;
  assert.deepEqual(ruta.requires, songRequires(['Em', 'D', 'A'], ['1.3']));
  assert.deepEqual(missingChords(ruta.chords, new Set(['1.3'])), ['Em', 'D', 'A']);
});

test('el nivel 2 está completo (35 lecciones) y el checkpoint 2 prueba rasgueo, arpegio, pentatónica y oído', () => {
  const level2 = NYLON_LEVELS[1];
  assert.equal(level2.modules.reduce((a, m) => a + m.lessonCount, 0), 35);
  for (const mod of level2.modules) for (const id of lessonIdsOf(mod)) assert.ok(NYLON_LESSONS[id], `falta la lección ${id}`);
  assert.deepEqual(NYLON_CP2.parts.map((p) => p.kind), ['ear', 'strum', 'playAlong', 'playAlong']);
  for (const p of NYLON_CP2.parts) if (p.kind === 'strum') for (const c of p.chords) assert.ok(chordModule(c), `${c} fuera del álbum`);
});

test('patrones de mano derecha: compases de 4 pulsos con notas del acorde', () => {
  const patterns = { pimaBar, pamiBar, altBassBar, balladBar, steadyBassBar };
  for (const c of allChords()) {
    const pcs = new Set(albumMidi(c).map((m) => m % 12));
    for (const [name, bar] of Object.entries(patterns)) {
      const score = bar(c);
      assert.equal(score.reduce((a, e) => a + e.beats, 0), 4, `${name}(${c})`);
      for (const x of score.filter(isNote)) assert.ok(pcs.has(midiOn(NYLON, x.string, x.fret) % 12), `${name}(${c}): ${x.string}${x.fret}`);
    }
    // El pulgar empieza siempre en el bajo del acorde.
    const first = pimaBar(c)[0];
    assert.ok(isNote(first) && midiOn(NYLON, first.string, first.fret) === albumMidi(c)[0], c);
  }
});

test('pentatónica menor de La en primera posición: solo La, Do, Re, Mi y Sol; improvisación con esa escala', () => {
  assert.equal(PENTA_OPEN.length, 12);
  for (const x of PENTA_OPEN) assert.ok(PENTA_AM.includes(midiOn(NYLON, x.string, x.fret) % 12), `${x.string}${x.fret}`);
  const improv = NYLON_LEVEL2_LESSONS.flatMap((l) => l.exercises).filter((e) => e.kind === 'improvise');
  assert.ok(improv.length >= 2);
  for (const ex of improv) if (ex.kind === 'improvise') assert.deepEqual(ex.scale, PENTA_AM);
});

test('nivel 3, primera parte: los módulos 3.1 a 3.4 están completos y cada cejilla nueva tiene su lección', () => {
  const mods = NYLON_LEVELS[2].modules.filter((m) => ['3.1', '3.2', '3.3', '3.4'].includes(m.id));
  assert.equal(mods.reduce((a, m) => a + m.lessonCount, 0), 19);
  for (const mod of mods) for (const id of lessonIdsOf(mod)) assert.ok(NYLON_LESSONS[id], `falta la lección ${id}`);
  // La media cejilla de 3.1 cubre solo la 2.ª y la 1.ª; la F de 3.2.1 es la cejilla completa.
  assert.deepEqual(albumDiagram('F').barre, { fret: 1, from: 4, to: 5 });
  const l321 = NYLON_LESSONS['3.2.1'];
  assert.equal(l321.cards[0].figure, 'barre-f');
});

test('sin tempo, ningún ejercicio pide dos veces seguidas la misma nota (se daría por tocada sola)', () => {
  const all = [...Object.values(NYLON_LESSONS).flatMap((l) => l.exercises), ...[NYLON_CP1, NYLON_CP2, NYLON_CP3].flatMap((c) => c.parts)];
  for (const ex of all) {
    if (ex.kind !== 'playAlong' || ex.bpm !== null) continue;
    for (let i = 1; i < ex.notes.length; i++) {
      const a = ex.notes[i - 1], b = ex.notes[i];
      assert.ok(midiOn(NYLON, a.string, a.fret) !== midiOn(NYLON, b.string, b.fret), `${ex.id}: nota ${i} igual a la anterior`);
    }
  }
});

test('nivel 3: ligados, escala de blues y checkpoint 3', () => {
  for (const id of ['3.5.1', '3.5.5', '3.6.1', '3.6.5']) assert.ok(NYLON_LESSONS[id], id);
  for (const x of BLUES_SCALE) assert.ok(BLUES_AM.includes(midiOn(NYLON, x.string, x.fret) % 12), `${x.string}${x.fret}`);
  assert.ok(BLUES_SCALE.some((x) => midiOn(NYLON, x.string, x.fret) % 12 === 3), 'la blue note (Mi♭)');
  for (const x of SLUR_PHRASE.filter(isNote)) assert.ok(PENTA_AM.includes(midiOn(NYLON, x.string, x.fret) % 12));
  assert.deepEqual(NYLON_CP3.parts.map((p) => p.kind), ['ear', 'strum', 'strum', 'playAlong']);
  for (const p of NYLON_CP3.parts) if (p.kind === 'strum') for (const c of p.chords) assert.ok(chordModule(c), `${c} fuera del álbum`);
});

test('nivel 3 completo: 3.7 enseña 6/8, zamba, chacarera, tango, milonga y vals', () => {
  const level3 = NYLON_LEVELS[2];
  for (const mod of level3.modules) for (const id of lessonIdsOf(mod)) assert.ok(NYLON_LESSONS[id], `falta la lección ${id}`);
  assert.ok(isValidPattern(MILONGA) && barBeatsOf(MILONGA) === 4);
  const mod37 = level3.modules.find((m) => m.id === '3.7')!;
  for (const id of lessonIdsOf(mod37)) {
    const lesson = NYLON_LESSONS[id];
    assert.ok(lesson.exercises.some((e) => e.needsBass), `${id}: sin ejercicio con guitarra`);
    for (const ex of lesson.exercises) {
      if (ex.kind === 'strum') {
        assert.ok(isValidPattern(ex.pattern), ex.id);
        for (const c of ex.chords) assert.ok(chordModule(c), `${ex.id}: ${c} fuera del álbum`);
      }
      if (ex.kind === 'playAlong' && ex.score) {
        assert.equal(ex.beatsPerBar, 3, ex.id);
        assert.ok(barsAreComplete(ex.score, 3), `${ex.id}: compases de 3 pulsos`);
      }
    }
  }
  // Los compases de vals: bajo y dos notas del acorde, 3 pulsos.
  for (const c of allChords()) {
    const bar = waltzBar(c);
    assert.equal(bar.reduce((a, e) => a + e.beats, 0), 3, c);
    const pcs = new Set(albumMidi(c).map((m) => m % 12));
    for (const x of bar.filter(isNote)) assert.ok(pcs.has(midiOn(NYLON, x.string, x.fret) % 12), `${c}: ${x.string}${x.fret}`);
  }
  assert.ok(barsAreComplete(ZAMBA_LINE, 3) && barsAreComplete(VALS_LINE, 3));
});

test('música popular en el cancionero: compás, estilo de banda y rasgueo coinciden', () => {
  const popular = NYLON_SONGS.filter((s) => s.genre === 'popular');
  assert.deepEqual(popular.map((s) => s.style), ['zamba', 'chacarera', 'tango', 'vals']);
  for (const s of popular) {
    const bar = s.beatsPerBar ?? 4;
    assert.equal(barBeatsOfStyle(s.style!), bar, `${s.id}: la banda va en ${bar}`);
    assert.equal(barBeatsOf(s.strum!), bar, `${s.id}: el rasgueo va en ${bar}`);
    assert.ok(s.requires.includes('3.7'), s.id);
  }
});
