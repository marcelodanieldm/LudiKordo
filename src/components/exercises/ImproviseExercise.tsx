import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Text } from '../Text';
import { useTranslation } from 'react-i18next';
import { Button, Stars } from '../ui';
import { colors, fonts, radius } from '../../theme';
import { listenNotes, requestMic, type Listener, type MicStatus } from '../../audio/mic';
import { playSequence, stopActiveSequence, type SequenceHandle } from '../../audio/engine';
import { exampleSchedule } from '../../music/examples';
import { LISTEN_COUNT_IN } from '../../music/listen';
import { howToImprovise, improvFeedback } from '../../music/feedback';
import { FeedbackCard, HowToCard } from './Coaching';
import { filterBacking, scoreImprov, targetTimes, type ImprovNote, type ImprovResult } from '../../music/improv';
import { freqToMidi, noteName, type Locale } from '../../music/notes';
import { starsFor } from '../../music/scoring';
import { useSettings } from '../../state/settings';
import type { ImproviseExercise as ImprovEx, ListenExample } from '../../content/types';

type Phase = 'intro' | 'playing' | 'result' | 'self';

const SELF_CHECK_STARS = 2;

/**
 * Improvisar sobre una pista: la app toca los acordes (con cuenta previa) y
 * escucha qué notas tocas. Al final muestra cuántas cayeron en la escala.
 */
export function ImproviseExercise({
  exercise,
  onDone,
  mastery,
  width,
  allowSelfCheck = true,
}: {
  exercise: ImprovEx;
  onDone: (stars: number) => void;
  mastery: number;
  width: number;
  allowSelfCheck?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const notationPref = useSettings((s) => s.notation);
  const strum = exercise.backing.strum;
  const bars = strum ? strum.chords.length : 0;
  // La pista repetida, con cuenta previa.
  const track: ListenExample = useMemo(
    () => ({
      ...exercise.backing,
      events: [],
      click: true,
      strum: strum ? { ...strum, chords: Array.from({ length: exercise.loops }, () => strum.chords).flat() } : undefined,
    }),
    [exercise, strum],
  );
  const scaleNames = exercise.scale.map((pc) => noteName(60 + pc, i18n.language as Locale, notationPref)).join(' · ');

  const [phase, setPhase] = useState<Phase>('intro');
  const [mic, setMic] = useState<MicStatus>('ok');
  const [result, setResult] = useState<{ stars: number; r: ImprovResult } | null>(null);
  const listener = useRef<Listener | null>(null);
  const sequence = useRef<SequenceHandle | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  const starting = useRef(false);
  const done = useRef(false);

  const stopAll = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    listener.current?.stop();
    listener.current = null;
    sequence.current?.stop();
    sequence.current = null;
  };
  useEffect(
    () => () => {
      mounted.current = false;
      stopAll();
    },
    [],
  );

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
      const detected: ImprovNote[] = [];
      const heard = await listenNotes((n) => detected.push(n));
      if (!mounted.current || done.current) {
        heard?.stop();
        return;
      }
      if (!heard) {
        setPhase('self');
        return;
      }
      listener.current = heard;
      const { notes, lengthSec } = exampleSchedule(track);
      // El clic solo en la cuenta previa: durante la pista el micrófono lo tomaría como una nota.
      sequence.current = playSequence(notes, { bpm: track.bpm, beats: LISTEN_COUNT_IN }, () => {
        // Otro sonido cortó la pista: se cancela la toma.
        sequence.current = null;
        stopEarly();
      }, track.tone);
      setPhase('playing');
      const t0 = sequence.current.startMs;
      const startMs = t0 + (LISTEN_COUNT_IN * 60000) / track.bpm;
      const backingNotes = notes.map((n) => ({ timeMs: t0 + n.startSec * 1000, midi: Math.round(freqToMidi(n.freq)) }));
      const targets = exercise.targets ? targetTimes(startMs, track.bpm, bars, exercise.loops, exercise.targets) : [];
      timer.current = setTimeout(() => {
        if (done.current) return;
        done.current = true;
        // Lo que se tocó durante la cuenta previa no cuenta.
        const all = detected.filter((d) => d.timeMs >= startMs - 300);
        const played = filterBacking(all, backingNotes);
        stopAll();
        if (!mounted.current) return;
        const r = scoreImprov(played, exercise.scale, exercise.minNotes, targets, all);
        setResult({ stars: starsFor(r.accuracy, mastery), r });
        setPhase('result');
      }, lengthSec * 1000 + 450);
    } finally {
      starting.current = false;
    }
  };

  function stopEarly() {
    done.current = true;
    stopAll();
    if (mounted.current) setPhase('intro');
  }

  const r = result?.r;
  return (
    <View style={{ gap: 14 }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 30, color: colors.ink }}>{t(exercise.promptKey)}</Text>
      <Text style={{ color: colors.muted }}>{t('ui.exercise.improvInfo', { notes: scaleNames, count: exercise.minNotes })}</Text>
      <Text style={{ color: colors.muted }}>{t('ui.exercise.improvHeadphones')}</Text>
      {phase === 'intro' ? <HowToCard tips={howToImprovise(exercise, scaleNames)} example={exercise.backing} width={width} /> : null}

      <View style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.xl, padding: 16, gap: 10, alignItems: 'center' }} accessibilityLiveRegion="polite">
        {phase === 'playing' ? <Text style={{ fontSize: 18, fontWeight: '800', color: colors.teal, textAlign: 'center' }}>{t('ui.exercise.improvPlaying')}</Text> : null}
        {phase === 'result' && result && r ? (
          <>
            <Stars count={result.stars} size={36} />
            <Text style={{ fontWeight: '700', color: colors.ink, textAlign: 'center' }}>{t('ui.exercise.improvResult', { notes: r.notes, percent: Math.round(r.inScale * 100) })}</Text>
            {r.targetTotal > 0 ? <Text style={{ color: colors.ink, textAlign: 'center' }}>{t('ui.exercise.improvTargets', { hits: r.targetHits, total: r.targetTotal })}</Text> : null}
            <FeedbackCard tips={improvFeedback(r, exercise.minNotes, result.stars)} note={String} />
          </>
        ) : null}
        {phase === 'self' ? (
          <Text style={{ color: colors.accentInk, fontWeight: '700', textAlign: 'center' }}>{mic === 'denied' ? t('ui.exercise.micDenied') : t('ui.exercise.micUnavailable')}</Text>
        ) : null}
      </View>

      {phase === 'intro' ? <Button label={t('ui.exercise.tapStart')} onPress={() => void start()} /> : null}
      {phase === 'playing' ? <Button variant="secondary" label={t('ui.listen.stop')} onPress={stopEarly} /> : null}
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
