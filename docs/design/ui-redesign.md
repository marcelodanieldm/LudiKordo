# Rediseño «escenario nocturno»

Canvas aprobado: https://claude.ai/artifact/SCrNy3QjEQDLLFQcdgrMtd (Hoy, Bienvenida, Paywall, Ruta, Practicar, lección paso Mira y Con bajo, resultado, tablet y hoja del sistema). Decisión: [ADR 0006](../memory/decisions/0006-tema-escenario-nocturno.md).

## Tokens (`src/theme.ts`)

| Token | Valor | Uso |
| --- | --- | --- |
| `bg` | `#14121F` | Fondo de la app |
| `card` | `#1F1C2E` | Tarjetas (borde `border` `#2E2A44`) |
| `raised` / `track` | `#2A2640` | Chips, botones neutros, pistas de progreso |
| `line` | `#3A3552` | Bordes de controles sin seleccionar, segmentos pendientes |
| `ink` / `muted` | `#F5F1E8` / `#B3ADC7` | Texto |
| `accent` | `#FF6B2C` | Acción principal, nota activa |
| `gold` | `#F5B83D` | Logros, estrellas, racha, checkpoint |
| `teal` | `#3FD0C9` | Afinado, correcto, objetivo |
| `onAccent` | `#1A0F08` | Texto sobre naranja, dorado o turquesa |
| `wood`, `fret`, `stringColor` | | Diapasón |

`*Soft` son fondos tenues de cada color (14–16 % sobre `card`) con su texto `*Ink`.

## Tipografía

- Títulos: `fonts.display` (Fredoka 600), 34 / 30 / 26 / 22.
- Texto: Nunito vía `src/components/Text.tsx` (400–900 según `fontWeight`).
- Etiquetas: `Eyebrow`, 12 px, 900, mayúsculas, espaciado 1,2.

## Componentes (`src/components/ui.tsx`)

`Button` (primary, teal, secondary, neutral, ghost; los llenos se hunden 4 px al tocar), `Pill`, `Card`, `H1`, `H2`, `Eyebrow`, `Chip`, `ProgressBar`, `Segments`, `Stars`, `StarIcon`, `PlayIcon`, `CloseButton`. `Kordi` acepta `light="beam" | "glow"` y `mood="happy"`.

## Pendiente respecto del canvas

- Selector «Sesión de hoy» (5/15/30 min) en Hoy: falta definir qué hace antes de mostrarlo.
- Puntos de pulso del metrónomo: el motor de audio todavía no expone el número de pulso.
- Herramientas Diapasón, Ritmo y Pistas de jam: siguen marcadas como próximas.
