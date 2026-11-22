/**
 * Práctica de la guitarra criolla: un ejercicio con banda por cada lección y
 * repasos de cada nivel (ADR 0010). Se arman a partir de lo que la lección hace
 * tocar con la guitarra, sin escribir material nuevo:
 *
 * - improvisación de la lección → `improv` con la misma pista y escala;
 * - partitura a tempo → `line` con esa partitura;
 * - rasgueo → `line` con los mismos acordes en p-i-m-i (o bajo y dos notas en 3/4);
 * - notas sin tempo (escalas, cajas) → `line` en negras.
 *
 * Cuando la línea no trae acordes (escalas, frases), la banda se arma con el acorde
 * del álbum que mejor calza con cada compás (`harmonize`). El título es el de la
 * lección; la descripción, una por tipo (`content.practice.n.desc.*`).
 */
import type { Exercise, Lesson, ScoreEvent, StrumExercise } from '../types';
import type { DrumStyle } from '../../music/drums';
import { barBeatsOfStyle } from '../../music/drums';
import { CHORDS, SEVENTHS, chordFromName } from '../../music/chords';
import { BOSSA_FINGERS, CHACARERA, CHARLESTON, MILONGA, ZAMBA, barBeatsOf, type Stroke } from '../../music/strum';
import { NYLON, midiOn, type StringId } from '../../instruments/profiles';
import { NYLON_LESSONS } from './lessons';
import { NYLON_CP1 } from './level1';
import { NYLON_CP2 } from './level2';
import { NYLON_CP3 } from './level3';
import { NYLON_CP4 } from './level4';
import { BARRE_DIAGRAMS, albumMidi, pimiBar, pimaBar, waltzBar, type AlbumChord } from './helpers';
import type { Drill, DrillCategory } from '../practice';

type Note = { string: StringId; fret: number; beats: number };
const isNote = (e: ScoreEvent): e is ScoreEvent & Note => !('rest' in e);
const pcOf = (e: Note) => midiOn(NYLON, e.string as StringId, e.fret) % 12;
const pcs = (chord: string) => new Set((chordFromName(chord) ?? []).map((m) => m % 12));

/** Acordes con los que la banda acompaña una línea sin cifrado: primero las tríadas; las cuatríadas, desde el nivel 3. */
export const TRIADS = ['Am', 'C', 'G', 'Em', 'F', 'Dm', 'E', 'A', 'D'];
export const BASIC_SEVENTHS = ['E7', 'A7', 'D7', 'G7', 'B7'];
export const COLOR_CHORDS = ['Am7', 'Em7', 'Dm7', 'Cmaj7', 'Gmaj7', 'Fmaj7', 'Bm'];
export const candidatesFor = (level: number) => (level >= 3 ? [...TRIADS, ...BASIC_SEVENTHS, ...COLOR_CHORDS] : [...TRIADS, ...BASIC_SEVENTHS]);
/** Una cuatríada solo gana si las notas la piden de verdad. */
const COMPLEXITY = (c: string) => (TRIADS.includes(c) ? 0 : 0.75);

/**
 * Un acorde por compás para una línea: el que más notas del compás contiene
 * (por duración), con premio si contiene la primera nota y si es su tónica, un
 * poco de premio por repetir el del compás anterior y castigo a las cuatríadas.
 */
export function harmonize(line: ScoreEvent[], beatsPerBar = 4, candidates = candidatesFor(1)): string[] {
  const bars: Note[][] = [];
  let t = 0;
  for (const e of line) {
    const bar = Math.floor(t / beatsPerBar + 1e-9);
    (bars[bar] ??= []);
    if (isNote(e)) bars[bar].push(e as Note);
    t += e.beats;
  }
  const scoreOf = (c: string, notes: Note[], prev?: string) => {
    const set = pcs(c);
    const root = (chordFromName(c) ?? [0])[0] % 12;
    let score = notes.reduce((a, n) => a + (set.has(pcOf(n)) ? n.beats : -0.5 * n.beats), 0);
    if (notes.length && set.has(pcOf(notes[0]))) score += 2;
    if (notes.length && pcOf(notes[0]) === root) score += 1;
    if (c === prev) score += 0.5;
    return score - COMPLEXITY(c);
  };
  const fit = (c: string, notes: Note[]) => {
    const set = pcs(c);
    const all = notes.reduce((a, n) => a + n.beats, 0);
    return all === 0 ? 1 : notes.reduce((a, n) => a + (set.has(pcOf(n)) ? n.beats : 0), 0) / all;
  };
  const pick = (notes: Note[], prev?: string) =>
    candidates.reduce((best, c) => (scoreOf(c, notes, prev) > scoreOf(best, notes, prev) + 1e-9 ? c : best), candidates[0]);
  // El acorde que mejor calza con toda la línea: el pedal para los compases cromáticos.
  const overall = pick(bars.flat().filter(Boolean));
  const out: string[] = [];
  for (const notes of bars) {
    const prev = out[out.length - 1];
    if (!notes || notes.length === 0) {
      out.push(prev ?? overall);
      continue;
    }
    const best = pick(notes, prev);
    // Si ningún acorde abarca al menos la mitad del compás (cromatismos), la banda sostiene el acorde anterior.
    out.push(fit(best, notes) >= 0.5 ? best : prev ?? overall);
  }
  return out;
}

