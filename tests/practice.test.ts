import { test } from 'node:test';
import assert from 'node:assert/strict';
import en from '../src/i18n/locales/en.json';
import es from '../src/i18n/locales/es.json';
import pt from '../src/i18n/locales/pt.json';
import { DRUM_STYLES, drumSchedule, type DrumStyle } from '../src/music/drums';
import { JAM_PARTS, PART_LEVEL, jamSchedule } from '../src/music/jam';
import { ON_TIME_MS, cleanDetections, judgeLive } from '../src/music/live';
import { chordFromName } from '../src/music/chords';
import { midiToFreq } from '../src/music/notes';
import { barsAreComplete } from '../src/music/tab';
import { BASS, GUITAR, midiOn, type StringId } from '../src/instruments/profiles';
import { BASS_DRILLS, DRILLS, DRILL_CATEGORIES, GUITAR_DRILLS, drillState, missingModule } from '../src/content/practice';
import { LEVELS } from '../src/content/curriculum';
import { GUITAR_LEVELS } from '../src/content/guitar/curriculum';
import { GUITAR_GENRES } from '../src/content/songs';

const f = midiToFreq;

test('batería: patrones dentro del compás y golpes en su lugar', () => {
  for (const [style, p] of Object.entries(DRUM_STYLES)) {
    for (const k of ['kick', 'snare', 'hat', 'ride'] as const) assert.ok(p[k].every((s) => s >= 0 && s < p.steps), `${style} ${k}`);
    assert.ok(p.kick.includes(0), `${style}: bombo en el 1`);
  }
  // Rock a 60 bpm: 2 compases después de 4 pulsos de cuenta.
  const hits = drumSchedule('rock', 2, 60, 4);
  assert.equal(hits.filter((h) => h.kind === 'kick').length, 6);
  assert.equal(hits[0].startSec, 4);
  assert.ok(hits.filter((h) => h.kind === 'snare').map((h) => h.startSec).includes(5), 'caja en el 2');
  assert.ok(hits.every((h, i) => i === 0 || h.startSec >= hits[i - 1].startSec), 'ordenados');
});

test('acompañamiento: el bajo toca la tónica en el 1 y cada parte se puede apagar', () => {
  const chords = ['Am', 'G', 'F', 'G'];
  const all = jamSchedule({ chords, bpm: 60, style: 'pop', loops: 2, parts: ['drums', 'bass', 'keys'], countIn: 4 });
  assert.equal(all.bodyBeats, 32);
  assert.equal(all.lengthSec, 36);
  const bass = all.notes.filter((n) => n.tone === 'ebass');
  chords.forEach((c, bar) => {
    const first = bass.find((n) => Math.abs(n.startSec - (4 + bar * 4)) < 1e-9);
    assert.ok(first, `compás ${bar + 1}`);
    assert.equal(Math.round(12 * Math.log2(first!.freq / 440) + 69) % 12, chordFromName(c)![0] % 12, `tónica de ${c}`);
  });
  // El teclado no toca la tónica grave y va más bajo que el bajo.
  const keys = all.notes.filter((n) => n.tone === 'keys');
  assert.ok(keys.length > 0 && keys.every((n) => n.level === PART_LEVEL.keys));
  assert.ok(all.drums.length > 0);
  const noDrums = jamSchedule({ chords, bpm: 60, style: 'pop', loops: 1, parts: ['keys'], countIn: 4 });
  assert.equal(noDrums.drums.length, 0);
  assert.ok(noDrums.notes.every((n) => n.tone === 'keys'));
  // Walking de jazz: cuatro negras por compás, la última a un semitono de la próxima tónica.
  const jazz = jamSchedule({ chords: ['Dm7', 'G7'], bpm: 60, style: 'jazz', loops: 1, parts: ['bass'], countIn: 0 });
  assert.equal(jazz.notes.length, 8);
  const midi = (x: number) => Math.round(12 * Math.log2(x / 440) + 69);
  assert.equal(Math.abs(midi(jazz.notes[3].freq) - chordFromName('G7')![0]), 1);
  // Guitarra rasgueada (app de bajo).
  const gtr = jamSchedule({ chords: ['C', 'G'], bpm: 60, style: 'rock', loops: 1, parts: ['guitar'], countIn: 4 });
  assert.ok(gtr.notes.length > 8 && gtr.notes.every((n) => n.tone === 'crunch' && n.startSec >= 4));
});

test('acompañamiento: la app nunca suma el mismo instrumento que toca el alumno', () => {
  // Las pruebas corren como bajo.
  assert.ok(!JAM_PARTS.includes('bass'));
  for (const d of GUITAR_DRILLS) assert.ok(!d.parts.includes('guitar'), d.id);
  for (const d of BASS_DRILLS) assert.ok(!d.parts.includes('bass'), d.id);
});

