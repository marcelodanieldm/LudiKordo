---
description: Review a pull request against AGENTS.md and leave findings as a PR comment. Usage /review-pr <PR number>
---

1. `gh pr view <número>` y `gh pr diff <número>` para leer el cambio. No hagas checkout sobre una carpeta donde trabaja otro agente.
2. Revisa contra `AGENTS.md` y las reglas de `.agents/rules/` que apliquen a los archivos cambiados, en este orden: errores reales, reglas del proyecto (textos, paridad YIN, CODEOWNERS), pruebas, accesibilidad y tablet.
3. Mira el estado de CI con `gh pr checks <número>`.
4. Redacta los hallazgos de más grave a menos grave, cada uno con `archivo:línea`, problema y arreglo sugerido.
5. Pide confirmación y publícalo con `gh pr comment <número> --body-file <archivo>`. No apruebes ni hagas merge: eso lo hace una persona.
