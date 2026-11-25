import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import {
  accessUntil,
  addMonths,
  amountForCycle,
  checkoutOptions,
  checkPromo,
  cryptoOrderId,
  cryptoPaid,
  discounted,
  isOffered,
  mpManifest,
  mpPreapprovalBody,
  nicePrice,
  normalizeCode,
  parseCryptoOrderId,
  parseMpReference,
  parseMpSignature,
  promoErrors,
  safeEqualHex,
  sortDeep,
  verifyMpSignature,
  verifyNowPayments,
  type Promo,
} from '../supabase/functions/_shared/billing';

const PROMO: Promo = {
  code: 'KORDI30',
  percent: 30,
  cycles: 1,
  plans: ['anual', 'semestral'],
  channels: ['mercadopago', 'paddle', 'crypto'],
  apps: ['bass', 'guitar', 'nylon'],
  startsAt: '2026-11-01T00:00:00Z',
  endsAt: '2026-12-31T23:59:59Z',
  active: true,
  maxRedemptions: 100,
  redemptions: 0,
};
const NOW = new Date('2026-11-25T12:00:00Z');
const CTX = { plan: 'anual', channel: 'mercadopago', app: 'bass', now: NOW } as const;

test('monedas por país: pesos en Argentina, reales y dólares en Brasil, dólares en Latam y España, cripto en todos', () => {
  assert.deepEqual(checkoutOptions('ar'), [
    { channel: 'mercadopago', currency: 'ARS' },
    { channel: 'crypto', currency: 'USDC' },
  ]);
  assert.deepEqual(
    checkoutOptions('BR').map((o) => o.currency),
    ['BRL', 'USD', 'USDC'],
  );
  for (const c of ['MX', 'CL', 'CO', 'ES', 'US']) {
    assert.deepEqual(checkoutOptions(c), [
      { channel: 'paddle', currency: 'USD' },
      { channel: 'crypto', currency: 'USDC' },
    ]);
  }
  assert.ok(isOffered('AR', 'mercadopago', 'ARS'));
  assert.ok(!isOffered('ES', 'mercadopago', 'ARS'), 'Mercado Pago en pesos es solo para Argentina');
  assert.ok(!isOffered('AR', 'paddle', 'USD'), 'en Argentina se cobra en pesos');
});

test('promos: valida vigencia, plan, canal, app y tope de canjes', () => {
  assert.deepEqual(checkPromo(PROMO, CTX), { ok: true, promo: PROMO });
  assert.deepEqual(checkPromo(null, CTX), { ok: false, reason: 'not_found' });
  assert.equal(checkPromo({ ...PROMO, active: false }, CTX).ok, false);
  assert.deepEqual(checkPromo(PROMO, { ...CTX, now: new Date('2027-01-01T00:00:00Z') }), { ok: false, reason: 'expired' });
  assert.deepEqual(checkPromo(PROMO, { ...CTX, now: new Date('2026-10-01T00:00:00Z') }), { ok: false, reason: 'not_started' });
  assert.deepEqual(checkPromo({ ...PROMO, plans: ['semestral'] }, CTX), { ok: false, reason: 'plan' });
  assert.deepEqual(checkPromo({ ...PROMO, channels: ['paddle'] }, CTX), { ok: false, reason: 'channel' });
  assert.deepEqual(checkPromo({ ...PROMO, apps: ['guitar'] }, CTX), { ok: false, reason: 'app' });
  assert.deepEqual(checkPromo({ ...PROMO, redemptions: 100 }, CTX), { ok: false, reason: 'exhausted' });
  assert.equal(checkPromo({ ...PROMO, maxRedemptions: null, redemptions: 9999 }, CTX).ok, true);
});

