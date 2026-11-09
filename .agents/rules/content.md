---
trigger: glob
globs: "src/content/**"
---

# Contenido pedagógico

- Las lecciones son datos en `src/content/lessons.ts`; los textos van en `content.l<id sin puntos>` de los 3 idiomas.
- Formato de 4 pasos y criterios de las lecciones modelo (1.1.1, 1.1.4, 1.2.1, 1.3.1). Procedimiento completo: skill `add-lesson`.
- Una habilidad nueva por lección, apoyada solo en lo enseñado antes en `curriculum.ts`.
- Solo los tipos de ejercicio implementados (`quiz`, `ear`, `tapRhythm`, `fretboardTap`, `playAlong`) en lecciones publicables.
- Música original. Nada de líneas, letras ni tablaturas de canciones con derechos.
- No cambies la cantidad de lecciones de un módulo en `curriculum.ts` sin actualizar `tests/logic.test.ts` (hoy espera 123) y avisar en el PR.
