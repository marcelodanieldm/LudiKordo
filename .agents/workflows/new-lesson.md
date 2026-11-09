---
description: Write one or more new lessons with texts in en, es and pt-BR. Usage /new-lesson <lesson id or module, e.g. 1.3.2 or 1.4>
---

1. Confirma en `src/content/curriculum.ts` que las lecciones pedidas existen y lee las anteriores del mismo módulo.
2. Crea la rama `ag/lesson-<id>` (en su propio worktree si hay otro agente trabajando).
3. Para cada lección, sigue la skill `add-lesson`: diseño breve en el plan, datos en `lessons.ts`, textos en los 3 idiomas.
// turbo
4. Corre `npm run check:i18n` y `npm test`.
5. Revisa tus propias traducciones contra `src/i18n/GLOSSARY.md` (portugués: «casa», «pestana»).
6. Abre el PR con la skill `ship-pr`, etiquetas `agent:antigravity` y `content`. Máximo 5 lecciones por PR.
