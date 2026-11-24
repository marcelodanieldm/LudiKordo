/**
 * Frase de ejemplo para improvisar sobre los acordes de un ejercicio (lógica pura).
 * En vez de subir y bajar la escala, muestra la idea que el ejercicio enseña:
 * pregunta y respuesta, notas de paso por grado y, al final de cada compás, una
 * nota larga que es del acorde que suena (la que «cae bien»). Todo dentro de la
 * primera posición (trastes 0 a 4), para que se pueda tocar igual.
 */
import type { InstrumentProfile, InstrumentString } from '../instruments/profiles';
import type { Beats, ScoreEvent } from '../content/types';
import { chordFromName } from './chords';

const MAX_FRET = 4;
const pc = (m: number) => ((m % 12) + 12) % 12;

interface Spot {
  s: InstrumentString;
  fret: number;
  midi: number;
}

/** Ritmo de cada compás: notas de paso y la nota del acorde al final (la más larga); `0` es silencio. */
const RHYTHM: Record<3 | 4, { ask: Beats[]; answer: Beats[] }> = {
  4: { ask: [0.5, 0.5, 1, 2], answer: [1, 1, 2] },
  3: { ask: [0.5, 0.5, 2], answer: [1, 2] },
};

/** Las notas de la escala en la posición, de grave a agudo y sin repetir alturas. */
export function scaleSpots(scale: readonly number[], strings: InstrumentProfile['strings']): Spot[] {
  const pcs = new Set(scale.map(pc));
  const seen = new Set<number>();
  const out: Spot[] = [];
  for (const s of [...strings].sort((a, b) => a.openMidi - b.openMidi)) {
    for (let fret = 0; fret <= MAX_FRET; fret++) {
      const midi = s.openMidi + fret;
      if (pcs.has(pc(midi)) && !seen.has(midi)) {
        seen.add(midi);
        out.push({ s, fret, midi });
      }
    }
  }
  return out.sort((a, b) => a.midi - b.midi);
}

/** Clases de altura del acorde (la primera es la fundamental) que también están en la escala. */
export function chordTargets(name: string, scale: readonly number[]): number[] {
  const first = name.trim();
  const notes = chordFromName(first) ?? [];
  const root = chordFromName(first.split('/')[0])?.[0];
  const pcs = new Set(scale.map(pc));
  const tones = [...new Set([...(root !== undefined ? [pc(root)] : []), ...notes.map(pc)])];
  return tones.filter((p) => pcs.has(p));
}

/**
 * La frase: un compás por acorde. Los compases impares preguntan (corcheas que
 * suben o bajan por grado hasta una nota del acorde); los pares responden
 * (un silencio, una nota y la nota del acorde). La última nota es la tónica si
 * el último acorde la tiene; si no, la fundamental del acorde.
 */
export function improvPhrase(scale: readonly number[], chords: readonly string[], strings: InstrumentProfile['strings'], barBeats: 3 | 4 = 4): ScoreEvent[] {
  const pool = scaleSpots(scale, strings);
  if (pool.length < 3 || chords.length === 0) return [];
  const tonic = pc(scale[0]);
  const tonicSpots = pool.map((n, i) => ({ n, i })).filter(({ n }) => pc(n.midi) === tonic);
  // Empieza cerca de la tónica del medio de la posición.
  let prev = tonicSpots.length ? tonicSpots[Math.floor((tonicSpots.length - 1) / 2)].i : Math.floor(pool.length / 2);
  const out: ScoreEvent[] = [];
  let last = -1;
  const push = (i: number, beats: Beats) => {
    out.push({ string: pool[i].s.id, fret: pool[i].fret, beats });
    last = pool[i].midi;
  };

  chords.forEach((chord, bar) => {
    const ask = bar % 2 === 0;
    const rhythm = ask ? RHYTHM[barBeats].ask : RHYTHM[barBeats].answer;
    const steps = ask ? rhythm.length - 1 : rhythm.length - 2;
    const final = bar === chords.length - 1;
    // La nota larga cae en la segunda mitad del compás: con dos acordes en 4/4, es la del segundo (como la pista).
    const names = chord.trim().split(/\s+/);
    let tones = chordTargets(barBeats === 4 ? names[names.length - 1] : names[0], scale);
    if (final && tones.includes(tonic)) tones = [tonic];
    else if (final && tones.length) tones = [tones[0]];
    if (!tones.length) tones = [tonic];
    // La pregunta sube y la respuesta baja (si se puede): la frase respira.
    const up = ask;
    const target = pickTarget(pool, tones, prev, up, steps);
    // Notas de paso por grado que llegan a la nota del acorde desde el lado del movimiento.
    const dir = pool[target].midi >= pool[prev].midi ? 1 : -1;
    const path = Array.from({ length: steps }, (_, k) => target - dir * (steps - k)).map((i) => Math.min(pool.length - 1, Math.max(0, i)));
    if (!ask) out.push({ rest: true, beats: rhythm[0] });
    const notes = [...path, target];
    const beats = ask ? rhythm : rhythm.slice(1);
    notes.forEach((i, k) => {
      let j = i;
      // Nunca la misma altura dos veces seguidas: se corre un grado.
      if (pool[j].midi === last) j = j - dir >= 0 && j - dir < pool.length ? j - dir : j + dir;
      push(j, beats[k]);
    });
    prev = target;
  });
  return out;
}

/** La nota del acorde más cercana a la anterior, del lado pedido y con lugar para las notas de paso. */
function pickTarget(pool: Spot[], tones: number[], prev: number, up: boolean, steps: number): number {
  let best = -1;
  let bestScore = Infinity;
  pool.forEach((n, i) => {
    if (!tones.includes(pc(n.midi)) || i === prev) return;
    const d = i - prev;
    // Del lado pedido y con lugar para las notas de paso.
    const room = up ? i - steps >= 0 : i + steps < pool.length;
    const score = Math.abs(d) + ((up ? d < 0 : d > 0) ? 2.5 : 0) + (room ? 0 : 10) + (Math.abs(d) < 2 ? 1.5 : 0);
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return best >= 0 ? best : prev;
}
