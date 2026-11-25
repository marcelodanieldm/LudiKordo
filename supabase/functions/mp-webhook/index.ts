/**
 * POST /mp-webhook — notificaciones de Mercado Pago Suscripciones.
 * - subscription_preapproval: cambió el estado de la suscripción (autorizada, pausada, cancelada).
 * - subscription_authorized_payment: hubo un cobro. Si salió aprobado, extiende el acceso
 *   y, cuando se terminan los ciclos de la promo, vuelve el monto al precio de lista.
 * Se publica sin verificación de JWT (supabase/config.toml): la firma x-signature la reemplaza.
 */
import { amountForCycle, parseMpReference, verifyMpSignature, type Currency } from '../_shared/billing.ts';
import { admin, env, json, loadPromo, mp, recordPayment } from '../_shared/server.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const url = new URL(req.url);
  const raw = await req.text();
  const body = JSON.parse(raw || '{}');
  const dataId = url.searchParams.get('data.id') ?? (body?.data?.id ? String(body.data.id) : null);
  const ok = await verifyMpSignature({
    header: req.headers.get('x-signature'),
    requestId: req.headers.get('x-request-id'),
    dataId,
    secret: env('MP_WEBHOOK_SECRET'),
  });
  if (!ok) return json({ error: 'signature' }, 401);
  const type = url.searchParams.get('type') ?? body.type;
  if (!dataId) return json({ ignored: true });

  const db = admin();

  if (type === 'subscription_preapproval') {
    const pre = await mp(`/preapproval/${dataId}`);
    await db
      .from('web_subscriptions')
      .update({ status: String(pre.status), updated_at: new Date().toISOString() })
      .eq('channel', 'mercadopago')
      .eq('external_id', String(pre.id));
    // Al cancelar no se quita nada: el acceso ya pagado dura hasta su fecha.
    return json({ ok: true });
  }

  if (type === 'subscription_authorized_payment') {
    const ap = await mp(`/authorized_payments/${dataId}`);
    const payment = (ap.payment ?? {}) as { id?: number | string; status?: string };
    if (payment.status !== 'approved') return json({ ok: true, status: payment.status ?? null });
    const preId = String(ap.preapproval_id);
    const { data: sub } = await db
      .from('web_subscriptions')
      .select('*')
      .eq('channel', 'mercadopago')
      .eq('external_id', preId)
      .maybeSingle();
    if (!sub) return json({ error: 'unknown_subscription' }, 404);
    // Mercado Pago puede reenviar la misma notificación: un pago se cuenta una sola vez.
    if (sub.last_payment_id === String(payment.id)) return json({ ok: true, duplicate: true });

    const pre = await mp(`/preapproval/${preId}`);
    const ref = parseMpReference(String(pre.external_reference ?? ''));
    if (!ref || ref.userId !== sub.user_id) return json({ error: 'reference' }, 409);

    const until = await recordPayment(db, { app: ref.app, plan: ref.plan, userId: ref.userId, paidAt: new Date() });
    const cycles = sub.cycles_paid + 1;
    await db
      .from('web_subscriptions')
      .update({
        status: 'authorized',
        cycles_paid: cycles,
        last_payment_id: String(payment.id),
        access_until: until.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sub.id);

    if (sub.promo_code) {
      if (cycles === 1) await db.rpc('redeem_promo', { p_code: sub.promo_code });
      const promo = await loadPromo(db, sub.promo_code);
      const next = amountForCycle(Number(sub.list_amount), sub.currency as Currency, cycles, promo);
      const current = Number((pre.auto_recurring as { transaction_amount?: number } | undefined)?.transaction_amount);
      if (next !== current) {
        await mp(`/preapproval/${preId}`, { method: 'PUT', body: JSON.stringify({ auto_recurring: { transaction_amount: next } }) });
      }
    }
    return json({ ok: true, until: until.toISOString() });
  }

  return json({ ignored: type ?? null });
});
