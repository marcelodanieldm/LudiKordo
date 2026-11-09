# 0001 · React Native + Expo con development build

- **Estado**: aceptada · 2026-11-09
- **Decidió**: Marcelo

## Contexto
App Android para teléfono y tablet, con posibilidad de iOS más adelante. Necesita un módulo nativo de detección de notas por micrófono.

## Decisión
React Native + Expo (SDK 54) con TypeScript estricto y Expo Router. Se usa un *development build* (no Expo Go) porque el módulo `modules/pitch-detector` es Kotlin propio.

## Consecuencias
- Un solo código para teléfono, tablet y un futuro iOS.
- `npx expo run:android` o `eas build --profile development` para probar; Expo Go no sirve.
- Las dependencias se instalan con `npx expo install` para que coincidan con el SDK.
