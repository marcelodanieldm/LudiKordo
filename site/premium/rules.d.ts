// Tipos de rules.js para las pruebas (la web lo usa como JavaScript sin compilar).
type Currency = 'ARS' | 'USD' | 'BRL' | 'USDC';
type Option = { channel: 'mercadopago' | 'paddle' | 'crypto'; currency: Currency };
type PromoLike = { code: string; percent: number; cycles: number; plans: string[]; channels: string[]; apps: string[]; startsAt: string | null; endsAt: string | null };

export const LATAM: string[];
export function checkoutOptions(country: string): Option[];
export function normalizeCode(code: string): string;
export function nicePrice(value: number, currency: Currency): number;
export function discounted(list: number, percent: number, currency: Currency, nice?: boolean): number;
export function amountForCycle(list: number, currency: Currency, cycle: number, promo: { percent: number; cycles: number } | null): number;
export function promoErrors(p: PromoLike): string[];
export function formatMoney(amount: number, currency: Currency, locale: string): string;
