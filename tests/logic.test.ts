import { test } from 'node:test';
import assert from 'node:assert/strict';
import { expectedTimes, scorePlayAlong, scoreTiming, starsFor, xpFor } from '../src/music/scoring';
import { midiToFreq } from '../src/music/notes';
import { currentWeekDays, needsReview, weeklyStreak, weekMet } from '../src/state/rules';
import { LEVELS, allLessonIds, isUnlocked, nextLesson, totalLessons, levelProgress } from '../src/content/curriculum';
import { annualSavingsPct, canOpenLesson, isLessonFree } from '../src/billing/access';

test('el currículo tiene 5 niveles, 25 módulos y 123 lecciones', () => {
  assert.equal(LEVELS.length, 5);
  assert.equal(LEVELS.flatMap((l) => l.modules).length, 25);
  assert.equal(totalLessons(), 123);
  assert.equal(allLessonIds()[0], '1.1.1');
  assert.equal(allLessonIds().at(-1), '5.5.4');
});

test('desbloqueo secuencial y salto de nivel', () => {
  const done = new Set(['1.1.1', '1.1.2']);
  assert.ok(isUnlocked('1.1.1', new Set()));
  assert.ok(isUnlocked('1.1.3', done));
  assert.ok(!isUnlocked('1.1.4', done));
  assert.ok(isUnlocked('1.2.1', new Set(['1.1.5'])));
  assert.ok(isUnlocked('2.1.1', new Set(), new Set([1])));
  assert.equal(nextLesson(done), '1.1.3');
  assert.equal(levelProgress(1, done), 2 / 25);
});

test('gratis: módulos 1.1 y 1.2; el resto pide Premium', () => {
  assert.ok(isLessonFree('1.1.4'));
  assert.ok(isLessonFree('1.2.5'));
  assert.ok(!isLessonFree('1.3.1'));
  assert.ok(canOpenLesson('1.3.1', true));
  assert.ok(!canOpenLesson('5.5.4', false));
});

test('el plan anual ahorra 25% frente a dos semestres', () => {
  assert.equal(annualSavingsPct(44.99, 29.99), 25);
});

test('ritmo: aciertos dentro de ±80 ms, cada ataque se usa una sola vez', () => {
  const exp = expectedTimes(4, 60); // 0, 1000, 2000, 3000
  assert.deepEqual(exp, [0, 1000, 2000, 3000]);
  const r = scoreTiming(exp, [10, 1070, 1075, 3200]);
  assert.equal(r.hits, 2);
  assert.equal(r.offsets[0], 10);
  assert.equal(r.offsets[1], 70);
  assert.equal(r.offsets[2], null); // 1075 no cuenta dos veces
  assert.equal(r.offsets[3], null); // 200 ms tarde
});

test('tocar con la pista: la nota tiene que ser la correcta', () => {
  const targets = [
    { timeMs: 0, midi: 29 },
    { timeMs: 1000, midi: 30 },
  ];
  const r = scorePlayAlong(targets, [
    { timeMs: 5, freq: midiToFreq(29) },
    { timeMs: 1005, freq: midiToFreq(31) }, // nota equivocada a tiempo
  ]);
  assert.equal(r.hits, 1);
});

test('estrellas y XP', () => {
  assert.equal(starsFor(0.8, 0.8), 3);
  assert.equal(starsFor(0.65, 0.8), 2);
  assert.equal(starsFor(0.45, 0.8), 1);
  assert.equal(starsFor(0.2, 0.8), 0);
  assert.equal(xpFor(3), 25);
  assert.equal(xpFor(0, true), 60);
});

test('racha semanal con comodín', () => {
  assert.ok(weekMet(4, 5));
  assert.ok(!weekMet(3, 5));
  // Lunes 2026-11-09. Semanas anteriores: 26 oct y 2 nov.
  const days = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05'];
  assert.equal(weeklyStreak(days, 4, '2026-11-09'), 2); // la semana en curso no corta la racha
  assert.equal(weeklyStreak([...days, '2026-11-09', '2026-11-10', '2026-11-11'], 4, '2026-11-11'), 3);
  assert.equal(weeklyStreak(['2026-10-26', '2026-10-27', '2026-10-28'], 4, '2026-11-09'), 0); // semana del 2/11 sin práctica
  assert.deepEqual(currentWeekDays(['2026-11-09', '2026-11-11'], '2026-11-12'), [true, false, true, false, false, false, false]);
});

test('repaso después de 14 días sin practicar una habilidad', () => {
  assert.ok(!needsReview('2026-11-01', '2026-11-15'));
  assert.ok(needsReview('2026-10-31', '2026-11-15'));
  assert.ok(!needsReview(undefined, '2026-11-15'));
});

