# 0011 · Cobro web junto a Google Play (opción B)

- **Estado**: aceptada · 2026-11-25 (Marcelo: «vamos con la opción B»)

## Contexto
Marcelo cobra desde Argentina y quiere suscripciones en pesos para Argentina, en dólares para Latinoamérica y España, en reales y dólares para Brasil, y en USDC/USDT. Google Play solo cobra en la moneda local de cada país (en España, euros), no acepta cripto y, fuera de unos pocos países (EEE, Australia, Brasil, India, Indonesia, Japón, Sudáfrica, Corea, EE. UU.), no deja usar otro sistema de cobro ni enlazar a uno desde la app. Comparativa completa: https://claude.ai/artifact/S5LTzqXVkExL5K3J9VzMro

## Decisión
1. **La app sigue vendiendo solo con Google Play** (RevenueCat, `ludikordo_premium`). No menciona ni enlaza la compra web: dentro de la app solo aparece «Iniciar sesión con Google» para quien ya tiene cuenta.
2. **Además hay una suscripción web** en `site/premium/`, a la que se llega desde el sitio, redes y correo:
   - Argentina: **Mercado Pago Suscripciones** en ARS.
   - Latinoamérica, España y el resto: **Paddle** en USD (comerciante registrado: cobra y paga impuestos de cada país), conectado a RevenueCat con Web Purchase Links.
   - Brasil: Paddle en BRL o USD.
   - Todos: **USDC/USDT con NOWPayments**, como prepago de 6 o 12 meses (las suscripciones en stablecoins de Stripe son solo para empresas de EE. UU.).
3. **La misma persona en la app y en la web**: inicio de sesión con Google a través de Supabase Auth. El id de usuario de Supabase es el App User ID de RevenueCat (`Purchases.logIn`).
4. **Backend en Supabase** (`supabase/`): tablas de precios web, promos, suscripciones web y acceso; funciones `checkout`, `mp-webhook`, `crypto-webhook`, `promo` y `premium`. Mercado Pago y cripto dan Premium con la API de entitlements promocionales de RevenueCat (`end_time_ms`); Paddle lo da RevenueCat directamente.
5. **Promos**: tabla `promos` (código, %, ciclos, planes, canales, apps, vigencia, tope). Las edita un admin desde el panel web. Mercado Pago y cripto las aplican en este backend; en Paddle se crea el mismo código; en Google Play se cargan a mano como oferta (el panel genera la configuración).
6. **La lógica es pura y tiene pruebas** en `supabase/functions/_shared/billing.ts` (`tests/web-billing.test.ts`). Los archivos de Deno quedan fuera de `tsc`.

## Consecuencias
- Los precios siguen fuera del código: los web están en la tabla `prices` (los carga Marcelo), los de Paddle en Paddle y los de Play en Play Console.
- Las claves (Mercado Pago, NOWPayments, RevenueCat secretas, Google OAuth) van como secretos de Supabase, nunca en el repo.
- Cada app usa su propia clave secreta de RevenueCat (`REVENUECAT_SECRET_BASS|GUITAR|NYLON`): una suscripción web es para una app.
- Pendiente de verificar con Google: que la política de pagos permita activar en la app lo comprado en la web sin enlazarlo (modelo «multiplataforma»). Pendiente con un contador: facturación local en pesos y ventas al exterior.
- Reembolsos y contracargos de Mercado Pago y cripto se resuelven a mano por ahora (quitar el acceso desde el panel de RevenueCat).
