import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../src/components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Button, Card, H1, H2, Muted } from '../../src/components/ui';
import { listenPitch, requestMic, type Listener } from '../../src/audio/mic';
import { startMetronome, type MetronomeHandle } from '../../src/audio/engine';
import { STRINGS, centsOff, noteName, type Locale } from '../../src/music/notes';
import { useSettings } from '../../src/state/settings';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { colors, fonts, radius } from '../../src/theme';

/** Herramientas sueltas. El afinador y el metrónomo son gratis para siempre. */
export default function Practice() {
  const { t } = useTranslation();
  const tools = [
    { k: 'fretboard', color: colors.accentInk, d: 'M3 7h18M3 12h18M3 17h18M8 4v16M14 4v16' },
    { k: 'rhythm', color: colors.gold, d: 'M9 18V5l10-2v13M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' },
    { k: 'jam', color: colors.teal, d: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' },
  ] as const;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        <H1>{t('ui.practice.title')}</H1>
        <Tuner />
        <Metronome />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {tools.map((tool) => (
            <View key={tool.k} style={{ flex: 1, minHeight: 88, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8 }}>
              <Svg width={22} height={22} viewBox="0 0 24 24">
                <Path d={tool.d} stroke={tool.color} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={{ fontSize: 13, fontWeight: '800', textAlign: 'center' }}>{t(`ui.practice.${tool.k}`)}</Text>
            </View>
          ))}
        </View>
        <Muted>{t('ui.common.comingSoon')}</Muted>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Aguja de −50 a +50 cents sobre un arco de 160°. */
function Gauge({ cents, active, inTune }: { cents: number; active: boolean; inTune: boolean }) {
  const clamped = Math.max(-50, Math.min(50, cents));
  const angle = ((clamped / 50) * 80 * Math.PI) / 180;
  const nx = 150 + Math.sin(angle) * 104;
  const ny = 150 - Math.cos(angle) * 104;
  return (
    <Svg width="100%" height="100%" viewBox="0 0 300 168">
      <Path d="M30 150 A 120 120 0 0 1 270 150" fill="none" stroke={colors.raised} strokeWidth={18} strokeLinecap="round" />
      <Path d="M128 32 A 120 120 0 0 1 172 32" fill="none" stroke={inTune && active ? colors.teal : colors.line} strokeWidth={18} strokeLinecap="round" />
      {active ? <Path d={`M150 150 L ${nx} ${ny}`} stroke={inTune ? colors.teal : colors.accent} strokeWidth={4} strokeLinecap="round" /> : null}
      <Circle cx={150} cy={150} r={10} fill={colors.ink} />
      <SvgText x={40} y={132} fontSize={12} fontFamily={fonts.extrabold} fill={colors.muted}>−50</SvgText>
      <SvgText x={244} y={132} fontSize={12} fontFamily={fonts.extrabold} fill={colors.muted}>+50</SvgText>
    </Svg>
  );
}

function Tuner() {
  const { t, i18n } = useTranslation();
  const notation = useSettings((s) => s.notation);
  const [on, setOn] = useState(false);
  const [freq, setFreq] = useState<number | null>(null);
  const listener = useRef<Listener | null>(null);
  useEffect(() => () => listener.current?.stop(), []);

  // La cuerda más cercana a la frecuencia detectada.
  const nearest = freq ? STRINGS.reduce((a, b) => (Math.abs(centsOff(freq, b.openMidi)) < Math.abs(centsOff(freq, a.openMidi)) ? b : a)) : null;
  const cents = freq && nearest ? centsOff(freq, nearest.openMidi) : 0;
  const inTune = Math.abs(cents) <= 5;
  const status = inTune ? t('ui.practice.inTune') : cents < 0 ? t('ui.practice.tuneUp') : t('ui.practice.tuneDown');
  const statusColor = inTune ? colors.teal : colors.accentInk;

  const toggle = async () => {
    if (on) {
      listener.current?.stop();
      listener.current = null;
      setOn(false);
      setFreq(null);
      return;
    }
    if ((await requestMic()) !== 'ok') return;
    listener.current = await listenPitch(setFreq);
    setOn(Boolean(listener.current));
  };

  return (
    <Card style={{ alignItems: 'center', gap: 8, borderRadius: radius.xxl }}>
      <View style={{ alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: '900' }}>{t('ui.practice.tuner')}</Text>
        {on ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.teal }} />
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.teal }}>{t('ui.exercise.listening')}</Text>
          </View>
        ) : null}
      </View>
      <View style={{ width: '100%', maxWidth: 320, aspectRatio: 300 / 168 }}>
        <Gauge cents={cents} active={Boolean(freq)} inTune={inTune} />
      </View>
      <View accessibilityLiveRegion="polite" style={{ alignItems: 'center', gap: 6, marginTop: -18 }}>
        <Text style={{ fontFamily: fonts.displayBold, fontSize: 56, lineHeight: 62, color: freq ? statusColor : colors.muted }}>
          {nearest ? noteName(nearest.openMidi, i18n.language as Locale, notation) : '–'}
        </Text>
        <Text style={{ fontSize: 15, fontWeight: '800', color: colors.muted }}>
          {freq ? `${freq.toFixed(1)} Hz · ${cents > 0 ? '+' : ''}${Math.round(cents)} ¢` : t('ui.practice.tunerHint')}
        </Text>
        {freq ? (
          <View style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, backgroundColor: inTune ? colors.tealSoft : colors.accentSoft }}>
            <Text style={{ fontWeight: '900', fontSize: 15, color: statusColor }}>{status}</Text>
          </View>
        ) : null}
      </View>
      <View style={{ alignSelf: 'stretch', flexDirection: 'row', gap: 8, marginTop: 4 }}>
        {[...STRINGS].map((s) => {
          const hit = nearest?.id === s.id;
          return (
            <View key={s.id} style={{ flex: 1, minHeight: 48, borderRadius: radius.md, borderWidth: 2, borderColor: hit ? colors.teal : colors.line, backgroundColor: hit ? colors.tealSoft : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: hit ? colors.teal : colors.ink }}>{noteName(s.openMidi, i18n.language as Locale, notation)}</Text>
            </View>
          );
        })}
      </View>
      <Button style={{ alignSelf: 'stretch' }} variant={on ? 'secondary' : 'primary'} label={on ? t('ui.practice.stop') : t('ui.practice.start')} onPress={() => void toggle()} />
    </Card>
  );
}

