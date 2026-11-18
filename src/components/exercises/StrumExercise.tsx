import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Text } from '../Text';
import { useTranslation } from 'react-i18next';
import { Button, Stars } from '../ui';
import { colors, fonts, radius } from '../../theme';
import { listenAttacks, requestMic, type Listener, type MicStatus } from '../../audio/mic';
import { nowMs, startMetronome, stopActiveSequence, type MetronomeHandle } from '../../audio/engine';
import { EIGHTHS_PER_BAR, eighthAt, strokeTimes } from '../../music/strum';
import { scoreTiming, starsFor } from '../../music/scoring';
import { useProgress } from '../../state/progress';
import type { StrumExercise as StrumEx } from '../../content/types';

type Phase = 'intro' | 'running' | 'result' | 'self';

/** Estrellas de la autoevaluación: completa la lección, pero el dominio pide detección. */
const SELF_CHECK_STARS = 2;
const ARROW = { D: '↓', U: '↑', '-': '·' } as const;

/**
 * Rasgueo con metrónomo. La app escucha cada golpe (sin mirar la altura: todavía
 * no reconoce acordes) y lo compara con el patrón. Las notas del acorde se
 * revisan aparte, de a una, en el ejercicio de arpegio de la misma lección.
 */
export function StrumExercise({
  exercise,
  onDone,
  mastery,
  width,
  allowSelfCheck = true,
}: {
  exercise: StrumEx;
  onDone: (stars: number) => void;
  mastery: number;
  width: number;
  allowSelfCheck?: boolean;
}) {
  const { t } = useTranslation();
  const unlocked = useProgress((s) => s.tempo[exercise.id]);
  const unlockTempo = useProgress((s) => s.unlockTempo);
  const bpm = Math.max(exercise.bpm, unlocked ?? 0);
  const bars = exercise.chords.length;

  const [phase, setPhase] = useState<Phase>('intro');
  const [mic, setMic] = useState<MicStatus>('ok');
  const [pos, setPos] = useState(-1);
  const [result, setResult] = useState<{ hits: number; total: number; stars: number; next?: number } | null>(null);
  const [failures, setFailures] = useState(0);
  const listener = useRef<Listener | null>(null);
  const metro = useRef<MetronomeHandle | null>(null);
  const timers = useRef<{ tick?: ReturnType<typeof setInterval>; end?: ReturnType<typeof setTimeout> }>({});
  const mounted = useRef(true);

  const stopAll = () => {
    if (timers.current.tick) clearInterval(timers.current.tick);
    if (timers.current.end) clearTimeout(timers.current.end);
    timers.current = {};
    listener.current?.stop();
    listener.current = null;
    metro.current?.stop();
    metro.current = null;
  };
  useEffect(
    () => () => {
      mounted.current = false;
      stopAll();
    },
    [],
  );

  const finishWith = (hits: number, total: number) => {
    stopAll();
    if (!mounted.current) return;
    const stars = starsFor(total ? hits / total : 0, mastery);
    let next: number | undefined;
    if (stars === 3 && exercise.tempoSteps) {
      next = exercise.tempoSteps.find((s) => s > bpm);
      if (next) unlockTempo(exercise.id, next);
    }
    setFailures((f) => (stars <= 1 ? f + 1 : 0));
    setResult({ hits, total, stars, next });
    setPos(-1);
    setPhase('result');
  };

  const start = async () => {
    stopActiveSequence();
    const status = await requestMic();
    setMic(status);
    if (status !== 'ok') {
      setPhase('self');
      return;
    }
    setResult(null);
    setPos(-1);
    setPhase('running');
    const attacks: number[] = [];
    metro.current = startMetronome(bpm, bars * 4);
    const startMs = metro.current.startMs;
    listener.current = await listenAttacks((ms) => attacks.push(ms));
    if (!listener.current) {
      stopAll();
      setPhase('self');
      return;
    }
    const expected = strokeTimes(exercise.pattern, bars, bpm, startMs).map((s) => s.timeMs);
    timers.current.tick = setInterval(() => setPos(eighthAt(nowMs(), startMs, bpm)), 60);
    timers.current.end = setTimeout(() => {
      const r = scoreTiming(expected, attacks);
      finishWith(r.hits, r.total);
    }, startMs - nowMs() + bars * 4 * (60000 / bpm) + 800);
  };

  // Dos compases por renglón en teléfono, cuatro en tablet.
  const perRow = width >= 560 ? 4 : 2;
  const barW = (width - 34 - (perRow - 1) * 8) / perRow;
  const cell = Math.min(28, barW / EIGHTHS_PER_BAR);

  return (
    <View style={{ gap: 14 }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 30, color: colors.ink }}>{t(exercise.promptKey)}</Text>
      <Text style={{ color: colors.muted }}>
        {t('ui.exercise.tempo', { bpm })} · {t('ui.exercise.headphones')}
      </Text>

      <View style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.xl, padding: 16, gap: 10 }}>
        <View
          style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
          accessible
          accessibilityRole="image"
          accessibilityLabel={t('ui.exercise.strumLabel', { bars, chords: exercise.chords.join(', ') })}
        >
          {exercise.chords.map((chord, bar) => (
            <View key={bar} style={{ width: barW, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 6, gap: 4 }}>
              <Text style={{ fontFamily: fonts.black, fontSize: 18, color: colors.ink }}>{chord}</Text>
              <View style={{ flexDirection: 'row' }}>
                {exercise.pattern.map((s, k) => {
                  const now = phase === 'running' && pos === bar * EIGHTHS_PER_BAR + k;
                  return (
                    <View key={k} style={{ width: cell, height: cell + 6, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: now ? colors.accent : 'transparent' }}>
                      <Text style={{ fontSize: s === '-' ? 14 : 18, fontWeight: '900', color: now ? colors.onAccent : s === 'D' ? colors.gold : s === 'U' ? colors.teal : colors.muted }}>
                        {ARROW[s]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
        <Text style={{ color: colors.muted, fontSize: 13 }}>{t('ui.exercise.strumLegend')}</Text>

        {phase === 'running' ? <Text style={{ fontSize: 16, fontWeight: '800', color: colors.teal, textAlign: 'center' }}>{pos < 0 ? '…' : t('ui.exercise.listening')}</Text> : null}
        {phase === 'result' && result ? (
          <View style={{ alignItems: 'center', gap: 6 }} accessibilityLiveRegion="polite">
            <Stars count={result.stars} size={36} />
            <Text style={{ fontWeight: '700', color: colors.ink }}>{t('ui.exercise.strumDetected', { hits: result.hits, total: result.total })}</Text>
            {result.next ? <Text style={{ color: colors.tealInk, fontWeight: '700' }}>{t('ui.exercise.nextTempo', { bpm: result.next })}</Text> : null}
          </View>
        ) : null}
        {phase === 'self' ? (
          <Text style={{ color: colors.accentInk, fontWeight: '700', textAlign: 'center' }}>{mic === 'denied' ? t('ui.exercise.micDenied') : t('ui.exercise.micUnavailable')}</Text>
        ) : null}
      </View>

      {phase === 'intro' ? <Button label={t('ui.exercise.tapStart')} onPress={() => void start()} /> : null}
      {phase === 'result' && result ? (
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button style={{ flex: 1 }} variant="secondary" label={t('ui.exercise.retry')} onPress={() => void start()} />
            <Button style={{ flex: 1 }} label={t('ui.common.next')} disabled={result.stars === 0} onPress={() => onDone(result.stars)} />
          </View>
          {allowSelfCheck && failures >= 2 ? <Button variant="teal" label={t('ui.exercise.selfOk')} onPress={() => onDone(SELF_CHECK_STARS)} /> : null}
        </View>
      ) : null}
      {phase === 'self' ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {allowSelfCheck ? <Button style={{ flex: 1 }} variant="teal" label={t('ui.exercise.selfOk')} onPress={() => onDone(SELF_CHECK_STARS)} /> : null}
          <Button style={{ flex: 1 }} variant="secondary" label={t('ui.exercise.retry')} onPress={() => setPhase('intro')} />
        </View>
      ) : null}
    </View>
  );
}
