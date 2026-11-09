---
description: Fix a failing CI run on a pull request branch. Usage /fix-ci <PR number>
---

1. `gh pr checks <número>` y `gh run view <id> --log-failed` para encontrar el primer error real.
2. Abre el worktree de la rama del PR (créalo con `git worktree add ../ludikordo-fix-<número> <rama>` si no existe).
3. Sigue la skill `fix-ci`: reproducir, arreglar la causa, nunca debilitar pruebas.
// turbo
4. Corre `npm run verify`.
5. Commit `fix(ci): …` y push de la misma rama (pide confirmación para el push). Comenta en el PR la causa en una frase.
6. Si después de dos intentos sigue fallando, detente y explica lo encontrado en el PR.