test('bodyFont elige la familia de Nunito según el peso', async () => {
  const { bodyFont, fonts } = await import('../src/theme');
  assert.equal(bodyFont(undefined), fonts.regular);
  assert.equal(bodyFont('normal'), fonts.regular);
  assert.equal(bodyFont('600'), fonts.semibold);
  assert.equal(bodyFont('bold'), fonts.bold);
  assert.equal(bodyFont('700'), fonts.bold);
  assert.equal(bodyFont('800'), fonts.extrabold);
  assert.equal(bodyFont(900), fonts.black);
});

test('los colores de texto del tema cumplen contraste 4,5:1 sobre las superficies', async () => {
  const { colors } = await import('../src/theme');
  const lum = (hex: string) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const ratio = (a: string, b: string) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  for (const bg of [colors.bg, colors.card, colors.raised]) {
    for (const fg of [colors.ink, colors.muted, colors.accentInk, colors.teal, colors.gold, colors.danger]) {
      assert.ok(ratio(fg, bg) >= 4.5, `${fg} sobre ${bg}: ${ratio(fg, bg).toFixed(2)}`);
    }
  }
  for (const bg of [colors.accent, colors.gold, colors.teal, colors.fingerI, colors.fingerM]) {
    assert.ok(ratio(colors.onAccent, bg) >= 4.5, `onAccent sobre ${bg}`);
  }
  assert.ok(ratio(colors.accentInk, colors.accentSoft) >= 4.5);
  assert.ok(ratio(colors.accentInk, colors.bar) >= 4.5, "pestaña activa");
  assert.ok(ratio(colors.muted, colors.bar) >= 4.5, "pestaña inactiva");
  assert.ok(ratio(colors.teal, colors.tealSoft) >= 4.5);
  assert.ok(ratio(colors.gold, colors.goldSoft) >= 4.5);
});

test('tablatura: compases completos, posición y conteo de cada figura', async () => {
  const { barsAreComplete, countFor, figureOf, placeNotes, totalBeats } = await import('../src/music/tab');
  const bar1 = [
    { string: 'E' as const, fret: 0, beats: 4 as const },
    { string: 'A' as const, fret: 0, beats: 2 as const },
    { string: 'A' as const, fret: 2, beats: 2 as const },
    { string: 'D' as const, fret: 0, beats: 1 as const },
    { string: 'D' as const, fret: 0, beats: 1 as const },
    { string: 'D' as const, fret: 2, beats: 2 as const },
  ];
  assert.equal(totalBeats(bar1), 12);
  assert.ok(barsAreComplete(bar1));
  const placed = placeNotes(bar1);
  assert.deepEqual(placed.map((n) => [n.bar, n.beatInBar]), [[0, 0], [1, 0], [1, 2], [2, 0], [2, 1], [2, 2]]);
  assert.deepEqual(countFor(placed[0]), [1, 2, 3, 4]);
  assert.deepEqual(countFor(placed[2]), [3, 4]);
  assert.deepEqual(['whole', 'half', 'quarter'], [4, 2, 1].map((b) => figureOf(b as 1 | 2 | 4)));
  // Una blanca en el pulso 4 cruza la barra; tres negras no completan el compás.
  assert.ok(!barsAreComplete([{ string: 'E', fret: 0, beats: 1 }, { string: 'E', fret: 0, beats: 2 }, { string: 'E', fret: 0, beats: 2 }, { string: 'E', fret: 0, beats: 1 }]));
  assert.ok(!barsAreComplete([{ string: 'E', fret: 0, beats: 1 }, { string: 'E', fret: 0, beats: 1 }, { string: 'E', fret: 0, beats: 1 }]));
  assert.ok(!barsAreComplete([]));
});

test('entrenador de tempo: sin clic se tolera más y se mide si el alumno apura', async () => {
  const { driftAdvice, expectedTimes, scoreTempoTrainer } = await import('../src/music/scoring');
  const expected = expectedTimes(8, 60); // 0, 1000, …, 7000
  // 4 pulsos con clic perfectos; 4 sin clic, 70 ms antes cada uno (apurado pero dentro de ±80).
  const taps = [0, 1000, 2000, 3000, 3930, 4930, 5930, 6930];
  const r = scoreTempoTrainer(expected, taps, 4);
  assert.equal(r.hits, 8);
  assert.equal(Math.round(r.driftMs!), -70);
  assert.equal(driftAdvice(r.driftMs), 'early');
  // Con clic, 70 ms de desvío ya no cuenta (tolerancia de pantalla, ±60).
  const r2 = scoreTempoTrainer(expected, [70, 1000, 2000, 3000, 4000, 5000, 6000, 7000], 4);
  assert.equal(r2.hits, 7);
  assert.equal(driftAdvice(r2.driftMs), 'steady');
  assert.equal(driftAdvice(40), 'late');
  // Un mismo toque no cuenta para dos pulsos.
  assert.equal(scoreTempoTrainer(expected, [3990], 4).hits, 1);
});

