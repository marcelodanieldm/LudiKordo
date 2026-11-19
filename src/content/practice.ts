/**
 * Práctica de habilidades: ejercicios para repetir con acompañamiento y
 * evaluación en vivo, separados de las lecciones. Reutilizan material del curso
 * (todo original) y se desbloquean con los módulos donde se aprende lo que usan.
 *
 * - `line`: una partitura para tocar a tempo; cada nota se juzga en vivo.
 * - `improv`: improvisar sobre el cifrado; se juzga si cada nota está en la escala.
 * Textos en `content.practice.<id con _>.title|desc`.
 */
import { IS_GUITAR } from '../instruments/current';
import type { Beats, ScoreEvent, ScoreNotation, Skill } from './types';
import type { DrumStyle } from '../music/drums';
import type { JamPart } from '../music/jam';
import { CP1_RIFF, REST_GROOVE, SIGHT_RIFF } from './guitar/level1';
import { PENTA_EIGHTHS, PENTA_LICK, PM_RIFF, POWER_RIFF } from './guitar/level2';
import { LEG_PHRASE, SLIDE_PHRASE, VIB_PHRASE } from './guitar/level3';
import { FINAL_SOLO, FOURS, G_MAJOR, MOTIF_PHRASE, TARGET_PHRASE, TRIAD_ARPS } from './guitar/level4';
import { findModule } from './theory';
import { moduleLearned } from './songbook';

export type DrillCategory = 'scales' | 'technique' | 'riffs' | 'arpeggios' | 'phrases' | 'reading' | 'improv';
export const DRILL_CATEGORIES: readonly DrillCategory[] = ['technique', 'riffs', 'scales', 'arpeggios', 'phrases', 'reading', 'improv'];

export interface Drill {
  id: string;
  kind: 'line' | 'improv';
  category: DrillCategory;
  skills: Skill[];
  level: 1 | 2 | 3 | 4 | 5;
  /** Módulos que hay que terminar para abrirlo. */
  requires: string[];
  titleKey: string;
  descKey: string;
  /** Un acorde por compás de la línea (o la vuelta de la improvisación). */
  chords: string[];
  style: DrumStyle;
  /** Acompañamiento que viene prendido (el alumno puede cambiarlo). */
  parts: JamPart[];
  /** Tempo inicial y escalones que se desbloquean con 3 estrellas. */
  tempoSteps: number[];
  /** Solo `line`. */
  line?: ScoreEvent[];
  notation?: ScoreNotation;
  /** Solo `improv`: clases de altura de la escala y notas mínimas por vuelta. */
  scale?: number[];
  minNotes?: number;
}

const key = (id: string, k: 'title' | 'desc') => `content.practice.${id.replace(/-/g, '_')}.${k}`;
const drill = (d: Omit<Drill, 'titleKey' | 'descKey'>): Drill => ({ ...d, titleKey: key(d.id, 'title'), descKey: key(d.id, 'desc') });

const PENTA_AM = [9, 0, 2, 4, 7];
const DORIAN_A = [9, 11, 0, 2, 4, 6, 7];
const MIXO_A = [9, 11, 1, 2, 4, 6, 7];
const C_MAJOR = [0, 2, 4, 5, 7, 9, 11];

// ───────────── Guitarra ─────────────

