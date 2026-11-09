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
}

interface Props {
  frets?: number;
  width: number;
  dots?: Dot[];
  /** Muestra el nombre de la nota bajo cada punto. */
  showNoteNames?: { locale: Locale; notation: Notation };
  leftHanded?: boolean;
  onTap?: (string: StringId, fret: number) => void;
}

const MARKERS = [3, 5, 7, 9, 15, 17, 19, 21];

/**
 * Diapasón dibujado como se ve desde quien toca: la cuerda Mi abajo.
 * Los trastes se achican hacia el cuerpo, como en un bajo real (regla del 17,817).
 * Para zurdos se espeja horizontalmente.
 */
export function Fretboard({ frets = 5, width, dots = [], showNoteNames, leftHanded, onTap }: Props) {
  const padL = 24;
  const nutX = padL;
  const boardW = width - padL - 8;
  const height = 150;
  const top = 14;
  const stringGap = 28;
  const boardH = stringGap * 3 + 24;

  // Posiciones de los trastes proporcionales a una escala real, normalizadas al ancho.
  const raw = Array.from({ length: frets + 1 }, (_, n) => 1 - Math.pow(2, -n / 12));
  const scale = boardW / raw[frets];
  const fretX = raw.map((r) => nutX + r * scale);
  const mid = (f: number) => (f === 0 ? nutX - 10 : (fretX[f - 1] + fretX[f]) / 2);
  const stringY = (id: StringId) => {
    const i = STRINGS.findIndex((s) => s.id === id); // 0 = Mi
    return top + 12 + (3 - i) * stringGap;
  };
  const mirror = (x: number) => (leftHanded ? width - x : x);

  return (
    <View>
      <Svg width={width} height={height} accessibilityRole="image">
        <Rect x={Math.min(mirror(nutX), mirror(nutX + boardW))} y={top} width={boardW} height={boardH} rx={4} fill={colors.track} />
        <Rect x={leftHanded ? mirror(nutX) : nutX - 5} y={top} width={6} height={boardH} fill={colors.ink} />
        {fretX.slice(1).map((x, i) => (
          <Line key={`f${i}`} x1={mirror(x)} y1={top} x2={mirror(x)} y2={top + boardH} stroke="#9C8F7E" strokeWidth={2} />
        ))}
        {MARKERS.filter((m) => m <= frets).map((m) => (
          <Circle key={`m${m}`} cx={mirror(mid(m))} cy={top + boardH / 2} r={5} fill="#D9CBB6" />
        ))}
        {STRINGS.map((s, i) => (
          <React.Fragment key={s.id}>
            <Line x1={mirror(nutX)} y1={stringY(s.id)} x2={mirror(nutX + boardW)} y2={stringY(s.id)} stroke="#6B5E4E" strokeWidth={3.2 - i * 0.6} />
            <SvgText x={mirror(8)} y={stringY(s.id) + 4} fontSize={12} fontWeight="700" fill={colors.muted} textAnchor="middle">
              {s.id}
            </SvgText>
          </React.Fragment>
        ))}
        {dots.map((d, i) => (
          <React.Fragment key={`d${i}`}>
            <Circle cx={mirror(mid(d.fret))} cy={stringY(d.string)} r={12} fill={d.color ?? colors.teal} />
            {d.label ? (
              <SvgText x={mirror(mid(d.fret))} y={stringY(d.string) + 5} fontSize={14} fontWeight="800" fill="#FFFFFF" textAnchor="middle">
                {d.label}
              </SvgText>
            ) : null}
            {showNoteNames ? (
              <SvgText x={mirror(mid(d.fret))} y={top + boardH + 18} fontSize={12} fontWeight="700" fill={colors.muted} textAnchor="middle">
                {noteName(midiAt(d.string, d.fret), showNoteNames.locale, showNoteNames.notation)}
              </SvgText>
            ) : null}
          </React.Fragment>
        ))}
      </Svg>
      {onTap ? (
        // Zonas táctiles invisibles por encima del dibujo: una por cuerda y traste.
        <View style={{ position: 'absolute', left: 0, top: 0, width, height }}>
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
