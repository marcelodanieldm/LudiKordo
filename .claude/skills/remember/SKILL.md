---
name: remember
description: Save project knowledge to the shared memory in docs/memory - a decision (ADR) or a learning/gotcha - so every agent and person sees it. Use when a decision is made, a non-obvious bug is found, the user says "remember this" or "anota esto", or at the end of a task that taught something reusable.
---
<!-- Generado desde .agents/skills por scripts/agents/sync-skills.mjs. No editar aquí. -->

# Guardar memoria del proyecto

La memoria compartida está en `docs/memory/` (índice: `docs/memory/INDEX.md`). Se guarda en git, dentro del PR de la tarea.

## ¿Qué tipo es?

- **Decisión** (se eligió un camino entre alternativas, con consecuencias): ADR nuevo.
- **Aprendizaje o trampa** (algo que salió mal o casi, y la regla para no repetirlo): una línea en `learnings.md`.
- **Preferencia personal** de alguien: no va acá; queda en la memoria de su herramienta.
- **Algo que ya dice el código o AGENTS.md**: no se guarda; se mejora el lugar original.

## Decisión (ADR)

1. Siguiente número libre en `docs/memory/decisions/` (cuatro dígitos).
2. Archivo `NNNN-titulo-corto.md` con: título, **Estado** (propuesta, aceptada, reemplazada por NNNN) y fecha, **Contexto**, **Decisión**, **Consecuencias**. Menos de 40 líneas.
3. Una fila en la tabla de `INDEX.md`.
4. Si reemplaza otra, marca la vieja como «reemplazada por NNNN» (no la borres).
5. Si la decisión es de producto o de dinero y no la tomó una persona explícitamente, el estado es **propuesta**.

## Aprendizaje

Agrega arriba de todo en `learnings.md`:

`- **AAAA-MM-DD · área** · qué pasó en una frase. **Regla**: qué hacer desde ahora.`

Si la regla es importante para todas las tareas, propone también una línea en `AGENTS.md`.

## Reglas

- Nunca secretos, datos personales ni contenido con derechos.
- Corto y verificable: rutas de archivo, comandos, números.
- Español neutro, como el resto de la documentación.
