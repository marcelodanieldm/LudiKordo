# LudiKordo — reglas para agentes

Reglas compartidas por Antigravity, Claude Code (local y en GitHub) y cualquier otra herramienta que lea `AGENTS.md`. Las reglas específicas de cada herramienta viven en `.agents/rules/` (Antigravity) y `CLAUDE.md` + `.claude/` (Claude Code). La guía completa del flujo está en `docs/AGENTIC_WORKFLOW.md`.

## Qué es el proyecto

App Android (teléfono y tablet) para aprender bajo de 4 cuerdas de cero a intermedio. React Native + Expo (SDK 54) + TypeScript estricto, Expo Router, Zustand + MMKV, i18next (en, es, pt), RevenueCat sobre Google Play Billing, y un módulo nativo Kotlin de detección de notas (`modules/pitch-detector`). Especificación de producto: ver `README.md`.

## Comandos

| Para | Comando |
| --- | --- |
| Instalar | `npm ci` |
| Pruebas de lógica (rápidas, sin emulador) | `npm test` |
| Tipos | `npm run typecheck` |
| Traducciones en los 3 idiomas | `npm run check:i18n` |
| Configuración de agentes sincronizada | `npm run check:agents` |
| Todo lo que corre CI | `npm run verify` |
| Instalar o actualizar skills de terceros | `npm run skills:external` |
| Activar un MCP opcional en tu máquina | `npm run mcp:optional -- add <nombre>` |
| Pruebas E2E (emulador encendido) | `npm run e2e` |
| App en un emulador o teléfono | `npx expo run:android` (no funciona en Expo Go) |

Antes de dar una tarea por terminada, `npm run verify` tiene que pasar.

## Mapa del código

- `app/` pantallas (Expo Router). `(tabs)/` son las 5 pestañas; `leccion/[id].tsx` el reproductor de lecciones.
- `src/content/` curriculum (`curriculum.ts`), lecciones (`lessons.ts`), tipos (`types.ts`). Las lecciones son datos, no código.
- `src/i18n/locales/{en,es,pt}.json` todos los textos: `ui.*` interfaz, `content.*` lecciones.
- `src/music/` teoría (`notes.ts`), detección (`yin.ts`), puntuación (`scoring.ts`). Lógica pura con pruebas.
- `src/state/` ajustes, progreso y reglas de racha (`rules.ts`, lógica pura).
- `src/billing/` reglas de acceso (`access.ts`, puro) y RevenueCat (`purchases.ts`).
- `src/audio/` metrónomo y tonos (`engine.ts`), puente con el micrófono (`mic.ts`).
- `src/components/` UI, diapasón, Kordi, reproductor de cartoons, ejercicios.
- `modules/pitch-detector/` módulo nativo Kotlin.
- `tests/` pruebas `node:test` que corren con `tsx`, sin React Native.

## Memoria, contexto y herramientas

- **Memoria del proyecto**: antes de una tarea no trivial, lee `docs/memory/INDEX.md` y abre solo lo que aplique. Cuando se toma una decisión o se descubre una trampa, guárdala con la skill `remember` dentro del mismo PR.
- **Documentación actualizada**: ante cualquier duda sobre una API de una librería (Expo, React Native, Rive, RevenueCat, i18next, Zustand), consulta el MCP `context7` o el MCP `expo` antes de escribir código. No inventes firmas.
- **Verificación visual**: si cambiaste la UI y hay un emulador encendido, usa el MCP `mobile` para recorrer la pantalla y capturarla en teléfono y tablet.
- **Skills de terceros** (Expo, Callstack, Remotion) están en `.agents/skills/` y listadas en `.agents/external-skills.lock.json`: no se editan a mano, se actualizan con `npm run skills:external`.
- Catálogo completo de MCPs, skills y su uso: `docs/TOOLING.md`. Cartoons: `docs/CARTOON_PIPELINE.md` y `docs/design/kordi.md`.

## Reglas de código

