import React from 'react';
import { View } from 'react-native';
import Svg, { Ellipse, Line, Rect, Text as SvgText } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { BEATS_PER_BAR, figureOf, placeNotes } from '../music/tab';
import { STRINGS } from '../music/notes';
import { colors, fonts } from '../theme';
import type { TabNote } from '../content/types';

const LABEL_W = 26;
const MIN_BEAT_W = 24;
const LINE_GAP = 18;
const STAFF_TOP = 14;
const STAFF_H = LINE_GAP * 3;
/** Alto de cada renglón: tablatura + figura rítmica debajo. */
const ROW_H = STAFF_TOP + STAFF_H + 52;

type NoteState = 'done' | 'current' | 'next';

/**
 * Tablatura de 4 líneas (Sol arriba, Mi abajo, como se escribe siempre) con la
 * figura rítmica de cada nota debajo: redonda, blanca o negra. Corta en
 * renglones de compases enteros según el ancho.
 */
export function TabStaff({ notes, width, current = -1 }: { notes: TabNote[]; width: number; current?: number }) {
  const { t } = useTranslation();
  const placed = placeNotes(notes);
  const bars = placed.length ? placed[placed.length - 1].bar + 1 : 0;
  const barsPerRow = Math.max(1, Math.floor((width - LABEL_W - 8) / (BEATS_PER_BAR * MIN_BEAT_W)));
  const rows = Math.ceil(bars / barsPerRow);
  const beatW = (width - LABEL_W - 8) / (barsPerRow * BEATS_PER_BAR);
  // En la tablatura la cuerda 1 (Sol) va arriba.
  const lineY = (string: TabNote['string']) => STAFF_TOP + (3 - STRINGS.findIndex((s) => s.id === string)) * LINE_GAP;
  const stateOf = (i: number): NoteState => (i < current ? 'done' : i === current ? 'current' : 'next');

  return (
    <View accessibilityRole="image" accessibilityLabel={t('ui.exercise.tabLabel', { count: notes.length })}>
      <Svg width={width} height={rows * ROW_H}>
        {Array.from({ length: rows }, (_, r) => {
          const y0 = r * ROW_H;
          const rowBars = Math.min(barsPerRow, bars - r * barsPerRow);
          const x1 = LABEL_W + rowBars * BEATS_PER_BAR * beatW;
          return (
            <React.Fragment key={`r${r}`}>
              {STRINGS.map((s) => (
                <Line key={s.id} x1={LABEL_W} x2={x1} y1={y0 + lineY(s.id)} y2={y0 + lineY(s.id)} stroke={colors.line} strokeWidth={1.5} />
              ))}
              {['T', 'A', 'B'].map((ch, k) => (
                <SvgText key={ch} x={10} y={y0 + STAFF_TOP + 12 + k * 17} fontSize={13} fontFamily={fonts.black} fill={colors.muted} textAnchor="middle">
                  {ch}
                </SvgText>
              ))}
              {Array.from({ length: rowBars + 1 }, (_, b) => (
                <Line key={`b${b}`} x1={LABEL_W + b * BEATS_PER_BAR * beatW} x2={LABEL_W + b * BEATS_PER_BAR * beatW} y1={y0 + STAFF_TOP} y2={y0 + STAFF_TOP + STAFF_H} stroke={colors.muted} strokeWidth={b === 0 ? 2.5 : 1.5} />
              ))}
            </React.Fragment>
          );
        })}
        {placed.map((n, i) => {
          const row = Math.floor(n.bar / barsPerRow);
          const y0 = row * ROW_H;
          const beatInRow = (n.bar % barsPerRow) * BEATS_PER_BAR + n.beatInBar;
          const x = LABEL_W + beatInRow * beatW + beatW / 2;
          const y = y0 + lineY(n.string);
          const st = stateOf(i);
          const color = st === 'done' ? colors.teal : st === 'current' ? colors.accentInk : colors.ink;
          const label = String(n.fret);
          const boxW = label.length > 1 ? 22 : 16;
          return (
            <React.Fragment key={`n${i}`}>
              {st === 'current' ? <Rect x={x - boxW / 2 - 3} y={y - 11} width={boxW + 6} height={22} rx={6} fill={colors.accentSoft} stroke={colors.accent} strokeWidth={1.5} /> : <Rect x={x - boxW / 2} y={y - 9} width={boxW} height={18} fill={colors.bg} />}
              <SvgText x={x} y={y + 5} fontSize={15} fontFamily={fonts.black} fill={color} textAnchor="middle">
                {label}
              </SvgText>
              <Rhythm x={x} y={y0 + STAFF_TOP + STAFF_H + 22} figure={figureOf(n.beats)} color={st === 'next' ? colors.muted : color} />
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

/** Figura rítmica: cabeza (hueca en redonda y blanca) y plica salvo en la redonda. */
function Rhythm({ x, y, figure, color }: { x: number; y: number; figure: 'whole' | 'half' | 'quarter'; color: string }) {
  const hollow = figure !== 'quarter';
  return (
    <>
      {figure !== 'whole' ? <Line x1={x + 5.5} x2={x + 5.5} y1={y - 22} y2={y} stroke={color} strokeWidth={1.8} /> : null}
      <Ellipse cx={x} cy={y} rx={6.5} ry={4.6} rotation={-20} origin={`${x}, ${y}`} fill={hollow ? 'none' : color} stroke={color} strokeWidth={2} />
    </>
  );
}
