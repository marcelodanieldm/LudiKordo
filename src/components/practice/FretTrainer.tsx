import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { Button, Card, H2, Muted } from '../ui';
import { Fretboard, type Dot } from '../Fretboard';
import { colors, fonts, radius } from '../../theme';
import { playTone } from '../../audio/engine';
import { listenNotes, requestMic, type Listener } from '../../audio/mic';
import { freqToMidi, midiAt, midiToFreq, noteName, type Locale, type StringId } from '../../music/notes';
import { INSTRUMENT } from '../../instruments/current';
import { HAND_INSTRUMENT } from '../exercises/Coaching';
import {
  ROUND_MS,
  SCOPES,
  answersOf,
  isHeardRight,
  isTapRight,
  nextQuestion,
  questionsFor,
  record,
  trainerFeedback,
  weakest,
  type Question,
  type Scope,
  type Stats,
  type TrainerFeedback,
} from '../../music/fretTrainer';
import { useProgress } from '../../state/progress';
import { useSettings } from '../../state/settings';

type Phase = 'setup' | 'running' | 'result';
/** Ancho mínimo de cada traste para que el toque mida al menos 44 dp. */
const MIN_FRET_W = 48;
const TICK_MS = 250;
const stringNumberOf = (id: string) => INSTRUMENT.strings.find((s) => s.id === id)?.number ?? 0;
const bestOf = (h: number[] | undefined) => (h?.length ? Math.max(...h) : 0);

/**
 * Entrenador del mástil: un minuto de «¿dónde está esta nota en esta cuerda?».
 * Se contesta tocando el diapasón de la pantalla o tocando el instrumento (el
 * micrófono reconoce la altura exacta). Al fallar se muestra dónde estaba.
 */
