/**
 * POST /checkout — arma el pago web de una persona con sesión iniciada.
 * Cuerpo: { app, plan, channel, currency, country, promoCode? }
 * Respuesta: { url } a donde mandar el navegador (Mercado Pago, la página de
 * pago de RevenueCat con Paddle, o la factura de NOWPayments).
 */
import {
  amountForCycle,
  checkPromo,
  cryptoOrderId,
  isApp,
  isOffered,
  isPlan,
  mpPreapprovalBody,
  normalizeCode,
  type Channel,
  type Currency,
} from '../_shared/billing.ts';
import { admin, caller, cors, env, json, listPrice, loadPromo, mp } from '../_shared/server.ts';

const APP_NAME = { bass: 'LudiKordo', guitar: 'LudiKordo Electric Guitar', nylon: 'LudiKordo Guitar' } as const;
const PLAN_NAME = { anual: 'anual', semestral: 'semestral' } as const;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const user = await caller(req);
  if (!user) return json({ error: 'auth' }, 401);

  const b = await req.json().catch(() => ({}));
  const app = b.app;
  const plan = b.plan;
  const channel = b.channel as Channel;
  const currency = b.currency as Currency;
  const country = typeof b.country === 'string' ? b.country : '';
  if (!isApp(app) || !isPlan(plan) || !isOffered(country, channel, currency)) return json({ error: 'option' }, 400);

  const db = admin();
  const code = typeof b.promoCode === 'string' && b.promoCode ? normalizeCode(b.promoCode) : null;
  let promo = null;
  if (code) {
    const check = checkPromo(await loadPromo(db, code), { app, plan, channel, now: new Date() });
    if (!check.ok) return json({ error: 'promo', reason: check.reason }, 400);
    promo = check.promo;
  }
  const site = env('SITE_URL');
  const back = `${site}/premium/?app=${app}&listo=1`;

  // Paddle: página de pago de RevenueCat para esta app, plan y moneda, con el id del alumno al final.
  // La promo se escribe en el pago de Paddle (el panel la crea allí con el mismo código).
  if (channel === 'paddle') {
    const link = env(`RC_LINK_${app.toUpperCase()}_${plan.toUpperCase()}_${currency}`);
    return json({ url: `${link}/${encodeURIComponent(user.id)}`, promoAtCheckout: code });
  }

  const list = await listPrice(db, app, plan, channel, currency);
  if (list === null) return json({ error: 'price' }, 409);
  const amount = amountForCycle(list, currency, 0, promo);

  if (channel === 'mercadopago') {
    const body = mpPreapprovalBody({
      app,
      plan,
      userId: user.id,
      email: user.email,
      amount,
      reason: `${APP_NAME[app]} Premium ${PLAN_NAME[plan]}`,
      backUrl: back,
      promoCode: code,
    });
    const pre = await mp('/preapproval', { method: 'POST', body: JSON.stringify(body) });
    const { error } = await db.from('web_subscriptions').insert({
      user_id: user.id,
      app,
      channel,
      external_id: String(pre.id),
      plan,
      status: 'pending',
      currency,
      list_amount: list,
      promo_code: code,
    });
    if (error) throw error;
    return json({ url: pre.init_point });
  }

  // Cripto: prepago de 6 o 12 meses con una factura de NOWPayments.
  const orderId = cryptoOrderId(app, plan, user.id, code, crypto.randomUUID());
  const res = await fetch('https://api.nowpayments.io/v1/invoice', {
    method: 'POST',
    headers: { 'x-api-key': env('NOWPAYMENTS_API_KEY'), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      price_amount: amount,
      price_currency: 'usd',
      order_id: orderId,
      order_description: `${APP_NAME[app]} Premium ${PLAN_NAME[plan]}`,
      ipn_callback_url: `${env('SUPABASE_URL')}/functions/v1/crypto-webhook`,
      success_url: back,
      cancel_url: `${site}/premium/?app=${app}`,
    }),
  });
  const inv = await res.json();
  if (!res.ok) return json({ error: 'crypto', detail: inv }, 502);
  const { error } = await db.from('web_subscriptions').insert({
    user_id: user.id,
    app,
    channel,
    external_id: orderId,
    plan,
    status: 'pending',
    currency,
    list_amount: list,
    promo_code: code,
  });
  if (error) throw error;
  return json({ url: inv.invoice_url });
});
