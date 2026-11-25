import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authorizeUrl, base64UrlDecode, isAuthRedirect, jwtClaims, parseAuthRedirect, redirectUri } from '../src/billing/account';

const b64url = (s: string) => Buffer.from(s, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const jwt = (claims: object) => `${b64url('{"alg":"HS256"}')}.${b64url(JSON.stringify(claims))}.firma`;

test('inicio de sesión: la vuelta llega al esquema de cada app', () => {
  assert.equal(redirectUri('ludikordonylon'), 'ludikordonylon://auth');
  assert.equal(
    authorizeUrl('https://abc.supabase.co/', 'ludikordo'),
    'https://abc.supabase.co/auth/v1/authorize?provider=google&redirect_to=ludikordo%3A%2F%2Fauth',
  );
  assert.ok(isAuthRedirect('ludikordo://auth#access_token=x', 'ludikordo'));
  assert.ok(!isAuthRedirect('ludikordo://leccion/1.1.1', 'ludikordo'));
  assert.ok(!isAuthRedirect('ludikordoguitar://auth#x', 'ludikordo'));
});

test('de la vuelta se queda con el id y el correo, también con acentos', () => {
  const token = jwt({ sub: 'b1c2-uuid', email: 'josé.núñez@gmail.com', role: 'authenticated' });
  const url = `ludikordo://auth#access_token=${token}&expires_in=3600&refresh_token=r&token_type=bearer&type=signup`;
  assert.deepEqual(parseAuthRedirect(url), { ok: true, account: { userId: 'b1c2-uuid', email: 'josé.núñez@gmail.com' } });
  assert.deepEqual(jwtClaims(token)?.role, 'authenticated');
  assert.equal(base64UrlDecode(b64url('Kordi 🎸 ñ')), 'Kordi 🎸 ñ');
});

test('errores del inicio de sesión: cancelado, sin token o token roto', () => {
  assert.deepEqual(parseAuthRedirect('ludikordo://auth?error=access_denied&error_description=Cancelado'), { ok: false, error: 'Cancelado' });
  assert.deepEqual(parseAuthRedirect('ludikordo://auth#error=server_error'), { ok: false, error: 'server_error' });
  assert.deepEqual(parseAuthRedirect('ludikordo://auth'), { ok: false, error: 'missing_token' });
  assert.deepEqual(parseAuthRedirect('ludikordo://auth#access_token=nada'), { ok: false, error: 'invalid_token' });
  assert.deepEqual(parseAuthRedirect(`ludikordo://auth#access_token=${jwt({ email: 'a@b.c' })}`), { ok: false, error: 'invalid_token' });
  assert.equal(jwtClaims('a.%%%.c'), null);
});
