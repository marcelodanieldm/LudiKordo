# Herramientas para agentes: MCPs, skills, reglas y memoria

Qué se sumó al proyecto, para qué sirve y cómo se activa. Investigado el 9 de noviembre de 2026; las URL y comandos salen de la documentación oficial de cada proveedor.

## Resumen

| Área | Activo por defecto (en git) | Opcional (cada persona en su máquina) |
| --- | --- | --- |
| Contexto y documentación | Context7, Expo MCP, skills oficiales de Expo, skill de Callstack | — |
| Diseño | Regla `design`, skill `expo-design-system`, guía de Kordi | Figma MCP |
| Video-cartoons | LottieFiles MCP, skill `make-cartoon`, pipeline | Rive MCP, ElevenLabs MCP, Nano Banana MCP, skill de Remotion |
| Pruebas | Mobile MCP, flujo Maestro + workflow `e2e-android` | Maestro MCP |
| Servicios | GitHub MCP (Antigravity) | RevenueCat MCP |
| Memoria | `docs/memory/` + skill `remember` | — |

## Dónde se configura

| Herramienta | MCPs del proyecto (en git) | MCPs personales | Skills | Reglas |
| --- | --- | --- | --- | --- |
| Claude Code | `.mcp.json` (pide aprobación la primera vez) | `claude mcp add` (alcance local) | `.claude/skills/` (copia generada) | `CLAUDE.md` → `AGENTS.md` |
| Antigravity | `.agents/mcp_config.json` | `~/.gemini/config/mcp_config.json` | `.agents/skills/` | `AGENTS.md` + `.agents/rules/` |

Los MCPs opcionales se agregan con `npm run mcp:optional -- add <nombre>`: registra el servidor en Claude Code (alcance local, fuera de git) y muestra el bloque para pegar en la configuración global de Antigravity. Las claves se leen de variables de entorno.

## MCPs

### Activos en el proyecto

