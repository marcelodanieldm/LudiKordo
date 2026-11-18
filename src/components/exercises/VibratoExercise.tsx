import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Text } from '../Text';
import { useTranslation } from 'react-i18next';
import { Button, Stars } from '../ui';
import { colors, fonts, radius } from '../../theme';
import { listenPitch, requestMic, type Listener, type MicStatus } from '../../audio/mic';
import { stopActiveSequence } from '../../audio/engine';
import { VIBRATO_MAX_IRREGULARITY, VIBRATO_RATE, scoreVibrato, type PitchSample, type VibratoResult } from '../../music/bend';
import { centsOff, midiAt, noteName, type Locale } from '../../music/notes';
import { starsFor } from '../../music/scoring';
import { useSettings } from '../../state/settings';
import type { VibratoExercise as VibEx } from '../../content/types';

type Phase = 'intro' | 'waiting' | 'recording' | 'result' | 'self';

const SELF_CHECK_STARS = 2;
/** Cuánto se espera a que suene la nota antes de abandonar. */
const WAIT_LIMIT_MS = 30000;
/** Cerca de la nota (en cents) para empezar a medir. */
const START_WINDOW = 50;

/**
 * Vibrato: cuando suena la nota, la app mide la altura unos segundos y evalúa
 * ancho, velocidad y regularidad en ventanas de 1 s.
 */
export function VibratoExercise({
  exercise,
  onDone,
  mastery,
  allowSelfCheck = true,
}: {
  exercise: VibEx;
  onDone: (stars: number) => void;
  mastery: number;
  allowSelfCheck?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const notation = useSettings((s) => s.notation);
  const target = midiAt(exercise.string, exercise.fret);
  const note = noteName(target, i18n.language as Locale, notation);

  const [phase, setPhase] = useState<Phase>('intro');
  const [mic, setMic] = useState<MicStatus>('ok');
  const [left, setLeft] = useState(exercise.seconds);
  const [result, setResult] = useState<{ stars: number; overall: VibratoResult | null } | null>(null);
  const listener = useRef<Listener | null>(null);
  const timers = useRef<{ tick?: ReturnType<typeof setInterval>; limit?: ReturnType<typeof setTimeout> }>({});
  const mounted = useRef(true);
  const starting = useRef(false);
  const done = useRef(false);

  const stopAll = () => {
    if (timers.current.tick) clearInterval(timers.current.tick);
    if (timers.current.limit) clearTimeout(timers.current.limit);
    timers.current = {};
    listener.current?.stop();
    listener.current = null;
  };
  useEffect(
    () => () => {
      mounted.current = false;
      stopAll();
    },
    [],
  );

  const finish = (samples: PitchSample[]) => {
    if (done.current) return;
    done.current = true;
    stopAll();
    if (!mounted.current) return;
    const r = scoreVibrato(samples, exercise.minDepthCents);
    setResult({ stars: starsFor(r.accuracy, mastery), overall: r.overall });
    setPhase('result');
  };

  const start = async () => {
    if (starting.current) return;
    starting.current = true;
    try {
      stopActiveSequence();
      const status = await requestMic();
      if (!mounted.current) return;
      setMic(status);
      if (status !== 'ok') {
        setPhase('self');
        return;
      }
      done.current = false;
      setResult(null);
      setLeft(exercise.seconds);
      setPhase('waiting');
      const samples: PitchSample[] = [];
      let startedAt = 0;
      let near = 0;
      const heard = await listenPitch((freq) => {
        const cents = centsOff(freq, target);
        const now = Date.now();
        if (!startedAt) {
          near = Math.abs(cents) <= START_WINDOW ? near + 1 : 0;
          if (near >= 3) {
            startedAt = now;
            setPhase('recording');
            if (timers.current.limit) clearTimeout(timers.current.limit);
            timers.current.tick = setInterval(() => {
              const remaining = Math.max(0, exercise.seconds - Math.floor((Date.now() - startedAt) / 1000));
              setLeft(remaining);
              if (remaining === 0) finish(samples);
            }, 250);
          }
          return;
        }
        // Lejos de la nota (otra cuerda, ruido): no se mide.
        if (Math.abs(cents) <= 150) samples.push({ tMs: now - startedAt, cents });
      });
      if (!mounted.current || done.current) {
        heard?.stop();
        return;
      }
      listener.current = heard;
      if (!heard) {
        setPhase('self');
        return;
      }
      timers.current.limit = setTimeout(() => finish(samples), WAIT_LIMIT_MS);
    } finally {
      starting.current = false;
    }
  };

  const o = result?.overall ?? null;
  const advice = !o
    ? null
    : o.depthCents < exercise.minDepthCents
      ? 'ui.exercise.vibratoNarrow'
      : o.rateHz < VIBRATO_RATE.min || o.rateHz > VIBRATO_RATE.max
        ? 'ui.exercise.vibratoSpeed'
        : o.irregularity > VIBRATO_MAX_IRREGULARITY
          ? 'ui.exercise.vibratoIrregular'
          : null;

  return (
    <View style={{ gap: 14 }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 30, color: colors.ink }}>{t(exercise.promptKey)}</Text>
      <Text style={{ color: colors.muted }}>{t('ui.exercise.vibratoInfo', { note, seconds: exercise.seconds })}</Text>

      <View style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.xl, padding: 16, gap: 10, alignItems: 'center' }} accessibilityLiveRegion="polite">
        {phase === 'waiting' ? <Text style={{ fontSize: 16, fontWeight: '800', color: colors.teal }}>{t('ui.exercise.vibratoWaiting', { note })}</Text> : null}
        {phase === 'recording' ? <Text style={{ fontFamily: fonts.display, fontSize: 28, color: colors.accentInk }}>{t('ui.exercise.vibratoRecording', { left })}</Text> : null}
        {phase === 'result' && result ? (
          <>
            <Stars count={result.stars} size={36} />
            {o ? <Text style={{ fontWeight: '700', color: colors.ink }}>{t('ui.exercise.vibratoResult', { depth: Math.round(o.depthCents), rate: o.rateHz.toFixed(1) })}</Text> : null}
            {advice ? <Text style={{ color: colors.accentInk, textAlign: 'center' }}>{t(advice)}</Text> : null}
          </>
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
          {allowSelfCheck && result.stars <= 1 ? <Button variant="teal" label={t('ui.exercise.selfOk')} onPress={() => onDone(SELF_CHECK_STARS)} /> : null}
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
