import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme';

type Mood = 'normal' | 'happy';
type Light = 'none' | 'beam' | 'glow';

/**
 * Kordi, el carpincho bajista. Personaje original de LudiKordo (docs/design/kordi.md).
 * `light` lo pone bajo un foco de escenario (beam) o con un halo dorado (glow).
 */
export function Kordi({ size = 160, label = 'Kordi', mood = 'normal', light = 'none' }: { size?: number; label?: string; mood?: Mood; light?: Light }) {
  const figure = (
    <Svg width={size} height={size} viewBox="0 0 160 160" accessibilityLabel={label} accessibilityRole="image">
      <Ellipse cx={80} cy={148} rx={54} ry={8} fill={light === 'none' ? '#000000' : colors.accent} opacity={light === 'none' ? 0.3 : 0.22} />
      <Rect x={38} y={72} width={84} height={72} rx={34} fill="#A0673C" />
      <Ellipse cx={62} cy={26} rx={9} ry={7} fill="#7A4A28" />
      <Rect x={44} y={22} width={78} height={58} rx={27} fill="#B07444" />
      <Rect x={90} y={40} width={42} height={36} rx={17} fill="#8E5A33" />
      <Circle cx={122} cy={51} r={2.6} fill="#3B2414" />
      {mood === 'happy' ? (
        <Path d="M80 44 q4 -5 8 0" fill="none" stroke="#1D1B2E" strokeWidth={3} strokeLinecap="round" />
      ) : (
        <>
          <Circle cx={84} cy={44} r={4.2} fill="#1D1B2E" />
          <Circle cx={85.5} cy={42.5} r={1.3} fill="#FFFFFF" />
        </>
      )}
      <G rotation={-24} origin="75, 101">
        <Rect x={16} y={98} width={118} height={7} rx={3} fill="#6B4423" />
      </G>
      <G rotation={-24} origin="58, 118">
        <Ellipse cx={58} cy={118} rx={25} ry={17} fill="#C2410C" />
        <Ellipse cx={58} cy={118} rx={8} ry={5} fill="#1D1B2E" opacity={0.35} />
      </G>
      <Ellipse cx={100} cy={94} rx={10} ry={8} fill="#8E5A33" />
      <Ellipse cx={64} cy={112} rx={9} ry={7} fill="#8E5A33" />
    </Svg>
  );
  if (light === 'none') return figure;

  const w = size * 1.5;
  const h = size * 1.6;
  return (
    <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'flex-end' }}>
      <Svg width={w} height={h} viewBox="0 0 150 160" style={{ position: 'absolute', left: 0, top: 0 }}>
        <Defs>
          <LinearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.gold} stopOpacity={0.3} />
            <Stop offset="1" stopColor={colors.gold} stopOpacity={0.02} />
          </LinearGradient>
          <RadialGradient id="halo" cx="50%" cy="60%" r="50%">
            <Stop offset="0" stopColor={colors.gold} stopOpacity={0.35} />
            <Stop offset="1" stopColor={colors.gold} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {light === 'beam' ? (
          <>
            <Path d="M66 0h18l46 152H20z" fill="url(#beam)" />
            <Ellipse cx={75} cy={152} rx={58} ry={8} fill={colors.gold} opacity={0.14} />
          </>
        ) : (
          <Circle cx={75} cy={95} r={75} fill="url(#halo)" />
        )}
      </Svg>
      {figure}
    </View>
  );
}
