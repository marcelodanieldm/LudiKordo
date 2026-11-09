import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, radius, MIN_TOUCH } from '../theme';

type Variant = 'primary' | 'secondary' | 'teal' | 'ghost';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
  testID,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Identificador estable para las pruebas E2E de Maestro (no depende del idioma). */
  testID?: string;
}) {
  const v = VARIANTS[variant];
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.button,
        { backgroundColor: disabled ? colors.border : v.bg, borderColor: v.border, opacity: pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <Text style={[styles.buttonText, { color: disabled ? colors.muted : v.fg }]}>{label}</Text>
    </Pressable>
  );
}

const VARIANTS: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.accent, fg: '#FFFFFF', border: colors.accent },
  secondary: { bg: 'transparent', fg: colors.ink, border: colors.ink },
  teal: { bg: colors.teal, fg: '#FFFFFF', border: colors.teal },
  ghost: { bg: 'transparent', fg: colors.teal, border: 'transparent' },
};

export function Pill({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.pill, selected ? styles.pillOn : styles.pillOff]}
    >
      <Text style={[styles.pillText, { color: selected ? colors.accentInk : colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function H1({ children }: { children: React.ReactNode }) {
  return <Text style={styles.h1}>{children}</Text>;
}

export function Muted({ children }: { children: React.ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

export function ProgressBar({ value, color = colors.accent }: { value: number; color?: string }) {
  return (
    <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}>
      <View style={[styles.fill, { width: `${Math.round(Math.min(1, value) * 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

export function Stars({ count, size = 48 }: { count: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }} accessibilityLabel={`${count} / 3`}>
      {[0, 1, 2].map((i) => (
        <Svg key={i} width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.6 5.7 21.1l1.5-7L2 9.3l7-.8z" fill={i < count ? colors.gold : colors.border} />
        </Svg>
      ))}
    </View>
  );
}

export const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonText: { fontSize: 16, fontWeight: '800' },
  pill: { flex: 1, minHeight: MIN_TOUCH, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  pillOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  pillOff: { borderColor: colors.border, backgroundColor: colors.card },
  pillText: { fontSize: 15, fontWeight: '800' },
  card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: 16, gap: 12 },
  h1: { fontSize: 28, fontWeight: '700', color: colors.ink },
  muted: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.track, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
});
