/**
 * «Cambios en un minuto» (lógica pura): cuántas veces pasas de un acorde a otro
 * (o, en el bajo, de una nota a otra en otro lugar del mástil) en 60 segundos.
 * Es la práctica más conocida para que los cambios salgan sin cortar el ritmo:
 * se mide, se guarda el récord y se apunta a superarlo un poco cada día.
 */
import { shapeOf, type ChordShape, type OpenChordId } from './chords';

export type ChangesInstrument = 'bass' | 'guitar' | 'nylon';

/** Una nota del bajo: cuerda y traste. */
export interface ChangeNote {
  string: 'E' | 'A' | 'D' | 'G';
  fret: number;
}

export type ChangePair =
  | { id: string; kind: 'chords'; a: OpenChordId; b: OpenChordId }
  | { id: string; kind: 'notes'; a: ChangeNote; b: ChangeNote };

/** Duración de una ronda. */
export const ROUND_MS = 60_000;
/** Golpes más juntos que esto son el mismo rasgueo (o un rebote del micrófono). */
export const MIN_GAP_MS = 280;
/** Cuántos resultados se guardan por par (para ver la tendencia). */
export const HISTORY_MAX = 12;

const chords = (a: OpenChordId, b: OpenChordId): ChangePair => ({ id: `${a}-${b}`, kind: 'chords', a, b });
const notes = (id: string, a: ChangeNote, b: ChangeNote): ChangePair => ({ id, kind: 'notes', a, b });

/**
 * Pares de guitarra, de los más fáciles (comparten dedos o se mueven poco) a los
 * que piden más: los mismos acordes abiertos del curso.
 */
export const GUITAR_PAIRS: ChangePair[] = [
  chords('Em', 'Am'),
  chords('A', 'D'),
  chords('D', 'E'),
  chords('A', 'E'),
  chords('Am', 'E'),
  chords('C', 'Am'),
  chords('G', 'Em'),
  chords('G', 'D'),
  chords('C', 'G'),
  chords('Am', 'Dm'),
  chords('E7', 'A7'),
  chords('D7', 'G7'),
];

/**
 * Pares del bajo: la fundamental de dos acordes en lugares distintos. Primero
 * cambios de cuerda en el mismo traste, después saltos de posición.
 */
export const BASS_PAIRS: ChangePair[] = [
  notes('G3-C3', { string: 'E', fret: 3 }, { string: 'A', fret: 3 }),
  notes('A5-D5', { string: 'E', fret: 5 }, { string: 'A', fret: 5 }),
  notes('C3-F3', { string: 'A', fret: 3 }, { string: 'D', fret: 3 }),
  notes('F1-C3', { string: 'E', fret: 1 }, { string: 'A', fret: 3 }),
  notes('G3-D5', { string: 'E', fret: 3 }, { string: 'A', fret: 5 }),
  notes('A5-E7', { string: 'E', fret: 5 }, { string: 'A', fret: 7 }),
  notes('G3-A5', { string: 'E', fret: 3 }, { string: 'E', fret: 5 }),
  notes('C3-G5', { string: 'A', fret: 3 }, { string: 'D', fret: 5 }),
];

export function changePairs(instrument: ChangesInstrument): ChangePair[] {
  return instrument === 'bass' ? BASS_PAIRS : GUITAR_PAIRS;
}

export function pairById(instrument: ChangesInstrument, id: string): ChangePair | undefined {
  return changePairs(instrument).find((p) => p.id === id);
}

/**
 * Cambios contados por golpes (guitarra: un rasgueo en cada acorde). El primer
 * golpe es el acorde de partida; cada golpe siguiente, separado al menos
 * MIN_GAP_MS del anterior aceptado, es un cambio.
 */
export function countStrumChanges(times: number[], minGapMs = MIN_GAP_MS): number {
  let accepted = 0;
  let last = -Infinity;
  for (const t of [...times].sort((a, b) => a - b)) {
    if (t - last < minGapMs) continue;
    accepted += 1;
    last = t;
  }
  return Math.max(0, accepted - 1);
}

/**
 * Cambios contados por notas (bajo): solo cuenta cuando suena la otra nota del
 * par. Repetir la misma nota, o tocar otra, no suma. Compara la altura exacta.
 */
export function countNoteChanges(midis: number[], a: number, b: number): number {
  let current: number | null = null;
  let changes = 0;
  for (const m of midis) {
    if (m !== a && m !== b) continue;
    if (current !== null && m !== current) changes += 1;
    current = m;
  }
  return changes;
}

/** Agrega un resultado al historial y se queda con los últimos HISTORY_MAX. */
export function pushScore(history: readonly number[] | undefined, score: number): number[] {
  return [...(history ?? []), score].slice(-HISTORY_MAX);
}

export const bestOf = (history: readonly number[] | undefined) => (history?.length ? Math.max(...history) : 0);

