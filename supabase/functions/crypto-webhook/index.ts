/**
 * POST /crypto-webhook — avisos (IPN) de NOWPayments. Cuando un pago queda
 * «finished», da Premium por 6 o 12 meses (prepago) sumados a lo que quede.
 * Se publica sin verificación de JWT: la firma x-nowpayments-sig la reemplaza.
 */
import { cryptoPaid, parseCryptoOrderId, verifyNowPayments } from '../_shared/billing.ts';
import { admin, env, json, recordPayment } from '../_shared/server.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const raw = await req.text();
  const ok = await verifyNowPayments(raw, req.headers.get('x-nowpayments-sig'), env('NOWPAYMENTS_IPN_SECRET'));
  if (!ok) return json({ error: 'signature' }, 401);
  const body = JSON.parse(raw);
  const orderId = String(body.order_id ?? '');
  const order = parseCryptoOrderId(orderId);
  if (!order) return json({ error: 'order' }, 400);

  const db = admin();
  const { data: sub } = await db.from('web_subscriptions').select('*').eq('channel', 'crypto').eq('external_id', orderId).maybeSingle();
  if (!sub || sub.user_id !== order.userId) return json({ error: 'unknown_order' }, 404);

  const status = String(body.payment_status ?? '');
  if (!cryptoPaid(status)) {
    if (sub.status !== 'paid') await db.from('web_subscriptions').update({ status, updated_at: new Date().toISOString() }).eq('id', sub.id);
    return json({ ok: true, status });
  }
  // NOWPayments reintenta los avisos: un pedido se paga una sola vez.
  if (sub.status === 'paid') return json({ ok: true, duplicate: true });

  const until = await recordPayment(db, { app: order.app, plan: order.plan, userId: order.userId, paidAt: new Date() });
  await db
    .from('web_subscriptions')
    .update({
      status: 'paid',
      cycles_paid: 1,
      last_payment_id: String(body.payment_id ?? ''),
      access_until: until.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sub.id);
  if (sub.promo_code) await db.rpc('redeem_promo', { p_code: sub.promo_code });
  return json({ ok: true, until: until.toISOString() });
});