1. **Ningún texto visible escrito en el código.** Todo pasa por `t('…')` y existe en `en.json`, `es.json` y `pt.json` con las mismas claves. Español neutro latinoamericano con tuteo; portugués de Brasil. Respetar el glosario de `src/i18n/GLOSSARY.md`.
2. **La lógica pura vive fuera de los componentes** (`src/music`, `src/state/rules.ts`, `src/billing/access.ts`, `src/content`) y tiene pruebas en `tests/`. Si cambias una regla, actualiza o agrega su prueba.
3. **YIN existe dos veces**: `src/music/yin.ts` (referencia probada) y `modules/pitch-detector/.../Yin.kt`. Si cambias una, cambia la otra en el mismo PR.
4. **TypeScript estricto**, sin `any` nuevos salvo en el borde con librerías nativas, con un comentario que explique por qué.
5. **Accesibilidad**: todo lo tocable es `Pressable`/`Button` con `accessibilityRole`, mínimo 44 dp; contraste de texto ≥ 4,5:1 usando los colores de `src/theme.ts`.
6. **Tablet y zurdos**: cada pantalla nueva se ve bien a 600 dp o más (`useLayout().isTablet`) y el diapasón respeta `hand === 'left'`.
7. **Teoría musical correcta**: afinación E1 A1 D2 G2 (MIDI 28, 33, 38, 43); cuerda 4 = Mi, cuerda 1 = Sol. Ante la duda, agregar una prueba en `tests/music.test.ts`.
8. **Dependencias**: no agregar paquetes sin explicarlo en el PR. Usar `npx expo install <paquete>` para que la versión coincida con el SDK.

## Contenido pedagógico

- Cada lección tiene 4 pasos: Mira (cartoon), Entiende (tarjetas), Practica sin bajo, Practica con bajo. Seguir el formato de las lecciones modelo (1.1.1, 1.1.4, 1.2.1, 1.3.1).
- Una habilidad nueva por lección. Criterio de dominio medible (`mastery`).
- Solo música original o de dominio público. Nunca letras, tablaturas ni grabaciones de canciones con derechos.

## Git y pull requests

- **Nunca** trabajar ni hacer push sobre `main`. Una rama por tarea: `ag/<issue>-<slug>` (Antigravity), `cc/<issue>-<slug>` (Claude Code), `hu/<issue>-<slug>` (persona).
- **Un agente por carpeta.** Para trabajar en paralelo, cada agente usa su propio *worktree* (`git worktree add ../ludikordo-<rama> -b <rama>`).
- Commits con Conventional Commits en inglés: `feat(lesson): add 1.3.2 spider on 4 strings`, `fix(audio): …`, `test(music): …`, `chore(agents): …`.
- Todo cambio entra por PR con la plantilla completa y CI en verde. Una persona aprueba y hace merge; los agentes no hacen merge.
- PRs chicos: idealmente menos de 400 líneas cambiadas, sin contar traducciones.

## Lo que un agente nunca hace

- Leer, escribir ni mostrar secretos: `.env*`, `google-play-key.json`, claves de RevenueCat, tokens.
- Correr `eas submit`, publicar en Google Play o cambiar precios. El deploy es solo por GitHub Actions (`docs/AGENTIC_WORKFLOW.md`).
- `git push --force`, reescribir historia compartida o borrar ramas ajenas.
- Editar `.github/workflows/`, `eas.json` o `src/billing/` sin que la tarea lo pida explícitamente (esas rutas tienen dueño en `CODEOWNERS`).
- Desactivar pruebas o bajar umbrales para que CI pase.
- Editar a mano `.claude/skills/`: se genera desde `.agents/skills/` con `npm run sync:skills`.
- Escribir claves de API en `.mcp.json`, `.agents/mcp_config.json` o cualquier archivo del repo: van en variables de entorno.
- Cambiar precios, productos u ofertas en RevenueCat, o publicar recursos generados (voces, imágenes) sin revisión humana.

## Definición de terminado

1. `npm run verify` pasa.
2. Textos nuevos en los 3 idiomas.
3. Pruebas nuevas o actualizadas para la lógica tocada.
4. PR con la plantilla completa, incluyendo qué agente lo hizo y cómo se probó (y capturas de teléfono y tablet si cambió la UI).
