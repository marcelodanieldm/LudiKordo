---
trigger: glob
globs: "app/**/*.tsx, src/components/**/*.tsx, src/theme.ts, docs/design/**"
---

# Diseño de interfaz

- **Tokens**: colores, radios y espaciados salen de `src/theme.ts`. Nada de colores sueltos en componentes; si falta un color, se agrega al tema (y se verifica contraste ≥ 4,5:1 para texto).
- **Estilo**: fondo crema, acento naranja quemado `#C2410C`, secundario verde azulado `#0F6E7E`, tarjetas blancas con borde suave, esquinas 14–20. Referencia visual: el prototipo de diseño del proyecto y `docs/design/kordi.md`.
- **Componentes**: reutiliza `Button`, `Pill`, `Card`, `ProgressBar`, `Stars` de `src/components/ui.tsx` antes de crear otros. Todo botón importante lleva `testID` estable para Maestro.
- **Tablet y teléfono**: cada pantalla se prueba a menos de 600 dp y a 600 dp o más (`useLayout().isTablet`); en tablet se aprovecha el ancho (dos paneles, contenido con `maxWidth`).
- **Zurdos**: todo diapasón respeta `hand === 'left'`.
- **Animación**: sutil y con propósito (feedback de acierto, avance de escena). Para rendimiento, skill `expo-animation` y `react-native-best-practices`.
- **Kordi**: siempre según `docs/design/kordi.md`; nunca imágenes de terceros.
- **Verificar visualmente**: con el MCP `mobile` o el de Expo (capturas del emulador) en teléfono y tablet, y adjuntar las capturas al PR.
