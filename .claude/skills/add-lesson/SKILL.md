---
name: add-lesson
description: Add a new LudiKordo lesson end to end - lesson data in src/content/lessons.ts, texts in en/es/pt, tests passing. Use when asked to write, add or draft a lesson (for example "add lesson 1.3.2").
---
<!-- Generado desde .agents/skills por scripts/agents/sync-skills.mjs. No editar aquí. -->

# Agregar una lección

Lecciones modelo para copiar el formato: `1.1.1`, `1.1.4`, `1.2.1`, `1.3.1` en `src/content/lessons.ts`.

## 1. Ubicar la lección

- Confirma que el id existe en la ruta: `src/content/curriculum.ts` (módulo y cantidad de lecciones).
- Lee las lecciones anteriores del mismo módulo: la nueva solo puede usar habilidades ya enseñadas.

## 2. Diseñar (antes de escribir código)

Escribe en el PR o en el plan:

- Objetivo medible en una frase.
- 4 escenas del cartoon: gancho, demostración, error común con humor, regla en una frase.
- 2–3 tarjetas, una idea por tarjeta, con figura si ayuda (`Figure` en `src/content/types.ts`).
- Ejercicios: al menos uno sin bajo (`quiz`, `ear`, `tapRhythm`, `fretboardTap`) y uno con bajo (`playAlong`). Solo esos 4 tipos están implementados.
- `mastery` (0,8 por defecto).

## 3. Datos

En `src/content/lessons.ts`, crea la constante siguiendo el patrón (`const l132: Lesson = { … }`) con la función `k(id, key)` para las claves, y súmala a `LESSONS`. Notas con `{ string, fret }`; verifica cada nota con `src/music/notes.ts`.

## 4. Textos

En `src/i18n/locales/es.json`, bajo `content.l<id sin puntos>` (por ejemplo `content.l132`): `title`, `objective`, `s1`–`s4`, `c1t`/`c1b`…, prompts de ejercicios, opciones y pistas. Después lo mismo en `en.json` y `pt.json` con las mismas claves. Respeta `src/i18n/GLOSSARY.md`.

## 5. Verificar

```bash
npm run check:i18n
npm test
npm run typecheck
```

La prueba `tests/content.test.ts` falla si falta una clave en algún idioma o si `correctIndex` apunta a una opción inexistente.

## 6. Entregar

Un PR por lección o por módulo (máximo 5 lecciones). Título: `feat(lesson): add 1.3.2 <título en inglés>`. Pide revisión de traducciones si no la hizo un revisor de i18n.
