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
import { CHORDS, PENTA_A, POWER_5, POWER_6, chordMidi, diagramMidi, powerMidi, triadPitchClasses, type ChordId } from '../src/music/chords';
import { BALLAD, DOWN_EIGHTHS, EIGHTHS, HALVES, QUARTERS, eighthAt, filterClicks, isValidPattern, scoreStrum, strokeTimes, strumSchedule } from '../src/music/strum';
import { listenSchedule } from '../src/music/listen';
import { exampleSchedule } from '../src/music/examples';
import { CALL, GUITAR_CP2, PENTA_UP, RESPONSE, arpScore } from '../src/content/guitar/level2';
import { BEND_PHRASE, GUITAR_CP3, LEG_PHRASE, SLIDE_PHRASE, VIB_PHRASE } from '../src/content/guitar/level3';
import { BARRES, OCTAVE } from '../src/music/chords';
import { analyzeVibrato, initialBend, scoreVibrato, stepBend, vibratoOk } from '../src/music/bend';
import { midiToFreq as m2f } from '../src/music/notes';
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

test('los niveles 1, 2 y 3 están completos y todas las lecciones existen en la ruta', () => {
  const route = new Set(GUITAR_LEVELS.flatMap((l) => l.modules.flatMap(lessonIdsOf)));
  for (const mod of GUITAR_LEVELS.slice(0, 3).flatMap((l) => l.modules)) {
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

test('checkpoint 2 de guitarra: claves en 3 idiomas y respuesta del oído correcta', () => {
  const used = [GUITAR_CP2.titleKey, GUITAR_CP2.introKey, ...GUITAR_CP2.parts.flatMap((p) => [p.promptKey, ...('options' in p ? p.options.filter((o) => !o.startsWith('=')) : [])])];
  for (const [code, tree] of Object.entries(locales)) for (const k of used) assert.ok(lookup(tree, k), `${code}: falta ${k}`);
  const ear = GUITAR_CP2.parts.find((p) => p.id === 'gcp2-ear');
  assert.ok(ear && ear.kind === 'ear' && ear.tones);
  // La, Do, Mi: tercera menor arriba de la tónica → «menor».
  const midi = ear.tones.map((f) => Math.round(69 + 12 * Math.log2(f / 440)));
  assert.equal(midi[1] - midi[0], 3);
  assert.equal(ear.options[ear.correctIndex], 'content.g.cp2.minor');
});

test('rasgueo: patrones válidos, golpes a tiempo y ejercicios con acordes conocidos', () => {
  for (const p of [QUARTERS, EIGHTHS, BALLAD, HALVES]) assert.ok(isValidPattern(p));
  assert.equal(isValidPattern(['U', '-', '-', '-', '-', '-', '-', '-']), false);
  const t = strokeTimes(BALLAD, 2, 60, 1000);
  assert.equal(t.length, 12);
  assert.deepEqual(t.slice(0, 6).map((s) => [s.timeMs, s.dir]), [[1000, 'D'], [2000, 'D'], [2500, 'U'], [3500, 'U'], [4000, 'D'], [4500, 'U']]);
  assert.equal(eighthAt(999, 1000, 60), -1);
  assert.equal(eighthAt(2600, 1000, 60), 3);
  const known = new Set([...Object.keys(CHORDS), 'G5', 'A5', 'C5', 'D5', 'E5', 'F', 'Fm', 'Bb', 'Cm']);
  const strums = [...lessons.flatMap((l) => l.exercises), ...GUITAR_CP2.parts, ...GUITAR_CP3.parts].filter((e) => e.kind === 'strum');
  assert.ok(strums.length >= 20);
  for (const e of strums) {
    if (e.kind !== 'strum') continue;
    assert.ok(isValidPattern(e.pattern), e.id);
    assert.ok(e.chords.length >= 2 && e.chords.every((c) => known.has(c)), e.id);
    assert.ok(e.bpm <= 80, e.id);
  }
});

test('ejemplos rasgueados: hacia abajo de grave a agudo, hacia arriba solo las 3 agudas', () => {
  const em = chordMidi('Em');
  const notes = strumSchedule([em], ['D', 'U', '-', '-', '-', '-', '-', '-'], 60);
  assert.equal(notes.length, 6 + 3);
  assert.ok(notes[0].freq < notes[5].freq && notes[0].startSec < notes[5].startSec);
  assert.ok(notes[6].freq > notes[8].freq, 'hacia arriba empieza por la más aguda');
  const ex = exampleSchedule({ events: [], bpm: 60, click: true, strum: { chords: [em, em], pattern: QUARTERS } });
  assert.equal(ex.beats, 12);
  assert.equal(ex.notes.length, 8 * 6);
  assert.ok(ex.notes[0].startSec >= 4, 'la cuenta previa va antes del primer golpe');
});

test('power chords, pentatónica y arpegios de acordes', () => {
  assert.deepEqual(powerMidi('E', 3), [43, 50]);
  for (const d of [POWER_6, POWER_5]) {
    const m = diagramMidi(d);
    assert.equal(m[1] - m[0], 7, `${d.name}: quinta justa`);
  }
  const pcs = new Set(diagramMidi(PENTA_A).map((m) => m % 12));
  assert.deepEqual([...pcs].sort((a, b) => a - b), [0, 2, 4, 7, 9]); // Do Re Mi Sol La
  assert.equal(PENTA_UP.length, 12);
  for (const id of Object.keys(CHORDS) as ChordId[]) assert.ok(barsAreComplete(arpScore(id)), id);
  // La pregunta queda abierta (termina en Mi) y la respuesta vuelve a La.
  const last = (s: ScoreEvent[]) => s.filter(isNote).slice(-1)[0];
  const endMidi = (e: { string: string; fret: number }) => GUITAR.strings.find((x) => x.id === e.string)!.openMidi + e.fret;
  assert.equal(endMidi(last(CALL)) % 12, 4);
  assert.equal(endMidi(last(RESPONSE)) % 12, 9);
});

test('rasgueo: el clic que se cuela por el parlante no cuenta y los golpes de más restan', () => {
  assert.ok(isValidPattern(DOWN_EIGHTHS));
  const start = 4000;
  const beat = 1000; // 60 bpm
  // Durante la cuenta el micrófono oye el clic (rms 0,02); después, el clic y los golpes reales (0,08).
  const clicks = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ timeMs: i * beat, rms: 0.02 }));
  const strokes = [4000, 5000, 6000, 7000].map((t) => ({ timeMs: t + 10, rms: 0.08 }));
  const kept = filterClicks([...clicks, ...strokes], start, 4 * beat);
  assert.deepEqual(kept.map((a) => a.timeMs), [4010, 5010, 6010, 7010]);
  // Solo el clic (sin tocar): no queda nada.
  assert.equal(filterClicks(clicks, start, 4 * beat).length, 0);
  // Con auriculares no entra nada en la cuenta: no se descarta ningún golpe.
  assert.equal(filterClicks(strokes, start, 4 * beat).length, 4);

  // Patrón de balada (6 golpes por compás) tocado como corcheas sin parar: 6 aciertos y 2 golpes de más.
  const allEighths = Array.from({ length: 8 }, (_, i) => start + i * 500);
  const r = scoreStrum(BALLAD, 1, 60, start, allEighths, 80);
  assert.equal(r.hits, 6);
  assert.equal(r.extras, 2);
  assert.ok(r.accuracy < 0.8);
  // El patrón justo: todo bien.
  const exact = strokeTimes(BALLAD, 1, 60, start).map((x) => x.timeMs);
  assert.equal(scoreStrum(BALLAD, 1, 60, start, exact, 80).accuracy, 1);
});

