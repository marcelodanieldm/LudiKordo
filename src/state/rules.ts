/**
 * Reglas de progreso sin dependencias de React Native, para poder probarlas.
 * Las fechas se manejan como 'YYYY-MM-DD' en el huso del teléfono.
 */

export function isoDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toUtcDays(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

export function daysBetween(a: string, b: string): number {
  return toUtcDays(b) - toUtcDays(a);
}

/** Lunes de la semana de la fecha, como número de día. */
function weekKey(date: string): number {
  const days = toUtcDays(date);
  const dow = (new Date(days * 86400000).getUTCDay() + 6) % 7; // lunes = 0
  return days - dow;
}

/**
 * Una semana cuenta si se practicó el objetivo de días, o un día menos
 * usando el comodín semanal.
 */
export function weekMet(daysPracticed: number, goalPerWeek: number): boolean {
  const freeze = 1;
  return daysPracticed >= Math.max(1, goalPerWeek - freeze);
}

/**
 * Racha semanal: semanas seguidas que cumplieron el objetivo.
 * La semana en curso suma si ya se cumplió, pero nunca corta la racha
 * mientras no terminó.
 */
export function weeklyStreak(practiceDays: string[], goalPerWeek: number, today: string): number {
  const perWeek = new Map<number, Set<string>>();
  for (const d of practiceDays) {
    const k = weekKey(d);
    if (!perWeek.has(k)) perWeek.set(k, new Set());
    perWeek.get(k)!.add(d);
  }
  const current = weekKey(today);
  let streak = 0;
  if (weekMet(perWeek.get(current)?.size ?? 0, goalPerWeek)) streak++;
  for (let k = current - 7; ; k -= 7) {
    if (!weekMet(perWeek.get(k)?.size ?? 0, goalPerWeek)) break;
    streak++;
  }
  return streak;
}

/** Días de la semana en curso (lunes a domingo) en que se practicó. */
export function currentWeekDays(practiceDays: string[], today: string): boolean[] {
  const monday = weekKey(today);
  const set = new Set(practiceDays.map(toUtcDays));
  return Array.from({ length: 7 }, (_, i) => set.has(monday + i));
}

/** Una habilidad pide repaso si no se practica hace más de 14 días. */
export const REVIEW_AFTER_DAYS = 14;
export function needsReview(lastPracticed: string | undefined, today: string): boolean {
  if (!lastPracticed) return false;
  return daysBetween(lastPracticed, today) > REVIEW_AFTER_DAYS;
}

export interface CheckpointRecord {
  stars: number;
  passedAt: string;
}

/**
 * Efecto de aprobar un checkpoint: mejor puntaje, fecha del primer aprobado,
 * bono de XP solo la primera vez, y nivel saltado si no estaba terminado.
 */
export function applyCheckpointPass(
  prev: CheckpointRecord | undefined,
  pass: { level: number; stars: number; levelCompleted: boolean },
  skippedLevels: number[],
  today: string,
  bonusXp: number,
): { record: CheckpointRecord; xp: number; skippedLevels: number[] } {
  const skipped = new Set(skippedLevels);
  if (!pass.levelCompleted) skipped.add(pass.level);
  return {
    record: { stars: Math.max(prev?.stars ?? 0, pass.stars), passedAt: prev?.passedAt ?? today },
    xp: prev ? 0 : bonusXp,
    skippedLevels: [...skipped].sort((a, b) => a - b),
  };
}
