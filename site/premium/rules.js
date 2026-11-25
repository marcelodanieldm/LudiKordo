/**
 * Copia en JavaScript de las reglas que necesita la web de suscripción.
 * La fuente es supabase/functions/_shared/billing.ts; tests/web-billing.test.ts
 * comprueba que las dos den lo mismo. El servidor vuelve a validar todo.
 */

export const LATAM = ['BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'GT', 'HN', 'MX', 'NI', 'PA', 'PE', 'PR', 'PY', 'SV', 'UY', 'VE'];

export function checkoutOptions(country) {
  const c = String(country).trim().toUpperCase();
  const crypto = { channel: 'crypto', currency: 'USDC' };
  if (c === 'AR') return [{ channel: 'mercadopago', currency: 'ARS' }, crypto];
  if (c === 'BR') return [{ channel: 'paddle', currency: 'BRL' }, { channel: 'paddle', currency: 'USD' }, crypto];
  return [{ channel: 'paddle', currency: 'USD' }, crypto];
}

export function normalizeCode(code) {
  return String(code).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

const round2 = (v) => Math.round(v * 100) / 100;

export function nicePrice(value, currency) {
  const eps = 1e-9;
  if (currency === 'ARS') return Math.max(999, Math.floor((value + 1) / 1000 + eps) * 1000 - 1);
  if (currency === 'BRL') return Math.max(0.9, round2(Math.floor(value - 0.9 + eps) + 0.9));
  return Math.max(0.99, round2(Math.floor(value - 0.99 + eps) + 0.99));
}

export function discounted(list, percent, currency, nice = true) {
  const raw = list * (1 - percent / 100);
  if (nice) return nicePrice(raw, currency);
  return currency === 'ARS' ? Math.round(raw) : round2(raw);
}

export function amountForCycle(list, currency, cycle, promo) {
  if (!promo) return list;
  if (promo.cycles !== 0 && cycle >= promo.cycles) return list;
  return discounted(list, promo.percent, currency);
}

const PLANS = ['anual', 'semestral'];
const APPS = ['bass', 'guitar', 'nylon'];

export function promoErrors(p) {
  const e = [];
  if (normalizeCode(p.code) !== p.code || p.code.length < 3 || p.code.length > 32) e.push('code');
  if (!Number.isInteger(p.percent) || p.percent < 1 || p.percent > 90) e.push('percent');
  if (!Number.isInteger(p.cycles) || p.cycles < 0 || p.cycles > 52) e.push('cycles');
  if (p.plans.length === 0 || !p.plans.every((x) => PLANS.includes(x))) e.push('plans');
  if (p.channels.length === 0) e.push('channels');
  if (p.apps.length === 0 || !p.apps.every((x) => APPS.includes(x))) e.push('apps');
  if (p.startsAt && p.endsAt && new Date(p.startsAt) >= new Date(p.endsAt)) e.push('dates');
  return e;
}

export function formatMoney(amount, currency, locale) {
  if (currency === 'USDC') return `${amount.toFixed(2)} USDC`;
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: currency === 'ARS' ? 0 : 2 }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}
