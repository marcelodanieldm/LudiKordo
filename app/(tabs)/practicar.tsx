import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Button, Card, H1, Muted } from '../../src/components/ui';
import { listenPitch, requestMic, type Listener } from '../../src/audio/mic';
import { startMetronome, type MetronomeHandle } from '../../src/audio/engine';
import { STRINGS, centsOff, noteName, type Locale } from '../../src/music/notes';
import { useSettings } from '../../src/state/settings';
import { colors, radius } from '../../src/theme';

/** Herramientas sueltas. El afinador y el metrónomo son gratis para siempre. */
export default function Practice() {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        <H1>{t('ui.practice.title')}</H1>
        <Tuner />
        <Metronome />
        {(['fretboard', 'rhythm', 'jam'] as const).map((k) => (
          <Card key={k}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.ink }}>{t(`ui.practice.${k}`)}</Text>
            <Muted>{t('ui.common.comingSoon')}</Muted>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
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

  const toggle = async () => {
    if (on) {
      listener.current?.stop();
      listener.current = null;
      setOn(false);
      return;
    }
    if ((await requestMic()) !== 'ok') return;
    listener.current = await listenPitch(setFreq);
    setOn(Boolean(listener.current));
  };

  return (
    <View style={{ backgroundColor: colors.night, borderRadius: radius.xl, padding: 20, gap: 10, alignItems: 'center' }}>
      <Text style={{ color: '#F7B58F', fontWeight: '800', fontSize: 13, textTransform: 'uppercase' }}>{t('ui.practice.tuner')}</Text>
      <Text style={{ color: '#FFFFFF', fontSize: 48, fontWeight: '700' }}>{nearest ? noteName(nearest.openMidi, i18n.language as Locale, notation) : '–'}</Text>
      <Text style={{ color: colors.nightMuted }}>{freq ? `${freq.toFixed(1)} Hz · ${cents > 0 ? '+' : ''}${Math.round(cents)} cents` : t('ui.practice.tunerHint')}</Text>
      <View style={{ alignSelf: 'stretch', height: 10, borderRadius: 5, backgroundColor: '#4A4760' }}>
        {freq ? (
          <View
            style={{
              position: 'absolute',
              left: `${Math.max(0, Math.min(94, 47 + cents))}%`,
              width: '6%',
              height: 10,
              borderRadius: 5,
              backgroundColor: inTune ? colors.good : '#F7B58F',
            }}
          />
        ) : null}
      </View>
      {freq ? (
        <Text style={{ fontWeight: '800', color: inTune ? colors.good : '#F7B58F' }}>
          {inTune ? t('ui.practice.inTune') : cents < 0 ? t('ui.practice.tuneUp') : t('ui.practice.tuneDown')}
        </Text>
      ) : null}
      <Button style={{ alignSelf: 'stretch' }} variant={on ? 'secondary' : 'primary'} label={on ? t('ui.practice.stop') : t('ui.practice.start')} onPress={() => void toggle()} />
    </View>
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

  return (
    <Card>
      <Text style={{ fontSize: 16, fontWeight: '800', color: colors.ink }}>{t('ui.practice.metronome')}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Button style={{ width: 56 }} variant="secondary" label="−" disabled={running} onPress={() => setBpm((b) => Math.max(40, b - 5))} />
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 24, fontWeight: '800', color: colors.ink }}>{t('ui.exercise.tempo', { bpm })}</Text>
        <Button style={{ width: 56 }} variant="secondary" label="+" disabled={running} onPress={() => setBpm((b) => Math.min(200, b + 5))} />
      </View>
      <Button variant={running ? 'secondary' : 'teal'} label={running ? t('ui.practice.stop') : t('ui.practice.start')} onPress={toggle} />
    </Card>
  );
}
