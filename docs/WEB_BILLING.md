# Cobro web (opción B) — puesta en marcha

Decisión y motivos: [ADR 0011](memory/decisions/0011-cobro-web-opcion-b.md). Este documento lista lo que tiene que hacer una persona: crear cuentas, cargar secretos y desplegar. **Ninguna clave va al repo**: todas se cargan con `supabase secrets set` o en el panel de cada servicio.

## Cómo funciona

```
Alumno ── site/premium ── inicia sesión con Google (Supabase Auth)
   │                       │
   │            elige app, plan y forma de pago
   │       ┌───────────────┼──────────────────────┐
   │  Mercado Pago (ARS)   Paddle (USD/BRL)        NOWPayments (USDC/USDT)
   │       │               │                        │
   │  mp-webhook      RevenueCat (directo)     crypto-webhook
   │       └──────► RevenueCat: entitlement «premium» ◄──┘
   │
   └── App ── «Iniciar sesión con Google» ── Purchases.logIn(id de Supabase) ── Premium
```

## 1. Supabase
1. Crear un proyecto (región São Paulo, la más cercana).
2. `supabase link --project-ref <ref>` y `supabase db push` (crea las tablas de `supabase/migrations/`).
3. Cargarte como admin en el editor SQL: `insert into public.admins (email) values ('tu-correo@gmail.com');`
4. Authentication → URL configuration: Site URL = la dirección del sitio; agregar `<sitio>/premium/**` y los tres esquemas de las apps (`ludikordo://auth`, `ludikordoguitar://auth`, `ludikordonylon://auth`).

## 2. Inicio de sesión con Google
1. Google Cloud Console → credenciales OAuth de tipo «Aplicación web», con la URL de retorno que muestra Supabase (`https://<ref>.supabase.co/auth/v1/callback`).
2. Supabase → Authentication → Providers → Google: pegar el client id y el secreto.

## 3. RevenueCat
1. Para cada app (bajo, eléctrica, criolla), una clave secreta v1 (Project settings → API keys).
2. Conectar Paddle (Apps → Paddle Billing) y crear, por app, plan y moneda, un **Web Purchase Link**. Son hasta 18 enlaces (3 apps × 2 planes × USD/BRL; BRL solo si vendes en Brasil).

## 4. Paddle
1. Cuenta de vendedor (verificación de identidad y cuenta bancaria en USD).
2. Productos y precios por app y plan, en USD y BRL. Activar códigos de descuento en el checkout.
3. Cada promo del panel se crea también en Paddle con el mismo código (el panel muestra los datos).

## 5. Mercado Pago
1. Tus integraciones → crear aplicación (Suscripciones). Copiar el Access Token de producción.
2. Webhooks: URL `https://<ref>.supabase.co/functions/v1/mp-webhook`, eventos «Planes y suscripciones». Copiar la clave secreta de la firma.

## 6. NOWPayments
1. Cuenta de comercio con verificación; confirmar que te acepta desde Argentina.
2. Billetera de cobro (USDC/USDT) y la clave IPN. URL de avisos: `https://<ref>.supabase.co/functions/v1/crypto-webhook`.

## 7. Web
En `site/premium/config.js`, la URL del proyecto y la clave **anon** (es pública; la protegen las reglas RLS). Nunca la clave de servicio. Netlify publica `site/` como siempre: la suscripción queda en `/premium/` y el panel en `/premium/admin.html`.

## 7b. App
La app lee la dirección del proyecto de `EXPO_PUBLIC_SUPABASE_URL` al compilar (variable de entorno de EAS o del workflow de APK). Sin ella no aparece «Iniciar sesión con Google». Al iniciar sesión, el id de Supabase pasa a ser el App User ID de RevenueCat (`Purchases.logIn`); por eso un pago web se ve en la app con la misma cuenta. La app no guarda tokens ni menciona la compra web.

## 8. Secretos y despliegue

```sh
supabase secrets set \
  SITE_URL=https://<sitio> SITE_ORIGIN=https://<sitio> \
  SUPABASE_ANON_KEY=<clave anon> \
  MP_ACCESS_TOKEN=<token> MP_WEBHOOK_SECRET=<secreto> \
  NOWPAYMENTS_API_KEY=<clave> NOWPAYMENTS_IPN_SECRET=<secreto> \
  REVENUECAT_SECRET_BASS=<sk_…> REVENUECAT_SECRET_GUITAR=<sk_…> REVENUECAT_SECRET_NYLON=<sk_…> \
  RC_LINK_BASS_ANUAL_USD=https://pay.rev.cat/<…> RC_LINK_BASS_SEMESTRAL_USD=… (uno por enlace)
supabase functions deploy checkout mp-webhook crypto-webhook promo premium
```

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` ya existen en las funciones.

## 9. Precios web y promos
En el panel (`/premium/admin.html`, con una cuenta de la tabla `admins`): precios de lista de Mercado Pago (ARS) y cripto (USDC), y el seteador de promos, que muestra cómo queda el primer cobro y los datos para crear la misma promo en Paddle y en Google Play. También se puede usar la tabla `prices`: un precio por app, plan, canal y moneda (`mercadopago`/`ARS`, `crypto`/`USDC`). Los de Paddle viven en Paddle y los de Play en Play Console.

## Flujos cubiertos

| Flujo | Mercado Pago | Paddle | Cripto |
| --- | --- | --- | --- |
| Alta | `checkout` crea la suscripción y manda al pago | Web Purchase Link de RevenueCat | `checkout` crea la factura |
| Cobro y renovación | `mp-webhook` (pago aprobado) extiende el acceso | RevenueCat | `crypto-webhook` (`finished`) da 6 o 12 meses |
| Pago rechazado | Mercado Pago reintenta; los 3 días de gracia cubren el reintento | Paddle | — (prepago) |
| Promo | primer cobro con descuento; al terminar los ciclos se vuelve al precio de lista | código en el checkout | precio con descuento |
| Cancelación | `premium` (POST) — el acceso pagado sigue | enlace del correo de Paddle | no se renueva |
| Reembolso | a mano: quitar el entitlement en RevenueCat | RevenueCat | a mano |

## Pendientes
- Confirmar con Google la política de pagos para el modelo multiplataforma (ADR 0011).
- Confirmar con un contador la facturación (monotributo o sociedad, ventas en pesos y al exterior).
- Prueba de punta a punta con las cuentas de prueba de Mercado Pago, el sandbox de Paddle y el sandbox de NOWPayments.
