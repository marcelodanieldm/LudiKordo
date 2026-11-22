import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { colors, fonts } from '../../theme';
import { INSTRUMENT } from '../../instruments/current';
import { useSettings } from '../../state/settings';
import type { ChordShape } from '../../music/chords';
import type { HandStep, Pluck } from '../../music/hands';

/** Un color por dedo de la mano que pisa (1 índice … 4 meñique), el mismo en el texto y en el dibujo. */
export const FINGER_COLOR = ['transparent', colors.fingerI, colors.accent, colors.teal, colors.gold] as const;
const PLUCK_LABEL: Record<Pluck, string> = { down: '↓', up: '↑', p: 'p', i: 'i', m: 'm', a: 'a' };
const FRETS = 5;
/** Un paso por pulso a este tempo, lento para que se vea el movimiento. */
const STEP_MS = 800;
const MAX_STEPS = 16;

/**
 * Las dos manos sobre el diapasón: dedos numerados en la posición, cuerdas al
 * aire, el pulgar detrás del mástil y, abajo, cómo toca la otra mano cada nota.
 * «Ver el movimiento» recorre las notas una por una. Con un acorde muestra cómo
 * se arma. Respeta zurdos (el mástil se dibuja al revés).
 */
export function HandMap({ steps, chord, width }: { steps?: HandStep[]; chord?: ChordShape; width: number }) {
  const { t } = useTranslation();
  const left = useSettings((s) => s.hand) === 'left';
  const [active, setActive] = useState(-1);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  // Cuerdas de la más aguda (arriba, como en la tablatura) a la más grave.
  const strings = [...INSTRUMENT.strings].sort((a, b) => a.number - b.number);
  const rowOf = (id: string) => strings.findIndex((s) => s.id === id);
  const shown = (steps ?? []).slice(0, MAX_STEPS);
  const pos = steps ? (shown.find((s) => s.fret > 0)?.pos ?? 1) : Math.max(1, Math.min(...(chord?.frets.filter((f) => f > 0) ?? [1])));
  const view = active >= 0 && shown[active] ? shown[active].pos : pos;

  const W = 360;
  const top = 26;
  const gap = strings.length > 4 ? 18 : 24;
  const neckH = gap * (strings.length - 1);
  const nutX = 52;
  const fretW = 56;
  const H = top + neckH + 96;
  const x = (v: number) => (left ? W - v : v);
  const fretX = (fret: number) => nutX + (fret - view + 0.5) * fretW;
  const y = (row: number) => top + row * gap;

  // Lo que se dibuja: las notas de la posición visible (o del paso activo) o el acorde.
  type Dot = { row: number; fret: number; finger: number; key: string; on: boolean };
  const dots: Dot[] = [];
  if (steps) {
    const seen = new Set<string>();
    shown.forEach((s, k) => {
      if (s.pos !== view && s.fret > 0) return;
      const key = `${s.string}${s.fret}`;
      const on = k === active;
      if (seen.has(key) && !on) return;
      seen.add(key);
      dots.push({ row: rowOf(s.string), fret: s.fret, finger: s.finger, key, on });
    });
  } else if (chord) {
    // `frets` va de la 6.ª a la 1.ª; en el dibujo la 1.ª va arriba.
    chord.frets.forEach((fret, i) => {
      if (fret < 0) return;
      dots.push({ row: strings.length - 1 - i, fret, finger: chord.fingers[i], key: `c${i}`, on: false });
    });
  }
  const thumbFret = view + 1;

  const play = () => {
    if (timer.current) clearInterval(timer.current);
    let k = 0;
    setActive(0);
    timer.current = setInterval(() => {
      k += 1;
      if (k >= shown.length) {
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
        setActive(-1);
        return;
      }
      setActive(k);
    }, STEP_MS);
  };

  const a11y = steps
    ? t('ui.exercise.hand.mapA11y', { pos, fingers: shown.map((s) => s.finger).join(', ') })
    : t('ui.exercise.hand.chordA11y', { fingers: (chord?.fingers ?? []).filter((f) => f > 0).join(', ') });

  return (
    <View style={{ gap: 8 }}>
      <View accessible accessibilityRole="image" accessibilityLabel={a11y}>
        <Svg width={width} height={(width * H) / W} viewBox={`0 0 ${W} ${H}`}>
          {/* Mástil: cejuela (o el traste anterior) y trastes. */}
          <Rect x={Math.min(x(nutX), x(nutX + FRETS * fretW))} y={top - 8} width={FRETS * fretW} height={neckH + 16} rx={6} fill={colors.raised} />
          {Array.from({ length: FRETS + 1 }, (_, f) => (
            <Line key={`f${f}`} x1={x(nutX + f * fretW)} y1={top - 8} x2={x(nutX + f * fretW)} y2={top + neckH + 8} stroke={f === 0 && view === 1 ? colors.ink : colors.muted} strokeWidth={f === 0 && view === 1 ? 5 : 2} />
          ))}
          {strings.map((s, row) => (
            <G key={s.id}>
              <Line x1={x(nutX - 18)} y1={y(row)} x2={x(nutX + FRETS * fretW)} y2={y(row)} stroke={colors.ink} strokeOpacity={0.7} strokeWidth={1 + row * 0.35} />
              <SvgText x={x(14)} y={y(row) + 4} fontSize={11} fill={colors.muted} textAnchor="middle" fontFamily={fonts.black}>
                {s.number}
              </SvgText>
            </G>
          ))}
          {Array.from({ length: FRETS }, (_, f) => (
            <SvgText key={`n${f}`} x={x(nutX + (f + 0.5) * fretW)} y={top - 12} fontSize={11} fill={colors.muted} textAnchor="middle" fontFamily={fonts.black}>
              {view + f}
            </SvgText>
          ))}
          {/* Dedos. */}
          {dots.map((d) =>
            d.fret === 0 ? (
              <Circle key={d.key} cx={x(nutX - 26)} cy={y(d.row)} r={7} fill="none" stroke={d.on ? colors.gold : colors.ink} strokeWidth={d.on ? 3 : 2} />
            ) : d.fret >= view && d.fret < view + FRETS ? (
              <G key={d.key}>
                {d.on ? <Circle cx={x(fretX(d.fret))} cy={y(d.row)} r={14} fill="none" stroke={colors.ink} strokeWidth={3} /> : null}
                <Circle cx={x(fretX(d.fret))} cy={y(d.row)} r={10} fill={FINGER_COLOR[d.finger] ?? colors.muted} />
                <SvgText x={x(fretX(d.fret))} y={y(d.row) + 4} fontSize={12} fill={colors.bg} textAnchor="middle" fontFamily={fonts.black}>
                  {d.finger}
                </SvgText>
              </G>
            ) : null,
          )}
          {/* Pulgar: detrás del mástil, frente al dedo 2. */}
          <Rect x={x(fretX(thumbFret)) - 20} y={top + neckH + 14} width={40} height={18} rx={9} fill={colors.card} stroke={colors.ink} strokeWidth={1.5} />
          <SvgText x={x(fretX(thumbFret))} y={top + neckH + 27} fontSize={10} fill={colors.ink} textAnchor="middle" fontFamily={fonts.black}>
            {t('ui.exercise.hand.thumbShort')}
          </SvgText>
          {/* La otra mano, nota por nota. */}
          {steps
            ? shown.slice(0, 12).map((s, k) => (
                <G key={`p${k}`}>
                  <Rect x={x(nutX - 30 + k * 26) - 11} y={top + neckH + 44} width={22} height={24} rx={6} fill={k === active ? colors.accent : colors.track} />
                  <SvgText x={x(nutX - 30 + k * 26)} y={top + neckH + 61} fontSize={13} fill={k === active ? colors.onAccent : colors.ink} textAnchor="middle" fontFamily={fonts.black}>
                    {PLUCK_LABEL[s.pluck]}
                  </SvgText>
                </G>
              ))
            : null}
        </Svg>
      </View>
      {steps && shown.length > 1 ? (
        <Pressable
          accessibilityRole="button"
          onPress={play}
          testID="hand-play"
          style={{ minHeight: 44, borderRadius: 22, paddingHorizontal: 16, alignSelf: 'flex-start', justifyContent: 'center', backgroundColor: colors.track }}
        >
          <Text style={{ fontWeight: '800', color: colors.ink }}>{active >= 0 ? t('ui.exercise.hand.playing', { n: active + 1, total: shown.length }) : t('ui.exercise.hand.play')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
