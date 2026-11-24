import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Text } from './Text';
import { Button } from './ui';
import { colors, fonts, radius } from '../theme';
import { FINGER_COLOR } from './exercises/HandMap';
import { INSTRUMENT, IS_GUITAR, IS_NYLON } from '../instruments/current';
import { useSettings } from '../state/settings';
import { playSequence, type SequenceHandle } from '../audio/engine';
import { midiToFreq } from '../music/notes';
import { listenPlan, stepOfBarre, stepOfDot, type HandPosture } from '../music/handPosition';
import type { HandsSpec } from '../content/types';

const OPEN_MIDI = INSTRUMENT.strings.map((s) => s.openMidi);
// El bajo suena una octava arriba en los ejemplos, para que se oiga en el parlante del teléfono.
const TRANSPOSE = INSTRUMENT.listenTransposeSemitones;
const N = OPEN_MIDI.length;
const LAST = N - 1;
const STRING_NAME = INSTRUMENT.strings.map((s) => s.id.toUpperCase());
const STRING_NUMBER = INSTRUMENT.strings.map((s) => s.number);

// Diapasón visto desde arriba: la cuerda más gruesa arriba, como al bajar la mirada.
const W = 360;
const TOP = 30;
const GAP = N === 4 ? 30 : 24;
const H = TOP + GAP * LAST + 44;
const NUT_X = 64;
const END_X = 350;
const yOf = (s: number) => TOP + s * GAP;
/** El pulgar, punteado, entre las cuerdas de abajo: va detrás del mástil. */
const THUMB_Y = TOP + GAP * LAST * 0.7;

/**
 * «Tus manos en la guitarra»: el acorde (o la araña) con un color por dedo, la
 * vista como la ve el alumno o de frente, el pulgar detrás del mástil, los
 * pasos para colocar los dedos uno por uno y el sonido, con la cuerda que suena
 * iluminada. Las guías de postura muestran el mástil de costado (bien y mal) y
 * la zona de la mano derecha.
 */
export function HandsCard({ spec, width }: { spec: HandsSpec; width: number }) {
  if (spec.kind === 'guide') return spec.hand === 'left' ? <LeftHandGuide width={width} /> : <RightHandGuide width={width} />;
  return <FingerBoard posture={spec.posture} width={width} />;
}

