import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Text } from '../Text';
import { useTranslation } from 'react-i18next';
import { Button, Stars } from '../ui';
import { colors, fonts, radius } from '../../theme';
import { listenAttacks, requestMic, type Listener, type MicStatus } from '../../audio/mic';
import { nowMs, startMetronome, stopActiveSequence, type MetronomeHandle } from '../../audio/engine';
import { barBeatsOf, eighthAt, filterClicks, scoreStrum, type Attack } from '../../music/strum';
import { TIMING_TOLERANCE_MS, starsFor } from '../../music/scoring';
import { useProgress } from '../../state/progress';
import type { ListenExample, StrumExercise as StrumEx } from '../../content/types';
import { chordFromName } from '../../music/chords';
import { howToStrum, strumFeedback, type Tip } from '../../music/feedback';
import { FeedbackCard, HAND_INSTRUMENT, HowToCard } from './Coaching';
import { openShape, strumHands } from '../../music/hands';

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
  // El ejemplo de la explicación: los mismos acordes con el mismo patrón, con clic.
  const example: ListenExample = {
    events: [],
    bpm,
    click: true,
    beatsPerBar: barBeatsOf(exercise.pattern) === 3 ? 3 : 4,
    strum: { chords: exercise.chords.map((c) => chordFromName(c) ?? [45, 52, 57]), pattern: exercise.pattern },
  };

  const [phase, setPhase] = useState<Phase>('intro');
  const [mic, setMic] = useState<MicStatus>('ok');
  const [pos, setPos] = useState(-1);
  const [result, setResult] = useState<{ hits: number; total: number; stars: number; next?: number } | null>(null);
  const [failures, setFailures] = useState(0);
  const [tips, setTips] = useState<Tip[] | null>(null);
  const listener = useRef<Listener | null>(null);
  const metro = useRef<MetronomeHandle | null>(null);
  const timers = useRef<{ tick?: ReturnType<typeof setInterval>; end?: ReturnType<typeof setTimeout> }>({});
  const mounted = useRef(true);
  /** Evita dos tomas a la vez (dos toques rápidos en «Empezar»). */
  const starting = useRef(false);

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
    if (starting.current || phase === 'running') return;
    starting.current = true;
    try {
      await run();
    } finally {
      starting.current = false;
    }
  };

  const run = async () => {
    stopActiveSequence();
    const status = await requestMic();
    // La pantalla pudo cerrarse mientras se pedía el permiso.
    if (!mounted.current) return;
    setMic(status);
    if (status !== 'ok') {
      setPhase('self');
      return;
    }
    setResult(null);
    setTips(null);
    setPos(-1);
    setPhase('running');
    const attacks: Attack[] = [];
    // 4 pulsos por compás, o 3 en 3/4 y 6/8 (entonces la cuenta es de dos compases de 3).
    const barBeats = barBeatsOf(exercise.pattern);
    const countIn = barBeats === 3 ? 6 : 4;
    metro.current = startMetronome(bpm, bars * barBeats, countIn, barBeats);
    const startMs = metro.current.startMs;
    const beatMs = 60000 / bpm;
    const heard = await listenAttacks((timeMs, rms) => attacks.push({ timeMs, rms }));
    // Si la pantalla se cerró durante la espera, apagar lo que llegó tarde.
    if (!mounted.current) {
      heard?.stop();
      stopAll();
      return;
    }
    listener.current = heard;
    if (!listener.current) {
      stopAll();
      setPhase('self');
      return;
    }
    timers.current.tick = setInterval(() => setPos(eighthAt(nowMs(), startMs, bpm)), 60);
    timers.current.end = setTimeout(() => {
      // Lo que entró durante la cuenta (el clic por el parlante) no cuenta como golpe.
      const strokes = filterClicks(attacks, startMs, countIn * beatMs).map((a) => a.timeMs);
      const r = scoreStrum(exercise.pattern, bars, bpm, startMs, strokes, TIMING_TOLERANCE_MS);
      setTips(strumFeedback({ ...r, stars: starsFor(r.total + r.extras ? r.hits / (r.total + r.extras) : 0, mastery) }).tips);
      finishWith(r.hits, r.total + r.extras);
    }, startMs - nowMs() + bars * barBeats * beatMs + 800);
  };

  // Dos compases por renglón en teléfono, cuatro en tablet.
  const perRow = width >= 560 ? 4 : 2;
  const barW = (width - 34 - (perRow - 1) * 8) / perRow;
  const cell = Math.min(28, barW / exercise.pattern.length);

  return (
    <View style={{ gap: 14 }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 30, color: colors.ink }}>{t(exercise.promptKey)}</Text>
      <Text style={{ color: colors.muted }}>
        {t('ui.exercise.tempo', { bpm })} · {t('ui.exercise.headphones')}
      </Text>
      {phase === 'intro' ? <HowToCard tips={howToStrum({ bpm, chords: exercise.chords, pattern: exercise.pattern }, t('ui.exercise.and'))} example={example} width={width} hands={{ tips: strumHands(exercise.chords, exercise.pattern, HAND_INSTRUMENT), chord: exercise.chords.map(openShape).find(Boolean) }} /> : null}

      <View style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.xl, padding: 16, gap: 10 }}>
        <View
          style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
          accessible
          accessibilityRole="image"
          accessibilityLabel={t('ui.exercise.strumLabel', {
            bars,
            chords: exercise.chords.join(', '),
            pattern: exercise.pattern.map((s) => t(s === 'D' ? 'ui.exercise.strokeD' : s === 'U' ? 'ui.exercise.strokeU' : 'ui.exercise.strokeRest')).join(', '),
          })}
        >
          {exercise.chords.map((chord, bar) => (
            <View key={bar} style={{ width: barW, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 6, gap: 4 }}>
              <Text style={{ fontFamily: fonts.black, fontSize: 18, color: colors.ink }}>{chord}</Text>
              <View style={{ flexDirection: 'row' }}>
                {exercise.pattern.map((s, k) => {
                  const now = phase === 'running' && pos === bar * exercise.pattern.length + k;
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
            {tips ? <FeedbackCard tips={tips} note={String} /> : null}
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
