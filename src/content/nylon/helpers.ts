/**
 * Utilidades para escribir lecciones de guitarra criolla como datos. Las alturas
 * se calculan con el perfil de criolla (no con el instrumento activo) para que
 * las pruebas de Node, que corren como bajo, las validen igual.
 */
import type { Beats, Figure, ListenExample, ScoreEvent, TabNote } from '../types';
import { CHORD_FIGURES } from '../../components/guitarFigureMeta';
import type { StringId } from '../../instruments/profiles';
import { NYLON, midiOn } from '../../instruments/profiles';
import { midiToFreq } from '../../music/notes';
import { CHORDS, SEVENTHS, chordDiagram, diagramMidi, diagramOf, type DiagramId, type GridDiagram, type OpenChordId } from '../../music/chords';
import type { Stroke } from '../../music/strum';

export const k = (lesson: string, key: string) => `content.n.l${lesson.replace(/\./g, '')}.${key}`;
export const scenes = (lesson: string) => [1, 2, 3, 4].map((n) => k(lesson, `s${n}`));
export const hz = (s: StringId, fret = 0) => midiToFreq(midiOn(NYLON, s, fret));

/** Las 6 cuerdas de la 6.ª (grave) a la 1.ª (aguda). */
export const LOW_TO_HIGH: StringId[] = ['E', 'A', 'D', 'G', 'B', 'e'];
/** Graves entorchadas (las toca el pulgar) y agudas de nylon (índice, medio y anular). */
export const BASS_STRINGS: StringId[] = ['E', 'A', 'D'];
export const TREBLE_STRINGS: StringId[] = ['G', 'B', 'e'];

/** Nota de partitura: cuerda, traste y duración (1 = negra por defecto). */
export const n = (s: StringId, fret: number, beats: Beats = 1): ScoreEvent => ({ string: s, fret, beats });
export const open = (s: StringId, beats: Beats = 1): ScoreEvent => n(s, 0, beats);
export const times = (s: StringId, count: number, fret = 0) => Array.from({ length: count }, () => ({ string: s, fret }));

/** Notas a tocar (sin silencios) de una partitura, en el formato de `playAlong.notes`. */
export function notesOf(score: ScoreEvent[]): { string: StringId; fret: number; beats?: 1 | 2 | 4 }[] {
  return score.flatMap((e) => {
    if ('rest' in e) return [];
    if (e.beats === 0.5) throw new Error('playAlong.notes no admite corcheas: usar `score`');
    return [{ string: e.string, fret: e.fret, ...(e.beats === 1 ? {} : { beats: e.beats }) }];
  });
}

/** Ejemplo sonoro de una partitura (tablatura y timbre de nylon por defecto). */
export const listen = (events: ScoreEvent[], bpm: number, extra: Partial<ListenExample> = {}): ListenExample => ({ events, bpm, show: 'tab', tone: 'nylon', ...extra });

/** Ejemplo sonoro sin dibujo (solo el botón «Escuchar»), con timbre de nylon por defecto. */
export const hear = (events: ScoreEvent[], bpm: number, extra: Partial<ListenExample> = {}): ListenExample => ({ events, bpm, tone: 'nylon', ...extra });

export const rest = (beats: Beats = 1): ScoreEvent => ({ rest: true, beats });

/** Partitura sin silencios ni corcheas → notas de tablatura (para `tabReading`). */
export function tabOf(score: ScoreEvent[]): TabNote[] {
  return score.map((e) => {
    if ('rest' in e || e.beats === 0.5) throw new Error('tabReading solo admite negras, blancas y redondas');
    return { string: e.string, fret: e.fret, beats: e.beats };
  });
}

/** Notas de una partitura con corcheas o silencios, para `playAlong.notes` junto con `score`. */
export function scoreNotes(score: ScoreEvent[]): { string: StringId; fret: number }[] {
  return score.flatMap((e) => ('rest' in e ? [] : [{ string: e.string, fret: e.fret }]));
}