export const GUITAR_DRILLS: Drill[] = [
  drill({ id: 'g-rest-groove', kind: 'line', category: 'riffs', skills: ['rhythm'], level: 1, requires: ['1.4'], chords: ['E5', 'A5', 'D5', 'E5'], style: 'rock', parts: ['drums', 'bass'], tempoSteps: [70, 80, 90], line: REST_GROOVE, notation: 'tab' }),
  drill({ id: 'g-first-riff', kind: 'line', category: 'riffs', skills: ['rhythm', 'technique'], level: 1, requires: ['1.5'], chords: ['Em', 'Em', 'D', 'Em'], style: 'rock', parts: ['drums', 'bass'], tempoSteps: [70, 80, 90], line: CP1_RIFF, notation: 'tab' }),
  drill({ id: 'g-sight', kind: 'line', category: 'reading', skills: ['fretboard'], level: 1, requires: ['1.5'], chords: ['Am', 'C', 'G', 'Am'], style: 'pop', parts: ['drums', 'keys'], tempoSteps: [60, 70, 80], line: SIGHT_RIFF, notation: 'tab' }),
  drill({ id: 'g-power', kind: 'line', category: 'riffs', skills: ['rhythm', 'technique'], level: 2, requires: ['2.4'], chords: ['G5', 'A5', 'C5', 'G5'], style: 'rock', parts: ['drums', 'bass'], tempoSteps: [70, 80, 90], line: POWER_RIFF, notation: 'tab' }),
  drill({ id: 'g-palm-mute', kind: 'line', category: 'technique', skills: ['technique', 'rhythm'], level: 2, requires: ['2.5'], chords: ['E5', 'E5', 'E5', 'E5'], style: 'rock', parts: ['drums', 'bass'], tempoSteps: [70, 80, 90], line: PM_RIFF, notation: 'tab' }),
  drill({ id: 'g-penta-run', kind: 'line', category: 'scales', skills: ['technique', 'fretboard'], level: 2, requires: ['2.6'], chords: ['Am', 'Am', 'Am', 'Am'], style: 'rock', parts: ['drums', 'bass'], tempoSteps: [60, 70, 80], line: PENTA_EIGHTHS, notation: 'tab' }),
  drill({ id: 'g-penta-lick', kind: 'line', category: 'phrases', skills: ['technique', 'ear'], level: 2, requires: ['2.6'], chords: ['Am', 'Dm', 'G', 'Am'], style: 'shuffle', parts: ['drums', 'bass', 'keys'], tempoSteps: [70, 80, 90], line: PENTA_LICK, notation: 'tab' }),
  drill({ id: 'g-legato', kind: 'line', category: 'technique', skills: ['technique'], level: 3, requires: ['3.1'], chords: ['Am', 'Em', 'Am', 'Am'], style: 'pop', parts: ['drums', 'bass'], tempoSteps: [60, 70, 80], line: LEG_PHRASE, notation: 'tab' }),
  drill({ id: 'g-slides', kind: 'line', category: 'technique', skills: ['technique'], level: 3, requires: ['3.2'], chords: ['Am', 'C', 'Dm', 'Am'], style: 'ballad', parts: ['drums', 'bass', 'keys'], tempoSteps: [60, 70, 80], line: SLIDE_PHRASE, notation: 'tab' }),
  drill({ id: 'g-vibrato', kind: 'line', category: 'phrases', skills: ['technique', 'ear'], level: 3, requires: ['3.4'], chords: ['Am', 'Am'], style: 'ballad', parts: ['drums', 'bass', 'keys'], tempoSteps: [60, 70, 80], line: VIB_PHRASE, notation: 'tab' }),
  drill({ id: 'g-major', kind: 'line', category: 'scales', skills: ['theory', 'fretboard'], level: 4, requires: ['4.3'], chords: ['G', 'G'], style: 'ballad', parts: ['drums', 'bass', 'keys'], tempoSteps: [70, 80, 100], line: G_MAJOR, notation: 'tab' }),
  drill({ id: 'g-fours', kind: 'line', category: 'technique', skills: ['technique', 'rhythm'], level: 4, requires: ['4.6'], chords: ['Am', 'Am', 'Am', 'Am'], style: 'rock', parts: ['drums', 'bass'], tempoSteps: [70, 90, 110], line: FOURS, notation: 'tab' }),
  drill({ id: 'g-triads', kind: 'line', category: 'arpeggios', skills: ['theory', 'fretboard'], level: 4, requires: ['4.7'], chords: ['Am', 'G', 'F', 'G'], style: 'pop', parts: ['drums', 'bass'], tempoSteps: [60, 70, 80], line: TRIAD_ARPS, notation: 'tab' }),
  drill({ id: 'g-motif', kind: 'line', category: 'phrases', skills: ['ear', 'rhythm'], level: 4, requires: ['4.5'], chords: ['Am', 'G', 'F', 'G'], style: 'pop', parts: ['drums', 'bass', 'keys'], tempoSteps: [60, 70, 80], line: MOTIF_PHRASE, notation: 'tab' }),
  drill({ id: 'g-targets', kind: 'line', category: 'phrases', skills: ['ear', 'theory'], level: 4, requires: ['4.5'], chords: ['Am', 'G', 'F', 'G'], style: 'ballad', parts: ['drums', 'bass', 'keys'], tempoSteps: [60, 70, 80], line: TARGET_PHRASE, notation: 'tab' }),
  drill({ id: 'g-solo', kind: 'line', category: 'phrases', skills: ['technique', 'ear'], level: 4, requires: ['4.10'], chords: ['Am', 'G', 'F', 'G', 'Am', 'G', 'F', 'G'], style: 'rock', parts: ['drums', 'bass', 'keys'], tempoSteps: [60, 70, 80], line: FINAL_SOLO, notation: 'tab' }),
  drill({ id: 'g-improv-penta', kind: 'improv', category: 'improv', skills: ['ear', 'technique'], level: 2, requires: ['2.6'], chords: ['Am', 'G', 'F', 'G'], style: 'rock', parts: ['drums', 'bass', 'keys'], tempoSteps: [80, 90, 100], scale: PENTA_AM, minNotes: 12 }),
  drill({ id: 'g-improv-blues', kind: 'improv', category: 'improv', skills: ['ear', 'technique'], level: 3, requires: ['3.4'], chords: ['A7', 'D7', 'A7', 'E7'], style: 'shuffle', parts: ['drums', 'bass', 'keys'], tempoSteps: [80, 90, 100], scale: PENTA_AM, minNotes: 12 }),
  drill({ id: 'g-improv-dorian', kind: 'improv', category: 'improv', skills: ['ear', 'theory'], level: 4, requires: ['4.4'], chords: ['Am7', 'D7', 'Am7', 'D7'], style: 'funk', parts: ['drums', 'bass', 'keys'], tempoSteps: [80, 90, 100], scale: DORIAN_A, minNotes: 12 }),
  drill({ id: 'g-improv-mixo', kind: 'improv', category: 'improv', skills: ['ear', 'theory'], level: 4, requires: ['4.4'], chords: ['A', 'G', 'A', 'G'], style: 'rock', parts: ['drums', 'bass', 'keys'], tempoSteps: [90, 100, 110], scale: MIXO_A, minNotes: 12 }),
  drill({ id: 'g-improv-jazz', kind: 'improv', category: 'improv', skills: ['ear', 'theory'], level: 4, requires: ['4.3'], chords: ['Dm7', 'G7', 'Cmaj7', 'Cmaj7'], style: 'jazz', parts: ['drums', 'bass', 'keys'], tempoSteps: [90, 100, 120], scale: C_MAJOR, minNotes: 12 }),
];

