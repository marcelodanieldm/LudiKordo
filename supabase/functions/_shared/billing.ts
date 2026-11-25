/**
 * Cobro web de LudiKordo (opción B, ADR 0011). Lógica pura: sin Deno, sin
 * Node y sin red, para que la usen las funciones de Supabase y las pruebas de
 * `tests/` por igual. Solo usa Web Crypto y TextEncoder, que existen en los dos.
 *
 * Este archivo no importa a otros: Deno pide extensión en los imports y el
 * chequeo de tipos del repo no la acepta, así que todo lo compartido vive acá.
 */

export type App = 'bass' | 'guitar' | 'nylon';
export type Plan = 'anual' | 'semestral';
export type Channel = 'mercadopago' | 'paddle' | 'crypto';
export type Currency = 'ARS' | 'USD' | 'BRL' | 'USDC';

export const APPS: readonly App[] = ['bass', 'guitar', 'nylon'];
export const PLANS: readonly Plan[] = ['anual', 'semestral'];
export const ENTITLEMENT_ID = 'premium';

/** Meses que cubre cada plan. */
export const PLAN_MONTHS: Record<Plan, number> = { anual: 12, semestral: 6 };
/** Días de gracia después de la fecha de cobro, mientras se reintenta un pago rechazado. */
export const GRACE_DAYS = 3;

export function isApp(v: unknown): v is App {
  return typeof v === 'string' && (APPS as readonly string[]).includes(v);
}
export function isPlan(v: unknown): v is Plan {
  return typeof v === 'string' && (PLANS as readonly string[]).includes(v);
}

// ───────────── Regiones: qué canal y qué moneda ve cada país ─────────────

export type CheckoutOption = { channel: Channel; currency: Currency };

