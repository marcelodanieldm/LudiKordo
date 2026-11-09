---
description: Take a GitHub issue from plan to pull request (branch, worktree, implement, verify, open PR). Usage /issue-to-pr <issue number>
---

1. Lee el issue: `gh issue view <número>`. Si no tiene criterios de aceptación claros, detente y pídelos.
2. Crea el worktree y la rama: `git fetch origin && git worktree add ../ludikordo-ag-<número> -b ag/<número>-<slug> origin/main`. Abre esa carpeta como workspace y sigue desde ahí.
3. En modo Planning, produce el Implementation Plan: archivos, pasos verificables, pruebas, claves i18n nuevas, riesgos. Si supera unas 400 líneas, propone partirlo.
4. Espera la aprobación del plan.
5. Implementa paso a paso. Usa la skill que corresponda (`add-lesson`, `add-exercise-type`, `i18n-sync`).
// turbo
6. Corre `npm run verify` y corrige hasta que pase.
7. Si cambió la UI, corre `npx expo run:android` en un emulador de teléfono y otro de tablet y guarda capturas.
8. Sigue la skill `ship-pr` para commitear, hacer push de la rama y abrir el PR con la etiqueta `agent:antigravity`.
9. Resume en el Walkthrough: enlace al PR, comandos ejecutados y pendientes.