/** Negras con la última nota estirada hasta completar el compás. */
export function asQuarters(seq: { string: StringId; fret: number }[], beatsPerBar = 4): ScoreEvent[] {
  const out: ScoreEvent[] = seq.map((x) => ({ string: x.string, fret: x.fret, beats: 1 }));
  const missing = (beatsPerBar - (seq.length % beatsPerBar)) % beatsPerBar;
  if (missing === 0) return out;
  const last = out[out.length - 1] as ScoreEvent & Note;
  // Las duraciones son 0,5, 1, 2 o 4: la última nota se estira a 2 (o 4) y el resto es silencio.
  if (missing === 3 && beatsPerBar === 4) {
    out[out.length - 1] = { ...last, beats: 4 };
    return out;
  }
  out[out.length - 1] = { ...last, beats: 2 };
  for (let i = 1; i < missing; i++) out.push({ rest: true, beats: 1 });
  return out;
}

const total = (line: ScoreEvent[]) => line.reduce((a, e) => a + e.beats, 0);
const steps = (bpm: number, eighths: boolean): number[] => {
  const base = eighths ? Math.min(bpm, 80) : bpm;
  return [base, base + 10, base + 20];
};
const hasEighths = (line: ScoreEvent[]) => line.some((e) => e.beats < 1);
const same = (a: Stroke[], b: Stroke[]) => a.length === b.length && a.every((x, i) => x === b[i]);

