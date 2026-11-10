# LudiKordo — código base (React Native + Expo)

App Android para teléfono y tablet que enseña bajo de 4 cuerdas desde cero hasta nivel intermedio, en inglés, español y portugués, con suscripción semestral y anual.

Este repositorio es la base de la **fase 1 (MVP)** del documento de producto: estructura completa, curriculum de 123 lecciones, las 4 lecciones modelo escritas, 4 de los 10 tipos de ejercicio, detección de notas por micrófono, progreso, rachas y suscripciones.

## Puesta en marcha

Requisitos: Node 20 o superior, Android Studio con un emulador o un teléfono Android, y una cuenta de Expo (para EAS).

```bash
npm install
npx expo install --fix      # alinea las versiones con el SDK de Expo instalado
npx expo prebuild -p android
npx expo run:android        # compila con el módulo nativo de detección
npm test                    # 21 pruebas de lógica (teoría, YIN, puntuación, rachas, traducciones)
npm run typecheck
```

> La app usa un módulo nativo propio (`modules/pitch-detector`), así que **no funciona en Expo Go**: hace falta un *development build* (`npx expo run:android` o `eas build --profile development`). Sin el módulo, los ejercicios con bajo pasan solos a autoevaluación.

Las versiones de `package.json` corresponden a Expo SDK 54. Si usas un SDK más nuevo, `npx expo install --fix` las actualiza.

## Trabajar desde otra máquina

Todo lo necesario está en el repositorio: código, reglas y skills de los agentes, MCPs del proyecto, memoria (`docs/memory/`) y workflows. Lo que **no** viaja, a propósito, son las claves y lo que se regenera:

```bash
git clone https://github.com/marcelodanieldm/LudiKordo.git && cd LudiKordo
nvm use                     # Node 22 (.nvmrc)
npm install
cp .env.example .env        # solo si usas los MCP opcionales
npm run skills:external     # skills de Expo/Callstack (si no están ya commiteadas)
```

Después: en Claude Code, aprobar los MCPs de `.mcp.json`; en Antigravity, abrir la carpeta (lee `AGENTS.md` y `.agents/`). Las claves de CI ya viven en GitHub Secrets y no hay que copiarlas.

**Primera publicación** (una sola vez): `gh auth login` y luego `scripts/github/publish.sh`, que crea `marcelodanieldm/LudiKordo` público, sube `main` y configura etiquetas, entornos y protección.

## Desarrollo con agentes

El proyecto está preparado para trabajar con Antigravity, Claude Code y GitHub. Reglas comunes en `AGENTS.md`; guía completa del flujo (quién hace qué, ramas y worktrees, CI, revisión, publicación en Google Play y puesta en marcha) en [`docs/AGENTIC_WORKFLOW.md`](docs/AGENTIC_WORKFLOW.md). Antes de cada PR: `npm run verify`. MCPs, skills de terceros, memoria compartida y pipeline de cartoons: [`docs/TOOLING.md`](docs/TOOLING.md).

## Estructura

```
app/                      Pantallas (Expo Router)
  _layout.tsx             Idioma, suscripciones y navegación raíz
  onboarding.tsx          Bienvenida, idioma y 5 preguntas
  paywall.tsx             Planes anual y semestral, paywall honesto
  (tabs)/                 Hoy, Ruta, Practicar, Progreso, Perfil
                          (barra inferior en teléfono, lateral en tablet)
  leccion/[id].tsx        Lección en 4 pasos; dos paneles en tablet
src/
  content/                Curriculum (5 niveles, 25 módulos), lecciones modelo y tipos
  i18n/locales/           en.json, es.json, pt.json: interfaz + contenido
  music/                  Notas y frecuencias, YIN (referencia en TS), puntuación
  state/                  Ajustes y progreso (Zustand + MMKV), reglas de racha
  billing/                RevenueCat, reglas de acceso gratis/Premium
  audio/                  Metrónomo y tonos (react-native-audio-api), puente con el micrófono
  components/             UI, Kordi, diapasón, reproductor de cartoons, ejercicios
modules/pitch-detector/   Módulo nativo Kotlin: AudioRecord + YIN + detección de ataques
tests/                    Pruebas de lógica (node:test + tsx)
```

