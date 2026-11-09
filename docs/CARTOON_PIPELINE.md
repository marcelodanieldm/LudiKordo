# Pipeline de video-cartoons

Cómo se produce el cartoon de una lección, de los textos a la app. Decisión de fondo: [ADR 0002](memory/decisions/0002-rive-para-cartoons.md). Personaje: [docs/design/kordi.md](design/kordi.md). Procedimiento para agentes: skill `make-cartoon`.

## Etapas

| # | Etapa | Herramienta | Quién | Sale |
| --- | --- | --- | --- | --- |
| 1 | Guion por escenas | Las claves `content.l<id>.s1`–`s4` de los 3 idiomas | Agente `content-author` + revisión humana | Textos aprobados en `src/i18n/locales/` |
| 2 | Storyboard | MCP `nanobanana` (Gemini image) con la plantilla de Kordi | Agente, curaduría humana | 4 bocetos en `assets/storyboards/<id>/` |
| 3 | Animación | Rive Editor de escritorio + MCP `rive` | Animador, asistido por el agente | `assets/rive/kordi_<id>.riv` |
| 4 | Voces | MCP `elevenlabs` (misma voz en en/es/pt) | Agente, escucha humana | `assets/audio/<locale>/<id>/s1.mp3`… |
| 5 | Microanimaciones de UI | MCP `lottiefiles` (estrellas, confeti) | Agente | `assets/lottie/*.json` + licencia anotada |
| 6 | Integración y prueba | `RIVE_READY`, emulador, MCP `mobile` | Agente | PR con capturas en teléfono y tablet |

Los MCP `nanobanana`, `rive` y `elevenlabs` son opcionales: se activan con `node scripts/agents/mcp-optional.mjs add <nombre>`.

## Contrato del archivo Rive

Para que la app pueda manejar cualquier cartoon sin código nuevo:

- **Artboard** `Main`, 1600×900 (16:9), fondo transparente u opaco de la paleta.
- **State machine** `Lesson` con:
  - input numérico `scene` (1 a 4): la app lo cambia al avanzar;
  - input booleano `talking`: la boca de Kordi se mueve mientras suena la voz.
- **View model** `Cartoon` con propiedad de texto `subtitle` (la app la llena desde i18n; si el binding no está, la app dibuja el subtítulo debajo).
- Nada de texto horneado en la animación: todo texto visible viene de i18n.
- Peso objetivo: menos de 300 KB por archivo.

## Audio

- MP3 mono 44,1 kHz, 96 kbps, normalizado a −16 LUFS.
- Un archivo por escena y por idioma: `assets/audio/<en|es|pt>/<id sin puntos>/s<n>.mp3`.
- La duración de cada escena es la del audio más largo de los 3 idiomas.

## Licencias

- Animaciones de LottieFiles: solo las de licencia libre de uso comercial; anotar autor y enlace en `assets/lottie/CREDITS.md`.
- Bocetos generados por IA: solo como referencia interna; la versión final es dibujo vectorial propio.
- Voces: la voz elegida tiene que permitir uso comercial en el plan contratado.

## Pendiente en el código

El reproductor (`src/components/CartoonPlayer.tsx`) ya avanza escenas y muestra subtítulos. Falta:
1. Cambiar el input `scene` y `talking` de la state machine con `rive-react-native`.
2. Reproducir la pista de voz de cada escena y sincronizar el avance con su duración.
3. Vincular `subtitle` por data binding.
