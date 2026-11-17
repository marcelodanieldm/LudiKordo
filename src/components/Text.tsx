import React from 'react';
import { StyleSheet, Text as RNText, type TextProps } from 'react-native';
import { bodyFont, colors } from '../theme';

let fontsReady = false;

/** Lo llama app/_layout.tsx cuando termina useFonts (false si la carga falló). */
export function setFontsReady(ready: boolean) {
  fontsReady = ready;
}

/**
 * Text de la app: aplica Nunito con la familia que corresponde al fontWeight
 * pedido y el color de texto por defecto. Si el estilo ya trae fontFamily
 * (por ejemplo Fredoka en títulos), se respeta. Si las fuentes no cargaron,
 * se deja la fuente del sistema con su fontWeight original.
 */
export function Text({ style, ...rest }: TextProps) {
  if (!fontsReady) {
    const { fontFamily: _ignored, ...plain } = StyleSheet.flatten(style) ?? {};
    return <RNText {...rest} style={[{ color: colors.ink }, plain]} />;
  }
  const flat = StyleSheet.flatten(style) ?? {};
  const family = flat.fontFamily ?? bodyFont(flat.fontWeight);
  return <RNText {...rest} style={[{ color: colors.ink }, flat, { fontFamily: family, fontWeight: undefined }]} />;
}
