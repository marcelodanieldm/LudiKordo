import React from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';
import { STRINGS, midiAt, noteName, type Locale, type Notation, type StringId } from '../music/notes';
import { colors } from '../theme';

export interface Dot {
  string: StringId;
  fret: number;
  label?: string;
  color?: string;
  /** Color del texto del punto (por defecto, oscuro sobre colores claros). */
  labelColor?: string;
  /** Nota activa: más grande y con halo. */
  glow?: boolean;
  /** Nota que viene: contorno punteado, sin relleno. */
  pending?: boolean;
}

interface Props {
  frets?: number;
  width: number;
  dots?: Dot[];
  /** Muestra el nombre de la nota bajo cada punto. */
  showNoteNames?: { locale: Locale; notation: Notation };
  leftHanded?: boolean;
  onTap?: (string: StringId, fret: number) => void;
  /** Permite tocar las cuerdas al aire (traste 0) antes de la cejuela. */
  openStrings?: boolean;
}

const MARKERS = [3, 5, 7, 9, 15, 17, 19, 21];

/**
 * Diapasón dibujado como se ve desde quien toca: la cuerda Mi abajo.
 * Los trastes se achican hacia el cuerpo, como en un bajo real (regla del 17,817).
 * Para zurdos se espeja horizontalmente.
 */
export function Fretboard({ frets = 5, width, dots = [], showNoteNames, leftHanded, onTap, openStrings }: Props) {
  const top = 14;
  const stringGap = width >= 560 ? 40 : 28;
  const boardH = stringGap * 3 + 24;
  const height = top + boardH + 30;
  const dotR = stringGap * 0.45;
  // Margen izquierdo: número de cuerda + punto de cuerda al aire sin cortarse.
  // Con cuerdas al aire tocables, la zona antes de la cejuela mide al menos 48 dp.
  const padL = Math.max(openStrings ? 48 : 24, dotR * 2 + 22);
  const nutX = padL;
  const boardW = width - padL - 8;

  // Posiciones de los trastes proporcionales a una escala real, normalizadas al ancho.
  const raw = Array.from({ length: frets + 1 }, (_, n) => 1 - Math.pow(2, -n / 12));
  const scale = boardW / raw[frets];
  const fretX = raw.map((r) => nutX + r * scale);
  const mid = (f: number) => (f === 0 ? nutX - dotR - 4 : (fretX[f - 1] + fretX[f]) / 2);
  const stringY = (id: StringId) => {
    const i = STRINGS.findIndex((s) => s.id === id); // 0 = Mi
    return top + 12 + (3 - i) * stringGap;
  };
  const mirror = (x: number) => (leftHanded ? width - x : x);

  return (
    <View>
      <Svg width={width} height={height} accessibilityRole="image">
        <Rect x={Math.min(mirror(nutX), mirror(nutX + boardW))} y={top} width={boardW} height={boardH} rx={5} fill={colors.wood} />
        {[1, 2, 3].map((k) => (
          <Line key={`g${k}`} x1={mirror(nutX)} y1={top + (boardH * k) / 4 + 3} x2={mirror(nutX + boardW)} y2={top + (boardH * k) / 4 + 3} stroke={colors.woodGrain} strokeWidth={6} opacity={0.6} />
        ))}
        <Rect x={leftHanded ? mirror(nutX) - 1 : nutX - 6} y={top} width={7} height={boardH} rx={2} fill={colors.nut} />
        {fretX.slice(1).map((x, i) => (
          <Line key={`f${i}`} x1={mirror(x)} y1={top} x2={mirror(x)} y2={top + boardH} stroke={colors.fret} strokeWidth={3} />
        ))}
        {MARKERS.filter((m) => m <= frets).map((m) => (
          <Circle key={`m${m}`} cx={mirror(mid(m))} cy={top + boardH / 2} r={6} fill={colors.inlay} />
        ))}
        {STRINGS.map((s, i) => (
          <React.Fragment key={s.id}>
            <Line x1={mirror(nutX)} y1={stringY(s.id)} x2={mirror(nutX + boardW)} y2={stringY(s.id)} stroke={colors.stringColor} strokeWidth={3.4 - i * 0.65} strokeLinecap="round" />
            <SvgText x={mirror(8)} y={stringY(s.id) + 4} fontSize={12} fontWeight="900" fill={colors.muted} textAnchor="middle">
              {s.id}
            </SvgText>
          </React.Fragment>
        ))}
        {dots.map((d, i) => {
          const cx = mirror(mid(d.fret));
          const cy = stringY(d.string);
          const r = d.glow ? dotR * 1.15 : dotR;
          return (
            <React.Fragment key={`d${i}`}>
              {d.glow ? <Circle cx={cx} cy={cy} r={r * 1.5} fill={d.color ?? colors.accent} opacity={0.25} /> : null}
              {d.pending ? (
                <Circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.muted} strokeWidth={2.5} strokeDasharray="4 4" />
              ) : (
                <Circle cx={cx} cy={cy} r={r} fill={d.color ?? colors.teal} />
              )}
              {d.label ? (
                <SvgText x={cx} y={cy + 5} fontSize={14} fontWeight="900" fill={d.pending ? colors.muted : (d.labelColor ?? colors.onAccent)} textAnchor="middle">
                  {d.label}
                </SvgText>
              ) : null}
              {showNoteNames ? (
                <SvgText x={cx} y={top + boardH + 20} fontSize={12} fontWeight="800" fill={colors.muted} textAnchor="middle">
                  {noteName(midiAt(d.string, d.fret), showNoteNames.locale, showNoteNames.notation)}
                </SvgText>
              ) : null}
            </React.Fragment>
          );
        })}
      </Svg>
      {onTap ? (
        // Zonas táctiles invisibles por encima del dibujo: una por cuerda y traste.
        <View style={{ position: 'absolute', left: 0, top: 0, width, height }}>
          {openStrings
            ? STRINGS.map((s) => (
                <Pressable
                  key={`${s.id}0`}
                  accessibilityRole="button"
                  accessibilityLabel={`${s.id} 0`}
                  onPress={() => onTap(s.id, 0)}
                  hitSlop={{ top: Math.max(0, (44 - stringGap) / 2), bottom: Math.max(0, (44 - stringGap) / 2) }}
                  style={{ position: 'absolute', left: leftHanded ? width - nutX : 0, width: nutX, top: stringY(s.id) - stringGap / 2, height: stringGap }}
                />
              ))
            : null}
          {STRINGS.flatMap((s) =>
            Array.from({ length: frets }, (_, k) => {
              const f = k + 1;
              const x0 = mirror(fretX[f - 1]);
              const x1 = mirror(fretX[f]);
              return (
                <Pressable
                  key={`${s.id}${f}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${s.id} ${f}`}
                  onPress={() => onTap(s.id, f)}
                  // Zona táctil de al menos 44 dp aunque las cuerdas estén más juntas.
                  hitSlop={{ top: Math.max(0, (44 - stringGap) / 2), bottom: Math.max(0, (44 - stringGap) / 2) }}
                  style={{ position: 'absolute', left: Math.min(x0, x1), width: Math.abs(x1 - x0), top: stringY(s.id) - stringGap / 2, height: stringGap }}
                />
              );
            }),
          )}
        </View>
      ) : null}
    </View>
  );
}
