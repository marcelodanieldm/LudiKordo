import { test } from 'node:test';
import assert from 'node:assert/strict';
import { backingSchedule, BACKING_STYLES, compBar, drumBar, parseChord, voiceChord } from '../src/music/backing';
import { BASS_MAX_HZ, expireMissed, initLive, judgeOnset, liveAdvice, liveStats } from '../src/music/live';
import { DRILLS, practiceItem } from '../src/content/drills';
import { availableTempos, liveExerciseId, practiceStatuses } from '../src/content/practice';
import { isRest, scoreBarsComplete } from '../src/music/staff';
import { midiAt, midiToFreq } from '../src/music/notes';
import { LEVELS, lessonIdsOf } from '../src/content/curriculum';
import { SONGS } from '../src/content/songs';
import en from '../src/i18n/locales/en.json';
import es from '../src/i18n/locales/es.json';
import pt from '../src/i18n/locales/pt.json';

test('acompañamiento: lee el cifrado (calidades, alteraciones e inversiones)', () => {
  assert.deepEqual(parseChord('Am'), { root: 9, intervals: [0, 3, 7], bass: undefined });
  assert.deepEqual(parseChord('G7')?.intervals, [0, 4, 7, 10]);
  assert.deepEqual(parseChord('Cmaj7')?.intervals, [0, 4, 7, 11]);
  assert.deepEqual(parseChord('Am7')?.intervals, [0, 3, 7, 10]);
  assert.equal(parseChord('F#m')?.root, 6);
  assert.equal(parseChord('Bb')?.root, 10);
  assert.equal(parseChord('G/B')?.bass, 11);
  assert.deepEqual(parseChord('E5')?.intervals, [0, 7]);
  assert.equal(parseChord('xyz'), null);
});

test('acompañamiento: el teclado toca las notas del acorde lejos del registro del bajo', () => {
  for (const sym of ['C', 'Am7', 'G7', 'F#m', 'Bb', 'E5']) {
    const ch = parseChord(sym)!;
    const v = voiceChord(ch);
    assert.equal(v.length, ch.intervals.length);
    for (const m of v) {
      assert.ok(m >= 56 && m <= 67, `${sym}: ${m}`);
      assert.ok(ch.intervals.includes((m - ch.root + 120) % 12), `${sym}: ${m} no es del acorde`);
      // Muy por encima de lo que el juez de notas acepta como bajo.
      assert.ok(midiToFreq(m) > BASS_MAX_HZ - 140);
    }
  }
});

test('acompañamiento: patrones por estilo dentro del compás, one drop sin bombo en el 1', () => {
  for (const st of BACKING_STYLES) {
    for (const h of drumBar(st)) assert.ok(h.beat >= 0 && h.beat < 4, st);
    for (const c of compBar(st)) assert.ok(c.beat >= 0 && c.beat + c.beats <= 4.001, st);
  }
  const reggae = drumBar('reggae');
  assert.ok(!reggae.some((h) => h.beat === 0 && h.kind === 'kick'));
  assert.ok(reggae.some((h) => h.beat === 2 && h.kind === 'kick'));
  // Skank: acordes en los contratiempos.
  assert.ok(compBar('reggae').every((c) => c.beat % 1 === 0.5));
});

test('acompañamiento: programa con cuenta, partes que se pueden apagar y dos acordes por compás', () => {
  const s = backingSchedule({ chords: ['C', 'Dm G'], bpm: 60, style: 'ballad', drums: true, keys: true, click: false, countIn: 4 });
  assert.equal(s.startSec, 4);
  assert.equal(s.lengthSec, 12);
  assert.equal(s.clicks.length, 4); // solo la cuenta
  assert.ok(s.drums.every((d) => d.timeSec >= 4));
  assert.equal(s.keys.length, 2);
  assert.deepEqual(s.keys[1].midis.map((m) => m % 12).sort(), [2, 5, 9]); // Dm entra en el compás 2
  const off = backingSchedule({ chords: ['C'], bpm: 120, style: 'rock', drums: false, keys: false, click: true });
  assert.equal(off.drums.length, 0);
  assert.equal(off.keys.length, 0);
  assert.equal(off.clicks.length, 8); // cuenta + 4 pulsos
});

