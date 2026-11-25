/**
 * Cuenta de LudiKordo (ADR 0011): inicio de sesión con Google a través de Supabase
 * Auth, abierto en el navegador. Lógica pura, sin dependencias nativas.
 *
 * La app solo necesita saber quién es la persona: su id de Supabase pasa a ser el
 * App User ID de RevenueCat, y así el Premium pagado en la web aparece en la app.
 * No guarda tokens: de la respuesta se queda con el id y el correo.
 */

export type Account = { userId: string; email: string };

export type AuthResult = { ok: true; account: Account } | { ok: false; error: string };

/** Dirección a la que vuelve el inicio de sesión: `ludikordo://auth` (o el esquema de cada app). */
export function redirectUri(scheme: string): string {
  return `${scheme}://auth`;
}

/** Página de inicio de sesión con Google de Supabase. */
export function authorizeUrl(supabaseUrl: string, scheme: string): string {
  const base = supabaseUrl.replace(/\/+$/, '');
  const q = new URLSearchParams({ provider: 'google', redirect_to: redirectUri(scheme) });
  return `${base}/auth/v1/authorize?${q.toString()}`;
}

/** ¿Es la vuelta del inicio de sesión? */
export function isAuthRedirect(url: string, scheme: string): boolean {
  return url.startsWith(redirectUri(scheme));
}

/**
 * Lee la vuelta: `ludikordo://auth#access_token=…&refresh_token=…` o, si falló,
 * `ludikordo://auth?error=…&error_description=…`. Supabase manda los datos en el
 * fragmento (#); por las dudas también se miran los parámetros (?).
 */
export function parseAuthRedirect(url: string): AuthResult {
  const hashAt = url.indexOf('#');
  const queryAt = url.indexOf('?');
  const fragment = hashAt >= 0 ? url.slice(hashAt + 1) : '';
  const query = queryAt >= 0 ? url.slice(queryAt + 1, hashAt > queryAt ? hashAt : undefined) : '';
  const params = new URLSearchParams(fragment || query);
  const extra = new URLSearchParams(query);
  const error = params.get('error_description') ?? params.get('error') ?? extra.get('error_description') ?? extra.get('error');
  if (error) return { ok: false, error };
  const token = params.get('access_token');
  if (!token) return { ok: false, error: 'missing_token' };
  const claims = jwtClaims(token);
  const sub = typeof claims?.sub === 'string' ? claims.sub : null;
  const email = typeof claims?.email === 'string' ? claims.email : '';
  if (!sub) return { ok: false, error: 'invalid_token' };
  return { ok: true, account: { userId: sub, email } };
}

/**
 * Datos del token (JWT) sin verificar la firma. Alcanza para saber el id: la
 * firma la verifica el servidor, que es el que da Premium, nunca la app.
 */
export function jwtClaims(token: string): Record<string, unknown> | null {
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    return JSON.parse(base64UrlDecode(part)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Base64url a texto UTF-8, sin depender de atob ni de Buffer. */
export function base64UrlDecode(input: string): string {
  const s = input.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of s) {
    const v = ALPHABET.indexOf(ch);
    if (v < 0) throw new Error('base64');
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return utf8(bytes);
}

function utf8(bytes: number[]): string {
  let out = '';
  for (let i = 0; i < bytes.length; ) {
    const b = bytes[i];
    let cp: number;
    let n: number;
    if (b < 0x80) [cp, n] = [b, 1];
    else if (b >= 0xf0) [cp, n] = [b & 0x07, 4];
    else if (b >= 0xe0) [cp, n] = [b & 0x0f, 3];
    else [cp, n] = [b & 0x1f, 2];
    for (let k = 1; k < n; k++) cp = (cp << 6) | (bytes[i + k] & 0x3f);
    out += String.fromCodePoint(cp);
    i += n;
  }
  return out;
}
