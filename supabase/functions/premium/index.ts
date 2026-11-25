/**
 * Suscripción web de la persona con sesión iniciada.
 * GET  /premium            → { access: [{ app, access_until }], subscriptions: [...] }
 * POST /premium { cancel } → cancela una suscripción de Mercado Pago. El acceso
 *                            ya pagado sigue hasta su fecha.
 * Las de Paddle se cancelan desde el enlace del correo de Paddle; las de cripto
 * son prepagas y no se renuevan solas.
 */
import { admin, caller, cors, json, mp } from '../_shared/server.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  const user = await caller(req);
  if (!user) return json({ error: 'auth' }, 401);
  const db = admin();

  if (req.method === 'GET') {
    const [access, subs] = await Promise.all([
      db.from('premium_access').select('app, access_until').eq('user_id', user.id),
      db
        .from('web_subscriptions')
        .select('id, app, channel, plan, status, currency, promo_code, cycles_paid, access_until, created_at')
        .eq('user_id', user.id)
        .neq('status', 'pending')
        .order('created_at', { ascending: false }),
    ]);
    return json({ access: access.data ?? [], subscriptions: subs.data ?? [] });
  }

  if (req.method === 'POST') {
    const b = await req.json().catch(() => ({}));
    if (typeof b.cancel !== 'string') return json({ error: 'params' }, 400);
    const { data: sub } = await db.from('web_subscriptions').select('*').eq('id', b.cancel).eq('user_id', user.id).maybeSingle();
    if (!sub || sub.channel !== 'mercadopago') return json({ error: 'not_found' }, 404);
    await mp(`/preapproval/${sub.external_id}`, { method: 'PUT', body: JSON.stringify({ status: 'cancelled' }) });
    await db.from('web_subscriptions').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', sub.id);
    return json({ ok: true, access_until: sub.access_until });
  }

  return json({ error: 'method' }, 405);
});