// ───────────── Bajo ─────────────

type BS = 'E' | 'A' | 'D' | 'G';
const b = (string: BS, fret: number, beats: Beats = 1): ScoreEvent => ({ string, fret, beats });
const four = (s: BS, fret: number) => [b(s, fret), b(s, fret), b(s, fret), b(s, fret)];
/** Cromático 1-2-3-4 en cada cuerda (un compás por cuerda). */
export const B_SPIDER: ScoreEvent[] = (['E', 'A', 'D', 'G'] as BS[]).flatMap((s) => [1, 2, 3, 4].map((f) => b(s, f)));
export const B_OPEN: ScoreEvent[] = [...four('E', 0), ...four('A', 0), ...four('D', 0), ...four('E', 0)];
/** Tónicas de Am – G – F – G en negras. */
export const B_ROOTS: ScoreEvent[] = [...four('A', 0), ...four('E', 3), ...four('E', 1), ...four('E', 3)];
/** Tónica y quinta (abajo o arriba) en blancas. */
export const B_ROOT_FIFTH: ScoreEvent[] = [b('A', 0, 2), b('E', 0, 2), b('E', 3, 2), b('D', 0, 2), b('E', 1, 2), b('A', 3, 2), b('E', 3, 2), b('D', 0, 2)];
/** Do mayor en pentagrama: sube una octava y baja. */
export const B_READ: ScoreEvent[] = [
  b('A', 3), b('A', 5), b('D', 2), b('D', 3),
  b('D', 5), b('G', 2), b('G', 4), b('G', 5),
  b('G', 4), b('G', 2), b('D', 5), b('D', 3),
  b('D', 2), b('A', 5), b('A', 3, 2),
];

