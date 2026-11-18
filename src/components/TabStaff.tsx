import React from 'react';
import { ScrollView } from 'react-native';
import Svg, { Ellipse, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { BEATS_PER_BAR, TAB_LABEL_W, figureOf, isTabRest, layoutTab, placeNotes, type Figure, type TabEvent } from '../music/tab';
import { STRINGS } from '../music/notes';
import { colors, fonts } from '../theme';
import type { StringId } from '../music/notes';

const LABEL_W = TAB_LABEL_W;
const LINE_GAP = 18;
const STAFF_TOP = 14;
const STAFF_H = LINE_GAP * (STRINGS.length - 1);
/** Alto de cada renglón: tablatura + figura rítmica debajo. */
const ROW_H = STAFF_TOP + STAFF_H + 52;

type NoteState = 'done' | 'current' | 'next';

/**
 * Tablatura de una línea por cuerda (la más aguda arriba, como se escribe siempre) con la
 * figura rítmica de cada nota debajo: redonda, blanca, negra o corchea, y los
 * silencios. Corta en renglones de compases enteros según el ancho.
 */
export function TabStaff({ notes, width, current = -1 }: { notes: TabEvent[]; width: number; current?: number }) {
  const { t } = useTranslation();
  const placed = placeNotes(notes);
  const layout = layoutTab(notes, width);
  const { rows, beatW } = layout;
  // En la tablatura la cuerda 1 (la más aguda) va arriba.
  const lineY = (string: StringId) => STAFF_TOP + (STRINGS.length - 1 - STRINGS.findIndex((s) => s.id === string)) * LINE_GAP;
  const stateOf = (i: number): NoteState => (i < current ? 'done' : i === current ? 'current' : 'next');

  return (
    <ScrollView horizontal scrollEnabled={layout.width > width} accessibilityRole="image" accessibilityLabel={t('ui.exercise.tabLabel', { count: notes.filter((e) => !isTabRest(e)).length })}>
      <Svg width={layout.width} height={rows * ROW_H}>
        {Array.from({ length: rows }, (_, r) => {
          const y0 = r * ROW_H;
          const rowBars = layout.barsInRow[r];
          const x1 = LABEL_W + rowBars * BEATS_PER_BAR * beatW;
          return (
            <React.Fragment key={`r${r}`}>
              {STRINGS.map((s) => (
                <Line key={s.id} x1={LABEL_W} x2={x1} y1={y0 + lineY(s.id)} y2={y0 + lineY(s.id)} stroke={colors.line} strokeWidth={1.5} />
              ))}
              {['T', 'A', 'B'].map((ch, k) => (
                <SvgText key={ch} x={10} y={y0 + STAFF_TOP + STAFF_H / 2 - 13 + k * 17} fontSize={13} fontFamily={fonts.black} fill={colors.muted} textAnchor="middle">
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
          const { row, x } = layout.notes[i];
          const y0 = row * ROW_H;
          const st = stateOf(i);
          const color = st === 'done' ? colors.teal : st === 'current' ? colors.accentInk : colors.ink;
          if (isTabRest(n)) {
            return <RestMark key={`n${i}`} x={x} y={y0 + STAFF_TOP + STAFF_H + 22} figure={figureOf(n.beats)} color={st === 'next' ? colors.muted : color} />;
          }
          const y = y0 + lineY(n.string);
          const label = String(n.fret);
          const boxW = label.length > 1 ? 22 : 16;
          return (
            <React.Fragment key={`n${i}`}>
              {st === 'current' ? <Rect x={x - boxW / 2 - 3} y={y - 11} width={boxW + 6} height={22} rx={6} fill={colors.accentSoft} stroke={colors.accent} strokeWidth={1.5} /> : <Rect x={x - boxW / 2} y={y - 9} width={boxW} height={18} fill={colors.bg} />}
              <SvgText x={x} y={y + 5} fontSize={15} fontFamily={fonts.black} fill={color} textAnchor="middle">
                {label}
              </SvgText>
              {/* Bend (↗½ o ↗1) y vibrato (~), a la derecha del traste. */}
              {'bend' in n && n.bend ? (
                <SvgText x={x + boxW / 2 + 2} y={y - 2} fontSize={11} fontFamily={fonts.black} fill={colors.accentInk}>
                  {`↗${n.bend === 1 ? '½' : '1'}`}
                </SvgText>
              ) : null}
              {'vibrato' in n && n.vibrato ? (
                <SvgText x={x + boxW / 2 + 2} y={y + 12} fontSize={13} fontFamily={fonts.black} fill={colors.tealInk}>
                  ~
                </SvgText>
              ) : null}
              <Rhythm x={x} y={y0 + STAFF_TOP + STAFF_H + 22} figure={figureOf(n.beats)} color={st === 'next' ? colors.muted : color} />
            </React.Fragment>
          );
        })}
      </Svg>
    </ScrollView>
  );
}

/** Figura rítmica: cabeza (hueca en redonda y blanca), plica salvo en la redonda y corchete en la corchea. */
function Rhythm({ x, y, figure, color }: { x: number; y: number; figure: Figure; color: string }) {
  const hollow = figure === 'whole' || figure === 'half';
  return (
    <>
      {figure !== 'whole' ? <Line x1={x + 5.5} x2={x + 5.5} y1={y - 22} y2={y} stroke={color} strokeWidth={1.8} /> : null}
      {figure === 'eighth' ? <Path d={`M${x + 5.5} ${y - 22} C${x + 9} ${y - 17} ${x + 14} ${y - 15} ${x + 12} ${y - 8}`} fill="none" stroke={color} strokeWidth={1.8} /> : null}
      <Ellipse cx={x} cy={y} rx={6.5} ry={4.6} rotation={-20} origin={`${x}, ${y}`} fill={hollow ? 'none' : color} stroke={color} strokeWidth={2} />
    </>
  );
}

/** Silencio en la línea de figuras: redonda y blanca como bloque bajo/sobre una rayita, negra en zigzag, corchea como «7». */
function RestMark({ x, y, figure, color }: { x: number; y: number; figure: Figure; color: string }) {
  if (figure === 'whole' || figure === 'half') {
    const below = figure === 'whole';
    return (
      <>
        <Line x1={x - 9} x2={x + 9} y1={y - 6} y2={y - 6} stroke={color} strokeWidth={1.5} />
        <Rect x={x - 6} y={below ? y - 6 : y - 11} width={12} height={5} fill={color} />
      </>
    );
  }
  if (figure === 'quarter') {
    return <Path d={`M${x - 2} ${y - 20} L${x + 3} ${y - 14} L${x - 3} ${y - 8} L${x + 3} ${y - 2} C${x - 3} ${y - 4} ${x - 4} ${y + 2} ${x} ${y + 4}`} fill="none" stroke={color} strokeWidth={2.2} strokeLinejoin="round" />;
  }
  return (
    <>
      <Ellipse cx={x - 3} cy={y - 12} rx={2.6} ry={2.4} fill={color} />
      <Path d={`M${x - 3} ${y - 10} C${x} ${y - 9} ${x + 3} ${y - 11} ${x + 4} ${y - 14} L${x - 1} ${y + 2}`} fill="none" stroke={color} strokeWidth={1.8} />
    </>
  );
}