test('en vivo: acierto a tiempo, antes, tarde, nota equivocada, perdida y pendiente', () => {
  const targets = [0, 1000, 2000, 3000, 4000, 5000].map((timeMs, i) => ({ timeMs, midi: 45 + i }));
  const detected = [
    { timeMs: 10, freq: f(45) }, // a tiempo
    { timeMs: 1000 - (ON_TIME_MS + 20), freq: f(46) }, // antes
    { timeMs: 2000 + ON_TIME_MS + 20, freq: f(47) }, // tarde
    { timeMs: 3005, freq: f(60) }, // otra nota
    // 4000: nada
    { timeMs: 4990, freq: f(50) }, // ya llegó la del 5000: se decide sin esperar
  ];
  const s = judgeLive(targets, detected, 5000);
  assert.deepEqual(s.verdicts, ['hit', 'early', 'late', 'wrong', 'miss', 'hit']);
  assert.equal(s.played[3], 60);
  assert.equal(s.hits, 4);
  assert.equal(s.decided, 6);
  assert.equal(s.streak, 1);
  assert.equal(s.bestStreak, 3);
  assert.equal(s.last, 5);
  // Antes de que cierre la ventana, una nota sin tocar sigue pendiente.
  const early = judgeLive(targets, detected.slice(0, 1), 1020);
  assert.deepEqual(early.verdicts.slice(0, 2), ['hit', 'pending']);
  assert.equal(early.accuracy, 1);
  // Un mismo ataque no cuenta para dos notas.
  const twice = judgeLive([{ timeMs: 0, midi: 45 }, { timeMs: 60, midi: 45 }], [{ timeMs: 30, freq: f(45) }], 1000);
  assert.equal(twice.hits, 1);
});

test('en vivo: se descarta lo que el micrófono oye del acompañamiento, pero nunca la nota esperada', () => {
  const detected = [
    { timeMs: 1050, freq: f(40) }, // eco de la pista (misma nota, justo después)
    { timeMs: 2040, freq: f(31) }, // retumbe del bombo
    { timeMs: 2050, freq: f(33) }, // la nota que tocaba justo después del bombo: queda
    { timeMs: 3000, freq: f(40) }, // nota tuya lejos de todo: queda
    { timeMs: 4010, freq: f(45) }, // la pista toca la misma nota que tú en el mismo pulso: queda
  ];
  const kept = cleanDetections(detected, [{ timeMs: 1000, midi: 40 }, { timeMs: 4000, midi: 45 }], [2000], [{ timeMs: 2000, midi: 33 }, { timeMs: 4000, midi: 45 }]);
  assert.deepEqual(kept.map((d) => d.timeMs), [2050, 3000, 4010]);
});

test('en vivo: con bajo y teclado tocando las mismas notas, tocar perfecto da 100 %', () => {
  const sched = jamSchedule({ chords: ['Am', 'Am'], bpm: 60, style: 'pop', loops: 1, parts: ['drums', 'bass', 'keys'], countIn: 0 });
  const backing = sched.notes.map((n) => ({ timeMs: n.startSec * 1000, midi: Math.round(12 * Math.log2(n.freq / 440) + 69) }));
  const drumHits = sched.drums.filter((d) => d.kind !== 'hat' && d.kind !== 'ride').map((d) => d.startSec * 1000);
  // El alumno toca justo las notas de la pista (tónica y quinta) en cada pulso.
  const targets = Array.from({ length: 8 }, (_, i) => ({ timeMs: i * 1000, midi: backing.find((b) => Math.abs(b.timeMs - i * 1000) < 1)?.midi ?? 45 }));
  const detected = targets.map((t) => ({ timeMs: t.timeMs + 10, freq: f(t.midi) }));
  const s = judgeLive(targets, cleanDetections(detected, backing, drumHits, targets), Infinity);
  assert.equal(s.hits, targets.length);
});

test('en vivo: no marca «perdida» antes de que la nota pueda llegar, y una nota no roba el acierto de la siguiente', () => {
  const targets = [{ timeMs: 1000, midi: 45 }, { timeMs: 1136, midi: 47 }];
  // La nota llega al detector un poco tarde: a los 1090 ms todavía no se la da por perdida.
  assert.equal(judgeLive(targets, [], 1090).verdicts[0], 'pending');
  assert.deepEqual(judgeLive(targets, [{ timeMs: 1030, freq: f(45) }], 1150).verdicts.slice(0, 1), ['hit']);
  // Tocar la segunda nota antes de tiempo no la convierte en «equivocada» de la primera.
  const s = judgeLive(targets, [{ timeMs: 1070, freq: f(47) }], 5000);
  assert.deepEqual(s.verdicts, ['miss', 'early']);
});