test('ejemplos: una nota puede traer su propio timbre (palm mute dentro de un riff)', () => {
  const sched = listenSchedule([{ string: 'E', fret: 0, beats: 0.5, tone: 'muted' }, { string: 'E', fret: 3, beats: 1 }], 60);
  assert.equal(sched[0].tone, 'muted');
  assert.equal(sched[1].tone, undefined);
});

test('checkpoint 3 de guitarra: claves en 3 idiomas', () => {
  const used = [GUITAR_CP3.titleKey, GUITAR_CP3.introKey, ...GUITAR_CP3.parts.map((p) => p.promptKey)];
  for (const [code, tree] of Object.entries(locales)) for (const k of used) assert.ok(lookup(tree, k), `${code}: falta ${k}`);
});

test('acordes con cejilla: cada forma suena a su tríada con la tónica en el bajo; octava a 12 semitonos', () => {
  const expected: Record<string, [number, boolean]> = { 'bar-f': [5, false], 'bar-fm': [5, true], 'bar-g': [7, false], 'bar-am': [9, true], 'bar-bb': [10, false], 'bar-c': [0, false], 'bar-cm': [0, true], 'bar-dm': [2, true] };
  for (const [id, [root, minor]] of Object.entries(expected)) {
    const midi = diagramMidi(BARRES[id as keyof typeof BARRES]);
    const pcs = [...new Set(midi.map((m) => m % 12))].sort((a, b) => a - b);
    assert.deepEqual(pcs, [root, (root + (minor ? 3 : 4)) % 12, (root + 7) % 12].sort((a, b) => a - b), id);
    assert.equal(Math.min(...midi) % 12, root, `${id}: tónica en el bajo`);
  }
  const o = diagramMidi(OCTAVE);
  assert.equal(o[1] - o[0], 12);
});

