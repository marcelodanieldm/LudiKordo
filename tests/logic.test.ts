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