/** La meta de la próxima ronda: un poco más que el récord (el próximo múltiplo de 5, mínimo 10). */
export function nextGoal(best: number): number {
  return Math.max(10, (Math.floor(best / 5) + 1) * 5);
}

/** El par que conviene practicar: el primero que todavía no llega a `target` cambios. */
export function suggestedPair(pairs: ChangePair[], history: Record<string, number[]>, target = 30): ChangePair | undefined {
  return pairs.find((p) => bestOf(history[p.id]) < target) ?? pairs[0];
}

/**
 * Lo que la mano puede dejar quieto entre los dos acordes: un dedo en el mismo
 * traste y cuerda (se queda apoyado) o en la misma cuerda con otro traste (se
 * desliza sin levantarse). Es el «dedo guía» del cambio.
 */
export type Anchor = { finger: number; kind: 'stay' | 'slide'; string: number };

export function anchorsOf(a: ChordShape, b: ChordShape): Anchor[] {
  const out: Anchor[] = [];
  for (let i = 0; i < 6; i++) {
    const fa = a.fingers[i];
    if (fa <= 0 || a.frets[i] <= 0) continue;
    // Cuerda 6.ª = índice 0; el texto dice el número de cuerda.
    const string = 6 - i;
    if (b.fingers[i] === fa && b.frets[i] === a.frets[i]) out.push({ finger: fa, kind: 'stay', string });
    else if (b.fingers[i] === fa && b.frets[i] > 0) out.push({ finger: fa, kind: 'slide', string });
  }
  return out;
}

/**
 * Dos o más dedos que se mueven juntos, como un bloque: misma forma y mismo
 * traste, corrida la misma cantidad de cuerdas (Mi menor → La menor: 2 y 3 bajan una).
 */
export function shapeShift(a: ChordShape, b: ChordShape): { fingers: number[]; strings: number; toward: 'treble' | 'bass' } | null {
  const where = (s: ChordShape, f: number) => s.fingers.findIndex((x, i) => x === f && s.frets[i] > 0);
  const moves = new Map<number, number[]>();
  for (let f = 1; f <= 4; f++) {
    const i = where(a, f);
    const j = where(b, f);
    if (i < 0 || j < 0 || i === j || a.frets[i] !== b.frets[j]) continue;
    moves.set(j - i, [...(moves.get(j - i) ?? []), f]);
  }
  const best = [...moves.entries()].sort((x, y) => y[1].length - x[1].length)[0];
  // Índice mayor = cuerda más aguda (0 es la 6.ª).
  return best && best[1].length >= 2 ? { fingers: best[1], strings: Math.abs(best[0]), toward: best[0] > 0 ? 'treble' : 'bass' } : null;
}

export function pairAnchors(pair: ChangePair): Anchor[] {
  return pair.kind === 'chords' ? anchorsOf(shapeOf(pair.a), shapeOf(pair.b)) : [];
}

export interface ChangesFeedback {
  /** Clave del titular (ui.changes.result.*). */
  headline: 'first' | 'record' | 'close' | 'below';
  /** Consejos (ui.changes.tip.*) con sus valores: siempre sobre la mano. */
  tips: { key: string; values?: Record<string, number | string> }[];
}

/**
 * Devolución de una ronda. El titular compara con el récord anterior; los
 * consejos dependen de cuántos cambios salieron y de lo que comparte el par.
 */
export function changesFeedback(pair: ChangePair, count: number, previousBest: number, hadHistory: boolean): ChangesFeedback {
  const headline = !hadHistory ? 'first' : count > previousBest ? 'record' : count >= previousBest - 2 ? 'close' : 'below';
  const tips: ChangesFeedback['tips'] = [];
  if (pair.kind === 'chords') {
    const anchors = pairAnchors(pair);
    const stay = anchors.find((x) => x.kind === 'stay');
    const shift = shapeShift(shapeOf(pair.a), shapeOf(pair.b));
    const slide = anchors.find((x) => x.kind === 'slide');
    if (stay) tips.push({ key: 'anchorStay', values: { finger: stay.finger, string: stay.string } });
    else if (shift) tips.push({ key: shift.toward === 'treble' ? 'shapeShiftTreble' : 'shapeShiftBass', values: { fingers: shift.fingers.join('-'), count: shift.strings } });
    else if (slide) tips.push({ key: 'anchorSlide', values: { finger: slide.finger, string: slide.string } });
    if (count < 20) tips.push({ key: 'block' });
    else if (count < 40) tips.push({ key: 'lightPress' });
    else tips.push({ key: 'eyesClosed' });
  } else {
    const sameFret = pair.a.fret === pair.b.fret;
    tips.push({ key: sameFret ? 'bassSameFret' : 'bassShift' });
    if (count < 30) tips.push({ key: 'bassLookAhead' });
    else tips.push({ key: 'eyesClosed' });
  }
  if (headline === 'below') tips.push({ key: 'slowIsFast' });
  return { headline, tips: tips.slice(0, 3) };
}