function FingerBoard({ posture, width }: { posture: HandPosture; width: number }) {
  const { t } = useTranslation();
  const leftHanded = useSettings((s) => s.hand === 'left');
  const [front, setFront] = useState(false);
  const [visible, setVisible] = useState(99);
  const [stepOn, setStepOn] = useState(-1);
  const [ringing, setRinging] = useState<number[]>([]);
  const [lit, setLit] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const handle = useRef<SequenceHandle | null>(null);

  // Diestro, como lo ve: la cejuela a la izquierda. Zurdo o de frente: al revés.
  const flip = leftHanded !== front;
  const X = (x: number) => (flip ? W - x : x);
  const fretW = (END_X - NUT_X) / posture.count;
  const fretX = (fret: number) => NUT_X + (fret - posture.first + 1) * fretW;
  // El dedo va pegado al traste (el metal), no en el medio de la casilla.
  const dotX = (fret: number) => fretX(fret) - fretW * 0.32;

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    handle.current?.stop();
    handle.current = null;
    setRinging([]);
    setLit(-1);
    setPlaying(false);
  };
  useEffect(() => {
    reset();
    setVisible(99);
    setStepOn(-1);
    return reset;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posture]);
  const later = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));

  const sound = (notes: { midi: number; offsetMs: number }[], level = 0.8) => {
    handle.current = playSequence(
      notes.map((n) => ({ freq: midiToFreq(n.midi + TRANSPOSE), startSec: n.offsetMs / 1000, durSec: 1.8, level })),
      undefined,
      () => {
        handle.current = null;
      },
    );
  };

  const listen = () => {
    if (playing) return reset();
    reset();
    setVisible(99);
    setStepOn(-1);
    setPlaying(true);
    const { events, totalMs } = listenPlan(posture, OPEN_MIDI);
    // Todo el ejemplo en una sola secuencia (el motor toca un ejemplo a la vez).
    sound(events.flatMap((e) => e.notes.map((n) => ({ midi: n.midi, offsetMs: e.atMs + n.offsetMs }))));
    // El motor arranca 0,15 s después de programar: el dibujo espera lo mismo.
    for (const e of events) later(e.atMs + 150, () => {
      setRinging(e.strings);
      setLit(e.dot);
    });
    later(totalMs + 150, reset);
  };

  const stepByStep = () => {
    reset();
    setVisible(0);
    posture.steps.forEach((s, k) => {
      later(1100 * k + 250, () => {
        setStepOn(k);
        setVisible(k + 1);
        if (s.kind === 'finger') {
          const d = posture.dots[s.dot];
          setLit(s.dot);
          setRinging([d.string]);
          sound([{ midi: OPEN_MIDI[d.string] + d.fret, offsetMs: 0 }], 0.7);
        } else {
          setLit(-1);
          setRinging(s.kind === 'barre' ? range(s.from, s.to) : s.kind === 'open' ? s.strings : []);
        }
      });
    });
    later(1100 * posture.steps.length + 400, () => {
      setRinging([]);
      setLit(-1);
      setStepOn(-1);
    });
  };

  const fingers = [...new Set<number>([...posture.dots.map((d) => d.finger), ...(posture.barre ? [1] : [])])].sort();
  const stepText = (k: number) => {
    const s = posture.steps[k];
    if (s.kind === 'barre') return t('ui.hands.step.barre', { fret: s.fret, from: STRING_NUMBER[s.from], to: STRING_NUMBER[s.to] });
    if (s.kind === 'finger') {
      const d = posture.dots[s.dot];
      return t('ui.hands.step.finger', { finger: d.finger, name: t(`ui.hands.finger.${d.finger}`), fret: d.fret, string: STRING_NUMBER[d.string] });
    }
    const list = s.strings.map((i) => STRING_NUMBER[i]).join(', ');
    return t(s.kind === 'open' ? 'ui.hands.step.open' : 'ui.hands.step.mute', { strings: list });
  };
  const inlays = [3, 5, 7, 9].filter((f) => f >= posture.first && f < posture.first + posture.count);
  const barreOn = posture.barre && stepOfBarre(posture) < visible;
  const h = Math.min(width * (H / W), 260);

  return (
    <View style={{ gap: 12 }} testID="hands-card">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }} accessibilityRole="radiogroup">
        {[false, true].map((f) => (
          <Pressable
            key={String(f)}
            accessibilityRole="radio"
            accessibilityState={{ selected: front === f }}
            onPress={() => setFront(f)}
            style={{ minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 22, backgroundColor: front === f ? colors.ink : colors.raised }}
          >
            <Text style={{ fontFamily: fonts.extrabold, color: front === f ? colors.bg : colors.ink }}>{t(f ? 'ui.hands.front' : 'ui.hands.pov')}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={{ color: colors.muted, fontSize: 14 }}>{t(front ? 'ui.hands.frontHint' : 'ui.hands.povHint')}</Text>

      <View style={{ width, height: h }} accessible accessibilityLabel={posture.steps.map((_, k) => stepText(k)).join(' ')}>
        <Svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
          {/* Madera, cejuela o primer traste mostrado */}
          <Rect x={Math.min(X(NUT_X), X(END_X))} y={TOP - 14} width={END_X - NUT_X} height={GAP * LAST + 28} rx={6} fill={colors.wood} />
          {inlays.map((f) => (
            <Circle key={f} cx={X(fretX(f) - fretW / 2)} cy={TOP + (GAP * LAST) / 2} r={5} fill={colors.line} />
          ))}
          {Array.from({ length: posture.count + 1 }, (_, k) => {
            const nut = k === 0 && posture.first === 1;
            return <Line key={k} x1={X(NUT_X + k * fretW)} y1={TOP - 14} x2={X(NUT_X + k * fretW)} y2={TOP + GAP * LAST + 14} stroke={nut ? colors.ink : colors.muted} strokeWidth={nut ? 6 : 2} />;
          })}
          {Array.from({ length: posture.count }, (_, k) => (
            <SvgText key={k} x={X(NUT_X + (k + 0.5) * fretW)} y={H - 8} fontSize={13} fill={colors.muted} textAnchor="middle" fontFamily={fonts.black}>
              {posture.first + k}
            </SvgText>
          ))}
          {/* Cuerdas: grosor proporcional; la que suena se ilumina */}
          {OPEN_MIDI.map((_, s) => {
            const on = ringing.includes(s);
            return <Line key={s} x1={X(NUT_X)} x2={X(END_X)} y1={yOf(s)} y2={yOf(s)} stroke={on ? colors.gold : colors.ink} strokeOpacity={on ? 1 : 0.7} strokeWidth={(on ? 1.4 : 0) + 3 - (s * 1.9) / LAST} />;
          })}
          {/* Nombre de cada cuerda y O / X */}
          {OPEN_MIDI.map((_, s) => (
            <G key={`m${s}`}>
              <SvgText x={X(14)} y={yOf(s) + 5} fontSize={13} fill={colors.ink} textAnchor="middle" fontFamily={fonts.black}>
                {STRING_NAME[s]}
              </SvgText>
              {posture.open.includes(s) ? <Circle cx={X(40)} cy={yOf(s)} r={7} fill={ringing.includes(s) ? colors.gold : 'none'} stroke={colors.ink} strokeWidth={2} /> : null}
              {posture.muted.includes(s) ? (
                <G stroke={colors.accentInk} strokeWidth={2.6} strokeLinecap="round">
                  <Line x1={X(34)} y1={yOf(s) - 6} x2={X(46)} y2={yOf(s) + 6} />
                  <Line x1={X(46)} y1={yOf(s) - 6} x2={X(34)} y2={yOf(s) + 6} />
                </G>
              ) : null}
            </G>
          ))}
          {/* Pulgar: detrás del mástil, a la altura del dedo 2 */}
          <Circle cx={X(dotX(posture.thumbFret))} cy={THUMB_Y} r={10} fill={colors.bg} fillOpacity={0.55} stroke={colors.ink} strokeWidth={1.6} strokeDasharray="3 3" />
          <SvgText x={X(dotX(posture.thumbFret))} y={THUMB_Y + 4} fontSize={11} fill={colors.ink} textAnchor="middle" fontFamily={fonts.black}>
            T
          </SvgText>
          {/* Cejilla */}
          {posture.barre && barreOn ? (
            <G>
              <Rect x={X(dotX(posture.barre.fret)) - 9} y={yOf(posture.barre.from) - 10} width={18} height={yOf(posture.barre.to) - yOf(posture.barre.from) + 20} rx={9} fill={FINGER_COLOR[1]} />
              <SvgText x={X(dotX(posture.barre.fret))} y={yOf(posture.barre.from) - 14} fontSize={12} fill={colors.ink} textAnchor="middle" fontFamily={fonts.black}>
                1
              </SvgText>
            </G>
          ) : null}
          {/* Dedos */}
          {posture.dots.map((d, k) =>
            stepOfDot(posture, k) < visible ? (
              <G key={k}>
                {lit === k ? <Circle cx={X(dotX(d.fret))} cy={yOf(d.string)} r={15} fill={FINGER_COLOR[d.finger]} fillOpacity={0.35} /> : null}
                <Circle cx={X(dotX(d.fret))} cy={yOf(d.string)} r={10.5} fill={FINGER_COLOR[d.finger]} stroke={colors.bg} strokeWidth={2} />
                <SvgText x={X(dotX(d.fret))} y={yOf(d.string) + 4.5} fontSize={12.5} fill={colors.night} textAnchor="middle" fontFamily={fonts.black}>
                  {d.finger}
                </SvgText>
              </G>
            ) : null,
          )}
        </Svg>
      </View>

      {/* Leyenda: el color de cada dedo que se usa */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {fingers.map((f) => (
          <Chip key={f} dot={FINGER_COLOR[f]} label={`${f} · ${t(`ui.hands.finger.${f}`)}`} />
        ))}
        <Chip ring label={t('ui.hands.thumb')} />
        {posture.open.length ? <Chip label={`O · ${t('ui.hands.open')}`} /> : null}
        {posture.muted.length ? <Chip label={`X · ${t('ui.hands.muted')}`} /> : null}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Button style={{ flexGrow: 1 }} variant="teal" label={t(playing ? 'ui.hands.stop' : 'ui.hands.listen')} onPress={listen} testID="hands-listen" />
        <Button style={{ flexGrow: 1 }} variant="secondary" label={t('ui.hands.steps')} onPress={stepByStep} testID="hands-steps" />
      </View>

      <View style={{ gap: 6 }}>
        {posture.steps.map((s, k) => {
          const finger = s.kind === 'finger' ? posture.dots[s.dot].finger : s.kind === 'barre' ? 1 : 0;
          return (
            <View key={k} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 8, borderRadius: radius.md, backgroundColor: stepOn === k ? colors.raised : 'transparent', borderWidth: 1, borderColor: stepOn === k ? colors.gold : colors.line }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: finger ? FINGER_COLOR[finger] : colors.line }}>
                <Text style={{ fontFamily: fonts.black, color: finger ? colors.night : colors.ink, fontSize: 13 }}>{finger || (s.kind === 'mute' ? 'X' : 'O')}</Text>
              </View>
              <Text style={{ flex: 1, fontSize: 15, lineHeight: 21, color: colors.ink }}>{stepText(k)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function Chip({ label, dot, ring }: { label: string; dot?: string; ring?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14, backgroundColor: colors.raised }}>
      {dot ? <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: dot }} /> : null}
      {ring ? <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.ink }} /> : null}
      <Text style={{ fontSize: 13, fontFamily: fonts.bold, color: colors.ink }}>{label}</Text>
    </View>
  );
}

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, k) => a + k);

