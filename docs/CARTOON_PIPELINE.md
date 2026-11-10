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
- **State machine** `Lesson`.
- **View model** `Cartoon`, con autobind al artboard, con tres propiedades que la app actualiza por data binding:
  - `scene` (número, 1 a 4): la app lo cambia al avanzar; las transiciones de la state machine se condicionan a este valor;
  - `talking` (booleano): la boca de Kordi se mueve mientras suena la voz;
  - `subtitle` (texto): opcional dentro de la animación; la app siempre dibuja el subtítulo debajo.
- No se usan *inputs* de state machine: Rive los marcó como obsoletos en React Native y el runtime nuevo (`@rive-app/react-native`) los rechaza.
- Nada de texto horneado en la animación: todo texto visible viene de i18n.
- Peso objetivo: menos de 300 KB por archivo.

Ejemplo completo de lo que necesita un animador: [docs/cartoons/1.1.1.md](cartoons/1.1.1.md).

## Audio

- MP3 mono 44,1 kHz, 96 kbps, normalizado a −16 LUFS.
- Un archivo por escena y por idioma: `assets/audio/<en|es|pt>/<id sin puntos>/s<n>.mp3`.
- La duración de cada escena es la del audio más largo de los 3 idiomas.

## Licencias

- Animaciones de LottieFiles: solo las de licencia libre de uso comercial; anotar autor y enlace en `assets/lottie/CREDITS.md`.
- Bocetos generados por IA: solo como referencia interna; la versión final es dibujo vectorial propio.
- Voces: la voz elegida tiene que permitir uso comercial en el plan contratado.

## Cómo lo reproduce la app

`src/components/CartoonPlayer.tsx`:

- **Con voz** registrada en `src/content/voices.ts` para el idioma: cada escena dura lo que su audio (con `expo-audio`), más una pausa de 0,6 s; mientras suena, `talking` = true.
- **Sin voz**: cada escena dura su tiempo de lectura (`src/content/cartoon.ts`, con pruebas).
- **Con el `.riv`** listado en `RIVE_READY`: se envían `scene`, `talking` y `subtitle` por data binding (`AutoBind(true)`). Sin él, Kordi bajo el foco.
- A 0,75× la voz se oye más lenta sin cambiar el tono, y las escenas sin voz duran más.

`cartoon.durationSec` de cada lección es la duración objetivo de la animación, para el animador; el reproductor no estira los subtítulos hasta ese número.
