---
trigger: glob
globs: "app/**/*.tsx, src/components/**/*.tsx, src/theme.ts, docs/design/**"
---

# Diseño de interfaz

- **Tokens**: colores, radios y espaciados salen de `src/theme.ts`. Nada de colores sueltos en componentes; si falta un color, se agrega al tema (y se verifica contraste ≥ 4,5:1 para texto).
- **Estilo «escenario nocturno»** (ADR 0006): fondo índigo `#14121F`, tarjetas `#1F1C2E`; naranja `#FF6B2C` solo para la acción principal y la nota activa; dorado para logros; turquesa para afinado/correcto. Texto sobre colores llenos: `colors.onAccent`. Esquinas 14–28. Detalle: `docs/design/ui-redesign.md`.
- **Tipografía**: títulos con `fonts.display` (Fredoka); el resto usa el `Text` de `src/components/Text.tsx`, que pone Nunito según `fontWeight`. No importar `Text` de `react-native` en pantallas.
- **Componentes**: reutiliza `Button`, `Pill`, `Card`, `H1`, `H2`, `Eyebrow`, `Chip`, `ProgressBar`, `Segments`, `Stars`, `CloseButton` de `src/components/ui.tsx` antes de crear otros. Todo botón importante lleva `testID` estable para Maestro.
- **Tablet y teléfono**: cada pantalla se prueba a menos de 600 dp y a 600 dp o más (`useLayout().isTablet`); en tablet se aprovecha el ancho (dos paneles, contenido con `maxWidth`).
- **Zurdos**: todo diapasón respeta `hand === 'left'`.
- **Animación**: sutil y con propósito (feedback de acierto, avance de escena). Para rendimiento, skill `expo-animation` y `react-native-best-practices`.
- **Kordi**: siempre según `docs/design/kordi.md`; nunca imágenes de terceros.
- **Verificar visualmente**: con el MCP `mobile` o el de Expo (capturas del emulador) en teléfono y tablet, y adjuntar las capturas al PR.
