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
  | 'checkpoint'
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
  /** Notas objetivo en orden. */
  notes: { string: StringId; fret: number }[];
  /** null = sin tempo (por ejemplo, para afinar o tocar una cuerda cuando se ilumina). */
  bpm: number | null;
  toleranceCents?: number;
  /** Tempos que se desbloquean al dominar el ejercicio. */
  tempoSteps?: number[];
}

/** Tipos todavía no implementados en el código base; se muestran como «próximamente». */
export interface PendingExercise extends BaseExercise {
  kind: 'tabReading' | 'followHand' | 'tempoTrainer' | 'checkpoint' | 'recordYourself';
}

export type Exercise = QuizExercise | TapRhythmExercise | FretboardTapExercise | PlayAlongExercise | PendingExercise;

export type Figure = 'bass-parts' | 'strings' | 'tuner' | 'fret5' | 'right-hand' | 'fretboard-1234' | 'left-hand';

export interface Card {
  titleKey: string;
  bodyKey: string;
  figure?: Figure;
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
}

export interface Level {
  id: number; // 1..5
  titleKey: string;
  weeks: [number, number];
  checkpointKey: string;
  modules: Module[];
}