test('seteador de promos: rechaza códigos, porcentajes y fechas inválidos', () => {
  assert.deepEqual(promoErrors(PROMO), []);
  assert.equal(normalizeCode(' kordi 30! '), 'KORDI30');
  assert.ok(promoErrors({ ...PROMO, code: 'kordi30' }).includes('code'));
  assert.ok(promoErrors({ ...PROMO, percent: 0 }).includes('percent'));
  assert.ok(promoErrors({ ...PROMO, percent: 95 }).includes('percent'));
  assert.ok(promoErrors({ ...PROMO, percent: 12.5 }).includes('percent'));
  assert.ok(promoErrors({ ...PROMO, cycles: 53 }).includes('cycles'));
  assert.ok(promoErrors({ ...PROMO, plans: [] }).includes('plans'));
  assert.ok(promoErrors({ ...PROMO, startsAt: '2027-01-01', endsAt: '2026-12-01' }).includes('dates'));
});

test('precio de góndola: redondea hacia abajo, así la promo nunca es menor que lo anunciado', () => {
  assert.equal(nicePrice(45499.3, 'ARS'), 44999);
  assert.equal(nicePrice(44999, 'ARS'), 44999);
  assert.equal(nicePrice(31.49, 'USD'), 30.99);
  assert.equal(nicePrice(31.99, 'USD'), 31.99);
  assert.equal(nicePrice(139.93, 'BRL'), 139.9);
  assert.equal(nicePrice(0.5, 'USD'), 0.99);
  for (const [list, cur] of [[64999, 'ARS'], [44.99, 'USD'], [199.9, 'BRL']] as const) {
    for (const pct of [5, 10, 25, 30, 50, 90]) {
      const p = discounted(list, pct, cur);
      assert.ok(p <= list * (1 - pct / 100) + 1e-9 || p === nicePrice(0, cur), `${list} ${cur} ${pct}% → ${p}`);
    }
  }
  assert.equal(discounted(64999, 30, 'ARS', false), 45499);
  assert.equal(discounted(44.99, 30, 'USD', false), 31.49);
});

test('ciclos de la promo: primer cobro, dos cobros o para siempre', () => {
  assert.equal(amountForCycle(64999, 'ARS', 0, null), 64999);
  const once = { percent: 30, cycles: 1 };
  assert.equal(amountForCycle(64999, 'ARS', 0, once), 44999);
  assert.equal(amountForCycle(64999, 'ARS', 1, once), 64999);
  const twice = { percent: 30, cycles: 2 };
  assert.equal(amountForCycle(64999, 'ARS', 1, twice), 44999);
  assert.equal(amountForCycle(64999, 'ARS', 2, twice), 64999);
  const forever = { percent: 20, cycles: 0 };
  assert.equal(amountForCycle(44.99, 'USD', 7, forever), 35.99);
});

test('acceso: suma el período a lo que quede, con 3 días de gracia, y respeta fin de mes', () => {
  assert.equal(addMonths(new Date('2026-01-31T10:00:00Z'), 1).toISOString(), '2026-02-28T10:00:00.000Z');
  assert.equal(addMonths(new Date('2028-01-31T10:00:00Z'), 1).toISOString(), '2028-02-29T10:00:00.000Z');
  const paid = new Date('2026-11-25T12:00:00Z');
  assert.equal(accessUntil(paid, 'anual', null).toISOString(), '2027-11-28T12:00:00.000Z');
  assert.equal(accessUntil(paid, 'semestral', null).toISOString(), '2027-05-28T12:00:00.000Z');
  // Renovó antes de vencer: no pierde días.
  const left = new Date('2026-12-10T00:00:00Z');
  assert.equal(accessUntil(paid, 'semestral', left).toISOString(), '2027-06-13T00:00:00.000Z');
  // Ya vencido: cuenta desde el pago.
  assert.equal(accessUntil(paid, 'semestral', new Date('2026-01-01T00:00:00Z')).toISOString(), '2027-05-28T12:00:00.000Z');
});

