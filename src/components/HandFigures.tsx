import React from 'react';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../theme';
import type { MotionStep } from '../content/types';

/** Índice en azul y medio en naranja, como dice la lección 1.2.1. */
export const FINGER_I = '#5AA9FF';
export const FINGER_M = colors.accent;

const STRINGS = ['E', 'A', 'D', 'G'] as const;

/**
 * Mano que pulsa, vista desde arriba: las 4 cuerdas (Mi arriba, la más cercana
 * a la cara), la pastilla, el pulgar apoyado y los dedos i y m. En cada paso, el
 * dedo activo tira de la cuerda y queda apoyado en la de arriba (toque apoyado).
 */
export function RightHandFigure({ width, step, leftHanded }: { width: number; step?: MotionStep; leftHanded: boolean }) {
  const W = 360;
  const H = 210;
  const y = (i: number) => 40 + i * 30;
  const played = step?.note ? STRINGS.indexOf(step.note.string as (typeof STRINGS)[number]) : 1;
  const fingerX = { i: 205, m: 245 } as const;
  const tipY = (finger: 'i' | 'm') => {
    if (step?.finger === finger) return y(Math.max(0, played - 1)) + 6; // ya pulsó: apoyada en la cuerda de arriba
    return y(played) + 26; // preparada debajo de la cuerda que va a tocar
  };
  const finger = (f: 'i' | 'm', color: string) => {
    const active = step?.finger === f;
    const tip = tipY(f);
    return (
      <G key={f} opacity={step && !active ? 0.55 : 1}>
        <Rect x={fingerX[f] - 13} y={tip} width={26} height={H - tip + 20} rx={13} fill={color} />
        <Circle cx={fingerX[f]} cy={H - 22} r={13} fill={colors.bg} stroke={color} strokeWidth={3} />
        <SvgText x={fingerX[f]} y={H - 17} fontSize={14} fill={colors.ink} textAnchor="middle" fontFamily={fonts.black}>
          {f}
        </SvgText>
      </G>
    );
  };
  return (
    <Svg width={width} height={(width * H) / W} viewBox={`0 0 ${W} ${H}`}>
      <G transform={leftHanded ? `translate(${W} 0) scale(-1 1)` : undefined}>
        <Rect x={0} y={20} width={W} height={130} rx={14} fill="#3A2416" />
        {/* Pastilla */}
        <Rect x={70} y={28} width={58} height={114} rx={10} fill="#141018" stroke="#2A2234" strokeWidth={2} />
        {STRINGS.map((s, i) => (
          <G key={s}>
            <Line x1={0} x2={W} y1={y(i)} y2={y(i)} stroke={step?.note && i === played ? colors.gold : '#D9D2C3'} strokeWidth={5 - i} />
          </G>
        ))}
        {/* Onda en la cuerda que suena */}
        {step?.note ? (
          <Path
            d={`M ${fingerX.i - 60} ${y(played)} q 15 -9 30 0 t 30 0 t 30 0 t 30 0 t 30 0`}
            stroke={colors.teal}
            strokeWidth={3}
            fill="none"
            opacity={0.9}
          />
        ) : null}
        {/* Pulgar: en la pastilla o sobre la cuerda Mi */}
        <G>
          <Rect x={step?.thumb === 'E' ? 132 : 78} y={step?.thumb === 'E' ? y(0) - 16 : 40} width={44} height={30} rx={15} fill="#E8B48A" stroke="#B9835C" strokeWidth={2} />
        </G>
        {finger('m', FINGER_M)}
        {finger('i', FINGER_I)}
      </G>
    </Svg>
  );
}

/**
 * Mano que pisa, de frente: cuerda Mi y trastes 1 a 4. Los dedos 1–4 se apoyan
 * justo detrás de cada traste; el activo baja y suena. Con `mark`, muestra dónde
 * pisar: bien (detrás del traste), encima del traste o en el medio del espacio.
 */
