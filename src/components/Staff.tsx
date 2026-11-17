import React from 'react';
import { ScrollView } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { BEATS_PER_BAR, CLEF_W, figureOfBeats, isRest, layoutScore, ledgerLines, placeScore } from '../music/staff';
import { midiAt, noteName, type Locale } from '../music/notes';
import { useSettings } from '../state/settings';
import { colors, fonts } from '../theme';
import type { ScoreEvent } from '../content/types';

/** Media distancia entre líneas: una posición del pentagrama. */
const HALF = 6;
const STAFF_TOP = 34;
const STAFF_H = HALF * 8;
const NAMES_H = 22;

type State = 'done' | 'current' | 'next';

/**
 * Pentagrama en clave de fa. Dibuja notas (redonda, blanca, negra y corchea),
 * silencios, sostenidos y líneas adicionales; corta en renglones de compases
 * enteros. `current` resalta la nota que toca leer; `highlightLine` pinta una
 * línea (por ejemplo, la de Fa, que marca la clave).
 */
export function Staff({
  events,
  width,
  current = -1,
  noteNames = false,
  highlightLine,
  accessibilityLabel,
}: {
  events: ScoreEvent[];
  width: number;
  current?: number;
  noteNames?: boolean;
  highlightLine?: number;
  accessibilityLabel?: string;
}) {
  const { t, i18n } = useTranslation();
  const notation = useSettings((s) => s.notation);
  const locale = i18n.language as Locale;
  const placed = placeScore(events);
  const layout = layoutScore(events, width);
  const rowH = STAFF_TOP + STAFF_H + 40 + (noteNames ? NAMES_H : 0);
  const totalBars = Math.max(1, Math.ceil(events.reduce((a, e) => a + e.beats, 0) / BEATS_PER_BAR));
  const yOf = (row: number, pos: number) => row * rowH + STAFF_TOP + (8 - pos) * HALF;
  const stateOf = (i: number): State => (current < 0 ? 'next' : i < current ? 'done' : i === current ? 'current' : 'next');
  const ink = (s: State) => (s === 'current' ? colors.accent : s === 'done' ? colors.muted : colors.ink);
  const notesCount = events.filter((e) => !isRest(e)).length;
  const svgW = events.length === 0 ? width : layout.width;
  const rows = events.length === 0 ? 1 : layout.rows;

  return (
    <ScrollView
      horizontal
      scrollEnabled={svgW > width}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? t('ui.exercise.staffLabel', { count: notesCount })}
    >
      <Svg width={svgW} height={rows * rowH}>
        {Array.from({ length: rows }, (_, r) => {
          const barsHere = events.length === 0 ? 1 : Math.min(layout.barsPerRow, totalBars - r * layout.barsPerRow);
          const x1 = events.length === 0 ? width - 4 : CLEF_W + barsHere * BEATS_PER_BAR * layout.beatW;
          const yF = yOf(r, 6);
          return (
            <G key={`r${r}`}>
              {[0, 2, 4, 6, 8].map((p) => (
                <Line
                  key={p}
                  x1={4}
                  x2={x1}
                  y1={yOf(r, p)}
                  y2={yOf(r, p)}
                  stroke={highlightLine === p ? colors.gold : colors.line}
                  strokeWidth={highlightLine === p ? 3 : 1.5}
                />
              ))}
              {/* Clave de fa: nace en la 4.ª línea (Fa) y la rodean dos puntos. */}
              <Circle cx={12} cy={yF} r={4} fill={colors.ink} />
              <Path
                d={`M12 ${yF} C 12 ${yF - 15}, 33 ${yF - 15}, 33 ${yF + 2} C 33 ${yF + 18}, 22 ${yF + 30}, 8 ${yF + 37}`}
                stroke={colors.ink}
                strokeWidth={3.5}
                fill="none"
                strokeLinecap="round"
              />
              <Circle cx={40} cy={yOf(r, 7)} r={2.4} fill={colors.ink} />
              <Circle cx={40} cy={yOf(r, 5)} r={2.4} fill={colors.ink} />
              {events.length > 0
                ? Array.from({ length: barsHere }, (_, b) => {
                    const x = CLEF_W + (b + 1) * BEATS_PER_BAR * layout.beatW;
                    const last = r * layout.barsPerRow + b + 1 === totalBars;
                    return (
                      <G key={`b${b}`}>
                        <Line x1={last ? x - 5 : x} x2={last ? x - 5 : x} y1={yOf(r, 8)} y2={yOf(r, 0)} stroke={colors.muted} strokeWidth={1.5} />
                        {last ? <Rect x={x - 2} y={yOf(r, 8)} width={3.5} height={STAFF_H} fill={colors.muted} /> : null}
                      </G>
                    );
                  })
                : null}
            </G>
          );
        })}

        {placed.map((p, i) => {
          const { row, x } = layout.items[i];
          const st = stateOf(i);
          const c = ink(st);
          const fig = figureOfBeats(p.event.beats);
          if (isRest(p.event)) return <RestGlyph key={i} fig={fig} x={x} y={(pos) => yOf(row, pos)} color={c} />;
          const pos = p.pos!;
          const y = yOf(row, pos);
          const up = p.stemUp!;
          const stemX = up ? x + 6 : x - 6;
          const stemEnd = yOf(row, p.stemTip!);
          const hollow = fig === 'whole' || fig === 'half';
          const partner = p.beamWith !== undefined ? layout.items[p.beamWith] : undefined;
          const ev = p.event as { string: 'E' | 'A' | 'D' | 'G'; fret: number };
          return (
            <G key={i}>
              {st === 'current' ? <Rect x={x - 15} y={yOf(row, 8) - 22} width={30} height={STAFF_H + 44} rx={10} fill={colors.accent} opacity={0.14} /> : null}
              {ledgerLines(pos).map((lp) => (
                <Line key={lp} x1={x - 11} x2={x + 11} y1={yOf(row, lp)} y2={yOf(row, lp)} stroke={colors.line} strokeWidth={1.5} />
              ))}
              {p.sharp ? <SharpGlyph x={x - 18} y={y} color={c} /> : null}
              <G transform={`rotate(-20 ${x} ${y})`}>
                <Ellipse cx={x} cy={y} rx={6.8} ry={4.8} fill={hollow ? "none" : c} stroke={c} strokeWidth={hollow ? 2.2 : 0} />
              </G>
              {fig !== 'whole' ? <Line x1={stemX} x2={stemX} y1={y} y2={stemEnd} stroke={c} strokeWidth={1.8} /> : null}
              {fig === 'eighth' && partner && p.beamWith! > i ? (
                <Line
                  x1={stemX}
                  x2={up ? partner.x + 6 : partner.x - 6}
                  y1={stemEnd}
                  y2={yOf(row, placed[p.beamWith!].stemTip!)}
                  stroke={c}
                  strokeWidth={5}
                />
              ) : null}
              {fig === 'eighth' && !partner ? (
                <Path
                  d={up ? `M${stemX} ${stemEnd} q 12 8 8 22` : `M${stemX} ${stemEnd} q 12 -8 8 -22`}
                  stroke={c}
                  strokeWidth={2.4}
                  fill="none"
                />
              ) : null}
              {noteNames ? (
                <SvgText x={x} y={row * rowH + STAFF_TOP + STAFF_H + 50} fontSize={12} fill={colors.muted} textAnchor="middle" fontFamily={fonts.black}>
                  {noteName(midiAt(ev.string, ev.fret), locale, notation)}
                </SvgText>
              ) : null}
            </G>
          );
        })}
      </Svg>
    </ScrollView>
  );
}