/** Cromático 1-2-3-4 en una cuerda (y de vuelta, 4-3-2-1). */
export const spider = (s: StringId) => [1, 2, 3, 4].map((fret) => ({ string: s, fret }));
export const spiderDown = (s: StringId) => [4, 3, 2, 1].map((fret) => ({ string: s, fret }));

// ───────────── Acordes (álbum de acordes de criolla) ─────────────

/**
 * Acorde del álbum, por su nombre en cifrado americano. Los abiertos usan su forma
 * (CHORDS, SEVENTHS); los del nivel 3, un diagrama con media cejilla o cejilla.
 */
export type AlbumChord = string;

/** Diagrama de cada acorde del álbum que no es abierto de primera posición (niveles 3 y 4). */
export const BARRE_DIAGRAMS: Readonly<Record<string, DiagramId>> = {
  Fmaj7: 'fmaj7',
  F: 'f-half',
  Bm: 'bm-half',
  Fm: 'bar-fm',
  F7: 'bar-f7',
  'F#m': 'bar-fsm',
  Gm: 'bar-gm',
  Bb: 'bar-bb',
  Bbm: 'bar-bbm',
  Bm7: 'bar-bm7',
  'C#m': 'bar-csm',
  Cm: 'bar-cm',
  B7: 'b7',
  C7: 'c7',
  // Nivel 4
  'Cmaj7': 'cmaj7',
  'Dm7': 'dm7',
  'Gmaj7': 'gmaj7',
  'Bm7b5': 'bm7b5',
  'Gm7': 'gm7',
  'Bbmaj7': 'bbmaj7',
  'Em7b5': 'em7b5',
  'A7b9': 'a7b9',
  'C6/9': 'c69',
  'Dm6': 'dm6',
  'G13': 'g13',
  'G#dim7': 'gsdim7',
  // Nivel 5
  'C/E': 'c-e',
  'G/B': 'g-b',
  'D/F#': 'd-fs',
};

/** Id del diagrama que dibuja un acorde del álbum. */
export function albumDiagramId(name: AlbumChord): DiagramId {
  if (name in CHORDS || name in SEVENTHS) return name as OpenChordId;
  const id = BARRE_DIAGRAMS[name];
  if (!id) throw new Error(`El acorde ${name} no tiene diagrama en la criolla`);
  return id;
}

export function albumDiagram(name: AlbumChord): GridDiagram {
  const id = albumDiagramId(name);
  return id in CHORDS || id in SEVENTHS ? chordDiagram(id as OpenChordId) : diagramOf(id);
}

/** Figura (diagrama) de un acorde del álbum. */
export function chordFigure(name: AlbumChord): Figure {
  const id = albumDiagramId(name);
  const fig = (Object.keys(CHORD_FIGURES) as Figure[]).find((f) => CHORD_FIGURES[f] === id);
  if (!fig) throw new Error(`El acorde ${name} no tiene figura`);
  return fig;
}

/** Notas MIDI de un acorde del álbum, de grave a agudo. */
export function albumMidi(name: AlbumChord): number[] {
  return diagramMidi(albumDiagram(name));
}

/** Las notas de un acorde de grave a agudo (cuerdas que suenan), para tocarlas de a una. */
export function chordArp(name: AlbumChord): { string: StringId; fret: number }[] {
  const d = albumDiagram(name);
  const out: { string: StringId; fret: number }[] = [];
  for (let i = 0; i < 6; i++) {
    if (d.marks[i] === 'x') continue;
    const dot = d.dots.find((x) => x.string === i);
    const barred = d.barre && i >= d.barre.from && i <= d.barre.to ? d.barre.fret : -1;
    const fret = dot ? dot.fret : d.marks[i] === 'o' ? 0 : barred;
    if (fret >= 0) out.push({ string: LOW_TO_HIGH[i], fret });
  }
  return out;
}

/** Las notas pisadas de un acorde (para el diapasón virtual). */
export function chordFretted(id: AlbumChord): { string: StringId; fret: number }[] {
  return chordArp(id).filter((x) => x.fret > 0);
}

