---
name: make-cartoon
description: Produce or update the Kordi video-cartoon of a LudiKordo lesson - storyboard, Rive animation contract, voices in en/es/pt and app integration - following docs/CARTOON_PIPELINE.md. Use when asked to make, animate, voice or storyboard a lesson cartoon.
---
<!-- Generado desde .agents/skills por scripts/agents/sync-skills.mjs. No editar aquí. -->

# Producir el cartoon de una lección

Lee primero `docs/CARTOON_PIPELINE.md` y `docs/design/kordi.md`. Trabaja en una rama `ag/cartoon-<id>` o `cc/cartoon-<id>`.

## 1. Guion

- Las escenas son `content.l<id sin puntos>.s1`–`s4` en `src/i18n/locales/{es,en,pt}.json`. Si no existen, primero la lección (skill `add-lesson`).
- Cada escena: una idea, menos de 25 palabras, mismo largo aproximado en los 3 idiomas.

## 2. Storyboard (si está el MCP `nanobanana`)

- Un boceto por escena con la plantilla de `docs/design/kordi.md`, pasando la imagen de referencia de Kordi para mantener la consistencia.
- Guarda en `assets/storyboards/<id>/s<n>.png`. Son referencia, no van a la app.
- Revisa la precisión musical: 4 cuerdas, la más gruesa arriba, digitación correcta.

## 3. Animación (si está el MCP `rive`, con el Rive Editor abierto)

- Crea o edita el archivo siguiendo el **contrato**: artboard `Main` 1600×900, state machine `Lesson` con `scene` (número) y `talking` (booleano), view model `Cartoon` con `subtitle` (texto).
- Colores en hex de la guía de Kordi. Sin texto horneado.
- Exporta a `assets/rive/kordi_<id con guiones bajos>.riv` (por ejemplo `kordi_1_3_1.riv`).
- Sin MCP de Rive: deja el storyboard y una lista de lo que el animador tiene que construir en la descripción del PR.

## 4. Voces (si está el MCP `elevenlabs`)

- La voz de Kordi está en `assets/audio/VOICES.md`; usa la misma en los 3 idiomas con un modelo multilingüe.
- Un archivo por escena e idioma: `assets/audio/<locale>/<id sin puntos>/s<n>.mp3`.
- Si una escena dura más de un 10% más en un idioma, acorta el texto (y actualiza i18n) en lugar de acelerar la voz.

## 5. Integración

- Agrega el nombre del recurso a `RIVE_READY` en `src/content/assets.ts`.
- Copia el `.riv` al lugar que espera Android (ver README, sección «Agregar un cartoon»).
- Corre `npm run verify` y prueba la lección en el emulador (MCP `mobile` o `npx expo run:android`) en teléfono y tablet; adjunta capturas al PR.

## Reglas

- Nunca secretos en archivos: las claves de ElevenLabs y Gemini van en variables de entorno.
- Nada de música, personajes ni marcas de terceros.
- Lottie: solo animaciones con licencia comercial libre, anotadas en `assets/lottie/CREDITS.md`.
- Guarda en memoria (skill `remember`) cualquier truco de Rive o de voz que sirva para las próximas lecciones.