export function FretTrainer({ width }: { width: number }) {
  const { t, i18n } = useTranslation();
  const notation = useSettings((s) => s.notation);
  const leftHanded = useSettings((s) => s.hand) === 'left';
  const rounds = useProgress((s) => s.fretRounds);
  const savedStats = useProgress((s) => s.fretStats);
  const recordFretRound = useProgress((s) => s.recordFretRound);

  const [scope, setScope] = useState<Scope>(SCOPES[0]);
  const [byMic, setByMic] = useState(false);
  const [phase, setPhase] = useState<Phase>('setup');
  const [question, setQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState({ right: 0, wrong: 0 });
  const [left, setLeft] = useState(ROUND_MS / 1000);
  const [flash, setFlash] = useState<{ wrong?: { string: StringId; fret: number }; missed?: StringId; missedPc?: number; show: number[]; heard?: number } | null>(null);
  const [noMic, setNoMic] = useState(false);
  const [result, setResult] = useState<{ right: number; wrong: number; meanMs: number; feedback: TrainerFeedback; weak: Question[]; best: number } | null>(null);

  const stats = useRef<Stats>({});
  const asked = useRef(0);
  const times = useRef<number[]>([]);
  const counts = useRef({ right: 0, wrong: 0 });
  const current = useRef<Question | null>(null);
  const listener = useRef<Listener | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const run = useRef(0);
  const mounted = useRef(true);

  const pool = useMemo(() => questionsFor(scope, INSTRUMENT.strings), [scope]);
  const name = (pc: number) => noteName(60 + pc, i18n.language as Locale, notation);

  const stopAll = () => {
    listener.current?.stop();
    listener.current = null;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (ticker.current) clearInterval(ticker.current);
    ticker.current = null;
  };
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      run.current += 1;
      stopAll();
    };
  }, []);

  const ask = (prev: Question | null) => {
    const q = nextQuestion(pool, stats.current, prev);
    current.current = q;
    asked.current = Date.now();
    setQuestion(q);
  };

  const answer = (right: boolean, wrongAt?: { string: StringId; fret: number }) => {
    const q = current.current;
    if (!q) return;
    const ms = Date.now() - asked.current;
    stats.current = record(stats.current, q, right, ms);
    if (right) {
      counts.current.right += 1;
      times.current.push(ms);
      setFlash(null);
    } else {
      counts.current.wrong += 1;
      // Al fallar, se ve dónde estaba la nota: es lo que más enseña.
      setFlash({ wrong: wrongAt, missed: q.string, missedPc: q.pc, show: answersOf(q, scope, INSTRUMENT.strings) });
    }
    setScore({ ...counts.current });
    ask(q);
  };

  const onTap = (string: StringId, fret: number) => {
    const q = current.current;
    if (phase !== 'running' || !q) return;
    void playTone(midiToFreq(midiAt(string, fret)), 0.5);
    if (isTapRight(q, string, fret, scope, INSTRUMENT.strings)) answer(true);
    else answer(false, { string, fret });
  };

  const finish = (myRun: number) => {
    if (!mounted.current || myRun !== run.current) return;
    stopAll();
    const { right, wrong } = counts.current;
    const meanMs = times.current.length ? times.current.reduce((a, b) => a + b, 0) / times.current.length : 0;
    const history = rounds[scope.id];
    const previous = bestOf(history);
    const weak = weakest(stats.current);
    const feedback = trainerFeedback({ right, wrong, meanMs }, previous, (history?.length ?? 0) > 0, scope, weak, HAND_INSTRUMENT);
    // Una ronda sin respuestas no se guarda ni suma a la racha.
    if (right + wrong > 0) recordFretRound(scope.id, right, stats.current);
    setResult({ right, wrong, meanMs, feedback, weak, best: Math.max(previous, right) });
    setPhase('result');
  };

  const start = async () => {
    const myRun = ++run.current;
    stopAll();
    stats.current = { ...savedStats };
    counts.current = { right: 0, wrong: 0 };
    times.current = [];
    setScore({ right: 0, wrong: 0 });
    setFlash(null);
    setResult(null);
    let mic = false;
    if (byMic) {
      const status = await requestMic();
      if (!mounted.current || myRun !== run.current) return;
      if (status === 'ok') {
        try {
          const heard = await listenNotes((n) => {
            const q = current.current;
            if (!q || myRun !== run.current) return;
            const midi = Math.round(freqToMidi(n.freq));
            // Solo la nota correcta avanza: otra nota (o ruido) no se cuenta como error.
            if (isHeardRight(q, midi, scope, INSTRUMENT.strings)) answer(true);
            else setFlash({ heard: midi, show: [] });
          });
          if (!mounted.current || myRun !== run.current) {
            heard?.stop();
            return;
          }
          listener.current = heard;
          mic = !!heard;
        } catch {
          mic = false;
        }
      }
      setNoMic(!mic);
    }
    ask(null);
    const t0 = Date.now();
    setLeft(ROUND_MS / 1000);
    setPhase('running');
    ticker.current = setInterval(() => {
      if (mounted.current && myRun === run.current) setLeft(Math.max(0, Math.ceil((ROUND_MS - (Date.now() - t0)) / 1000)));
    }, TICK_MS);
    timers.current.push(setTimeout(() => finish(myRun), ROUND_MS));
  };

  const cancel = () => {
    run.current += 1;
    stopAll();
    setPhase('setup');
  };

  // El diapasón entra entero en tablet; en teléfono, con 12 trastes, se desplaza de costado.
  const boardW = Math.max(width, (scope.frets + 1) * MIN_FRET_W);
  const lastWrong = flash?.wrong;
  // La pregunta fallada: dónde estaba la nota (en verde) y dónde se tocó (×).
  const dots: Dot[] = [
    ...(lastWrong ? [{ ...lastWrong, label: '×', color: colors.danger }] : []),
    ...(flash?.missed ? flash.show.map((fret) => ({ string: flash.missed!, fret, color: colors.teal, labelColor: colors.onTeal, label: '✓' })) : []),
  ];

  return (
    <View style={{ gap: 14 }}>
      {phase === 'setup' ? (
        <Card style={{ gap: 12 }}>
          <H2 style={{ fontSize: 18 }}>{t('ui.fretTrainer.scopeTitle')}</H2>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SCOPES.map((sc) => {
              const selected = sc.id === scope.id;
              const best = bestOf(rounds[sc.id]);
              return (
                <Pressable
                  key={sc.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setScope(sc)}
                  style={{ minHeight: 44, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 22, justifyContent: 'center', backgroundColor: selected ? colors.accent : colors.card, borderWidth: 1, borderColor: selected ? colors.accent : colors.border }}
                >
                  <Text style={{ fontWeight: '800', color: selected ? colors.onAccent : colors.ink }}>{t(`ui.fretTrainer.scope.${sc.id}`)}</Text>
                  {best > 0 ? <Text style={{ fontSize: 12, color: selected ? colors.onAccent : colors.muted }}>{t('ui.fretTrainer.bestShort', { n: best })}</Text> : null}
                </Pressable>
              );
            })}
          </View>
          <Pressable accessibilityRole="switch" accessibilityState={{ checked: byMic }} onPress={() => setByMic((m) => !m)} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.ink, backgroundColor: byMic ? colors.accent : 'transparent' }} />
            <Text style={{ flex: 1, color: colors.ink }}>{t('ui.fretTrainer.byMic')}</Text>
          </Pressable>
          {noMic ? <Muted>{t('ui.fretTrainer.noMic')}</Muted> : null}
          <Button label={t('ui.fretTrainer.start')} onPress={() => void start()} testID="fret-start" />
        </Card>
      ) : null}

      {phase === 'running' && question ? (
        <>
          <Card style={{ gap: 6, alignItems: 'center' }}>
            <Text style={{ fontFamily: fonts.black, fontSize: 16, color: colors.muted }}>
              {t('ui.fretTrainer.status', { s: left, right: score.right, wrong: score.wrong })}
            </Text>
            <Text accessibilityLiveRegion="polite" style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 32, color: colors.ink, textAlign: 'center' }}>
              {t('ui.fretTrainer.question', { note: name(question.pc), string: stringNumberOf(question.string) })}
            </Text>
            <Muted>{byMic && !noMic ? t('ui.fretTrainer.hintMic') : t('ui.fretTrainer.hintTap')}</Muted>
            {flash?.heard !== undefined ? <Muted>{t('ui.fretTrainer.heard', { note: noteName(flash.heard, i18n.language as Locale, notation) })}</Muted> : null}
            {flash?.missed ? <Muted>{t('ui.fretTrainer.wasHere', { note: name(flash.missedPc ?? 0), string: stringNumberOf(flash.missed) })}</Muted> : null}
          </Card>
          <ScrollView horizontal showsHorizontalScrollIndicator={boardW > width}>
            <Fretboard
              width={boardW}
              frets={scope.frets}
              leftHanded={leftHanded}
              openStrings
              onTap={onTap}
              dots={dots}
            />
          </ScrollView>
          {byMic && !noMic ? <Button variant="secondary" label={t('ui.fretTrainer.skip')} onPress={() => answer(false)} /> : null}
          <Button variant="secondary" label={t('ui.fretTrainer.cancel')} onPress={cancel} />
        </>
      ) : null}

      {phase === 'result' && result ? (
        <Card style={{ gap: 12 }}>
          <Text style={{ fontFamily: fonts.black, fontSize: 56, color: colors.gold, textAlign: 'center' }}>{result.right}</Text>
          {result.right + result.wrong > 0 ? (
            <H2 style={{ textAlign: 'center' }}>{t(`ui.fretTrainer.result.${result.feedback.headline}`, { count: result.right, best: result.best })}</H2>
          ) : (
            <Muted style={{ textAlign: 'center' }}>{t('ui.fretTrainer.empty')}</Muted>
          )}
          <Muted style={{ textAlign: 'center' }}>
            {t('ui.fretTrainer.summary', { right: result.right, wrong: result.wrong, s: (result.meanMs / 1000).toFixed(1) })}
          </Muted>
          {result.weak.length ? (
            <View style={{ gap: 4 }}>
              <Text style={{ fontWeight: '900', color: colors.ink }}>{t('ui.fretTrainer.weakTitle')}</Text>
              {result.weak.map((q) => (
                <Text key={`${q.string}${q.pc}`} style={{ color: colors.ink }}>
                  {t('ui.fretTrainer.weakItem', { note: name(q.pc), string: stringNumberOf(q.string) })}
                </Text>
              ))}
            </View>
          ) : null}
          {result.feedback.tips.map((tip) => (
            <View key={tip} style={{ flexDirection: 'row', gap: 8 }}>
              <Text style={{ color: colors.teal, fontWeight: '900' }}>•</Text>
              <Text style={{ flex: 1, fontSize: 15, lineHeight: 22, color: colors.ink }}>{t(`ui.fretTrainer.tip.${tip}`)}</Text>
            </View>
          ))}
          <Button label={t('ui.fretTrainer.again')} onPress={() => void start()} testID="fret-again" />
          <Button variant="secondary" label={t('ui.fretTrainer.change')} onPress={() => setPhase('setup')} />
        </Card>
      ) : null}
    </View>
  );
}