export function LeftHandFigure({ width, step, leftHanded, labels }: { width: number; step?: MotionStep; leftHanded: boolean; labels: { ok: string; onFret: string; middle: string } }) {
  const W = 360;
  const H = 190;
  const nutX = 30;
  const fretX = (f: number) => nutX + f * 78;
  const stringY = (i: number) => 52 + i * 28;
  const mark = step?.mark;

  if (mark) {
    // Dibujo de colocación: un solo dedo en el traste 3 de la cuerda Mi.
    const x = mark === 'ok' ? fretX(3) - 12 : mark === 'onFret' ? fretX(3) : fretX(2) + 39;
    const good = mark === 'ok';
    return (
      <Svg width={width} height={(width * H) / W} viewBox={`0 0 ${W} ${H}`}>
        <G transform={leftHanded ? `translate(${W} 0) scale(-1 1)` : undefined}>
          <Neck W={W} fretX={fretX} stringY={stringY} highlight={3} />
          <Circle cx={x} cy={stringY(0)} r={15} fill={good ? colors.teal : colors.accent} stroke={colors.bg} strokeWidth={3} />
        </G>
        <SvgText x={W / 2} y={H - 10} fontSize={16} fill={good ? colors.teal : colors.accentInk} textAnchor="middle" fontFamily={fonts.black}>
          {`${good ? '✓' : '✗'} ${good ? labels.ok : mark === 'onFret' ? labels.onFret : labels.middle}`}
        </SvgText>
      </Svg>
    );
  }

  const active = typeof step?.finger === 'number' ? step.finger : undefined;
  return (
    <Svg width={width} height={(width * H) / W} viewBox={`0 0 ${W} ${H}`}>
      <G transform={leftHanded ? `translate(${W} 0) scale(-1 1)` : undefined}>
        <Neck W={W} fretX={fretX} stringY={stringY} highlight={active} />
        {[1, 2, 3, 4].map((f) => {
          const pressed = f === active;
          const cx = fretX(f) - 14;
          const cy = pressed ? stringY(0) : stringY(0) - 22;
          return (
            <G key={f} opacity={active && !pressed ? 0.6 : 1}>
              <Rect x={cx - 13} y={0} width={26} height={cy} fill="#E8B48A" opacity={0.55} />
              <Circle cx={cx} cy={cy} r={14} fill={pressed ? colors.accent : '#E8B48A'} stroke={colors.bg} strokeWidth={3} />
              <G transform={leftHanded ? `translate(${2 * cx} 0) scale(-1 1)` : undefined}>
                <SvgText x={cx} y={cy + 5} fontSize={15} fill={colors.onAccent} textAnchor="middle" fontFamily={fonts.black}>
                  {String(f)}
                </SvgText>
              </G>
            </G>
          );
        })}
      </G>
    </Svg>
  );
}

function Neck({ W, fretX, stringY, highlight }: { W: number; fretX: (f: number) => number; stringY: (i: number) => number; highlight?: number }) {
  return (
    <G>
      <Rect x={0} y={34} width={W} height={120} fill="#5A3A22" />
      {highlight ? <Rect x={fretX(highlight - 1)} y={34} width={fretX(highlight) - fretX(highlight - 1)} height={120} fill={colors.gold} opacity={0.14} /> : null}
      <Rect x={fretX(0) - 6} y={34} width={8} height={120} fill="#EDE6D6" />
      {[1, 2, 3, 4].map((f) => (
        <Rect key={f} x={fretX(f) - 2} y={34} width={4} height={120} fill="#C9C2D6" />
      ))}
      <Circle cx={(fretX(2) + fretX(3)) / 2} cy={94} r={6} fill="#EDE6D6" opacity={0.7} />
      {[0, 1, 2, 3].map((i) => (
        <Line key={i} x1={0} x2={W} y1={stringY(i)} y2={stringY(i)} stroke="#D9D2C3" strokeWidth={4 - i * 0.8} />
      ))}
    </G>
  );
}
