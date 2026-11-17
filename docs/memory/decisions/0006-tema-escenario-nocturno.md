# 0006 · Interfaz «escenario nocturno»

- **Estado**: aceptada · 2026-11-09 (aprobada por Marcelo sobre el canvas de diseño)

## Contexto
La primera versión usaba fondo crema y acento terracota. Para la mejora de calidad visual se exploraron tres direcciones (escenario nocturno, cálido y lúdico, claro/oscuro) y se eligió la primera.

## Decisión
- Tema oscuro único: fondo `#14121F`, superficies `#1F1C2E` / `#2A2640`, texto `#F5F1E8` / `#B3ADC7`.
- Colores con significado fijo: naranja `#FF6B2C` = acción principal y nota a tocar; dorado `#F5B83D` = logros; turquesa `#3FD0C9` = afinado, correcto, objetivo.
- Texto sobre colores llenos siempre oscuro (`#1A0F08`), nunca blanco.
- Tipografía: Fredoka (títulos) y Nunito (texto), cargadas con `@expo-google-fonts`.
- Botón principal con «escalón» inferior que se hunde al tocar; Kordi bajo un foco en bienvenida, cartoon y resultado.
- Diseño de referencia: canvas «LudiKordo — Rediseño escenario nocturno» (https://claude.ai/artifact/SCrNy3QjEQDLLFQcdgrMtd).

## Consecuencias
- Los nombres antiguos de `colors` se conservan con valores oscuros; hay una prueba de contraste en `tests/logic.test.ts`.
- Un tema claro, si se pide, implica volver semánticos todos los tokens (no está hecho).
- Dos dependencias nuevas de fuentes (+ `expo-font`).