## Qué está hecho y qué falta

| Área | Estado |
| --- | --- |
| Curriculum completo (123 lecciones, 3 idiomas) | Hecho: títulos de niveles, módulos, checkpoints y ejercicios estrella |
| Lecciones redactadas | 4 de 123: 1.1.1, 1.1.4, 1.2.1 y 1.3.1 |
| Tipos de ejercicio | 6 de 9: quiz/oído, tocar el ritmo, diapasón virtual, tocar con el bajo, leer tablatura y entrenador de tempo. Seguir la mano, checkpoint y grabarte muestran «próximamente» |
| Detección por micrófono | Hecho: módulo Kotlin + autoevaluación de respaldo. Falta probarlo en teléfonos reales (fase 0) y calibrar la latencia |
| Afinador y metrónomo | Hechos |
| Progreso, estrellas, XP, racha semanal, radar, insignias | Hechos (guardado local) |
| Suscripciones | Hecho con RevenueCat; falta configurar Play Console y RevenueCat (abajo) |
| Tablet | Barra lateral y lección en dos paneles |
| Zurdos | Diapasón espejado |
| Cartoons | Reproductor listo; muestra a Kordi con subtítulos hasta que lleguen los `.riv` |
| Pendiente | Test de nivel, Sesión de hoy por duración, notificaciones (recordatorio diario y aviso 2 días antes de que termine la prueba), sincronización con Supabase, ilustraciones de las tarjetas, fuentes Fredoka y Nunito, pistas de acompañamiento, iOS |

## Configurar las suscripciones

1. **Play Console** → Monetizar → Suscripciones → crear `ludikordo_premium`.
   - Plan base `anual`: renovación automática, cada año, con una oferta de prueba gratis de 7 días.
   - Plan base `semestral`: renovación automática, cada 6 meses.
   - Activar período de gracia y suspensión de cuenta. Cargar precios regionales (ARS, BRL, MXN, COP, CLP, EUR).
2. **RevenueCat** → crear el proyecto, conectar Google Play con la cuenta de servicio, crear el permiso `premium` y una oferta `default` con dos paquetes: *Annual* (plan `anual`) y *Six Month* (plan `semestral`).
3. Copiar la clave pública de Android de RevenueCat en `app.json` → `extra.revenueCatAndroidKey`.

Sin clave, la app funciona en modo gratis (módulos 1.1 y 1.2).

## Agregar una lección

1. En `src/content/lessons.ts`, crear el objeto `Lesson` siguiendo el formato de las 4 modelo y sumarlo a `LESSONS`.
2. Agregar sus textos en `content.l<id sin puntos>` de los 3 archivos de `src/i18n/locales/`.
3. Correr `npm test`: la prueba de contenido avisa si falta una clave en algún idioma o si una respuesta correcta apunta a una opción que no existe.

## Agregar un cartoon

1. Exportar la animación de Rive como `kordi_<id>.riv` (por ejemplo `kordi_1_3_1.riv`) y copiarla en `android/app/src/main/res/raw/`. Como `android/` se regenera con `prebuild` (y está en `.gitignore`), conviene guardar los originales en `assets/rive/` y copiarlos con un config plugin, o bien versionar la carpeta `android/`.
2. Sumar el nombre a `RIVE_READY` en `src/content/assets.ts`.
3. La voz va como pista de audio por idioma; los subtítulos salen de las claves `s1`…`s4` de cada lección.

## Notas de diseño

- Colores, código de dedos y estilo siguen el prototipo de diseño (fondo crema, naranja quemado `#C2410C`, verde azulado `#0F6E7E`).
- La nota cuenta como correcta dentro de ±50 cents y a tiempo dentro de ±80 ms (±60 ms en los ejercicios de tocar la pantalla). Para afinar, ±5 cents.
- La autoevaluación da 2 estrellas: completa la lección, pero las 3 estrellas de dominio piden detección real.
- `src/music/yin.ts` y `Yin.kt` implementan el mismo algoritmo. Las pruebas corren sobre la versión TypeScript; si cambias una, cambia la otra.