test('bend: cuenta solo los intentos que llegan y se sostienen; avisa si queda corto', () => {
  const spec = { startMidi: 62, semitones: 2 as const };
  const f = (c: number) => m2f(62) * 2 ** (c / 1200);
  let s = initialBend();
  // Corto: llega a 150 cents y vuelve.
  for (const c of [0, 0, 60, 120, 150, 150, 100, 10]) s = stepBend(spec, s, f(c));
  assert.equal(s.reps, 0);
  assert.equal(s.short, 1);
  // Bien: llega a 200 y se sostiene.
  for (const c of [0, 80, 160, 195, 200, 200, 202, 199, 200, 201, 200, 200]) s = stepBend(spec, s, f(c));
  assert.equal(s.reps, 1);
  // Con soltar: no cuenta hasta volver.
  let r = initialBend();
  const rel = { ...spec, release: true };
  for (const c of [0, 100, 200, 200, 200, 200, 200, 200, 200, 200, 200]) r = stepBend(rel, r, f(c));
  assert.equal(r.reps, 0);
  assert.equal(r.phase, 'release');
  r = stepBend(rel, r, f(5));
  assert.equal(r.reps, 1);
});

test('vibrato: mide velocidad y ancho; una nota quieta no aprueba', () => {
  const wave = (hz: number, depth: number) => Array.from({ length: 220 }, (_, i) => ({ tMs: i * 23, cents: depth * Math.sin(2 * Math.PI * hz * i * 0.023) }));
  const good = analyzeVibrato(wave(5.5, 30));
  assert.ok(good && Math.abs(good.rateHz - 5.5) < 0.6);
  assert.ok(vibratoOk(good, 20));
  assert.equal(scoreVibrato(wave(5.5, 30), 20).accuracy, 1);
  assert.equal(vibratoOk(analyzeVibrato(wave(5.5, 8)), 20), false, 'muy angosto');
  assert.equal(vibratoOk(analyzeVibrato(wave(12, 30)), 20), false, 'muy rápido');
  const still = Array.from({ length: 220 }, (_, i) => ({ tMs: i * 23, cents: (i % 2) * 2 }));
  assert.ok(scoreVibrato(still, 20).accuracy < 0.2);
});

test('nivel 3: frases en compases completos, bends y vibratos en cuerdas y trastes de guitarra', () => {
  for (const sc of [LEG_PHRASE, SLIDE_PHRASE, BEND_PHRASE, VIB_PHRASE]) assert.ok(barsAreComplete(sc));
  assert.ok(BEND_PHRASE.some((e) => 'bend' in e && e.bend === 2));
  assert.ok(VIB_PHRASE.some((e) => 'vibrato' in e && e.vibrato));
  const parts = [...lessons.flatMap((l) => l.exercises), ...GUITAR_CP3.parts];
  const bv = parts.filter((e) => e.kind === 'bend' || e.kind === 'vibrato');
  assert.ok(bv.length >= 12);
  for (const e of bv) {
    if (e.kind !== 'bend' && e.kind !== 'vibrato') continue;
    assert.ok(guitarStrings.has(e.string), e.id);
    assert.ok(e.fret >= 1 && e.fret <= 20, e.id);
    // Los bends van en las cuerdas 1 a 3, como se enseña.
    if (e.kind === 'bend') assert.ok(['G', 'B', 'e'].includes(e.string), e.id);
  }
});
