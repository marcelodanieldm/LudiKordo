import React from 'react';
import Svg, { Circle, Ellipse, G, Rect } from 'react-native-svg';

/** Kordi, el carpincho bajista. Personaje original de LudiKordo. */
export function Kordi({ size = 160, label = 'Kordi' }: { size?: number; label?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160" accessibilityLabel={label} accessibilityRole="image">
      <Ellipse cx={80} cy={146} rx={52} ry={8} fill="#1D1B2E" opacity={0.08} />
      <Rect x={38} y={72} width={84} height={72} rx={34} fill="#A0673C" />
      <Ellipse cx={62} cy={26} rx={9} ry={7} fill="#7A4A28" />
      <Rect x={44} y={22} width={78} height={58} rx={27} fill="#B07444" />
      <Rect x={90} y={40} width={42} height={36} rx={17} fill="#8E5A33" />
      <Circle cx={122} cy={51} r={2.6} fill="#3B2414" />
      <Circle cx={84} cy={44} r={4.2} fill="#1D1B2E" />
      <Circle cx={85.5} cy={42.5} r={1.3} fill="#FFFFFF" />
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
}