/** Sostenido dibujado con trazos (no depende de que la fuente tenga ♯). */
function SharpGlyph({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <G>
      <Line x1={x - 2} x2={x - 2} y1={y - 10} y2={y + 11} stroke={color} strokeWidth={1.4} />
      <Line x1={x + 2} x2={x + 2} y1={y - 11} y2={y + 10} stroke={color} strokeWidth={1.4} />
      <Line x1={x - 5} x2={x + 5} y1={y - 2} y2={y - 5} stroke={color} strokeWidth={2.6} />
      <Line x1={x - 5} x2={x + 5} y1={y + 5} y2={y + 2} stroke={color} strokeWidth={2.6} />
    </G>
  );
}

function RestGlyph({ fig, x, y, color }: { fig: ReturnType<typeof figureOfBeats>; x: number; y: (pos: number) => number; color: string }) {
  switch (fig) {
    case 'whole':
      // Cuelga de la 4.ª línea.
      return <Rect x={x - 7} y={y(6)} width={14} height={HALF} fill={color} />;
    case 'half':
      // Se apoya sobre la 3.ª línea.
      return <Rect x={x - 7} y={y(4) - HALF} width={14} height={HALF} fill={color} />;
    case 'quarter':
      return (
        <Path
          d={`M${x - 3} ${y(7)} l 6 7 l -6 6 l 6 7 q -8 -3 -4 7`}
          stroke={color}
          strokeWidth={2.6}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      );
    default:
      return (
        <G>
          <Circle cx={x - 3} cy={y(5)} r={2.8} fill={color} />
          <Path d={`M${x - 3} ${y(5) + 2} q 5 1 8 -3 l -6 15`} stroke={color} strokeWidth={2} fill="none" />
        </G>
      );
  }
}