test('entrenador de tempo: apurarse mucho o no marcar no es «pulso firme»', async () => {
  const { driftAdvice, expectedTimes, scoreTempoTrainer } = await import('../src/music/scoring');
  const expected = expectedTimes(8, 60);
  // Sin toques en la parte sin clic.
  const none = scoreTempoTrainer(expected, [0, 1000, 2000, 3000], 4);
  assert.equal(none.driftMs, null);
  assert.equal(driftAdvice(none.driftMs), 'missing');
  // Se adelanta 150 ms en cada pulso sin clic: fuera de tolerancia, pero el consejo lo dice.
  const rush = scoreTempoTrainer(expected, [0, 1000, 2000, 3000, 3850, 4850, 5850, 6850], 4);
  assert.equal(rush.hits, 4);
  assert.equal(driftAdvice(rush.driftMs), 'early');
});

test('entrenador de tempo: el desvío descuenta la latencia propia de cada teléfono', async () => {
  const { driftAdvice, expectedTimes, scoreTempoTrainer } = await import('../src/music/scoring');
  const expected = expectedTimes(8, 60);
  // Teléfono con 50 ms de latencia: todos los toques llegan 50 ms tarde, con y sin clic.
  const r = scoreTempoTrainer(expected, expected.map((t) => t + 50), 4);
  assert.equal(driftAdvice(r.driftMs), 'steady');
  // Dos toques con la misma hora: solo uno se usa y el otro queda libre.
  const dup = scoreTempoTrainer(expected, [0, 0, 1000, 2000, 3000], 4);
  assert.equal(dup.hits, 4);
});

test('tocar con el bajo: figuras de distinta duración', async () => {
  const { noteIndexAt, noteTimes } = await import('../src/music/scoring');
  // Redonda, blanca, negra, negra a 60 bpm.
  const times = noteTimes([4, 2, 1, 1], 60, 1000);
  assert.deepEqual(times, [1000, 5000, 7000, 8000]);
  assert.equal(noteIndexAt(times, 500), -1);
  assert.equal(noteIndexAt(times, 4999), 0);
  assert.equal(noteIndexAt(times, 5000), 1);
  assert.equal(noteIndexAt(times, 9000), 3);
  // Todas negras: igual que el pulso del metrónomo.
  assert.deepEqual(noteTimes([1, 1, 1], 120), [0, 500, 1000]);
});

test('tablatura: renglones de compases enteros según el ancho', async () => {
  const { MIN_BEAT_W, layoutTab, TAB_LABEL_W } = await import('../src/music/tab');
  const bar = (fret: number) => [0, 1, 2, 3].map(() => ({ string: 'E' as const, fret, beats: 1 as const }));
  const four = [...bar(0), ...bar(1), ...bar(12), ...bar(3)];
  // Teléfono (≈ 320 dp útiles): 2 compases por renglón, 2 renglones.
  const phone = layoutTab(four, 320);
  assert.equal(phone.barsPerRow, 2);
  assert.equal(phone.rows, 2);
  assert.deepEqual(phone.barsInRow, [2, 2]);
  assert.ok(phone.beatW >= MIN_BEAT_W);
  // El compás 3 empieza otro renglón, otra vez a la izquierda.
  assert.equal(phone.notes[8].row, 1);
  assert.equal(phone.notes[8].x, phone.notes[0].x);
  // Las notas nunca se pisan: separación ≥ ancho mínimo de pulso.
  for (let i = 1; i < 4; i++) assert.ok(phone.notes[i].x - phone.notes[i - 1].x >= MIN_BEAT_W);
  // Tablet: los 4 compases en un renglón.
  assert.equal(layoutTab(four, 900).rows, 1);
  // Muy angosto: un compás por renglón y pide desplazamiento horizontal.
  const tiny = layoutTab(four, 100);
  assert.equal(tiny.barsPerRow, 1);
  assert.ok(tiny.width >= TAB_LABEL_W + 8 + 4 * MIN_BEAT_W);
  // Sin notas: nada que dibujar.
  assert.equal(layoutTab([], 320).rows, 0);
});

test('opciones de nota en letras se muestran según idioma y notación', async () => {
  const { letterNoteLabel, noteName } = await import('../src/music/notes');
  assert.equal(letterNoteLabel('E', 'es', 'both'), noteName(28, 'es', 'both'));
  assert.equal(letterNoteLabel('E', 'en', 'letters'), 'E');
  assert.equal(letterNoteLabel('F♯', 'pt', 'letters'), noteName(30, 'pt', 'letters'));
  assert.equal(letterNoteLabel('G', 'es', 'solfege'), noteName(31, 'es', 'solfege'));
  // Los números y textos no son notas.
  assert.equal(letterNoteLabel('3', 'es', 'both'), null);
  assert.equal(letterNoteLabel('Mi', 'es', 'both'), null);
});
