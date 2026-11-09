---
name: fix-ci
description: Diagnose and fix a failing LudiKordo CI run on a pull request branch - reproduce locally, fix the root cause, push to the same branch. Use when CI is red, when asked to fix the build or tests, or when an @claude comment says /fix-ci.
---
<!-- Generado desde .agents/skills por scripts/agents/sync-skills.mjs. No editar aquí. -->

# Arreglar CI

1. **Ver qué falló**: `gh pr checks <pr>` y `gh run view <run-id> --log-failed`. Identifica el job (`verify`, `agents-config`, `native-android`) y el primer error real, no el último.
2. **Reproducir**: corre localmente el mismo comando (`npm run typecheck`, `npm test`, `npm run check:i18n`, `npm run check:agents`). Si es `native-android` y no hay SDK de Android, lee el log de Gradle con cuidado: suele ser un import o una firma de Kotlin.
3. **Arreglar la causa**, no el síntoma:
   - Nunca desactivar ni saltear pruebas, ni subir tolerancias, ni agregar `@ts-ignore` para pasar.
   - Si la prueba estaba mal (por ejemplo, teoría musical equivocada), explícalo en el commit.
4. **Verificar** con `npm run verify`.
5. **Entregar**: commit `fix(ci): <qué se arregló>` en la misma rama del PR y push de esa rama (nunca a `main`). Deja un comentario en el PR con la causa en una frase.

Si después de dos intentos no está resuelto, detente y deja un comentario con lo que encontraste para que lo vea una persona.