// ───────────── Guía de la mano izquierda: el mástil de costado ─────────────

const NECK = 'M70 92 H230 Q236 92 236 100 Q236 176 150 182 Q64 176 64 100 Q64 92 70 92 Z';
const SKIN_FILL = '#E8A87C';

function NeckBase() {
  return (
    <>
      <Path d={NECK} fill={colors.wood} stroke={colors.line} strokeWidth={2} />
      <Rect x={70} y={84} width={160} height={10} rx={3} fill="#6B4A33" />
      {OPEN_MIDI.map((_, i) => (
        <Circle key={i} cx={90 + (i * 120) / LAST} cy={81} r={4.2 - (i * 2.2) / LAST} fill={colors.muted} />
      ))}
    </>
  );
}

function LeftHandGuide({ width }: { width: number }) {
  const { t } = useTranslation();
  const two = width >= 520;
  const w = two ? (width - 12) / 2 : width;
  const box = (good: boolean) => (
    <View key={String(good)} style={{ width: w, gap: 6, padding: 10, borderRadius: radius.lg, borderWidth: 1.5, borderColor: good ? colors.teal : colors.accentInk }}>
      <View style={{ width: w - 20, height: (w - 20) * 0.7 }} accessible accessibilityLabel={t(good ? 'ui.hands.guide.goodA11y' : 'ui.hands.guide.badA11y')}>
        <Svg viewBox="0 0 300 210" width="100%" height="100%">
          <NeckBase />
          {good ? (
            <>
              {/* Dedo en garra: baja vertical y pisa con la punta */}
              <Path d="M40 18 C 70 8, 118 10, 132 44 C 138 58, 136 70, 134 77" fill="none" stroke={SKIN_FILL} strokeWidth={20} strokeLinecap="round" />
              <Circle cx={134} cy={79} r={5} fill={colors.teal} />
              {/* Pulgar detrás, a media altura */}
              <Ellipse cx={152} cy={194} rx={26} ry={13} fill={SKIN_FILL} />
              <SvgText x={152} y={199} fontSize={15} fill={colors.night} textAnchor="middle" fontFamily={fonts.black}>T</SvgText>
            </>
          ) : (
            <>
              {/* Dedo acostado: roza la cuerda de al lado */}
              <Path d="M28 52 C 70 50, 110 64, 168 74" fill="none" stroke={SKIN_FILL} strokeWidth={20} strokeLinecap="round" />
              <Circle cx={162} cy={81} r={9} fill="none" stroke={colors.accentInk} strokeWidth={3} />
              {/* Pulgar que asoma por arriba */}
              <Ellipse cx={62} cy={66} rx={13} ry={22} fill={SKIN_FILL} stroke={colors.accentInk} strokeWidth={2.5} />
              <SvgText x={62} y={71} fontSize={15} fill={colors.night} textAnchor="middle" fontFamily={fonts.black}>T</SvgText>
            </>
          )}
        </Svg>
      </View>
      <Text style={{ fontFamily: fonts.black, color: good ? colors.tealInk : colors.accentInk }}>{t(good ? 'ui.hands.guide.good' : 'ui.hands.guide.bad')}</Text>
      <Text style={{ fontSize: 15, lineHeight: 21, color: colors.ink }}>{t(good ? 'ui.hands.guide.goodBody' : 'ui.hands.guide.badBody')}</Text>
    </View>
  );
  return <View style={{ flexDirection: two ? 'row' : 'column', gap: 12 }} testID="hands-guide-left">{[true, false].map(box)}</View>;
}

