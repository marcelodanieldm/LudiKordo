# Aprendizajes y trampas

Cosas que ya salieron mal (o casi) y la regla que quedó. Una entrada por tema, la más reciente arriba. Formato: fecha · área · qué pasó · regla.

- **2026-11-09 · mcp** · Antigravity usa `serverUrl` para MCPs remotos; Claude Code usa `url` con `type: http`. **Regla**: `npm run check:agents` valida la clave correcta en `.agents/mcp_config.json` y `.mcp.json`.
- **2026-11-09 · git** · `.gitignore` tenía `android/` y eso ignoraba también `modules/pitch-detector/android/`, el módulo Kotlin. **Regla**: las carpetas generadas se ignoran con ruta absoluta desde la raíz (`/android/`, `/ios/`). Antes de commitear algo nativo, `git ls-files modules/` debe listar los `.kt`.
- **2026-11-09 · agentes** · Antigravity descarta en silencio una regla de `.agents/rules/` sin `trigger` válido (por ejemplo `alwaysOn`). **Regla**: `npm run check:agents` valida el frontmatter; CI lo exige.
- **2026-11-09 · agentes** · Las skills existen en dos carpetas (`.agents/skills` para Antigravity, `.claude/skills` para Claude Code). **Regla**: se edita solo `.agents/skills` y se corre `npm run sync:skills`; un hook de Claude bloquea editar la copia.
- **2026-11-09 · audio** · YIN está en TypeScript (probado) y en Kotlin (en el teléfono). **Regla**: se cambian juntos; un hook de Claude avisa si se edita uno solo.
- **2026-11-09 · i18n** · En Brasil el espacio donde se pisa es «casa»; «traste» es la barra de metal. **Regla**: glosario en `src/i18n/GLOSSARY.md`.
- **2026-11-09 · audio** · El micrófono de un teléfono capta mal la fundamental del Mi grave (41,2 Hz). **Regla**: las pruebas de detección incluyen una señal con fundamental débil; la fase 0 mide en 10 teléfonos reales.
- **2026-11-09 · github** · GitHub no deja aprobar tus propios PR, y los agentes los abren con tu cuenta. **Regla**: con un solo desarrollador, 0 aprobaciones requeridas; CI sigue siendo obligatorio.
- **2026-11-09 · ui** · En Android, con fuentes propias cada peso es una familia distinta: `fontWeight` sin `fontFamily` cae en la fuente del sistema. **Regla**: usar el `Text` de `src/components/Text.tsx`, que traduce `fontWeight` a la familia de Nunito.
- **2026-11-10 · rive** · Los *inputs* de state machine y los *text runs* están obsoletos en Rive para React Native y el runtime nuevo (`@rive-app/react-native` ≥ 0.5) los rechaza. **Regla**: todo lo que la app controla en un `.riv` va por data binding (view model `Cartoon`); al migrar de `rive-react-native` cambian los hooks (`useViewModelInstance`, `useRiveNumber`…), no el `.riv`.
