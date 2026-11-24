import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { colors, fonts } from '../theme';
import type { GridDiagram } from '../music/chords';
import { LAND, beatAt, chordBeats, fitScale, fretWindow, stringNumber, type ChordBeat } from '../music/chordCartoon';
import { FINGER_COLOR } from './exercises/HandMap';
import { IS_NYLON } from '../instruments/current';

/** Proporción alto/ancho del dibujo (para que entre en el escenario del cartoon). */
export const CHORD_CARTOON_RATIO = 200 / 360;
const W = 360;
const H = 200;
const TICK_MS = 50;
const NECK_TOP = 46;
const GAP = 16;
const NUT_X = 62;
const END_X = 300;
const STRUM_X = 328;
const PALM_Y = 188;
const KNUCKLE_Y = 166;
const CURL_Y = 150;

const ease = (p: number) => 1 - (1 - Math.min(1, Math.max(0, p))) ** 3;
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/**
 * Cartoon de la mano armando un acorde, visto como lo ve quien toca (la 6.ª
 * arriba, la mano que pisa sale de abajo y el pulgar asoma detrás del mástil):
 * el pulgar se apoya, cada dedo baja a su traste en orden (la cejilla se
 * acuesta), la otra mano rasguea y vibran solo las cuerdas que suenan.
 * En pausa muestra el acorde armado. Zurdos: el mástil se dibuja al revés.
 */