/** Las notas de un acorde como tablatura en compases completos (4, 5 o 6 notas → 4 u 8 pulsos). */
export function arpScore(id: AlbumChord): ScoreEvent[] {
  const notes = chordArp(id);
  const beats: (1 | 2 | 4)[] = notes.length === 4 ? [1, 1, 1, 1] : notes.length === 5 ? [1, 1, 1, 1, 4] : [1, 1, 1, 1, 2, 2];
  return notes.map((x, i) => n(x.string, x.fret, beats[i]));
}

/**
 * Un compás p-i-m-i sobre un acorde: el pulgar en la nota más grave y después
 * 3.ª, 2.ª y 3.ª cuerda con lo que pisa el acorde (patrón de 1.3.5).
 */
export function pimiBar(id: AlbumChord): ScoreEvent[] {
  const notes = chordArp(id);
  const fretOn = (s: StringId) => notes.find((x) => x.string === s)?.fret ?? 0;
  const bass = notes[0];
  return [n(bass.string, bass.fret), n('G', fretOn('G')), n('B', fretOn('B')), n('G', fretOn('G'))];
}

/** Ejemplo sonoro rasgueado: un acorde por compás. */
export function strumListen(chords: AlbumChord[], pattern: Stroke[], bpm: number, extra: Partial<ListenExample> = {}): ListenExample {
  return { events: [], bpm, strum: { chords: chords.map(albumMidi), pattern }, ...extra };
}

// ───────────── Patrones de mano derecha sobre un acorde (nivel 2.5) ─────────────

const onString = (id: AlbumChord, s: StringId) => chordArp(id).find((x) => x.string === s)?.fret ?? 0;

/** p-i-m-a en negras: bajo, 3.ª, 2.ª y 1.ª. */
/** Compás de 3 pulsos (vals, zamba, chacarera): pulgar en el bajo y dos notas del acorde en la 3.ª y la 2.ª. */
export function waltzBar(id: AlbumChord): ScoreEvent[] {
  return pimiBar(id).slice(0, 3);
}

export function pimaBar(id: AlbumChord): ScoreEvent[] {
  const b = chordArp(id)[0];
  return [n(b.string, b.fret), n('G', onString(id, 'G')), n('B', onString(id, 'B')), n('e', onString(id, 'e'))];
}

/** p-a-m-i en negras: bajo, 1.ª, 2.ª y 3.ª. */
export function pamiBar(id: AlbumChord): ScoreEvent[] {
  const b = chordArp(id)[0];
  return [n(b.string, b.fret), n('e', onString(id, 'e')), n('B', onString(id, 'B')), n('G', onString(id, 'G'))];
}

/** Bajo alternado en negras: bajo, 2.ª, segundo bajo (la cuerda siguiente del acorde) y 2.ª. */
export function altBassBar(id: AlbumChord): ScoreEvent[] {
  const [b, alt] = chordArp(id);
  const top = n('B', onString(id, 'B'));
  return [n(b.string, b.fret), top, n(alt.string, alt.fret), { ...top }];
}

/** Arpegio de balada en corcheas: p-i-m-a-m-i-m-i. */
export function balladBar(id: AlbumChord): ScoreEvent[] {
  const b = chordArp(id)[0];
  const g = onString(id, 'G'), bb = onString(id, 'B'), e = onString(id, 'e');
  return [n(b.string, b.fret, 0.5), n('G', g, 0.5), n('B', bb, 0.5), n('e', e, 0.5), n('B', bb, 0.5), n('G', g, 0.5), n('B', bb, 0.5), n('G', g, 0.5)];
}

/** Bajo constante en corcheas (fingerpicking): el pulgar alterna dos bajos y los dedos responden en la 2.ª y la 1.ª. */
export function steadyBassBar(id: AlbumChord): ScoreEvent[] {
  const [b, alt] = chordArp(id);
  const bb = onString(id, 'B'), e = onString(id, 'e');
  return [n(b.string, b.fret, 0.5), n('B', bb, 0.5), n(alt.string, alt.fret, 0.5), n('e', e, 0.5), n(b.string, b.fret, 0.5), n('B', bb, 0.5), n(alt.string, alt.fret, 0.5), n('e', e, 0.5)];
}
