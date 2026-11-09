---
trigger: glob
globs: "src/billing/**, app/paywall.tsx"
---

# Suscripciones

Estas rutas tienen dueño en `CODEOWNERS`: cambia solo lo que la tarea pide y explícalo en el PR.

- Un producto `ludikordo_premium` con planes base `anual` (P1Y, prueba de 7 días) y `semestral` (P6M); permiso `premium` en RevenueCat.
- Gratis para siempre: módulos 1.1 y 1.2, afinador y metrónomo (`FREE_MODULES` en `access.ts`).
- Paywall honesto, no negociable: precio total del período en grande, fecha exacta del primer cobro, «seguir gratis» con el mismo peso visual, restaurar compras, enlace para administrar la suscripción en Google Play. Nunca mostrar el paywall en medio de una lección.
- Los precios salen de RevenueCat (`priceString`), nunca escritos en el código.
- Las reglas puras (`access.ts`) tienen pruebas en `tests/logic.test.ts`.