export const BASS_DRILLS: Drill[] = [
  drill({ id: 'b-open', kind: 'line', category: 'riffs', skills: ['rhythm'], level: 1, requires: ['1.2'], chords: ['E5', 'A5', 'D5', 'E5'], style: 'rock', parts: ['drums', 'guitar'], tempoSteps: [70, 80, 100], line: B_OPEN, notation: 'tab' }),
  drill({ id: 'b-spider', kind: 'line', category: 'technique', skills: ['technique'], level: 1, requires: ['1.3'], chords: ['E5', 'A5', 'D5', 'G5'], style: 'rock', parts: ['drums'], tempoSteps: [60, 70, 80], line: B_SPIDER, notation: 'tab' }),
  drill({ id: 'b-roots', kind: 'line', category: 'riffs', skills: ['rhythm', 'fretboard'], level: 1, requires: ['1.5'], chords: ['Am', 'G', 'F', 'G'], style: 'pop', parts: ['drums', 'guitar', 'keys'], tempoSteps: [70, 80, 100], line: B_ROOTS, notation: 'tab' }),
  drill({ id: 'b-root-fifth', kind: 'line', category: 'arpeggios', skills: ['theory', 'fretboard'], level: 1, requires: ['1.5'], chords: ['Am', 'G', 'F', 'G'], style: 'ballad', parts: ['drums', 'guitar', 'keys'], tempoSteps: [60, 70, 80], line: B_ROOT_FIFTH, notation: 'tab' }),
  drill({ id: 'b-read', kind: 'line', category: 'reading', skills: ['theory', 'fretboard'], level: 2, requires: ['2.6'], chords: ['C', 'C', 'G', 'C'], style: 'pop', parts: ['drums', 'keys'], tempoSteps: [60, 70, 80], line: B_READ, notation: 'staff' }),
  drill({ id: 'b-improv', kind: 'improv', category: 'improv', skills: ['ear', 'rhythm'], level: 1, requires: ['1.5'], chords: ['Am', 'G', 'F', 'G'], style: 'rock', parts: ['drums', 'guitar', 'keys'], tempoSteps: [80, 90, 100], scale: PENTA_AM, minNotes: 8 }),
];

/** Ejercicios del instrumento de esta build. */
export const DRILLS: Drill[] = IS_GUITAR ? GUITAR_DRILLS : BASS_DRILLS;

export function getDrill(id: string): Drill | undefined {
  return DRILLS.find((d) => d.id === id);
}

/** Id con el que se guardan las estrellas y el tempo desbloqueado. */
export const drillExerciseId = (id: string) => `drill-${id}`;

export type DrillState = 'open' | 'locked' | 'premium';

/** Abierto si se terminaron sus módulos; Premium si alguno de ellos lo es. */
export function drillState(d: Drill, completed: ReadonlySet<string>, skippedLevels: ReadonlySet<number>, canOpenModule: (moduleId: string) => boolean): DrillState {
  if (!d.requires.every((m) => canOpenModule(m))) return 'premium';
  return d.requires.every((m) => moduleLearned(m, completed, skippedLevels)) ? 'open' : 'locked';
}

/** El primer módulo que falta, para el mensaje «termina el módulo X». */
export function missingModule(d: Drill, completed: ReadonlySet<string>, skippedLevels: ReadonlySet<number>): string | undefined {
  return d.requires.find((m) => findModule(m) && !moduleLearned(m, completed, skippedLevels));
}

/** Compases de la línea (o de la vuelta de improvisación). */
export const drillBars = (d: Drill) => d.chords.length;
