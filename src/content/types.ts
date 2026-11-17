/**
 * Modelo de contenido. Las lecciones son datos: los textos se guardan como
 * claves que cada idioma resuelve (src/i18n/locales/*.json, sección "content").
 */
import type { StringId } from '../music/notes';

export type Skill = 'technique' | 'rhythm' | 'fretboard' | 'theory' | 'ear';

/** Los 10 tipos de ejercicio del documento de producto. */
export type ExerciseKind =
  | 'quiz'
  | 'tapRhythm'
  | 'fretboardTap'
  | 'tabReading'
  | 'ear'
  | 'followHand'
  | 'playAlong'
  | 'tempoTrainer'
  | 'recordYourself';

interface BaseExercise {
  id: string;
  kind: ExerciseKind;
  skills: Skill[];
  /** Si necesita el bajo en la mano. */
  needsBass: boolean;
  /** Clave del enunciado. */
  promptKey: string;
}

export interface QuizExercise extends BaseExercise {
  kind: 'quiz' | 'ear';
  needsBass: false;
  /** Claves de las opciones, o textos literales si empiezan con '='. */
  options: string[];
  correctIndex: number;
  /** Para ejercicios de oído: tonos a reproducir antes de responder (Hz). */
  tones?: number[];
  /** Pentagrama que se muestra con el enunciado (por ejemplo, «¿qué nota es?»). */
  staff?: ScoreEvent[];
  hintKey?: string;
}

export interface TapRhythmExercise extends BaseExercise {
  kind: 'tapRhythm';
  needsBass: false;
  bpm: number;
  beats: number;
  /** Etiquetas de los botones a alternar, por ejemplo ['i', 'm']. */
  pads: string[];
}

export interface FretboardTapExercise extends BaseExercise {
  kind: 'fretboardTap';
  needsBass: false;
  /** Secuencia de notas a tocar en el diapasón virtual. */
  sequence: { string: StringId; fret: number }[];
  frets: number;
}

export interface PlayAlongExercise extends BaseExercise {
  kind: 'playAlong';
  needsBass: true;
  /**
   * Notas objetivo en orden. `beats` (4 redonda, 2 blanca, 1 negra; por defecto 1)
   * permite tocar figuras de distinta duración; entonces se muestra como tablatura.
   */
  notes: { string: StringId; fret: number; beats?: 1 | 2 | 4 }[];
  /** null = sin tempo (por ejemplo, para afinar o tocar una cuerda cuando se ilumina). */
  bpm: number | null;
  toleranceCents?: number;
  /** Tempos que se desbloquean al dominar el ejercicio. */
  tempoSteps?: number[];
  /** Si las notas con duración se muestran en tablatura (por defecto) o en pentagrama. */
  notation?: ScoreNotation;
}

/** Nota de tablatura: cuerda, traste (0 = al aire) y duración en pulsos (4 redonda, 2 blanca, 1 negra). */
export interface TabNote {
  string: StringId;
  fret: number;
  beats: 1 | 2 | 4;
}

/** Cómo se escribe una lectura: tablatura (por defecto) o pentagrama en clave de fa. */
export type ScoreNotation = 'tab' | 'staff';

/** Duración en pulsos de 4/4: corchea, negra, blanca, redonda. */
export type Beats = 0.5 | 1 | 2 | 4;

/** Un evento de partitura: una nota (cuerda y traste) o un silencio. */
export type ScoreEvent = { string: StringId; fret: number; beats: Beats } | { rest: true; beats: Beats };

/** Ejemplo sonoro de una tarjeta: la app lo toca con un tono sintetizado. */
export interface ListenExample {
  events: ScoreEvent[];
  bpm: number;
  /** Qué se dibuja junto al botón «Escuchar». Por defecto, nada. */
  show?: ScoreNotation;
  /** Nombre de cada nota debajo del pentagrama (para las primeras lecturas). */
  noteNames?: boolean;
  /** Clic de metrónomo durante el ejemplo. */
  click?: boolean;
}

export interface TabReadingExercise extends BaseExercise {
  kind: 'tabReading';
  needsBass: false;
  notation?: ScoreNotation;
  /** Compases de 4/4 completos: la duración de cada compás suma 4. */
  notes: TabNote[];
  /** Trastes que muestra el diapasón donde se responde. */
  frets: number;
}

export interface TempoTrainerExercise extends BaseExercise {
  kind: 'tempoTrainer';
  needsBass: false;
  bpm: number;
  /** Pulsos a marcar, después de 4 de cuenta. */
  beats: number;
  /** Cuántos de esos pulsos tienen clic; después, el alumno sigue solo. */
  audibleBeats: number;
}

/** Tipos todavía no implementados en el código base; se muestran como «próximamente». */
export interface PendingExercise extends BaseExercise {
  kind: 'followHand' | 'recordYourself';
}

export type Exercise =
  | QuizExercise
  | TapRhythmExercise
  | FretboardTapExercise
  | PlayAlongExercise
  | TabReadingExercise
  | TempoTrainerExercise
  | PendingExercise;

export type Figure = 'bass-parts' | 'strings' | 'tuner' | 'fret5' | 'right-hand' | 'fretboard-1234' | 'left-hand' | 'bass-clef';

export interface Card {
  titleKey: string;
  bodyKey: string;
  figure?: Figure;
  /** Ejemplo sonoro con botón «Escuchar». */
  listen?: ListenExample;
}

export interface Lesson {
  id: string; // '1.3.1'
  minutes: number;
  titleKey: string;
  objectiveKey: string;
  cartoon: {
    /** Nombre del recurso Rive en android/app/src/main/res/raw. */
    riveResource?: string;
    durationSec: number;
    /** Subtítulos por escena, en orden. */
    sceneKeys: string[];
  };
  cards: Card[];
  exercises: Exercise[];
  /** Precisión que da las 3 estrellas. */
  mastery: number;
}

export interface Module {
  id: string; // '1.3'
  titleKey: string;
  lessonCount: number;
  starExerciseKey: string;
  /** Objetivo del módulo en una frase, visible en la ruta. */
  goalKey: string;
}

export interface Level {
  id: number; // 1..5
  titleKey: string;
  weeks: [number, number];
  checkpointKey: string;
  modules: Module[];
}
