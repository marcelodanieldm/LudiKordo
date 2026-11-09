# 0002 · Cartoons en Rive con capas por idioma, no video

- **Estado**: aceptada · 2026-11-09

## Contexto
Hay 123 lecciones, cada una con un cartoon de 1 a 3 minutos, en 3 idiomas. Producir video renderizado significaría 369 videos y descargas pesadas.

## Decisión
Cada cartoon es un archivo Rive (`.riv`) con:
- una *state machine* con un input numérico `scene` (1–4) que avanza las escenas;
- un *view model* con una propiedad de texto `subtitle` que la app llena desde i18n;
- la voz como pista de audio separada por idioma.

Una animación sirve para los 3 idiomas. El reproductor (`src/components/CartoonPlayer.tsx`) cae en Kordi estático con subtítulos mientras no exista el `.riv`.

## Consecuencias
- Archivos livianos (KB, no MB) e interactivos.
- La sincronización voz–animación se hace por escena, no por fotograma.
- Remotion queda para videos de marketing (ficha de Google Play, redes), no para la app.
- Pendiente en el código: reproducir la pista de voz por escena y vincular `subtitle` por data binding de Rive.
