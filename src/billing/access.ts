/** Qué es gratis y qué es Premium. Lógica pura, sin dependencias nativas. */
import { moduleOf } from '../content/curriculum';

export const FREE_MODULES = ['1.1', '1.2'];
export const ENTITLEMENT_ID = 'premium';
export const PRODUCT_ID = 'ludikordo_premium';
export const BASE_PLANS = { annual: 'anual', semiannual: 'semestral' } as const;
export const TRIAL_DAYS = 7;

export function isLessonFree(lessonId: string): boolean {
  return FREE_MODULES.includes(moduleOf(lessonId));
}

export function canOpenLesson(lessonId: string, isPremium: boolean): boolean {
  return isPremium || isLessonFree(lessonId);
}

/** Ahorro del plan anual frente a pagar dos semestres, en porcentaje entero. */
export function annualSavingsPct(annualPrice: number, semiannualPrice: number): number {
  if (semiannualPrice <= 0) return 0;
  return Math.round((1 - annualPrice / (2 * semiannualPrice)) * 100);
}

export function formatMoney(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/** Fecha en que termina la prueba gratis, para mostrarla en el paywall. */
export function trialEndDate(from: Date, locale: string, days = TRIAL_DAYS): string {
  const d = new Date(from.getTime() + days * 86400000);
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(d);
}
