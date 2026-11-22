import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Text } from '../Text';
import { useTranslation } from 'react-i18next';
import { Button, Stars } from '../ui';
import { colors, fonts, radius } from '../../theme';
import { listenPitch, requestMic, type Listener, type MicStatus } from '../../audio/mic';
import { stopActiveSequence } from '../../audio/engine';
import { BEND_TOLERANCE_CENTS, bendAdvice, initialBend, stepBend, type BendState } from '../../music/bend';
import { midiAt, noteName, type Locale } from '../../music/notes';
import { starsFor } from '../../music/scoring';
import { useSettings } from '../../state/settings';
import type { BendExercise as BendEx, ListenExample } from '../../content/types';
import { bendFeedback, howToBend } from '../../music/feedback';
import { FeedbackCard, HowToCard } from './Coaching';
import { bendHands, fingering } from '../../music/hands';

type Phase = 'intro' | 'running' | 'result' | 'self';

const SELF_CHECK_STARS = 2;
/** Tiempo para lograr los intentos. */
const LIMIT_MS = 60000;
/** Sin altura durante este tiempo = la nota se apagó. */
const SILENCE_MS = 250;
const pct = (v: number) => `${v}%` as `${number}%`;

/**
 * Bend: la app sigue la altura de la nota mientras se empuja la cuerda y cuenta
 * los intentos que llegan a la nota de llegada y se sostienen (y vuelven, si
 * el ejercicio pide soltar).
 */
