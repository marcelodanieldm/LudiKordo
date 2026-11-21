/**
 * Álbum de acordes de la guitarra criolla (lógica pura, ADR 0010): qué módulo
 * desbloquea cada acorde y qué módulos pide una canción. Una canción se abre
 * cuando el alumno tiene todos sus acordes y terminó la técnica que usa, así que
 * `requires` se arma con `songRequires` y nunca a mano.
 *
 * El árbol completo está en docs/CURRICULUM-NYLON.md. Se agregan acordes acá a
 * medida que llegan sus lecciones.
 */
import { NYLON_LEVELS } from './curriculum';

/** Acordes nuevos de cada módulo, en el orden en que se enseñan. */
export const CHORD_UNLOCKS: Readonly<Record<string, readonly string[]>> = {
  '2.1': ['Em', 'Am', 'E', 'A', 'D'],
  '2.2': ['C', 'G', 'Dm', 'E7', 'A7'],
  '2.3': ['Em7', 'Am7', 'D7', 'G7'],
};

const ROUTE_ORDER: string[] = NYLON_LEVELS.flatMap((l) => l.modules.map((m) => m.id));
const routeIndex = (moduleId: string) => {
  const i = ROUTE_ORDER.indexOf(moduleId);
  if (i < 0) throw new Error(`El módulo ${moduleId} no está en la ruta de criolla`);
  return i;
};

/** Módulo que desbloquea un acorde, o undefined si todavía no se enseña. */
export function chordModule(chord: string): string | undefined {
  return Object.keys(CHORD_UNLOCKS).find((m) => CHORD_UNLOCKS[m].includes(chord));
}

/** Todos los acordes del álbum, en el orden de la ruta. */
export function allChords(): string[] {
  return Object.keys(CHORD_UNLOCKS)
    .sort((a, b) => routeIndex(a) - routeIndex(b))
    .flatMap((m) => [...CHORD_UNLOCKS[m]]);
}

/** Acordes que el alumno ya tiene, según los módulos terminados. */
export function unlockedChords(completedModules: ReadonlySet<string>): string[] {
  return allChords().filter((c) => completedModules.has(chordModule(c)!));
}

/** Acordes de una lista que el alumno todavía no tiene (sin repetir, en orden de aparición). */
export function missingChords(chords: readonly string[], completedModules: ReadonlySet<string>): string[] {
  return [...new Set(chords)].filter((c) => {
    const m = chordModule(c);
    return !m || !completedModules.has(m);
  });
}

/**
 * Módulos que pide una canción: los que desbloquean sus acordes más los de la
 * técnica que usa, sin repetir y en el orden de la ruta. Falla si algún acorde
 * no está en el álbum (así una canción no puede pedir un acorde que no se enseña).
 */
export function songRequires(chords: readonly string[], technique: readonly string[] = []): string[] {
  const fromChords = [...new Set(chords)].map((c) => {
    const m = chordModule(c);
    if (!m) throw new Error(`El acorde ${c} no está en el álbum de acordes de criolla`);
    return m;
  });
  return [...new Set([...fromChords, ...technique])].sort((a, b) => routeIndex(a) - routeIndex(b));
}
