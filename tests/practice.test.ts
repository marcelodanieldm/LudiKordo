import { test } from 'node:test';
import assert from 'node:assert/strict';
import { backingSchedule, BACKING_STYLES, compBar, drumBar, parseChord, voiceChord } from '../src/music/backing';
import { BASS_MAX_HZ, LIVE_DETECTION_DELAY_MS, expireMissed, initLive, judgeOnset, liveAdvice, liveStats, maxHzFor } from '../src/music/live';
import { DRILLS, practiceItem } from '../src/content/drills';
import { availableTempos, liveExerciseId, liveResult, liveTargets, practiceStatuses } from '../src/content/practice';
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
  // «maj» sin 7 es mayor (no menor), y otras calidades comunes.
  assert.deepEqual(parseChord('Cmaj')?.intervals, [0, 4, 7]);
  assert.deepEqual(parseChord('Dsus2')?.intervals, [0, 2, 7]);
  assert.deepEqual(parseChord('C6')?.intervals, [0, 4, 7, 9]);
  assert.deepEqual(parseChord('Caug')?.intervals, [0, 4, 8]);
  assert.deepEqual(parseChord('C+')?.intervals, [0, 4, 8]);
  assert.equal(parseChord('xyz'), null);
});

test('acompañamiento: el teclado toca las notas del acorde lejos del registro del bajo', () => {
  for (const sym of ['C', 'Am7', 'G7', 'F#m', 'Bb', 'E5']) {
    const ch = parseChord(sym)!;
    const v = voiceChord(ch);
    assert.equal(v.length, ch.intervals.length);
    for (const m of v) {
      assert.ok(m >= 68 && m <= 79, `${sym}: ${m}`);
      assert.ok(ch.intervals.includes((m - ch.root + 120) % 12), `${sym}: ${m} no es del acorde`);
      // Por encima de todo lo que el juez acepta como bajo: la banda no se cuenta como nota.
      assert.ok(midiToFreq(m) > BASS_MAX_HZ, `${sym}: ${midiToFreq(m)} Hz`);
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
  // El aviso del micrófono llega tarde: recién después de la demora se da por perdida.
  assert.deepEqual(expireMissed(s, 3200).missed, []);
  const ex = expireMissed(s, 3000 + 80 + LIVE_DETECTION_DELAY_MS + 1);
  assert.deepEqual(ex.missed, [4]);
  const st = liveStats(ex.state);
  assert.deepEqual([st.hits, st.early, st.late, st.wrong, st.missed, st.judged], [3, 1, 1, 1, 1, 5]);
  assert.equal(liveAdvice({ ...st, accuracy: 0.9, early: 0, late: 0, hits: 9, judged: 10, wrong: 1, missed: 0 }), 'great');
  assert.equal(liveAdvice({ judged: 10, hits: 6, accuracy: 0.6, early: 4, late: 1, wrong: 0, missed: 0 }), 'early');
  assert.equal(liveAdvice({ judged: 10, hits: 2, accuracy: 0.2, early: 0, late: 0, wrong: 1, missed: 7 }), 'missing');
});

test('evaluación en vivo: aviso tardío, octava de arriba y corrección de una nota equivocada', () => {
  const hz = (m: number) => midiToFreq(m);
  const t = [{ timeMs: 1000, midi: 28 }, { timeMs: 1375, midi: 28 }];
  // Un aviso que llega 200 ms tarde con su sello de tiempo a tiempo sigue siendo acierto.
  let s = expireMissed(initLive(t), 1200).state;
  let r = judgeOnset(s, { timeMs: 1005, freq: hz(28) });
  assert.equal(r.verdict, 'hit');
  s = r.state;
  // El teléfono reporta el Mi grave una octava arriba: no es nota equivocada.
  r = judgeOnset(s, { timeMs: 1380, freq: hz(40) });
  assert.equal(r.verdict, 'hit');
  // Primero una altura vieja (otra nota) y enseguida la buena: se corrige a acierto.
  let u = initLive([{ timeMs: 1000, midi: 33 }]);
  u = judgeOnset(u, { timeMs: 990, freq: hz(28) }).state;
  assert.equal(u.verdicts[0], 'wrongNote');
  r = judgeOnset(u, { timeMs: 1020, freq: hz(33) });
  assert.equal(r.verdict, 'hit');
  assert.equal(liveStats(r.state).hits, 1);
  // Tope por ejercicio: nota más aguda una octava arriba + 3 semitonos (nunca más que el tope general).
  assert.ok(Math.abs(maxHzFor([{ timeMs: 0, midi: 28 }]) - midiToFreq(43)) < 1e-6);
  assert.equal(maxHzFor([{ timeMs: 0, midi: 70 }]), BASS_MAX_HZ);
  // La octava del Mi grave pasa el tope; el teclado de la banda, no.
  assert.equal(judgeOnset(initLive(t), { timeMs: 1000, freq: hz(40) }, 80, 50, maxHzFor(t)).verdict, 'hit');
  assert.equal(judgeOnset(initLive(t), { timeMs: 1000, freq: hz(60) }, 80, 50, maxHzFor(t)).verdict, null);
});

test('práctica: objetivos y resultado de una toma (estrellas, minutos, tempo nuevo)', () => {
  const d = DRILLS.find((x) => x.id === 'one-drop')!;
  const tg = liveTargets(d, 10000, 60);
  assert.equal(tg.length, d.line.filter((e) => !isRest(e)).length);
  assert.equal(tg[0].timeMs, 11000); // el uno es silencio: la primera nota entra en el 2
  assert.equal(tg[0].midi, midiAt('A', 0));
  const all = initLive(tg);
  const perfect = { ...all, verdicts: all.verdicts.map(() => 'hit' as const) };
  const res = liveResult(perfect, d, 72, undefined);
  assert.equal(res.stars, 3);
  assert.equal(res.unlockedNow, 80);
  // Si ya tenía 80 desbloqueado, no se anuncia otra vez.
  assert.equal(liveResult(perfect, d, 72, 80).unlockedNow, null);
  const none = liveResult(all, d, 72, undefined);
  assert.equal(none.stars, 0);
  assert.equal(none.unlockedNow, null);
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
    if (d.line.some((e) => e.beats < 1)) assert.ok(d.tempoSteps.every((b) => b <= 80), `${d.id}: corcheas a más de 80 bpm`);
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
    for (const tree of [en, es, pt] as unknown as { content: { drill: Record<string, { title?: string }> } }[]) assert.ok(tree.content.drill[d.id.replace(/-/g, '_')]?.title, `${d.id}: textos`);
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