/** Latinoamérica de habla hispana (más España aparte), en dólares por la web. */
export const LATAM = ['BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'GT', 'HN', 'MX', 'NI', 'PA', 'PE', 'PR', 'PY', 'SV', 'UY', 'VE'];

/**
 * Opciones de pago por país, en orden de preferencia:
 * Argentina en pesos con Mercado Pago; Brasil en reales o dólares con Paddle;
 * Latinoamérica, España y el resto en dólares con Paddle. Cripto en todos.
 */
export function checkoutOptions(country: string): CheckoutOption[] {
  const c = country.trim().toUpperCase();
  const crypto: CheckoutOption = { channel: 'crypto', currency: 'USDC' };
  if (c === 'AR') return [{ channel: 'mercadopago', currency: 'ARS' }, crypto];
  if (c === 'BR') return [{ channel: 'paddle', currency: 'BRL' }, { channel: 'paddle', currency: 'USD' }, crypto];
  return [{ channel: 'paddle', currency: 'USD' }, crypto];
}

export function isOffered(country: string, channel: Channel, currency: Currency): boolean {
  return checkoutOptions(country).some((o) => o.channel === channel && o.currency === currency);
}

// ───────────── Promos ─────────────

export type Promo = {
  code: string;
  /** Porcentaje de descuento, entero de 1 a 90. */
  percent: number;
  /** Cuántos cobros llevan descuento; 0 = mientras siga suscripto. */
  cycles: number;
  plans: Plan[];
  channels: Channel[];
  apps: App[];
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  /** Tope de canjes; null = sin tope. */
  maxRedemptions: number | null;
  redemptions: number;
};

export type PromoCheck =
  | { ok: true; promo: Promo }
  | { ok: false; reason: 'not_found' | 'inactive' | 'not_started' | 'expired' | 'plan' | 'channel' | 'app' | 'exhausted' };

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

/** Reglas de un código de promo antes de cobrar. */
export function checkPromo(
  promo: Promo | null | undefined,
  ctx: { plan: Plan; channel: Channel; app: App; now: Date },
): PromoCheck {
  if (!promo) return { ok: false, reason: 'not_found' };
  if (!promo.active) return { ok: false, reason: 'inactive' };
  if (promo.startsAt && ctx.now < new Date(promo.startsAt)) return { ok: false, reason: 'not_started' };
  if (promo.endsAt && ctx.now > new Date(promo.endsAt)) return { ok: false, reason: 'expired' };
  if (!promo.plans.includes(ctx.plan)) return { ok: false, reason: 'plan' };
  if (!promo.channels.includes(ctx.channel)) return { ok: false, reason: 'channel' };
  if (!promo.apps.includes(ctx.app)) return { ok: false, reason: 'app' };
  if (promo.maxRedemptions !== null && promo.redemptions >= promo.maxRedemptions) return { ok: false, reason: 'exhausted' };
  return { ok: true, promo };
}

/** Errores de carga del seteador de promos; lista vacía = válida. */
export function promoErrors(p: Pick<Promo, 'code' | 'percent' | 'cycles' | 'plans' | 'channels' | 'apps' | 'startsAt' | 'endsAt'>): string[] {
  const e: string[] = [];
  if (normalizeCode(p.code) !== p.code || p.code.length < 3 || p.code.length > 32) e.push('code');
  if (!Number.isInteger(p.percent) || p.percent < 1 || p.percent > 90) e.push('percent');
  if (!Number.isInteger(p.cycles) || p.cycles < 0 || p.cycles > 52) e.push('cycles');
  if (p.plans.length === 0 || !p.plans.every(isPlan)) e.push('plans');
  if (p.channels.length === 0) e.push('channels');
  if (p.apps.length === 0 || !p.apps.every(isApp)) e.push('apps');
  if (p.startsAt && p.endsAt && new Date(p.startsAt) >= new Date(p.endsAt)) e.push('dates');
  return e;
}

/**
 * Precio «de góndola»: $ 48.999, R$ 139,90, US$ 31,99. Siempre redondea hacia
 * abajo, para que la promo nunca sea menor que el porcentaje anunciado.
 */
export function nicePrice(value: number, currency: Currency): number {
  const eps = 1e-9;
  if (currency === 'ARS') return Math.max(999, Math.floor((value + 1) / 1000 + eps) * 1000 - 1);
  if (currency === 'BRL') return Math.max(0.9, round2(Math.floor(value - 0.9 + eps) + 0.9));
  return Math.max(0.99, round2(Math.floor(value - 0.99 + eps) + 0.99));
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

/** Precio con descuento. Los pesos se cobran sin centavos. */
export function discounted(list: number, percent: number, currency: Currency, nice = true): number {
  const raw = list * (1 - percent / 100);
  if (nice) return nicePrice(raw, currency);
  return currency === 'ARS' ? Math.round(raw) : round2(raw);
}

/**
 * Monto del cobro número `cycle` (0 = el primero) con una promo aplicada.
 * Sin promo, o pasados sus ciclos, es el precio de lista.
 */
export function amountForCycle(list: number, currency: Currency, cycle: number, promo: Pick<Promo, 'percent' | 'cycles'> | null): number {
  if (!promo) return list;
  if (promo.cycles !== 0 && cycle >= promo.cycles) return list;
  return discounted(list, promo.percent, currency);
}

// ───────────── Acceso Premium ─────────────

/** Suma meses de calendario, ajustando el 31 a fin de mes (31 ene + 1 = 28/29 feb). */
export function addMonths(from: Date, months: number): Date {
  const d = new Date(from.getTime());
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d;
}

/**
 * Hasta cuándo tiene Premium alguien que pagó un período. Si todavía le quedaba
 * acceso (pagó antes de vencer, o cripto por adelantado), el período se suma al
 * final y no se pierden días.
 */
export function accessUntil(paidAt: Date, plan: Plan, currentUntil: Date | null, graceDays = GRACE_DAYS): Date {
  const start = currentUntil && currentUntil > paidAt ? currentUntil : paidAt;
  const end = addMonths(start, PLAN_MONTHS[plan]);
  return new Date(end.getTime() + graceDays * 86400000);
}

// ───────────── Mercado Pago ─────────────

/** Suscripción sin plan asociado y con pago pendiente: el alumno paga en el link `init_point`. */
export function mpPreapprovalBody(a: {
  app: App;
  plan: Plan;
  userId: string;
  email: string;
  amount: number;
  reason: string;
  backUrl: string;
  promoCode: string | null;
}) {
  return {
    reason: a.reason,
    external_reference: mpReference(a.app, a.plan, a.userId, a.promoCode),
    payer_email: a.email,
    back_url: a.backUrl,
    status: 'pending',
    auto_recurring: {
      frequency: PLAN_MONTHS[a.plan],
      frequency_type: 'months',
      transaction_amount: a.amount,
      currency_id: 'ARS',
    },
  };
}

/** `app|plan|userId|PROMO`: lo que vuelve en cada webhook para saber de quién es el cobro. */
export function mpReference(app: App, plan: Plan, userId: string, promoCode: string | null): string {
  return [app, plan, userId, promoCode ?? ''].join('|');
}

export function parseMpReference(ref: string): { app: App; plan: Plan; userId: string; promoCode: string | null } | null {
  const [app, plan, userId, promo] = ref.split('|');
  if (!isApp(app) || !isPlan(plan) || !userId) return null;
  return { app, plan, userId, promoCode: promo ? promo : null };
}

/** Header `x-signature: ts=…,v1=…`. */
export function parseMpSignature(header: string | null): { ts: string; v1: string } | null {
  if (!header) return null;
  let ts = '';
  let v1 = '';
  for (const part of header.split(',')) {
    const [k, v] = part.split('=').map((s) => s.trim());
    if (k === 'ts') ts = v ?? '';
    if (k === 'v1') v1 = v ?? '';
  }
  return ts && v1 ? { ts, v1 } : null;
}

/**
 * Texto que firma Mercado Pago: `id:[data.id];request-id:[x-request-id];ts:[ts];`.
 * Si falta un valor, se omite ese par. El id alfanumérico va en minúsculas.
 */
export function mpManifest(dataId: string | null, requestId: string | null, ts: string): string {
  let m = '';
  if (dataId) m += `id:${/[a-z]/i.test(dataId) ? dataId.toLowerCase() : dataId};`;
  if (requestId) m += `request-id:${requestId};`;
  m += `ts:${ts};`;
  return m;
}

export async function verifyMpSignature(a: { header: string | null; requestId: string | null; dataId: string | null; secret: string }): Promise<boolean> {
  const sig = parseMpSignature(a.header);
  if (!sig) return false;
  const expected = await hmacHex('SHA-256', a.secret, mpManifest(a.dataId, a.requestId, sig.ts));
  return safeEqualHex(expected, sig.v1);
}

// ───────────── Cripto (NOWPayments) ─────────────

/** Ordena las claves en todos los niveles, como lo firma NOWPayments. */
export function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return Object.keys(obj)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortDeep(obj[k]);
        return acc;
      }, {});
  }
  return value;
}

/** Header `x-nowpayments-sig`: HMAC-SHA512 del cuerpo con las claves ordenadas. */
export async function verifyNowPayments(rawBody: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature) return false;
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return false;
  }
  const expected = await hmacHex('SHA-512', secret, JSON.stringify(sortDeep(body)));
  return safeEqualHex(expected, signature);
}

/** Solo un pago terminado da acceso; «parcial» o «confirmando» todavía no. */
export function cryptoPaid(status: string): boolean {
  return status === 'finished';
}

/** Id del pedido cripto: `app|plan|userId|PROMO|nonce`. */
export function cryptoOrderId(app: App, plan: Plan, userId: string, promoCode: string | null, nonce: string): string {
  return [app, plan, userId, promoCode ?? '', nonce].join('|');
}

export function parseCryptoOrderId(id: string) {
  const parts = id.split('|');
  const base = parseMpReference(parts.slice(0, 4).join('|'));
  return base && parts[4] ? { ...base, nonce: parts[4] } : null;
}

// ───────────── Utilidades de firma ─────────────

export async function hmacHex(algo: 'SHA-256' | 'SHA-512', secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: algo }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Compara dos firmas hex en tiempo constante. */
export function safeEqualHex(a: string, b: string): boolean {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}
