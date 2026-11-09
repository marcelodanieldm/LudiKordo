@AGENTS.md

# Claude Code en LudiKordo

Las reglas de arriba (`AGENTS.md`) valen para todo. Esto agrega lo propio de Claude Code.

## Subagentes (`.claude/agents/`)

Delegar cuando la tarea encaja; cada uno tiene herramientas limitadas a su rol.

| Subagente | Cuándo |
| --- | --- |
| `planner` | Antes de una tarea de más de 2 archivos: lee el issue y el código, devuelve un plan. No edita. |
| `test-engineer` | Escribir o reparar pruebas en `tests/`, reproducir un bug con una prueba que falle. |
| `code-reviewer` | Antes de abrir el PR: revisa el diff contra `AGENTS.md`. No edita. |
| `i18n-reviewer` | Cuando se tocan textos: paridad de claves, glosario, tono en en/es/pt. |
| `content-author` | Redactar lecciones nuevas siguiendo el formato pedagógico. |
| `audio-native` | Cambios en `modules/pitch-detector`, `src/music/yin.ts`, `src/audio/`. |
| `release-manager` | Preparar una versión (changelog, tag sugerido). Nunca publica. |

## Skills (`/nombre`)

Del proyecto: `/add-lesson`, `/add-exercise-type`, `/i18n-sync`, `/fix-ci`, `/release-prep`, `/ship-pr`, `/remember`, `/make-cartoon`. De terceros (después de `npm run skills:external`): las de Expo (`expo-overview`, `expo-router`, `expo-module`…) y `react-native-best-practices`. Son las mismas que usa Antigravity; la fuente está en `.agents/skills/` y se copia a `.claude/skills/` con `npm run sync:skills`.

## MCPs

`.mcp.json` trae `context7`, `expo`, `mobile` y `lottiefiles` (Claude Code pide aprobarlos la primera vez). Los que necesitan clave o app de escritorio (`rive`, `elevenlabs`, `nanobanana`, `revenuecat`, `figma`, `maestro`) se activan con `npm run mcp:optional -- add <nombre>`. Detalle: `docs/TOOLING.md`.

## Hooks (`.claude/settings.json`)

- Después de editar un archivo de traducciones, se valida la paridad de claves; si falla, el error vuelve a Claude.
- Si se edita uno de los dos YIN sin el otro, aparece un recordatorio.
- Al terminar un turno con cambios en el código, corren `npm test` y `npm run typecheck`; si fallan, Claude sigue hasta arreglarlo.

## Flujo por defecto para un issue

1. `planner` → plan breve en el chat.
2. Rama `cc/<issue>-<slug>` (o worktree si hay otro agente trabajando).
3. Implementar en pasos chicos; `test-engineer` para las pruebas.
4. `code-reviewer` (y `i18n-reviewer` si hubo textos).
5. `/ship-pr` para commitear, hacer push de la rama y abrir el PR con la plantilla.
