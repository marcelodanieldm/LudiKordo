import { test } from 'node:test';
import assert from 'node:assert/strict';
import en from '../src/i18n/locales/en.json';
import es from '../src/i18n/locales/es.json';
import pt from '../src/i18n/locales/pt.json';
import { GENRES, SONGS } from '../src/content/songs';
import { firstSongModule, keyParts, moduleLearned, recommendedSong, songbook, songStatus } from '../src/content/songbook';
import { LEVELS, lessonIdsOf } from '../src/content/curriculum';
import { eventAt, isRest, noteEventIndexes, noteStartBeats, scoreBarsComplete, spell } from '../src/music/staff';
import { midiAt } from '../src/music/notes';
import type { Genre } from '../src/content/types';

const modules = LEVELS.flatMap((l) => l.modules);
const lessonsOf = (...ids: string[]) => ids.flatMap((id) => lessonIdsOf(modules.find((m) => m.id === id)!));
const all = () => true;

test('cancionero: 2 canciones por cada género pedido, todas con compases completos', () => {
  const wanted: Genre[] = ['reggae', 'bossa', 'soul', 'blues', 'rock', 'pop', 'ballad'];
  assert.deepEqual([...GENRES].sort(), [...wanted].sort());
  for (const g of wanted) assert.ok(SONGS.filter((s) => s.genre === g).length >= 2, g);
  assert.equal(new Set(SONGS.map((s) => s.id)).size, SONGS.length);
  for (const s of SONGS) {
    assert.ok(scoreBarsComplete(s.line), `${s.id}: compases incompletos`);
    // Un acorde por compás.
    assert.equal(s.chords.length, s.line.reduce((a, e) => a + e.beats, 0) / 4, `${s.id}: cifrado y compases no coinciden`);
    assert.ok(s.tempoSteps[0] === s.bpm && s.tempoSteps.every((b, i) => i === 0 || b > s.tempoSteps[i - 1]), `${s.id}: tempos`);
    for (const m of s.requires) assert.ok(modules.some((x) => x.id === m), `${s.id}: módulo ${m}`);
    // El nivel de la canción es el del módulo más avanzado que pide.
    assert.equal(s.level, Math.max(...s.requires.map((m) => Number(m[0]))), `${s.id}: nivel`);
    // La tablatura solo dibuja negras, blancas y redondas sin silencios.
    if (s.notation === 'tab') assert.ok(s.line.every((e) => !isRest(e) && e.beats >= 1), `${s.id}: tablatura con corcheas o silencios`);
    // Corcheas y silencios se leen en pentagrama: piden el módulo 2.6 o un nivel posterior.
    if (s.notation === 'staff') assert.ok(s.level >= 3 || s.requires.includes('2.6'), `${s.id}: pentagrama antes de 2.6`);
  }
});

test('cancionero: nivel 1 solo usa trastes 0–5 y cuerdas Mi, La y Re', () => {
  for (const s of SONGS.filter((x) => x.level === 1)) {
    for (const e of s.line) if (!isRest(e)) assert.ok(e.fret <= 5 && e.string !== 'G', `${s.id}: ${e.string}${e.fret}`);
  }
});

