/**
 * Modelo de contenido. Las lecciones son datos: los textos se guardan como
 * claves que cada idioma resuelve (src/i18n/locales/*.json, sección "content").
 */
import type { StringId } from '../music/notes';
import type { Tone } from '../music/timbre';
import type { Stroke } from '../music/strum';

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
  | 'recordYourself'
  | 'strum';

interface BaseExercise {
  id: string;
  kind: ExerciseKind;
  skills: Skill[];
  /** Si necesita el instrumento en la mano (el nombre viene del bajo; vale para la guitarra). */
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
  /** Timbre de cada tono (guitarra: limpio, crunch, pastilla del mástil…). Por defecto, el del instrumento. */
  timbres?: Tone[];
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
  /**
   * Partitura completa, con corcheas y silencios (canciones). Si está, manda sobre
   * `notes` para el tiempo y el dibujo; `notes` tiene que ser sus notas sin silencios.
   */
  score?: ScoreEvent[];
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
  /** Timbre del ejemplo (guitarra: limpio, crunch, pastilla…). Por defecto, el del instrumento. */
  tone?: Tone;
  /**
   * Rasgueo de acordes: notas MIDI de cada compás (de grave a agudo) y patrón de
   * púa. Si está, suena esto en lugar de `events` (que puede quedar vacío).
   */
  strum?: { chords: number[][]; pattern: Stroke[] };
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

/**
 * Rasgueo con metrónomo (guitarra): se puntúa cuándo cae cada golpe de púa,
 * escuchando ataques sin altura (la app todavía no reconoce acordes). Las notas
 * de cada acorde se revisan aparte, de a una, con un `playAlong`.
 */
export interface StrumExercise extends BaseExercise {
  kind: 'strum';
  needsBass: true;
  bpm: number;
  /** 8 casillas por compás: 'D' abajo, 'U' arriba, '-' sin tocar. */
  pattern: Stroke[];
  /** Nombre del acorde de cada compás (se muestra tal cual: Em, G5…). */
  chords: string[];
  tempoSteps?: number[];
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
  | StrumExercise
  | PendingExercise;

export type Figure =
  | 'bass-parts'
  | 'strings'
  | 'tuner'
  | 'fret5'
  | 'right-hand'
  | 'fretboard-1234'
  | 'left-hand'
  | 'bass-clef'
  // Guitarra eléctrica (src/components/GuitarFigures.tsx)
  | 'guitar-parts'
  | 'guitar-strings'
  | 'pickup-selector'
  | 'guitar-knobs'
  | 'amp-panel'
  | 'amp-clean'
  | 'amp-crunch'
  | 'cable-amp'
  | 'guitar-tuner'
  | 'posture'
  | 'pick-grip'
  | 'pick-down'
  | 'pick-alternate'
  | 'string-crossing'
  | 'fret-hand'
  | 'mute-fret-hand'
  | 'mute-pick-hand'
  | 'chord-diagram-how'
  | 'chord-em'
  | 'chord-e'
  | 'chord-am'
  | 'chord-a'
  | 'chord-c'
  | 'chord-g'
  | 'chord-d'
  | 'chord-dm'
  | 'power-6'
  | 'power-5'
  | 'penta-box'
  | 'palm-mute';

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
    /** Duración objetivo de la animación completa (guía para el animador). */
    durationSec: number;
    /** Subtítulos por escena, en orden. */
    sceneKeys: string[];
    /**
     * Mientras no hay .riv: ilustración animada de cada escena (misma longitud
     * que `sceneKeys`; null = solo Kordi en el escenario).
     */
    visuals?: (Figure | null)[];
    /** Sonido que acompaña cada escena (se toca al empezarla); null = ninguno. */
    sounds?: (ListenExample | null)[];
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

export type Genre = 'reggae' | 'bossa' | 'soul' | 'blues' | 'rock' | 'pop' | 'ballad';

/** Canción del cancionero: una línea de bajo original para tocar sobre su cifrado. */
export interface Song {
  id: string;
  titleKey: string;
  descriptionKey: string;
  genre: Genre;
  /** Nivel de la ruta al que corresponde. */
  level: 1 | 2 | 3 | 4 | 5;
  /** Módulos que hay que terminar para desbloquearla. */
  requires: string[];
  /** Tonalidad, en cifrado americano («E», «Am»). */
  key: string;
  bpm: number;
  tempoSteps: number[];
  /** Un acorde por compás, en cifrado americano. */
  chords: string[];
  /** Línea de bajo completa: compases de 4/4. */
  line: ScoreEvent[];
  notation: ScoreNotation;
  skills: Skill[];
}
