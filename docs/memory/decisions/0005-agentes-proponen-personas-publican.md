# 0005 · Los agentes proponen por PR; las personas publican

- **Estado**: aceptada · 2026-11-09

## Decisión
Ningún agente hace merge, crea tags, construye para producción ni publica en Google Play. Todo cambio entra por PR con CI en verde; una persona hace merge, crea el tag `vX.Y.Z` y aprueba la promoción a producción.

## Cómo se hace cumplir
Permisos de `.claude/settings.json`, reglas de `AGENTS.md`, protección de `main`, `CODEOWNERS` y el entorno `play-production` con aprobación obligatoria. Detalle en `docs/AGENTIC_WORKFLOW.md`.