test('Mercado Pago: suscripción en pesos cada 12 o 6 meses, con referencia que vuelve en el aviso', () => {
  const body = mpPreapprovalBody({
    app: 'nylon',
    plan: 'semestral',
    userId: 'u-1',
    email: 'a@b.com',
    amount: 29999,
    reason: 'LudiKordo Guitar Premium semestral',
    backUrl: 'https://x.test/premium/',
    promoCode: 'KORDI30',
  });
  assert.deepEqual(body.auto_recurring, { frequency: 6, frequency_type: 'months', transaction_amount: 29999, currency_id: 'ARS' });
  assert.equal(body.status, 'pending');
  assert.deepEqual(parseMpReference(body.external_reference), { app: 'nylon', plan: 'semestral', userId: 'u-1', promoCode: 'KORDI30' });
  assert.deepEqual(parseMpReference('bass|anual|u-2|'), { app: 'bass', plan: 'anual', userId: 'u-2', promoCode: null });
  assert.equal(parseMpReference('piano|anual|u'), null);
});

test('Mercado Pago: valida la firma x-signature como la documenta', async () => {
  assert.deepEqual(parseMpSignature('ts=1704908010,v1=abc123'), { ts: '1704908010', v1: 'abc123' });
  assert.equal(parseMpSignature('v1=abc'), null);
  assert.equal(mpManifest('123456', 'req-1', '1704908010'), 'id:123456;request-id:req-1;ts:1704908010;');
  assert.equal(mpManifest('ORD01ABC', null, '17'), 'id:ord01abc;ts:17;');
  const secret = 'secreto-de-prueba';
  const v1 = createHmac('sha256', secret).update('id:123456;request-id:req-1;ts:1704908010;').digest('hex');
  const header = `ts=1704908010,v1=${v1}`;
  assert.equal(await verifyMpSignature({ header, requestId: 'req-1', dataId: '123456', secret }), true);
  assert.equal(await verifyMpSignature({ header, requestId: 'req-1', dataId: '999', secret }), false);
  assert.equal(await verifyMpSignature({ header, requestId: 'req-1', dataId: '123456', secret: 'otro' }), false);
  assert.equal(await verifyMpSignature({ header: null, requestId: 'req-1', dataId: '123456', secret }), false);
});

test('NOWPayments: firma HMAC-SHA512 del cuerpo con las claves ordenadas; solo «finished» da acceso', async () => {
  assert.equal(JSON.stringify(sortDeep({ b: 1, a: { d: 2, c: [{ z: 1, y: 2 }] } })), '{"a":{"c":[{"y":2,"z":1}],"d":2},"b":1}');
  const secret = 'ipn-secreto';
  const raw = JSON.stringify({ payment_status: 'finished', order_id: 'x', payment_id: 5, price_amount: 31.99 });
  const sig = createHmac('sha512', secret).update(JSON.stringify(sortDeep(JSON.parse(raw)))).digest('hex');
  assert.equal(await verifyNowPayments(raw, sig, secret), true);
  assert.equal(await verifyNowPayments(raw, sig.toUpperCase(), secret), true);
  assert.equal(await verifyNowPayments(raw.replace('31.99', '1.99'), sig, secret), false);
  assert.equal(await verifyNowPayments('no es json', sig, secret), false);
  assert.ok(cryptoPaid('finished'));
  for (const s of ['waiting', 'confirming', 'confirmed', 'partially_paid', 'failed', 'expired']) assert.ok(!cryptoPaid(s), s);
  const id = cryptoOrderId('guitar', 'anual', 'u-9', null, 'n1');
  assert.deepEqual(parseCryptoOrderId(id), { app: 'guitar', plan: 'anual', userId: 'u-9', promoCode: null, nonce: 'n1' });
  assert.equal(parseCryptoOrderId('guitar|anual|u-9|'), null);
});

test('comparación de firmas en tiempo constante', () => {
  assert.ok(safeEqualHex('abcd', 'ABCD'));
  assert.ok(!safeEqualHex('abcd', 'abce'));
  assert.ok(!safeEqualHex('abcd', 'abc'));
});
