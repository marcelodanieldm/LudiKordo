---
name: add-exercise-type
description: Implement one of the pending LudiKordo exercise types (followHand, recordYourself) or a new one, from type definition to component and tests. Use when asked to build a new kind of exercise.
---

# Implementar un tipo de ejercicio

Tipos ya implementados para usar de referencia: `QuizExercise`, `TapRhythmExercise`, `FretboardTapExercise`, `PlayAlongExercise` en `src/components/exercises/`.

1. **Tipo de datos**: en `src/content/types.ts`, saca el tipo de `PendingExercise` y crea su interfaz propia con los campos que necesita. Agrégalo a la unión `Exercise`.
2. **Lógica pura primero**: la evaluación (aciertos, estrellas) va en `src/music/scoring.ts` u otro módulo puro, con pruebas en `tests/logic.test.ts` antes del componente.
3. **Componente**: `src/components/exercises/<Nombre>Exercise.tsx` con la firma `{ exercise, onDone(stars), mastery, width? }`. Reglas:
   - Textos con `t()`; claves nuevas en `ui.exercise.*` de los 3 idiomas.
   - Detiene micrófono, metrónomo y timers al desmontarse.
   - Funciona en tablet (usa `width`) y para zurdos si dibuja el diapasón.
   - Si usa el micrófono, ofrece autoevaluación cuando la detección no está disponible o falla dos veces.
4. **Registro**: agrega el `case` en `src/components/exercises/ExerciseView.tsx`.
5. **Uso**: agrega el ejercicio a una lección existente o nueva para probarlo de punta a punta.
6. **Verificar**: `npm run verify`. Si cambiaste la UI, adjunta capturas de teléfono y tablet al PR.
