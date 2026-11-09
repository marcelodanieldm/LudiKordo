---
trigger: always_on
---

# Cómo trabaja Antigravity en LudiKordo

Las reglas del proyecto están en `AGENTS.md` (siempre cargado). Esto agrega lo propio de Antigravity.

- **Modo**: usa Planning para cualquier tarea que toque más de 2 archivos, y deja el Implementation Plan como artefacto antes de editar. Fast solo para cambios de una línea o preguntas.
- **Un workspace por rama**: abre el worktree de la tarea (`../ludikordo-<rama>`) como workspace propio en el Agent Manager. Nunca dos agentes en la misma carpeta, ni en la carpeta donde trabaja Claude Code.
- **Ramas**: `ag/<issue>-<slug>`. Etiqueta los PR con `agent:antigravity`.
- **Terminal**: puedes correr sin pedir `npm test`, `npm run typecheck`, `npm run check:i18n`, `npm run check:agents` y `npm run verify`. Pide confirmación antes de `git push`, `npm install` o `npx expo install`. Nunca corras `eas build`, `eas submit`, `git push --force`, `gh pr merge` ni `git tag`.
- **Navegador**: úsalo para leer documentación (Expo, React Native, RevenueCat). La app es solo Android: para verificar UI, corre `npx expo run:android` en el emulador y adjunta capturas de teléfono y tablet al Walkthrough y al PR.
- **Skills**: las skills del proyecto están en `.agents/skills/` y las comparte Claude Code. Si cambias una, corre `npm run sync:skills` y commitea también `.claude/skills/`.
- **Walkthrough**: al terminar, incluye comandos ejecutados con su resultado y qué quedó pendiente; ese texto va al cuerpo del PR.