test('cancionero: la raíz de cada acorde suena en el primer tiempo de su compás', () => {
  const pc = (name: string) => {
    const m = /^([A-G])(#|♯)?/.exec(name)!;
    return ({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 } as Record<string, number>)[m[1]] + (m[2] ? 1 : 0);
  };
  for (const s of SONGS) {
    // En reggae el uno queda vacío: se mira la primera nota del compás.
    let beat = 0;
    const firstOfBar = new Map<number, number>();
    for (const e of s.line) {
      const bar = Math.floor(beat / 4);
      if (!isRest(e) && !firstOfBar.has(bar)) firstOfBar.set(bar, midiAt(e.string, e.fret) % 12);
      beat += e.beats;
    }
    // Nota que suena en el tercer tiempo de cada compás (para compases con dos acordes).
    const atBeat3 = new Map<number, number>();
    beat = 0;
    for (const e of s.line) {
      if (!isRest(e) && beat % 4 === 2) atBeat3.set(Math.floor(beat / 4), midiAt(e.string, e.fret) % 12);
      beat += e.beats;
    }
    // Con barra (G/B) el bajo toca la nota después de la barra.
    const bassOf = (c: string) => pc(c.includes('/') ? c.split('/')[1] : c);
    s.chords.forEach((c, bar) => {
      const [first, second] = c.split(' ');
      assert.equal(firstOfBar.get(bar), bassOf(first), `${s.id} compás ${bar + 1}: ${c}`);
      if (second) assert.equal(atBeat3.get(bar), bassOf(second), `${s.id} compás ${bar + 1}, tercer tiempo: ${second}`);
    });
  }
});

test('cancionero: desbloqueo por módulos aprendidos y por nivel saltado', () => {
  const pop = SONGS.find((s) => s.id === 'pop-1')!;
  assert.equal(songStatus(pop, new Set(), new Set(), all).state, 'locked');
  assert.deepEqual(songStatus(pop, new Set(), new Set(), all).missing, ['1.5']);
  assert.equal(songStatus(pop, new Set(lessonsOf('1.5')), new Set(), all).state, 'open');
  // Falta una lección del módulo: sigue bloqueada.
  assert.equal(songStatus(pop, new Set(lessonsOf('1.5').slice(1)), new Set(), all).state, 'locked');
  // Nivel 1 saltado por test.
  assert.ok(moduleLearned('1.5', new Set(), new Set([1])));
  assert.equal(songStatus(pop, new Set(), new Set([1]), all).state, 'open');
  // Aprendido pero sin Premium.
  assert.equal(songStatus(pop, new Set(lessonsOf('1.5')), new Set(), () => false).state, 'premium');
  // Sin Premium y sin progreso: se ofrece Premium, no «completa 1.5» (que tampoco podría abrir).
  assert.equal(songStatus(pop, new Set(), new Set(), () => false).state, 'premium');
});

test('cancionero: orden y canción sugerida', () => {
  const done = new Set(lessonsOf('1.5'));
  const list = songbook(done, new Set(), all, (id) => (id === 'rock-1' ? 3 : 0));
  assert.equal(list.length, SONGS.length);
  const states = list.map((s) => s.state);
  // Abiertas primero, bloqueadas al final.
  assert.ok(states.lastIndexOf('open') < states.indexOf('locked'));
  // La dominada va después de las abiertas sin dominar.
  const rock = list.findIndex((s) => s.song.id === 'rock-1');
  assert.ok(list.slice(0, rock).every((s) => s.state === 'open' && s.stars < 3));
  assert.notEqual(recommendedSong(list)?.song.id, 'rock-1');
  assert.equal(recommendedSong(songbook(new Set(), new Set(), all)), null);
  // Filtro por género.
  assert.ok(songbook(done, new Set(), all, undefined, { genre: 'reggae' }).every((s) => s.song.genre === 'reggae'));
});

test('cancionero: play-along con silencios toma el tiempo de cada nota', () => {
  const ev = [{ rest: true as const, beats: 1 as const }, { string: 'A' as const, fret: 0, beats: 0.5 as const }, { string: 'A' as const, fret: 0, beats: 0.5 as const }, { string: 'A' as const, fret: 3, beats: 2 as const }];
  assert.deepEqual(noteStartBeats(ev), [1, 1.5, 2]);
  assert.deepEqual(noteEventIndexes(ev), [1, 2, 3]);
  // Evento que suena en cada pulso, silencios incluidos.
  const starts = [0, 1, 1.5, 2];
  assert.equal(eventAt(starts, 0.2), 0);
  assert.equal(eventAt(starts, 1.6), 2);
  assert.equal(eventAt(starts, 3.9), 3);
});

test('cancionero: corcheas a un tempo inicial que el micrófono pueda seguir', () => {
  // El detector marca un ataque si el volumen sube 1,8× en ventanas de ~93 ms: corcheas por encima de 80 bpm se pierden.
  for (const s of SONGS) if (s.line.some((e) => e.beats < 1)) assert.ok(s.bpm <= 80, `${s.id}: ${s.bpm} bpm con corcheas`);
});

test('cancionero: textos en los 3 idiomas y teoría de las canciones', () => {
  for (const tree of [en, es, pt] as Record<string, unknown>[]) {
    const songs = (tree.content as Record<string, Record<string, { title: string; desc: string }>>).song;
    for (const s of SONGS) {
      const key = s.id.replace(/-/g, '_');
      assert.ok(songs[key]?.title && songs[key]?.desc, `falta ${key}`);
    }
    for (const g of GENRES) assert.ok(((tree.ui as Record<string, Record<string, Record<string, string>>>).songbook.genre)[g]);
  }
  // Escalera de otoño: el bajo baja Do, Si, La, Sol, Fa, Mi.
  const b = SONGS.find((s) => s.id === 'ballad-2')!;
  assert.deepEqual(b.line.slice(0, 6).map((e) => (isRest(e) ? '-' : spell(midiAt(e.string, e.fret)).letter)), ['C', 'B', 'A', 'G', 'F', 'E']);
});

test('cancionero: tonalidad y primer módulo para el mensaje', () => {
  assert.deepEqual(keyParts('Em'), { letter: 'E', minor: true });
  assert.deepEqual(keyParts('C#m'), { letter: 'C♯', minor: true });
  assert.deepEqual(keyParts('G'), { letter: 'G', minor: false });
  assert.equal(firstSongModule(), '1.5');
});