test('evaluación en vivo: a tiempo, antes, después, otra nota, perdida e interferencias', () => {
  const t = [
    { timeMs: 1000, midi: 33 },
    { timeMs: 1500, midi: 33 },
    { timeMs: 2000, midi: 38 },
    { timeMs: 2500, midi: 28 },
    { timeMs: 3000, midi: 28 },
  ];
  let s = initLive(t);
  const hz = (m: number) => midiToFreq(m);
  let r = judgeOnset(s, { timeMs: 1010, freq: hz(33) });
  assert.equal(r.verdict, 'hit');
  s = r.state;
  r = judgeOnset(s, { timeMs: 1430, freq: hz(33) });
  assert.equal(r.verdict, 'early');
  s = r.state;
  r = judgeOnset(s, { timeMs: 2070, freq: hz(38) });
  assert.equal(r.verdict, 'late');
  s = r.state;
  // El teclado de la banda que se cuela por el parlante no cuenta.
  r = judgeOnset(s, { timeMs: 2500, freq: 440 });
  assert.equal(r.verdict, null);
  r = judgeOnset(s, { timeMs: 2500, freq: hz(30) });
  assert.equal(r.verdict, 'wrongNote');
  s = r.state;
  assert.equal(s.streak, 0);
  assert.equal(s.bestStreak, 3);
  // Lejos de toda nota pendiente: nada cambia.
  assert.equal(judgeOnset(s, { timeMs: 2750, freq: hz(28) }).verdict, null);
  const ex = expireMissed(s, 3200);
  assert.deepEqual(ex.missed, [4]);
  const st = liveStats(ex.state);
  assert.deepEqual([st.hits, st.early, st.late, st.wrong, st.missed, st.judged], [3, 1, 1, 1, 1, 5]);
  assert.equal(liveAdvice({ ...st, accuracy: 0.9, early: 0, late: 0, hits: 9, judged: 10, wrong: 1, missed: 0 }), 'great');
  assert.equal(liveAdvice({ judged: 10, hits: 6, accuracy: 0.6, early: 4, late: 1, wrong: 0, missed: 0 }), 'early');
  assert.equal(liveAdvice({ judged: 10, hits: 2, accuracy: 0.2, early: 0, late: 0, wrong: 1, missed: 7 }), 'missing');
});

test('práctica: ejercicios bien escritos, con banda y un nivel que coincide con lo que piden', () => {
  assert.ok(DRILLS.length >= 6);
  const modules = LEVELS.flatMap((l) => l.modules.map((m) => m.id));
  const pc = (name: string) => parseChord(name)!;
  for (const d of DRILLS) {
    assert.ok(scoreBarsComplete(d.line), d.id);
    assert.equal(d.chords.length, d.line.reduce((a, e) => a + e.beats, 0) / 4, `${d.id}: un acorde por compás`);
    for (const m of d.requires) assert.ok(modules.includes(m), `${d.id}: ${m}`);
    assert.equal(d.level, Math.max(...d.requires.map((m) => Number(m[0]))), `${d.id}: nivel`);
    assert.equal(d.tempoSteps[0], d.bpm);
    if (d.line.some((e) => e.beats < 1)) assert.ok(d.bpm <= 80, `${d.id}: corcheas a más de 80 bpm`);
    if (d.notation === 'tab') assert.ok(d.line.every((e) => !isRest(e) && e.beats >= 1), `${d.id}: tablatura`);
    // La primera nota de cada compás es la raíz del acorde (salvo el ejercicio cromático).
    if (d.id !== 'spider-groove') {
      let beat = 0;
      const first = new Map<number, number>();
      for (const e of d.line) {
        const bar = Math.floor(beat / 4);
        if (!isRest(e) && !first.has(bar)) first.set(bar, midiAt(e.string, e.fret) % 12);
        beat += e.beats;
      }
      d.chords.forEach((c, bar) => assert.equal(first.get(bar), pc(c.split(' ')[0]).root, `${d.id} compás ${bar + 1}`));
    }
    for (const tree of [en, es, pt] as Record<string, any>[]) assert.ok(tree.content.drill[d.id.replace(/-/g, '_')]?.title, `${d.id}: textos`); // eslint-disable-line @typescript-eslint/no-explicit-any
  }
});

test('práctica: estado, tempos disponibles y canciones del cancionero con banda', () => {
  const done = (ids: string[]) => new Set(ids.flatMap((m) => lessonIdsOf(LEVELS.flatMap((l) => l.modules).find((x) => x.id === m)!)));
  const st = practiceStatuses(DRILLS, done(['1.3', '1.4']), new Set(), () => true, () => 0);
  assert.equal(st.find((s) => s.item.id === 'rock-quarters')!.state, 'open');
  assert.equal(st.find((s) => s.item.id === 'one-drop')!.state, 'locked');
  assert.equal(practiceStatuses(DRILLS, new Set(), new Set(), () => false, () => 0)[0].state, 'premium');
  const rock = DRILLS.find((d) => d.id === 'rock-quarters')!;
  assert.deepEqual(availableTempos(rock, undefined), [80]);
  assert.deepEqual(availableTempos(rock, 100), [80, 90, 100]);
  assert.equal(liveExerciseId('one-drop'), 'live-one-drop');
  const song = practiceItem(`song-${SONGS[0].id}`)!;
  assert.equal(song.line, SONGS[0].line);
  assert.equal(practiceItem('nope'), undefined);
});