// ───────────── Guía de la mano derecha: zona de toque y con qué se toca ─────────────

type RightKind = 'fingers' | 'pick' | 'bass';
/** Criolla: p-i-m-a con las yemas. Eléctrica: púa. Bajo: índice y medio alternados, pulgar en la pastilla. */
const RIGHT_KIND: RightKind = IS_NYLON ? 'fingers' : IS_GUITAR ? 'pick' : 'bass';

const FINGER_ROLES = [
  { key: 'p', strings: [0, 1, 2], color: colors.teal },
  { key: 'i', strings: [3], color: FINGER_COLOR[1] },
  { key: 'm', strings: [4], color: colors.accent },
  { key: 'a', strings: [5], color: colors.gold },
] as const;

function RightHandGuide({ width }: { width: number }) {
  const { t } = useTranslation();
  const leftHanded = useSettings((s) => s.hand === 'left');
  const X = (x: number) => (leftHanded ? 400 - x : x);
  const sy = (i: number) => 78 + (i * 85) / LAST;
  const acoustic = RIGHT_KIND === 'fingers';
  const roles: { key: string; color: string; text: string }[] =
    RIGHT_KIND === 'fingers'
      ? FINGER_ROLES.map((r) => ({ key: r.key, color: r.color, text: t(`ui.hands.guide.role.${r.key}`) }))
      : RIGHT_KIND === 'pick'
        ? [1, 2, 3].map((k) => ({ key: String(k), color: colors.gold, text: t(`ui.hands.guide.pick.${k}`) }))
        : [
            { key: 'i', color: FINGER_COLOR[1], text: t('ui.hands.guide.bass.i') },
            { key: 'm', color: colors.accent, text: t('ui.hands.guide.bass.m') },
            { key: 'T', color: colors.teal, text: t('ui.hands.guide.bass.thumb') },
          ];
  const zoneX = acoustic ? 182 : RIGHT_KIND === 'pick' ? 196 : 212;
  return (
    <View style={{ gap: 10 }} testID="hands-guide-right">
      <View style={{ width, height: Math.min(width * 0.62, 280) }} accessible accessibilityLabel={t(`ui.hands.guide.rightA11y.${RIGHT_KIND}`)}>
        <Svg viewBox="0 0 400 250" width="100%" height="100%">
          <G transform={leftHanded ? 'translate(400,0) scale(-1,1)' : undefined}>
            <Path d="M8 40 C 60 10, 120 20, 150 40 C 180 60, 230 60, 260 40 C 300 14, 392 22, 392 130 C 392 238, 300 246, 260 220 C 230 200, 180 200, 150 220 C 120 240, 60 250, 8 220 Z" fill={acoustic ? '#D9A35F' : '#B4532A'} />
            {acoustic ? (
              <>
                <Circle cx={150} cy={130} r={50} fill="#2A1B0E" />
                <Circle cx={150} cy={130} r={58} fill="none" stroke="#8E5A33" strokeWidth={3} />
              </>
            ) : (
              // Pastillas: dos en la eléctrica; en el bajo, una donde apoya el pulgar.
              (RIGHT_KIND === 'pick' ? [150, 282] : [180]).map((x) => <Rect key={x} x={x} y={62} width={34} height={136} rx={8} fill="#1D1B2E" stroke="#C9C4BA" strokeWidth={2} />)
            )}
            <Rect x={330} y={68} width={22} height={124} rx={6} fill={acoustic ? '#4A2E17' : '#C9C4BA'} />
            {/* Zona de toque */}
            <Rect x={zoneX} y={64} width={RIGHT_KIND === 'bass' ? 70 : 84} height={132} rx={14} fill={colors.gold} fillOpacity={0.28} stroke={colors.gold} strokeWidth={2} strokeDasharray="6 5" />
            {OPEN_MIDI.map((_, i) => (
              <Line key={i} x1={0} x2={340} y1={sy(i)} y2={sy(i)} stroke={i < N / 2 ? '#C9C4BA' : '#F5F1E8'} strokeWidth={2.6 - (i * 1.4) / LAST} />
            ))}
            {RIGHT_KIND === 'fingers' ? (
              <>
                <Rect x={212} y={sy(0) - 9} width={32} height={sy(2) - sy(0) + 18} rx={16} fill={colors.teal} />
                {[3, 4, 5].map((i) => (
                  <Circle key={i} cx={254} cy={sy(i)} r={10} fill={FINGER_ROLES[i - 2].color} />
                ))}
              </>
            ) : RIGHT_KIND === 'pick' ? (
              // Púa con la punta hacia las cuerdas, asomando apenas entre el pulgar y el índice.
              <>
                <Path d="M218 98 Q238 90 258 98 Q262 116 238 142 Q214 116 218 98 Z" fill={colors.gold} stroke="#9A3412" strokeWidth={2} />
                <Ellipse cx={238} cy={104} rx={24} ry={12} fill="#E8A87C" />
              </>
            ) : (
              <>
                {/* El pulgar descansa en la pastilla; i y m tocan cerca de ella */}
                <Ellipse cx={197} cy={sy(0) - 20} rx={16} ry={11} fill="#E8A87C" />
                <Circle cx={247} cy={sy(1)} r={11} fill={FINGER_COLOR[1]} />
                <Circle cx={247} cy={sy(2)} r={11} fill={colors.accent} />
              </>
            )}
          </G>
          {/* Letras y números, sin espejar */}
          {RIGHT_KIND === 'fingers' ? (
            <>
              <SvgText x={X(228)} y={sy(1) + 5} fontSize={16} fill={colors.night} textAnchor="middle" fontFamily={fonts.black}>p</SvgText>
              {[3, 4, 5].map((i) => (
                <SvgText key={i} x={X(254)} y={sy(i) + 4.5} fontSize={13} fill={colors.night} textAnchor="middle" fontFamily={fonts.black}>
                  {FINGER_ROLES[i - 2].key}
                </SvgText>
              ))}
            </>
          ) : RIGHT_KIND === 'bass' ? (
            <>
              <SvgText x={X(197)} y={sy(0) - 16} fontSize={12} fill={colors.night} textAnchor="middle" fontFamily={fonts.black}>T</SvgText>
              <SvgText x={X(247)} y={sy(1) + 4.5} fontSize={13} fill={colors.night} textAnchor="middle" fontFamily={fonts.black}>i</SvgText>
              <SvgText x={X(247)} y={sy(2) + 4.5} fontSize={13} fill={colors.night} textAnchor="middle" fontFamily={fonts.black}>m</SvgText>
            </>
          ) : null}
          {OPEN_MIDI.map((_, i) => (
            <SvgText key={`n${i}`} x={X(372)} y={sy(i) + 4} fontSize={11} fill={colors.night} textAnchor="middle" fontFamily={fonts.black}>
              {STRING_NUMBER[i]}
            </SvgText>
          ))}
          <SvgText x={X(zoneX + 40)} y={56} fontSize={13} fill={colors.ink} textAnchor="middle" fontFamily={fonts.black}>
            {t('ui.hands.guide.zone')}
          </SvgText>
        </Svg>
      </View>
      <Text style={{ fontSize: 15, lineHeight: 21, color: colors.ink }}>{t(`ui.hands.guide.rightBody.${RIGHT_KIND}`)}</Text>
      {roles.map((r) => (
        <View key={r.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: r.color }}>
            <Text style={{ fontFamily: fonts.black, color: colors.night }}>{r.key}</Text>
          </View>
          <Text style={{ flex: 1, fontSize: 15, color: colors.ink }}>{r.text}</Text>
        </View>
      ))}
    </View>
  );
}
