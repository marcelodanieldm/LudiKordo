import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Text } from './Text';
import { colors, fonts, radius, MIN_TOUCH } from '../theme';

type Variant = 'primary' | 'secondary' | 'teal' | 'ghost' | 'neutral';

const VARIANTS: Record<Variant, { bg: string; fg: string; border: string; step?: string }> = {
  /** Acción principal: naranja con «escalón» que se hunde al tocar. */
  primary: { bg: colors.accent, fg: colors.onAccent, border: colors.accent, step: colors.accentShadow },
  secondary: { bg: 'transparent', fg: colors.ink, border: colors.line },
  teal: { bg: colors.teal, fg: colors.onTeal, border: colors.teal, step: colors.tealShadow },
  neutral: { bg: colors.raised, fg: colors.ink, border: colors.raised },
  ghost: { bg: 'transparent', fg: colors.accentInk, border: 'transparent' },
};

const STEP = 4;

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
  icon,
  testID,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Ícono opcional a la izquierda del texto (ver PlayIcon). */
  icon?: React.ReactNode;
  /** Identificador estable para las pruebas E2E de Maestro (no depende del idioma). */
  testID?: string;
}) {
  const v = VARIANTS[variant];
  const step = !disabled && v.step;
  // El estilo de quien llama va en un contenedor: el margen superior del Pressable
  // queda libre para compensar el hundimiento sin que el botón cambie de tamaño.
  return (
    <View style={style}>
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.button,
        {
          backgroundColor: disabled ? colors.raised : v.bg,
          borderColor: disabled ? colors.raised : v.border,
          borderBottomColor: step ? v.step : disabled ? colors.raised : v.border,
          borderBottomWidth: step && !pressed ? 2 + STEP : 2,
          marginTop: step && pressed ? STEP : 0,
          opacity: pressed && !step ? 0.8 : 1,
        },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {icon}
        <Text style={[styles.buttonText, { color: disabled ? colors.muted : v.fg }]}>{label}</Text>
      </View>
    </Pressable>
    </View>
  );
}

export function PlayIcon({ color = colors.onAccent, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5z" fill={color} />
    </Svg>
  );
}

export function Pill({ label, selected, onPress, sub }: { label: string; selected: boolean; onPress: () => void; sub?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.pill, selected ? styles.pillOn : styles.pillOff]}
    >
      <Text style={[styles.pillText, { color: selected ? colors.accentInk : colors.ink }]}>{label}</Text>
      {sub ? <Text style={{ fontSize: 11, fontWeight: '800', color: selected ? colors.accentInk : colors.muted }}>{sub}</Text> : null}
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function H1({ children }: { children: React.ReactNode }) {
  return <Text style={styles.h1}>{children}</Text>;
}

export function H2({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.h2, style]}>{children}</Text>;
}

/** Etiqueta corta en mayúsculas sobre un título («Continuar», «Objetivo»). */
export function Eyebrow({ children, color = colors.accentInk }: { children: React.ReactNode; color?: string }) {
  return <Text style={[styles.eyebrow, { color }]}>{children}</Text>;
}

export function Muted({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}

export function Chip({ label, color = colors.ink, bg = colors.raised }: { label: string; color?: string; bg?: string }) {
  return (
    <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: bg }}>
      <Text style={{ fontSize: 13, fontWeight: '900', color }}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ value, color = colors.accent, height = 10 }: { value: number; color?: string; height?: number }) {
  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2 }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
    >
      <View style={{ height, borderRadius: height / 2, width: `${Math.round(Math.min(1, value) * 100)}%`, backgroundColor: color }} />
    </View>
  );
}

/** Barra segmentada: una celda por paso o lección. */
export function Segments({ total, done, current, color = colors.accent }: { total: number; done: number; current?: number; color?: string }) {
  return (
    <View accessible accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: done }} style={{ flexDirection: 'row', gap: 4 }}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i < done ? colors.teal : i === current ? color : colors.line }} />
      ))}
    </View>
  );
}

export function StarIcon({ size = 24, color = colors.gold }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.6 5.7 21.1l1.5-7L2 9.3l7-.8z" fill={color} />
    </Svg>
  );
}

export function Stars({ count, size = 48 }: { count: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }} accessibilityLabel={`${count} / 3`}>
      {[0, 1, 2].map((i) => (
        <StarIcon key={i} size={i === 1 ? size * 1.25 : size} color={i < count ? colors.gold : colors.line} />
      ))}
    </View>
  );
}

export function CloseButton({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.close}>
      <Svg width={18} height={18} viewBox="0 0 24 24">
        <Path d="M6 6l12 12M18 6 6 18" stroke={colors.muted} strokeWidth={2.6} strokeLinecap="round" />
      </Svg>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: radius.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  buttonText: { fontSize: 17, fontWeight: '900' },
  pill: { flexGrow: 1, minHeight: 48, minWidth: MIN_TOUCH, borderRadius: radius.md, borderWidth: 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  pillOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  pillOff: { borderColor: colors.line, backgroundColor: 'transparent' },
  pillText: { fontSize: 15, fontWeight: '800' },
  card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.xl, padding: 16, gap: 12 },
  h1: { fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: colors.ink },
  h2: { fontFamily: fonts.display, fontSize: 22, lineHeight: 27, color: colors.ink },
  eyebrow: { fontSize: 12, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  muted: { fontSize: 14, fontWeight: '700', color: colors.muted, lineHeight: 20 },
  track: { backgroundColor: colors.track, overflow: 'hidden' },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
});
