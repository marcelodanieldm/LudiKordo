/**
 * Ayudas de servidor para las funciones de Supabase (Deno). La lógica de negocio
 * está en billing.ts, que es pura y tiene pruebas; acá solo hay red y entorno.
 * Este archivo queda fuera del chequeo de tipos del repo (usa Deno).
 */
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { accessUntil, ENTITLEMENT_ID, type App, type Plan } from './billing.ts';

export function env(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Falta la variable ${name}`);
  return v;
}

const ALLOWED_ORIGIN = Deno.env.get('SITE_ORIGIN') ?? '*';

export const cors = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

/** Cliente con la clave de servicio: salta las reglas de RLS, solo para el servidor. */
export function admin(): SupabaseClient {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
}

/** Usuario que llama, a partir de su token de sesión. */
export async function caller(req: Request): Promise<{ id: string; email: string } | null> {
  const auth = req.headers.get('Authorization');
  if (!auth) return null;
  const client = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const { data } = await client.auth.getUser();
  return data.user?.email ? { id: data.user.id, email: data.user.email } : null;
}

/** Clave secreta de RevenueCat de cada app (cada app es un proyecto o una app distinta). */
function revenueCatKey(app: App): string {
  return env(`REVENUECAT_SECRET_${app.toUpperCase()}`);
}

/** Da Premium en RevenueCat hasta `until`. La app lo ve en su próxima consulta. */
export async function grantPremium(app: App, userId: string, until: Date): Promise<void> {
  const url = `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}/entitlements/${ENTITLEMENT_ID}/promotional`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${revenueCatKey(app)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ end_time_ms: until.getTime() }),
  });
  if (!res.ok) throw new Error(`RevenueCat ${res.status}: ${await res.text()}`);
}

/**
 * Registra un pago: extiende el acceso de esa persona en esa app, lo guarda y se
 * lo pasa a RevenueCat. Devuelve la nueva fecha.
 */
export async function recordPayment(db: SupabaseClient, a: { app: App; plan: Plan; userId: string; paidAt: Date }): Promise<Date> {
  const { data } = await db.from('premium_access').select('access_until').eq('user_id', a.userId).eq('app', a.app).maybeSingle();
  const current = data?.access_until ? new Date(data.access_until) : null;
  const until = accessUntil(a.paidAt, a.plan, current);
  const { error } = await db
    .from('premium_access')
    .upsert({ user_id: a.userId, app: a.app, access_until: until.toISOString(), updated_at: new Date().toISOString() });
  if (error) throw error;
  await grantPremium(a.app, a.userId, until);
  return until;
}

export async function loadPromo(db: SupabaseClient, code: string) {
  const { data } = await db.from('promos').select('*').eq('code', code).maybeSingle();
  if (!data) return null;
  return {
    code: data.code as string,
    percent: data.percent as number,
    cycles: data.cycles as number,
    plans: data.plans,
    channels: data.channels,
    apps: data.apps,
    startsAt: data.starts_at as string | null,
    endsAt: data.ends_at as string | null,
    active: data.active as boolean,
    maxRedemptions: data.max_redemptions as number | null,
    redemptions: data.redemptions as number,
  };
}

export async function listPrice(db: SupabaseClient, app: App, plan: Plan, channel: string, currency: string): Promise<number | null> {
  const { data } = await db
    .from('prices')
    .select('amount')
    .eq('app', app)
    .eq('plan', plan)
    .eq('channel', channel)
    .eq('currency', currency)
    .maybeSingle();
  return data ? Number(data.amount) : null;
}

/** Mercado Pago, con el token del vendedor. */
export async function mp(path: string, init: RequestInit = {}): Promise<Record<string, unknown>> {
  const res = await fetch(`https://api.mercadopago.com${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${env('MP_ACCESS_TOKEN')}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Mercado Pago ${res.status}: ${JSON.stringify(body)}`);
  return body as Record<string, unknown>;
}