function Metronome() {
  const { t } = useTranslation();
  const [bpm, setBpm] = useState(80);
  const handle = useRef<MetronomeHandle | null>(null);
  const [running, setRunning] = useState(false);
  useEffect(() => () => handle.current?.stop(), []);

  const toggle = () => {
    if (running) {
      handle.current?.stop();
      setRunning(false);
    } else {
      // 10 minutos de pulsos programados; se cortan al detener.
      handle.current = startMetronome(bpm, bpm * 10, 0);
      setRunning(true);
    }
  };

  const step = (label: string, d: string, delta: number) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: running }}
      disabled={running}
      onPress={() => setBpm((b) => Math.max(40, Math.min(200, b + delta)))}
      style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center', opacity: running ? 0.5 : 1 }}
    >
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Path d={d} stroke={colors.ink} strokeWidth={2.8} strokeLinecap="round" />
      </Svg>
    </Pressable>
  );

  return (
    <Card>
      <H2 style={{ fontSize: 18 }}>{t('ui.practice.metronome')}</H2>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {step(t('ui.practice.tempoDown'), 'M5 12h14', -5)}
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 44, lineHeight: 50 }}>{bpm}</Text>
          <Text style={{ fontSize: 15, fontWeight: '800', color: colors.muted }}>{t('ui.practice.bpmUnit')}</Text>
        </View>
        {step(t('ui.practice.tempoUp'), 'M5 12h14M12 5v14', 5)}
      </View>
      <Button variant={running ? 'secondary' : 'primary'} label={running ? t('ui.practice.stop') : t('ui.practice.start')} onPress={toggle} />
    </Card>
  );
}