/** Estilo de la banda: por el patrón de rasgueo, el compás o el módulo. */
export function styleFor(moduleId: string, pattern?: Stroke[], beatsPerBar = 4, chords: string[] = []): DrumStyle {
  if (beatsPerBar === 3) {
    if (pattern && same(pattern, ZAMBA)) return 'zamba';
    if (pattern && same(pattern, CHACARERA)) return 'chacarera';
    if (moduleId === '3.7' && pattern && !same(pattern, ZAMBA) && !same(pattern, CHACARERA) && pattern.filter((s) => s !== '-').length === 2) return 'zamba';
    return 'vals';
  }
  if (pattern && same(pattern, BOSSA_FINGERS)) return 'bossa';
  if (pattern && same(pattern, CHARLESTON)) return 'jazz';
  if (pattern && same(pattern, MILONGA)) return 'tango';
  if (moduleId === '3.7') return 'tango';
  // Blues: todos dominantes con séptima.
  if (chords.length >= 4 && chords.every((c) => /^[A-G][#b]?7$/.test(c))) return 'shuffle';
  if (moduleId.startsWith('4.') && chords.some((c) => c.includes('maj7'))) return 'jazz';
  if (moduleId === '4.3') return 'bossa';
  if (moduleId === '4.2') return 'jazz';
  if (moduleId === '3.5' || moduleId === '3.6') return 'shuffle';
  if (moduleId.startsWith('1.')) return 'ballad';
  return 'pop';
}

const BAND = ['drums', 'bass', 'keys'] as const;

/** El nombre de un acorde del álbum a partir de las notas de su diagrama (las pistas guardan las notas). */
let VOICINGS: Map<string, string> | undefined;
export function chordName(midi: number[]): string {
  VOICINGS ??= new Map([...Object.keys(CHORDS), ...Object.keys(SEVENTHS), ...Object.keys(BARRE_DIAGRAMS)].map((c) => [albumMidi(c as AlbumChord).join(','), c]));
  return VOICINGS.get(midi.join(',')) ?? '';
}
const descKey = (k: 'chords' | 'line' | 'notes' | 'improv' | 'review') => `content.practice.n.desc.${k}`;

interface Base {
  id: string;
  level: 1 | 2 | 3 | 4 | 5;
  requires: string[];
  titleKey: string;
  lessonId?: string;
}

/** Línea p-i-m-i (4/4) o bajo y dos notas (3/4) sobre los acordes de un rasgueo. */
function chordsLine(ex: StrumExercise): ScoreEvent[] | undefined {
  try {
    const three = barBeatsOf(ex.pattern) === 3;
    return ex.chords.flatMap((c) => (three ? waltzBar(c as AlbumChord) : pimiBar(c as AlbumChord)));
  } catch {
    return undefined;
  }
}

/** El ejercicio de práctica de una lección, o nada si la lección no tiene qué tocar con la banda. */
export function drillFromExercises(base: Base, moduleId: string, exercises: Exercise[]): Drill | undefined {
  const withGuitar = exercises.filter((e) => e.needsBass);
  const improv = withGuitar.find((e) => e.kind === 'improvise');
  const timed = withGuitar.find((e) => e.kind === 'playAlong' && e.bpm != null);
  const strum = withGuitar.find((e): e is StrumExercise => e.kind === 'strum');
  const free = withGuitar.find((e) => e.kind === 'playAlong' && e.bpm == null);
  const make = (d: Omit<Drill, 'id' | 'level' | 'requires' | 'titleKey'>): Drill => ({ ...base, ...d });

  if (improv && improv.kind === 'improvise' && improv.backing.strum) {
    const pattern = improv.backing.strum.pattern;
    const bpb = barBeatsOf(pattern);
    const chords = improv.backing.strum.chords.map(chordName);
    if (chords.some((c) => !c)) return undefined;
    return make({
      kind: 'improv', category: 'improv', skills: ['ear', 'technique'], descKey: descKey('improv'),
      chords: chords as string[], style: styleFor(moduleId, pattern, bpb, chords as string[]), parts: [...BAND],
      tempoSteps: steps(Math.max(70, improv.backing.bpm), false),
      scale: improv.scale, minNotes: Math.max(4, Math.ceil(improv.minNotes / Math.max(1, improv.loops))),
    });
  }
  if (timed && timed.kind === 'playAlong') {
    const bpb = timed.beatsPerBar ?? 4;
    const line: ScoreEvent[] = timed.score ?? timed.notes.map((x) => ({ string: x.string, fret: x.fret, beats: x.beats ?? 1 }));
    if (total(line) % bpb === 0) {
      const bars = total(line) / bpb;
      const strumChords = strum && strum.chords.length === bars && barBeatsOf(strum.pattern) === bpb ? strum.chords : undefined;
      return make({
        kind: 'line', category: moduleId.startsWith('1.') ? 'technique' : 'phrases', skills: timed.skills, descKey: descKey('line'),
        chords: strumChords ?? harmonize(line, bpb, candidatesFor(base.level)), style: styleFor(moduleId, strum?.pattern, bpb), parts: [...BAND],
        tempoSteps: steps(timed.bpm!, hasEighths(line)), line, notation: 'tab',
      });
    }
  }
  if (strum) {
    const line = chordsLine(strum);
    if (line) {
      const bpb = barBeatsOf(strum.pattern);
      return make({
        kind: 'line', category: 'arpeggios', skills: ['technique', 'rhythm'], descKey: descKey('chords'),
        chords: strum.chords, style: styleFor(moduleId, strum.pattern, bpb), parts: [...BAND],
        tempoSteps: steps(Math.min(strum.bpm, 70), false), line, notation: 'tab',
      });
    }
  }
  if (free && free.kind === 'playAlong') {
    const seq = free.notes;
    if (seq.length >= 4) {
      const line = asQuarters(seq);
      return make({
        kind: 'line', category: moduleId.startsWith('1.') ? 'reading' : 'scales', skills: free.skills, descKey: descKey('notes'),
        chords: harmonize(line, 4, candidatesFor(base.level)), style: styleFor(moduleId), parts: [...BAND],
        tempoSteps: [60, 70, 80], line, notation: 'tab',
      });
    }
  }
  return undefined;
}

const lessonKey = (id: string) => `content.n.l${id.replace(/\./g, '')}.title`;
const moduleOf = (lessonId: string) => lessonId.split('.').slice(0, 2).join('.');

/** Un ejercicio por lección, en el orden del curso. */
export const NYLON_LESSON_DRILLS: Drill[] = Object.values(NYLON_LESSONS)
  .map((l: Lesson) => {
    const mod = moduleOf(l.id);
    return drillFromExercises(
      { id: `n-l${l.id.replace(/\./g, '')}`, level: Number(l.id[0]) as Drill['level'], requires: [mod], titleKey: lessonKey(l.id), lessonId: l.id },
      mod,
      l.exercises,
    );
  })
  .filter((d): d is Drill => d !== undefined);

// ───────────── Repasos de cada nivel ─────────────

const reviewKey = (id: string) => `content.practice.${id.replace(/-/g, '_')}.title`;
const lastModule = (level: number) => `${level}.${level === 1 ? 5 : level === 2 ? 6 : level === 3 ? 7 : 6}`;

function reviewLine(id: string, level: 1 | 2 | 3 | 4, chords: string[], line: ScoreEvent[], style: DrumStyle, bpm: number, category: DrillCategory = 'arpeggios'): Drill {
  return {
    id, kind: 'line', category, skills: ['technique', 'rhythm'], level, requires: [lastModule(level)],
    titleKey: reviewKey(id), descKey: descKey('review'), chords, style, parts: [...BAND],
    tempoSteps: steps(bpm, hasEighths(line)), line, notation: 'tab',
  };
}

const strumOf = (cpParts: Exercise[], id: string) => cpParts.find((p) => p.id === id) as StrumExercise;
const melody = NYLON_CP1.parts.find((p) => p.id === 'ncp1-melody');
const MELODY_LINE = melody && melody.kind === 'playAlong' && melody.score ? melody.score : [];
const CP2_CHORDS = strumOf(NYLON_CP2.parts, 'ncp2-strum').chords;
const CP3_BLUES = strumOf(NYLON_CP3.parts, 'ncp3-blues').chords;
const CP3_BARRES = strumOf(NYLON_CP3.parts, 'ncp3-barres').chords;
const CP4_COMPING = strumOf(NYLON_CP4.parts, 'ncp4-comping').chords;
const CP4_BOSSA = strumOf(NYLON_CP4.parts, 'ncp4-bossa').chords;
const improvCP4 = NYLON_CP4.parts.find((p) => p.kind === 'improvise');

export const NYLON_REVIEW_DRILLS: Drill[] = [
  reviewLine('n-review-1', 1, harmonize(MELODY_LINE, 4, candidatesFor(1)), MELODY_LINE, 'ballad', 70, 'phrases'),
  reviewLine('n-review-2', 2, CP2_CHORDS, CP2_CHORDS.flatMap((c) => pimaBar(c as AlbumChord)), 'pop', 70),
  reviewLine('n-review-3', 3, CP3_BARRES, CP3_BARRES.flatMap((c) => pimiBar(c as AlbumChord)), 'pop', 70),
  {
    id: 'n-review-3-blues', kind: 'improv', category: 'improv', skills: ['ear', 'technique'], level: 3, requires: ['3.6'],
    titleKey: reviewKey('n-review-3-blues'), descKey: descKey('improv'), chords: CP3_BLUES, style: 'shuffle', parts: [...BAND],
    // El blues del checkpoint 3 está en Mi: escala de blues de Mi (Mi, Sol, La, Si♭, Si, Re).
    tempoSteps: [80, 90, 100], scale: [4, 7, 9, 10, 11, 2], minNotes: 16,
  },
  reviewLine('n-review-4', 4, CP4_BOSSA, CP4_BOSSA.flatMap((c) => pimiBar(c as AlbumChord)), 'bossa', 70),
  {
    id: 'n-review-4-jazz', kind: 'improv', category: 'improv', skills: ['ear', 'theory'], level: 4, requires: ['4.6'],
    titleKey: reviewKey('n-review-4-jazz'), descKey: descKey('improv'), chords: CP4_COMPING, style: 'jazz', parts: [...BAND],
    tempoSteps: [80, 90, 100], scale: improvCP4 && improvCP4.kind === 'improvise' ? improvCP4.scale : [0, 2, 4, 5, 7, 9, 10, 11], minNotes: 16,
  },
];

export const NYLON_DRILLS: Drill[] = [...NYLON_LESSON_DRILLS, ...NYLON_REVIEW_DRILLS];

/** Usado por las pruebas: no se toca ninguna barra de compás sin acorde. */
export const lineBeatsOk = (d: Drill) => d.kind !== 'line' || total(d.line!) === d.chords.length * barBeatsOfStyle(d.style);
