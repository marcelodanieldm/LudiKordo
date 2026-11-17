import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Text } from '../Text';
import { useTranslation } from 'react-i18next';
import { Button, Stars } from '../ui';
import { colors, radius, fonts } from '../../theme';
import { listenNotes, listenPitch, requestMic, type Listener, type MicStatus } from '../../audio/mic';
import { nowMs, startMetronome, type MetronomeHandle } from '../../audio/engine';
import { centsOff, midiAt, noteName, type Locale } from '../../music/notes';
import { noteIndexAt, noteTimes, PITCH_TOLERANCE_CENTS, scorePlayAlong, starsFor, type DetectedNote } from '../../music/scoring';
import { TabStaff } from '../TabStaff';
import { useSettings } from '../../state/settings';
import { useProgress } from '../../state/progress';
import type { PlayAlongExercise as PlayEx } from '../../content/types';

type Phase = 'intro' | 'running' | 'result' | 'self';

/** Estrellas de la autoevaluación: completa la lección, pero el dominio pide detección. */
const SELF_CHECK_STARS = 2;

/**
 * Ejercicio con el bajo. Con tempo: metrónomo + detección de ataques y notas.
 * Sin tempo: la app espera cada nota (o afinación) antes de pasar a la siguiente.
 * Si el micrófono no está disponible o falla dos veces seguidas, ofrece autoevaluación.
 */
