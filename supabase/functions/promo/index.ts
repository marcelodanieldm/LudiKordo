/**
 * GET /promo?code=KORDI30&app=bass&plan=anual&channel=mercadopago&currency=ARS
 * Pública: dice si el código sirve y cuánto queda el precio. No descuenta nada:
 * el canje se cuenta cuando entra el primer pago.
 */
import { amountForCycle, checkPromo, isApp, isPlan, normalizeCode, type Channel, type Currency } from '../_shared/billing.ts';
import { admin, cors, json, listPrice, loadPromo } from '../_shared/server.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  const q = new URL(req.url).searchParams;
  const app = q.get('app');
  const plan = q.get('plan');
  const channel = q.get('channel') as Channel;
  const currency = q.get('currency') as Currency;
  const code = normalizeCode(q.get('code') ?? '');
  if (!isApp(app) || !isPlan(plan) || !code) return json({ ok: false, reason: 'params' }, 400);

  const db = admin();
  const check = checkPromo(await loadPromo(db, code), { app, plan, channel, now: new Date() });
  if (!check.ok) return json({ ok: false, reason: check.reason });
  const { percent, cycles } = check.promo;
  // En Paddle el precio con descuento lo calcula su propio pago.
  const list = channel === 'paddle' ? null : await listPrice(db, app, plan, channel, currency);
  return json({
    ok: true,
    code,
    percent,
    cycles,
    list,
    first: list === null ? null : amountForCycle(list, currency, 0, check.promo),
  });
});
