---
name: ship-pr
description: Finish a LudiKordo task and open a pull request - verify, commit with Conventional Commits, push the branch, open the PR with the template filled in. Use when the work on a branch is done and ready for review.
---
<!-- Generado desde .agents/skills por scripts/agents/sync-skills.mjs. No editar aquí. -->

# Abrir el PR

1. Confirma que no estás en `main`: `git branch --show-current`. Si lo estás, crea la rama (`cc/<issue>-<slug>` o `ag/<issue>-<slug>`) antes de seguir.
2. `npm run verify`. Si falla, arréglalo antes de seguir.
3. Revisa el diff completo (`git diff origin/main...HEAD` y `git status`): nada de secretos, archivos generados ni cambios ajenos a la tarea.
4. Commits pequeños con Conventional Commits en inglés (`feat(scope): …`, `fix(scope): …`, `test(scope): …`).
5. `git push -u origin HEAD` (nunca `--force` sobre una rama compartida).
6. Escribe el cuerpo del PR en un archivo temporal fuera del repo (por ejemplo `/tmp/pr-body.md`) completando `.github/pull_request_template.md`, y abre el PR con `gh pr create --title "<tipo>(<área>): <resumen>" --body-file /tmp/pr-body.md`. El cuerpo incluye:
   - Resumen en 2–3 frases y `Closes #<issue>`.
   - Qué agente lo hizo (Antigravity, Claude Code o persona) y con qué modelo.
   - Cómo se probó: comandos y resultado; capturas de teléfono y tablet si cambió la UI.
   - Riesgos o pendientes.
7. Etiquetas: `agent:claude` o `agent:antigravity`, más el área (`content`, `i18n`, `native`, `billing`, `ui`).

No hagas merge: lo hace una persona después de la revisión.
