import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../Text';
import { useTranslation } from 'react-i18next';
import { nowMs, startMetronome, type MetronomeHandle } from '../../audio/engine';
import { driftAdvice, expectedTimes, scoreTempoTrainer, starsFor } from '../../music/scoring';
import { Button, Muted, Stars } from '../ui';
import { colors, fonts, radius } from '../../theme';
import type { TempoTrainerExercise as TempoEx } from '../../content/types';

const COUNT_IN = 4;

/**
 * Marcar el pulso en pantalla. Primero con clic; después el clic se calla y el
 * alumno sigue solo. Al final dice si apuró, se atrasó o mantuvo el pulso.
 */
export function TempoTrainerExercise({ exercise, onDone, mastery }: { exercise: TempoEx; onDone: (stars: number) => void; mastery: number }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [beat, setBeat] = useState(-COUNT_IN - 1);
  const [result, setResult] = useState<{ hits: number; total: number; stars: number; advice: 'early' | 'late' | 'steady' } | null>(null);
  const metro = useRef<MetronomeHandle | null>(null);
  const taps = useRef<number[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepMs = 60000 / exercise.bpm;

  const clearAll = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (ticker.current) clearInterval(ticker.current);
    ticker.current = null;
  };

  useEffect(
    () => () => {
      clearAll();
      metro.current?.stop();
    },
    [],
  );

  const finish = () => {
    clearAll();
    const h = metro.current;
    if (!h) return;
    const expected = expectedTimes(exercise.beats, exercise.bpm, h.startMs);
    const r = scoreTempoTrainer(expected, taps.current, exercise.audibleBeats);
    setResult({ hits: r.hits, total: r.total, stars: starsFor(r.accuracy, mastery), advice: driftAdvice(r.driftMs) });
    setPhase('done');
  };

  const start = () => {
    clearAll();
    metro.current?.stop();
    taps.current = [];
    setResult(null);
    metro.current = startMetronome(exercise.bpm, exercise.beats, COUNT_IN, 4, exercise.audibleBeats);
    const startMs = metro.current.startMs;
    setPhase('running');
    // Indicador visual del pulso (solo mientras hay clic; después, a ciegas).
    ticker.current = setInterval(() => setBeat(Math.floor((nowMs() - startMs) / stepMs)), 50);
    timers.current.push(setTimeout(finish, startMs - nowMs() + exercise.beats * stepMs + 400));
  };

  const tap = () => {
    if (phase === 'running') taps.current.push(nowMs());
  };

  const counting = beat < 0;
  const silent = beat >= exercise.audibleBeats;
  const beatInBar = ((beat % 4) + 4) % 4;
  const status = phase !== 'running' ? '' : counting ? t('ui.exercise.countIn', { n: COUNT_IN + beat + 1 }) : silent ? t('ui.exercise.tempoSilent') : t('ui.exercise.tempoWithClick');

  return (
    <View style={{ gap: 14 }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 30 }}>{t(exercise.promptKey)}</Text>
      <Muted>
        {t('ui.exercise.tempoHint', { n: exercise.audibleBeats })} · {t('ui.exercise.tempo', { bpm: exercise.bpm })}
      </Muted>
      <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {[0, 1, 2, 3].map((i) => {
          const on = phase === 'running' && !silent && beatInBar === i;
          return <View key={i} style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: on ? (i === 0 ? colors.accent : colors.gold) : colors.raised }} />;
        })}
      </View>
      <Text accessibilityLiveRegion="polite" style={{ textAlign: 'center', fontSize: 15, fontWeight: '900', color: silent ? colors.teal : colors.muted, minHeight: 22 }}>
        {status}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('ui.exercise.tempoTap')}
        onPressIn={tap}
        style={{ height: 160, borderRadius: radius.xxl, backgroundColor: phase === 'running' ? colors.accent : colors.raised, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ fontFamily: fonts.displayBold, fontSize: 32, color: phase === 'running' ? colors.onAccent : colors.muted }}>{t('ui.exercise.tempoTap')}</Text>
      </Pressable>
      {result ? (
        <View style={{ alignItems: 'center', gap: 8 }} accessibilityLiveRegion="polite">
          <Stars count={result.stars} size={36} />
          <Text style={{ fontWeight: '800' }}>{t('ui.exercise.result', { hits: result.hits, total: result.total })}</Text>
          <Text style={{ fontWeight: '700', color: result.advice === 'steady' ? colors.teal : colors.accentInk, textAlign: 'center' }}>{t(`ui.exercise.drift.${result.advice}`)}</Text>
        </View>
      ) : null}
      {phase === 'done' && result ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button style={{ flex: 1 }} variant="secondary" label={t('ui.exercise.retry')} onPress={start} />
          <Button style={{ flex: 1 }} label={t('ui.common.next')} onPress={() => onDone(result.stars)} />
        </View>
      ) : (
        <Button label={t('ui.exercise.tapStart')} disabled={phase === 'running'} onPress={start} />
      )}
    </View>
  );
}
