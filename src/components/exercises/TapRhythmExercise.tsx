import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { nowMs, startMetronome, type MetronomeHandle } from '../../audio/engine';
import { expectedTimes, scoreTiming, starsFor, TAP_TOLERANCE_MS } from '../../music/scoring';
import { Button, Stars } from '../ui';
import { colors, radius } from '../../theme';
import type { TapRhythmExercise as TapEx } from '../../content/types';

/**
 * «Caminata de dedos»: tocar dos botones alternados al ritmo del metrónomo.
 * Un toque cuenta si cae cerca de un pulso y es el botón que corresponde a ese pulso.
 */
export function TapRhythmExercise({ exercise, onDone, mastery }: { exercise: TapEx; onDone: (stars: number) => void; mastery: number }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [result, setResult] = useState<{ hits: number; total: number; stars: number } | null>(null);
  const metro = useRef<MetronomeHandle | null>(null);
  const taps = useRef<{ time: number; pad: number }[]>([]);

  useEffect(() => () => metro.current?.stop(), []);

  const start = () => {
    taps.current = [];
    setResult(null);
    metro.current = startMetronome(exercise.bpm, exercise.beats);
    setPhase('running');
    const totalMs = metro.current.startMs - nowMs() + (exercise.beats * 60000) / exercise.bpm + 400;
    setTimeout(finish, totalMs);
  };

  const finish = () => {
    const h = metro.current;
    if (!h) return;
    const expected = expectedTimes(exercise.beats, exercise.bpm, h.startMs);
    const step = 60000 / exercise.bpm;
    const valid = taps.current
      .filter(({ time, pad }) => {
        const beat = Math.round((time - h.startMs) / step);
        return beat >= 0 && beat < exercise.beats && beat % exercise.pads.length === pad;
      })
      .map((x) => x.time);
    const r = scoreTiming(expected, valid, TAP_TOLERANCE_MS);
    setResult({ hits: r.hits, total: r.total, stars: starsFor(r.accuracy, mastery) });
    setPhase('done');
  };

  const tap = (pad: number) => {
    if (phase === 'running') taps.current.push({ time: nowMs(), pad });
  };

  const padColors = [colors.fingerI, colors.fingerM];

  return (
    <View style={{ gap: 14 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color: colors.ink }}>{t(exercise.promptKey)}</Text>
      <Text style={{ color: colors.muted }}>
        {t('ui.exercise.tapHint')} · {t('ui.exercise.tempo', { bpm: exercise.bpm })}
      </Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {exercise.pads.map((p, i) => (
          <Pressable
            key={p}
            accessibilityRole="button"
            accessibilityLabel={p}
            onPressIn={() => tap(i)}
            style={{ flex: 1, height: 140, borderRadius: radius.xl, backgroundColor: padColors[i % 2], alignItems: 'center', justifyContent: 'center', opacity: phase === 'running' ? 1 : 0.6 }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 40, fontWeight: '800' }}>{p}</Text>
          </Pressable>
        ))}
      </View>
      {result ? (
        <View style={{ alignItems: 'center', gap: 8 }} accessibilityLiveRegion="polite">
          <Stars count={result.stars} size={36} />
          <Text style={{ fontWeight: '700', color: colors.ink }}>{t('ui.exercise.result', { hits: result.hits, total: result.total })}</Text>
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