export function PlayAlongExercise({
  exercise,
  onDone,
  mastery,
  width,
  allowSelfCheck = true,
}: {
  exercise: PlayEx;
  onDone: (stars: number) => void;
  mastery: number;
  width: number;
  /** En un checkpoint no hay autoevaluación: aprobar exige que la app oiga las notas. */
  allowSelfCheck?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const notation = useSettings((s) => s.notation);
  const unlocked = useProgress((s) => s.tempo[exercise.id]);
  const unlockTempo = useProgress((s) => s.unlockTempo);
  const bpm = exercise.bpm === null ? null : Math.max(exercise.bpm, unlocked ?? 0);

  const [phase, setPhase] = useState<Phase>('intro');
  const [mic, setMic] = useState<MicStatus>('ok');
  const [index, setIndex] = useState(0);
  const [cents, setCents] = useState<number | null>(null);
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

  const targets = exercise.notes.map((n) => midiAt(n.string, n.fret));
  const beats = exercise.notes.map((n) => n.beats ?? 1);
  const totalBeats = beats.reduce((a, b) => a + b, 0);
  // Con figuras de distinta duración, las notas se muestran como tablatura.
  const asTab = exercise.notes.some((n) => (n.beats ?? 1) !== 1);
  const label = (midi: number) => noteName(midi, i18n.language as Locale, notation);

  const finishWith = (hits: number, total: number) => {
    stopAll();
    // Si la pantalla ya se cerró, no se guarda progreso ni se cambia el estado.
    if (!mounted.current) return;
    const stars = starsFor(total ? hits / total : 0, mastery);
    let next: number | undefined;
    if (stars === 3 && bpm !== null && exercise.tempoSteps) {
      next = exercise.tempoSteps.find((s) => s > bpm);
      if (next) unlockTempo(exercise.id, next);
    }
    setFailures((f) => (stars <= 1 ? f + 1 : 0));
    setResult({ hits, total, stars, next });
    setPhase('result');
  };

  const start = async () => {
    const status = await requestMic();
    setMic(status);
    if (status !== 'ok') {
      setPhase('self');
      return;
    }
    setResult(null);
    setIndex(0);
    setPhase('running');

    if (bpm === null) {
      // Sin tempo: avanzar nota por nota cuando la altura queda dentro de la tolerancia.
      const tol = exercise.toleranceCents ?? PITCH_TOLERANCE_CENTS;
      let i = 0;
      let stable = 0;
      listener.current = await listenPitch((freq) => {
        if (i >= targets.length) return;
        const c = centsOff(freq, targets[i]);
        setCents(c);
        stable = Math.abs(c) <= tol ? stable + 1 : 0;
        if (stable >= 3) {
          i += 1;
          stable = 0;
          setIndex(i);
          if (i >= targets.length) finishWith(targets.length, targets.length);
        }
      });
      if (!listener.current) setPhase('self');
      return;
    }

    // Con tempo: metrónomo con cuenta de 4 y escucha de ataques.
    const detected: DetectedNote[] = [];
    metro.current = startMetronome(bpm, totalBeats);
    const startMs = metro.current.startMs;
    listener.current = await listenNotes((n) => detected.push(n));
    if (!listener.current) {
      // Sin detección, el metrónomo ya programado no debe seguir sonando.
      stopAll();
      setPhase('self');
      return;
    }
    const step = 60000 / bpm;
    const expected = noteTimes(beats, bpm, startMs);
    timers.current.tick = setInterval(() => setIndex(Math.max(0, noteIndexAt(expected, nowMs()))), 100);
    timers.current.end = setTimeout(() => {
      const r = scorePlayAlong(expected.map((timeMs, k) => ({ timeMs, midi: targets[k] })), detected);
      finishWith(r.hits, r.total);
    }, startMs - nowMs() + totalBeats * step + 800);
  };

  const current = targets[Math.min(index, targets.length - 1)];

  return (
    <View style={{ gap: 14 }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 30, color: colors.ink }}>{t(exercise.promptKey)}</Text>
      <Text style={{ color: colors.muted }}>
        {bpm !== null ? `${t('ui.exercise.tempo', { bpm })} · ` : ''}
        {t('ui.exercise.headphones')}
      </Text>

      <View style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.xl, padding: 16, gap: 10, alignItems: 'center' }}>
        {asTab ? (
          <TabStaff
            notes={exercise.notes.map((n) => ({ string: n.string, fret: n.fret, beats: n.beats ?? 1 }))}
            width={width - 34}
            current={phase === 'running' ? index : -1}
          />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {exercise.notes.map((n, k) => (
              <View
                key={k}
                style={{
                  minWidth: 40,
                  paddingHorizontal: 8,
                  height: 40,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: phase === 'running' && k === index ? colors.accent : k < index ? colors.tealSoft : colors.track,
                }}
              >
                <Text style={{ fontWeight: '800', color: phase === 'running' && k === index ? colors.onAccent : colors.ink }}>
                  {n.string}
                  {n.fret}
                </Text>
              </View>
            ))}
          </View>
        )}
        {phase === 'running' ? (
          <>
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.teal }}>{t('ui.exercise.listening')}</Text>
            <Text style={{ fontFamily: fonts.display, fontSize: 28, lineHeight: 34, color: colors.accentInk, textAlign: 'center' }}>{t('ui.exercise.waitingFor', { note: label(current) })}</Text>
            {bpm === null && cents !== null ? (
              <Text style={{ color: Math.abs(cents) <= (exercise.toleranceCents ?? PITCH_TOLERANCE_CENTS) ? colors.tealInk : colors.accentInk, fontWeight: '700' }}>
                {cents > 0 ? '+' : ''}
                {Math.round(cents)} cents
              </Text>
            ) : null}
          </>
        ) : null}
        {phase === 'result' && result ? (
          <View style={{ alignItems: 'center', gap: 6 }} accessibilityLiveRegion="polite">
            <Stars count={result.stars} size={36} />
            <Text style={{ fontWeight: '700', color: colors.ink }}>{t('ui.exercise.detected', { hits: result.hits, total: result.total })}</Text>
            {result.next ? <Text style={{ color: colors.tealInk, fontWeight: '700' }}>{t('ui.exercise.nextTempo', { bpm: result.next })}</Text> : null}
          </View>
        ) : null}
        {phase === 'self' ? (
          <Text style={{ color: colors.accentInk, fontWeight: '700', textAlign: 'center' }}>
            {mic === 'denied' ? t('ui.exercise.micDenied') : t('ui.exercise.micUnavailable')}
          </Text>
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