const levelsOf = { bass: LEVELS, guitar: GUITAR_LEVELS };
const profiles = { bass: BASS, guitar: GUITAR };

test('ejercicios de práctica: válidos para su instrumento y con módulos que existen', () => {
  assert.equal(DRILLS, BASS_DRILLS, 'las pruebas corren como bajo');
  for (const [inst, list] of [['bass', BASS_DRILLS], ['guitar', GUITAR_DRILLS]] as const) {
    const modules = levelsOf[inst].flatMap((l) => l.modules.map((m) => m.id));
    assert.equal(new Set(list.map((d) => d.id)).size, list.length, `${inst}: ids únicos`);
    for (const d of list) {
      assert.ok(DRILL_CATEGORIES.includes(d.category), d.id);
      for (const m of d.requires) assert.ok(modules.includes(m), `${d.id}: módulo ${m}`);
      assert.equal(d.level, Math.max(...d.requires.map((m) => Number(m.split('.')[0]))), `${d.id}: nivel`);
      assert.ok(d.tempoSteps.every((b, i) => i === 0 || b > d.tempoSteps[i - 1]), `${d.id}: tempos`);
      for (const c of d.chords) assert.ok(chordFromName(c), `${d.id}: acorde ${c}`);
      assert.ok(d.parts.length > 0);
      if (d.kind === 'line') {
        const line = d.line!;
        assert.ok(barsAreComplete(line), `${d.id}: compases`);
        assert.equal(line.reduce((a, e) => a + e.beats, 0), d.chords.length * 4, `${d.id}: un acorde por compás`);
        if (line.some((e) => e.beats < 1)) assert.ok(d.tempoSteps[0] <= 80, `${d.id}: corcheas a ${d.tempoSteps[0]}`);
        for (const e of line) {
          if ('rest' in e) continue;
          const midi = midiOn(profiles[inst], e.string as StringId, e.fret);
          assert.ok(Number.isFinite(midi) && e.fret <= profiles[inst].frets, `${d.id}: ${e.string}${e.fret}`);
        }
      } else {
        assert.ok(d.scale && d.scale.length >= 5 && d.minNotes && d.minNotes > 0, d.id);
      }
    }
  }
  // Hay improvisación y ejercicios de nivel 1 en las dos apps.
  for (const list of [BASS_DRILLS, GUITAR_DRILLS]) {
    assert.ok(list.some((d) => d.kind === 'improv'));
    assert.ok(list.some((d) => d.level === 1));
  }
  assert.ok(GUITAR_GENRES.length > 0);
});

test('ejercicios de práctica: se abren al terminar sus módulos', () => {
  const d = BASS_DRILLS.find((x) => x.id === 'b-roots')!;
  const all = () => true;
  assert.equal(drillState(d, new Set(), new Set(), all), 'locked');
  assert.equal(missingModule(d, new Set(), new Set()), '1.5');
  assert.equal(drillState(d, new Set(), new Set([1]), all), 'open', 'nivel saltado con el checkpoint');
  assert.equal(drillState(d, new Set(), new Set([1]), () => false), 'premium');
});

test('ejercicios de práctica: títulos, descripciones y textos de la pantalla en los 3 idiomas', () => {
  for (const [lang, tree] of Object.entries({ es, en, pt })) {
    const get = (key: string) => key.split('.').reduce<unknown>((o, p) => (o as Record<string, unknown> | undefined)?.[p], tree);
    for (const d of [...BASS_DRILLS, ...GUITAR_DRILLS]) {
      assert.equal(typeof get(d.titleKey), 'string', `${lang}: ${d.titleKey}`);
      assert.equal(typeof get(d.descKey), 'string', `${lang}: ${d.descKey}`);
    }
    for (const c of DRILL_CATEGORIES) assert.equal(typeof get(`ui.drills.category.${c}`), 'string', `${lang}: categoría ${c}`);
    for (const p of ['drums', 'bass', 'guitar', 'keys']) assert.equal(typeof get(`ui.drills.part.${p}`), 'string', `${lang}: ${p}`);
    for (const s of Object.keys(DRUM_STYLES) as DrumStyle[]) assert.equal(typeof get(`ui.drills.style.${s}`), 'string', `${lang}: ${s}`);
    for (const v of ['hit', 'early', 'late', 'wrong', 'miss']) assert.equal(typeof get(`ui.drills.verdict.${v}`), 'string', `${lang}: ${v}`);
  }
});