export function ChordHandCartoon({ diagram, width, leftHanded, playing, sceneMs }: { diagram: GridDiagram; width: number; leftHanded: boolean; playing: boolean; sceneMs?: number }) {
  const { t } = useTranslation();
  const beats = useMemo(() => chordBeats(diagram), [diagram]);
  const { first, count } = useMemo(() => fretWindow(diagram), [diagram]);
  const [ms, setMs] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setMs((m) => m + TICK_MS), TICK_MS);
    return () => clearInterval(id);
  }, [playing]);

  // En pausa: el acorde armado y quieto (el tiempo «hold»).
  // Una vuelta entera entra en la escena (en escenas cortas, más rápido).
  const scale = sceneMs ? fitScale(beats, sceneMs) : 1;
  const { index, progress } = playing ? beatAt(beats, ms, scale) : { index: beats.length - 1, progress: 1 };
  const beat = beats[index];

  const x = (v: number) => (leftHanded ? W - v : v);
  const y = (s: number) => NECK_TOP + s * GAP;
  const fretW = (END_X - NUT_X) / count;
  /** Donde apoya la yema: justo detrás del traste. */
  const pressX = (fret: number) => NUT_X + (fret - first + 0.72) * fretW;
  // Un dedo por traste: cada nudillo queda frente a «su» traste, así los dedos no se cruzan.
  const knuckleX = (finger: number) => pressX(first + finger - 1) - fretW * 0.2;
  const palmX = (knuckleX(1) + knuckleX(4)) / 2;

  // Rasgueo: la púa (o los dedos) baja de la cuerda más grave que suena a la más aguda.
  const strum = beat.kind === 'strum' ? beat.strings : [];
  const sweep = beat.kind === 'strum' ? ease(progress / 0.35) : 0;
  const pickY = strum.length ? lerp(y(strum[0]) - 12, y(strum[strum.length - 1]) + 12, sweep) : 0;
  const ringing = (s: number) => strum.includes(s) && pickY >= y(s);
  const amp = beat.kind === 'strum' ? 3 * (1 - progress) * (Math.round(ms / TICK_MS) % 2 ? 1 : -1) : 0;

  const placeBeats = beats.flatMap((b, k) => (b.kind === 'place' ? [{ b, k }] : []));
  const thumbIn = index > 0 ? 1 : ease(progress / 0.6);

  const [captionKey, captionVals] = captionFor(beat, strum.length);
  const caption = t(captionKey, captionVals);
  const a11y = t('ui.exercise.hand.cartoonA11y', {
    name: diagram.name,
    fingers: placeBeats.map(({ b }) => (b.kind === 'place' ? b.finger : 0)).join(', '),
  });

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={a11y}>
      <Svg width={width} height={(width * H) / W} viewBox={`0 0 ${W} ${H}`}>
        <SvgText x={W / 2} y={17} fontSize={15} fill={colors.ink} textAnchor="middle" fontFamily={fonts.black}>
          {diagram.name ? t('ui.exercise.hand.cartoonTitle', { name: diagram.name, caption }) : caption}
        </SvgText>
        {/* Pulgar: detrás del mástil, frente al dedo 2; el mástil lo tapa a medias. */}
        <Rect x={x(pressX(first + 1)) - 16} y={lerp(22, 26, thumbIn)} width={32} height={24} rx={12} fill={colors.muted} fillOpacity={0.5} stroke={colors.ink} strokeWidth={1.5} strokeDasharray="4 3" opacity={thumbIn} />
        {/* Mástil. */}
        <Rect x={Math.min(x(NUT_X), x(END_X))} y={NECK_TOP - 8} width={END_X - NUT_X} height={GAP * 5 + 16} rx={4} fill={colors.wood} />
        {Array.from({ length: count + 1 }, (_, f) => {
          const nut = f === 0 && first === 1;
          return <Line key={`f${f}`} x1={x(NUT_X + f * fretW)} y1={NECK_TOP - 8} x2={x(NUT_X + f * fretW)} y2={NECK_TOP + GAP * 5 + 8} stroke={nut ? colors.ink : colors.muted} strokeWidth={nut ? 5 : 2} />;
        })}
        {first > 1 ? (
          <SvgText x={x(NUT_X + fretW / 2)} y={NECK_TOP - 13} fontSize={12} fill={colors.muted} textAnchor="middle" fontFamily={fonts.black}>
            {t('ui.exercise.hand.fretShort', { n: first })}
          </SvgText>
        ) : null}
        {/* Boca de la guitarra, donde rasguea la otra mano. */}
        <Circle cx={x(STRUM_X)} cy={NECK_TOP + GAP * 2.5} r={34} fill={colors.night} opacity={0.6} />
        {/* Cuerdas: de la 6.ª (arriba, más gruesa) a la 1.ª. Las que suenan vibran. */}
        {[0, 1, 2, 3, 4, 5].map((s) => {
          const x0 = x(NUT_X - 8);
          const x1 = x(W - 6);
          const a = ringing(s) ? amp * (s % 2 ? -1 : 1) : 0;
          return (
            <Path key={`s${s}`} d={`M ${x0} ${y(s)} Q ${(x0 + x1) / 2} ${y(s) + a * 2} ${x1} ${y(s)}`} stroke={ringing(s) ? colors.gold : colors.ink} strokeOpacity={ringing(s) ? 1 : 0.75} strokeWidth={2.2 - s * 0.25} fill="none" />
          );
        })}
        {/* Arriba de cada cuerda: × no suena, ○ al aire. */}
        {diagram.marks.map((m, s) =>
          m === 'x' ? (
            <G key={`m${s}`}>
              <Line x1={x(38)} y1={y(s) - 5} x2={x(48)} y2={y(s) + 5} stroke={colors.accentInk} strokeWidth={2.5} />
              <Line x1={x(38)} y1={y(s) + 5} x2={x(48)} y2={y(s) - 5} stroke={colors.accentInk} strokeWidth={2.5} />
            </G>
          ) : m === 'o' ? (
            <Circle key={`m${s}`} cx={x(43)} cy={y(s)} r={5.5} fill={ringing(s) ? colors.gold : 'none'} stroke={ringing(s) ? colors.gold : colors.ink} strokeWidth={2} />
          ) : null,
        )}
        {/* Números de cuerda, a la izquierda de las marcas. */}
        {[0, 1, 2, 3, 4, 5].map((s) => (
          <SvgText key={`n${s}`} x={x(18)} y={y(s) + 4} fontSize={11} fill={colors.muted} textAnchor="middle" fontFamily={fonts.black}>
            {stringNumber(s)}
          </SvgText>
        ))}
        {/* Rasgueo: flecha y púa que baja. */}
        {strum.length ? (
          <G>
            <Line x1={x(STRUM_X + 18)} y1={y(strum[0]) - 12} x2={x(STRUM_X + 18)} y2={y(strum[strum.length - 1]) + 12} stroke={colors.accent} strokeWidth={3} strokeLinecap="round" />
            <Path d={`M ${x(STRUM_X + 12)} ${y(strum[strum.length - 1]) + 6} L ${x(STRUM_X + 18)} ${y(strum[strum.length - 1]) + 16} L ${x(STRUM_X + 24)} ${y(strum[strum.length - 1]) + 6}`} stroke={colors.accent} strokeWidth={3} fill="none" />
            {IS_NYLON ? (
              // Criolla: el pulgar (p) baja por las cuerdas, sin púa.
              <G>
                <Circle cx={x(STRUM_X - 2)} cy={pickY} r={9} fill={colors.gold} />
                <SvgText x={x(STRUM_X - 2)} y={pickY + 4} fontSize={11} fill={colors.bg} textAnchor="middle" fontFamily={fonts.black}>
                  {t('ui.exercise.hand.thumbLetter')}
                </SvgText>
              </G>
            ) : (
              <Path d={`M ${x(STRUM_X - 8)} ${pickY - 7} L ${x(STRUM_X + 6)} ${pickY} L ${x(STRUM_X - 8)} ${pickY + 7} Z`} fill={colors.gold} />
            )}
          </G>
        ) : null}
        {/* La mano que pisa: palma abajo, cada dedo sube a su traste en su momento. */}
        <Ellipse cx={x(palmX)} cy={PALM_Y} rx={(knuckleX(4) - knuckleX(1)) / 2 + 24} ry={24} fill={colors.muted} fillOpacity={0.35} stroke={colors.ink} strokeWidth={1.5} />
        {[1, 2, 3, 4].map((finger) => {
          const kx = knuckleX(finger);
          const entry = placeBeats.find(({ b }) => b.kind === 'place' && b.finger === finger);
          const curled = { x: kx, y: CURL_Y + (finger === 1 || finger === 4 ? 4 : 0) };
          if (!entry || entry.b.kind !== 'place') {
            // Dedo libre: curvado y cerca de las cuerdas, listo para bajar.
            return <Line key={`d${finger}`} x1={x(kx)} y1={KNUCKLE_Y} x2={x(curled.x)} y2={curled.y} stroke={FINGER_COLOR[finger]} strokeOpacity={0.35} strokeWidth={11} strokeLinecap="round" />;
          }
          const b = entry.b;
          const p = entry.k < index ? 1 : entry.k === index ? ease(progress / LAND) : 0;
          const landing = entry.k === index && playing;
          const strings = b.strings;
          // Con cejilla, la yema queda en la cuerda más grave y el dedo acostado hasta la más aguda.
          const tip = { x: pressX(b.fret), y: y(strings[0]) };
          const base = { x: pressX(b.fret), y: y(strings[strings.length - 1]) };
          const tx = lerp(curled.x, tip.x, p);
          const reach = b.barre ? base : tip;
          const ty = lerp(curled.y, reach.y, p);
          return (
            <G key={`d${finger}`}>
              <Line x1={x(kx)} y1={KNUCKLE_Y} x2={x(tx)} y2={ty} stroke={FINGER_COLOR[finger]} strokeOpacity={0.55} strokeWidth={12} strokeLinecap="round" />
              {b.barre && p > 0 ? (
                <Line x1={x(tx)} y1={ty} x2={x(tx)} y2={lerp(ty, tip.y, p)} stroke={FINGER_COLOR[finger]} strokeOpacity={0.8} strokeWidth={12} strokeLinecap="round" />
              ) : null}
              {/* Otras cuerdas que pisa el mismo dedo (sin cejilla). */}
              {!b.barre && p >= 1
                ? strings.slice(1).map((s) => <Circle key={`e${s}`} cx={x(tip.x)} cy={y(s)} r={7} fill={FINGER_COLOR[finger]} />)
                : null}
              {landing ? <Circle cx={x(tx)} cy={b.barre ? lerp(ty, tip.y, p) : ty} r={13} fill="none" stroke={colors.ink} strokeWidth={2.5} /> : null}
              <Circle cx={x(tx)} cy={b.barre ? lerp(ty, tip.y, p) : ty} r={9} fill={FINGER_COLOR[finger]} />
              <SvgText x={x(tx)} y={(b.barre ? lerp(ty, tip.y, p) : ty) + 4} fontSize={11} fill={colors.bg} textAnchor="middle" fontFamily={fonts.black}>
                {finger}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

/** Clave y valores del texto del tiempo actual: siempre sobre la mano y los dedos. */
function captionFor(beat: ChordBeat, sounding: number): [string, Record<string, number>] {
  switch (beat.kind) {
    case 'thumb':
      return ['ui.exercise.hand.cartoonThumb', {}];
    case 'place':
      return beat.barre
        ? ['ui.exercise.hand.cartoonBarre', { fret: beat.fret }]
        : ['ui.exercise.hand.cartoonPlace', { finger: beat.finger, fret: beat.fret, string: stringNumber(beat.strings[0]) }];
    case 'strum':
      return ['ui.exercise.hand.cartoonStrum', { n: sounding }];
    case 'hold':
      return ['ui.exercise.hand.cartoonHold', {}];
  }
}