export function BendExercise({
  exercise,
  onDone,
  mastery,
  width,
  allowSelfCheck = true,
}: {
  exercise: BendEx;
  onDone: (stars: number) => void;
  mastery: number;
  width: number;
  allowSelfCheck?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const notation = useSettings((s) => s.notation);
  const startMidi = midiAt(exercise.string, exercise.fret);
  const spec = { startMidi, semitones: exercise.semitones, release: exercise.release };
  const label = (midi: number) => noteName(midi, i18n.language as Locale, notation);
  // El ejemplo: la nota de partida y la de llegada, para tener el sonido en el oído.
  const example: ListenExample = {
    events: [
      { string: exercise.string, fret: exercise.fret, beats: 2 },
      { string: exercise.string, fret: exercise.fret + exercise.semitones, beats: 2 },
    ],
    bpm: 70,
  };

  const [phase, setPhase] = useState<Phase>('intro');
  const [mic, setMic] = useState<MicStatus>('ok');
  const [state, setState] = useState<BendState>(initialBend());
  const [stars, setStars] = useState(0);
  const listener = useRef<Listener | null>(null);
  const timers = useRef<{ silence?: ReturnType<typeof setInterval>; limit?: ReturnType<typeof setTimeout> }>({});
  const mounted = useRef(true);
  const starting = useRef(false);
  /** La toma ya terminó (evita terminar dos veces). */
  const done = useRef(false);

  const stopAll = () => {
    if (timers.current.silence) clearInterval(timers.current.silence);
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

  const finish = (s: BendState) => {
    if (done.current) return;
    done.current = true;
    stopAll();
    if (!mounted.current) return;
    setStars(starsFor(Math.min(1, s.reps / exercise.reps), mastery));
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
      let s = initialBend();
      let lastPitch = 0;
      setState(s);
      setPhase('running');
      const heard = await listenPitch((freq) => {
        lastPitch = Date.now();
        s = stepBend(spec, s, freq);
        setState(s);
        if (s.reps >= exercise.reps) finish(s);
      });
      // La pantalla se cerró o se tocó «Terminar» mientras arrancaba el micrófono.
      if (!mounted.current || done.current) {
        heard?.stop();
        return;
      }
      listener.current = heard;
      if (!heard) {
        setPhase('self');
        return;
      }
      // Sin altura un rato: la nota se apagó (cuenta para el intento en curso).
      timers.current.silence = setInterval(() => {
        if (lastPitch && Date.now() - lastPitch > SILENCE_MS && s.rel !== null) {
          s = stepBend(spec, s, null);
          setState(s);
        }
      }, 100);
      timers.current.limit = setTimeout(() => finish(s), LIMIT_MS);
    } finally {
      starting.current = false;
    }
  };

  const target = exercise.semitones * 100;
  const scale = target + 60;
  const pos = state.rel === null ? null : Math.max(-20, Math.min(scale, state.rel));
  const advice = bendAdvice(state);

  return (
    <View style={{ gap: 14 }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 30, color: colors.ink }}>{t(exercise.promptKey)}</Text>
      <Text style={{ color: colors.muted }}>
        {t('ui.exercise.bendInfo', { from: label(startMidi), to: label(startMidi + exercise.semitones) })}
      </Text>
      {phase === 'intro' ? <HowToCard tips={howToBend(exercise)} example={example} width={width} hands={{ tips: bendHands(), steps: fingering([{ string: exercise.string, fret: exercise.fret }]).map((s) => ({ ...s, finger: s.fret > 0 ? 3 : 0, pos: Math.max(1, s.fret - 2), pluck: 'down' as const })) }} /> : null}

      <View style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.xl, padding: 16, gap: 12 }}>
        {/* Medidor: de la nota de partida (izquierda) a la de llegada (zona turquesa). */}
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t('ui.exercise.bendGauge', { cents: Math.round(state.rel ?? 0), target })}
          style={{ height: 34, borderRadius: radius.md, backgroundColor: colors.track, overflow: 'hidden' }}
        >
          <View
            style={{
              position: 'absolute',
              left: pct(((target - BEND_TOLERANCE_CENTS + 20) / (scale + 20)) * 100),
              width: pct(((2 * BEND_TOLERANCE_CENTS) / (scale + 20)) * 100),
              top: 0,
              bottom: 0,
              backgroundColor: colors.tealSoft,
            }}
          />
          {pos !== null ? (
            <View style={{ position: 'absolute', left: pct(((pos + 20) / (scale + 20)) * 100), top: 2, bottom: 2, width: 6, marginLeft: -3, borderRadius: 3, backgroundColor: colors.accent }} />
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.muted, fontWeight: '700' }}>{label(startMidi)}</Text>
          <Text style={{ color: colors.tealInk, fontWeight: '800' }}>{label(startMidi + exercise.semitones)}</Text>
        </View>
        <Text style={{ fontWeight: '800', color: colors.ink, textAlign: 'center' }} accessibilityLiveRegion="polite">
          {t('ui.exercise.bendReps', { reps: Math.min(state.reps, exercise.reps), total: exercise.reps })}
        </Text>
        {phase === 'running' && advice ? (
          <Text style={{ color: colors.accentInk, textAlign: 'center' }}>{t(advice === 'short' ? 'ui.exercise.bendShort' : 'ui.exercise.bendOver')}</Text>
        ) : null}
        {phase === 'result' ? (
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Stars count={stars} size={36} />
            <FeedbackCard tips={bendFeedback(Math.min(state.reps, exercise.reps), exercise.reps, stars)} note={label} />
          </View>
        ) : null}
        {phase === 'self' ? (
          <Text style={{ color: colors.accentInk, fontWeight: '700', textAlign: 'center' }}>{mic === 'denied' ? t('ui.exercise.micDenied') : t('ui.exercise.micUnavailable')}</Text>
        ) : null}
      </View>

      {phase === 'intro' ? <Button label={t('ui.exercise.tapStart')} onPress={() => void start()} /> : null}
      {phase === 'running' ? <Button variant="secondary" label={t('ui.exercise.finish')} onPress={() => finish(state)} /> : null}
      {phase === 'result' ? (
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button style={{ flex: 1 }} variant="secondary" label={t('ui.exercise.retry')} onPress={() => void start()} />
            <Button style={{ flex: 1 }} label={t('ui.common.next')} disabled={stars === 0} onPress={() => onDone(stars)} />
          </View>
          {allowSelfCheck && stars <= 1 ? <Button variant="teal" label={t('ui.exercise.selfOk')} onPress={() => onDone(SELF_CHECK_STARS)} /> : null}
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