| MCP | Para qué en LudiKordo | Conexión | Costo / cuenta |
| --- | --- | --- | --- |
| **Context7** | Documentación actualizada de React Native, Expo Router, Zustand, i18next, RevenueCat, Rive: evita APIs inventadas | `https://mcp.context7.com/mcp` | Gratis; [clave opcional](https://github.com/upstash/context7) para más cuota |
| **Expo MCP** | Documentación de Expo, instalar versiones compatibles y, con el servidor local, capturas e interacción con la app | `https://mcp.expo.dev/mcp` (OAuth) | [Disponible en el plan gratis de Expo](https://expo.dev/changelog/the-expo-mcp-server-is-now-available-on-the-free-plan.md) |
| **Mobile MCP** | Manejar el emulador o un teléfono Android: tocar, escribir, capturas. Verificación visual de cada PR de UI | `npx -y @mobilenext/mobile-mcp@latest` | Gratis; necesita Android SDK y un emulador encendido ([repo](https://github.com/mobile-next/mobile-mcp)) |
| **LottieFiles** | Buscar microanimaciones (estrellas, confeti, check) con licencia libre | `https://mcp.lottiefiles.com/mcp` | [Cuenta gratis](https://lottiefiles.com/mcp) |
| **GitHub** (solo Antigravity) | Issues, PRs y Actions desde Antigravity (Claude Code ya usa `gh`) | `https://api.githubcopilot.com/mcp/` | [Servidor oficial](https://github.com/github/github-mcp-server) |

Las capacidades locales de Expo MCP (capturas, automatización) piden SDK 54 o más nuevo, el paquete `expo-mcp` y arrancar con `npm run start:mcp` ([docs](https://docs.expo.dev/eas/ai/mcp)).

### Opcionales

| MCP | Para qué | Requisito | Nota |
| --- | --- | --- | --- |
| **Rive** (`rive`) | El agente crea y edita state machines, view models y data binding de los cartoons dentro del editor | [Rive de escritorio abierto](https://rive.app/docs/editor/ai/mcp) (macOS o Windows), servidor en `127.0.0.1:9791` | Oficial. Rechaza cambios que romperían el archivo |
| **ElevenLabs** (`elevenlabs`) | Voces de Kordi en en/es/pt con la misma voz, y efectos de sonido | `uv` y `ELEVENLABS_API_KEY` | [Oficial](https://github.com/elevenlabs/elevenlabs-mcp); de pago según uso |
| **Nano Banana** (`nanobanana`) | Bocetos y storyboards con consistencia de personaje | `uv` y `GEMINI_API_KEY` | Comunitario ([repo](https://github.com/zhongweili/nanobanana-mcp-server)): revisar antes de usar; las imágenes llevan marca SynthID |
| **RevenueCat** (`revenuecat`) | Consultar productos, permisos, ofertas y suscriptores | Cuenta de RevenueCat (OAuth) | [Oficial](https://www.revenuecat.com/docs/tools/mcp). Cambiar precios u ofertas: solo con aprobación humana |
| **Figma** (`figma`) | Traer variables y componentes si el diseño pasa a Figma | Asiento Dev o Full en plan pago | [Oficial](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation) |
| **Maestro** (`maestro`) | Escribir y correr flujos E2E en vivo desde el agente | Maestro CLI | Viene dentro del CLI de Maestro |

### Descartados (por ahora)

- **MCPs de memoria** (grafos, vectores, Basic Memory): guardan fuera de git y cada herramienta vería una memoria distinta. Ver [ADR 0003](memory/decisions/0003-memoria-en-repo.md).
- **MCPs de Rive sin editor** (comunitarios): prometen crear `.riv` sin el editor, pero son proyectos chicos; preferimos el oficial con revisión humana del animador.
- **Remotion MCP**: Remotion lo reemplazó por agent skills.
- **Sentry MCP**: no usamos Sentry; para errores en producción, la skill `eas-observe`.

## Skills

### Del proyecto (`.agents/skills/`, nuestras)

`add-lesson`, `add-exercise-type`, `i18n-sync`, `fix-ci`, `release-prep`, `ship-pr`, `remember` (memoria), `make-cartoon` (pipeline de cartoons).

### De terceros (fijadas por commit)

Se instalan con `npm run skills:external` (lee `.agents/external-skills.json`, copia a `.agents/skills/`, fija el commit en `.agents/external-skills.lock.json` y sincroniza a Claude Code). Se revisan por PR antes de commitear: una skill es texto que el agente obedece.

| Skill | Fuente | Para qué |
| --- | --- | --- |
| `expo-overview` | [expo/skills](https://docs.expo.dev/skills/) | Elige la skill de Expo correcta para cada tarea |
| `expo-router` | expo/skills | Navegación, pestañas, modales |
| `expo-animation` | expo/skills | Animaciones con buen rendimiento |
| `expo-design-system` | expo/skills | Tokens, componentes, consistencia visual |
| `expo-module` | expo/skills | Expo Modules API en Kotlin (nuestro detector) |
| `expo-dev-client` | expo/skills | Development builds |
| `expo-upgrade` | expo/skills | Subir de SDK |
| `eas-app-stores` | expo/skills | Builds y envío a Google Play (referencia; los agentes no publican) |
| `eas-observe` | expo/skills | Métricas y errores en producción |
| `react-native-best-practices` | [callstackincubator/agent-skills](https://github.com/callstackincubator/agent-skills) | Rendimiento: FPS, re-renders, memoria |
| `remotion-best-practices` (opcional) | [remotion-dev/skills](https://www.remotion.dev/docs/ai/skills) | Video promocional de Google Play en React |

Las opcionales: `npm run skills:external -- --include-optional`.

## Reglas

- `AGENTS.md`: comunes a todas las herramientas (ahora incluye memoria, skills externas y MCPs).
- `.agents/rules/design.md` (nueva): tokens, componentes, tablet, zurdos, verificación visual con MCP.
- Resto sin cambios: `i18n`, `content`, `audio-native`, `billing`, `release-safety`, `antigravity`.

## Memoria

`docs/memory/` con índice, decisiones (ADR 0001–0005) y aprendizajes. La leen todos los agentes al empezar tareas grandes y se actualiza con la skill `remember` dentro del PR. Antigravity (Knowledge Items) y Claude Code mantienen además su memoria propia para preferencias personales.

## Seguridad

- Ningún secreto en `.mcp.json` ni en `.agents/mcp_config.json`: `npm run check:agents` falla si encuentra algo con forma de clave.
- Los MCP comunitarios (Nano Banana) quedan fuera de la configuración compartida.
- Los MCP con permisos de escritura sobre servicios reales (RevenueCat, GitHub) no reemplazan las barreras del flujo: merge, tags, precios y publicación siguen siendo humanos.
