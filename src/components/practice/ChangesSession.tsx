import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { Button, Card, H2, Muted } from '../ui';
import { HandMap } from '../exercises/HandMap';
import { colors, fonts, radius } from '../../theme';
import { listenAttacks, listenNotes, requestMic, type Listener } from '../../audio/mic';
import { freqToMidi, midiAt, noteName, type Locale } from '../../music/notes';
import { shapeOf } from '../../music/chords';
import { handPlan } from '../../music/hands';
import { INSTRUMENT } from '../../instruments/current';
import { ROUND_MS, bestOf, changesFeedback, countNoteChanges, countStrumChanges, nextGoal, type ChangeNote, type ChangePair, type ChangesFeedback } from '../../music/changes';
import { useProgress } from '../../state/progress';
import { useSettings } from '../../state/settings';

type Phase = 'setup' | 'countdown' | 'running' | 'result';
const COUNTDOWN = 3;
const TICK_MS = 200;
const stringNumberOf = (id: string) => INSTRUMENT.strings.find((s) => s.id === id)?.number ?? 0;
const midiOf = (n: ChangeNote) => midiAt(n.string, n.fret);

/** Nombre de un lado del par: el acorde, o la nota con su cuerda y traste (bajo). */
export function usePairLabel() {
  const { t, i18n } = useTranslation();
  const notation = useSettings((s) => s.notation);
  return (pair: ChangePair, side: 'a' | 'b'): string =>
    pair.kind === 'chords'
      ? pair[side]
      : t('ui.changes.noteAt', { note: noteName(midiOf(pair[side]), i18n.language as Locale, notation), string: stringNumberOf(pair[side].string), fret: pair[side].fret });
}

/**
 * Una ronda de «Cambios en un minuto»: 3-2-1, sesenta segundos cambiando entre
 * los dos lados del par (un golpe en cada acorde, o la nota en el bajo) y el
 * resultado contra el récord, con consejos para la mano. Cuenta con el
 * micrófono; sin micrófono (o si lo prefieres), cuentas tú tocando la pantalla.
 */
export function ChangesSession({ pair, width }: { pair: ChangePair; width: number }) {
  const { t } = useTranslation();
  const history = useProgress((s) => s.changes[pair.id]);
  const recordChanges = useProgress((s) => s.recordChanges);
  const [phase, setPhase] = useState<Phase>('setup');
  const [manual, setManual] = useState(false);
  const [noMic, setNoMic] = useState(false);
  const [left, setLeft] = useState(COUNTDOWN);
  const [count, setCount] = useState(0);
  const [result, setResult] = useState<{ count: number; feedback: ChangesFeedback; best: number } | null>(null);

  const listener = useRef<Listener | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const hits = useRef<number[]>([]);
  const taps = useRef(0);
  /** Cómo se cuenta esta ronda: lo decide `start` (y pasa a «tú» si el micrófono no arranca). */
  const byTaps = useRef(false);
  const run = useRef(0);
  const mounted = useRef(true);

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

  const pairLabel = usePairLabel();
  const targets = pair.kind === 'notes' ? [midiOf(pair.a), midiOf(pair.b)] : [];
  const label = (side: 'a' | 'b') => pairLabel(pair, side);

  const tally = (): number => {
    if (byTaps.current) return taps.current;
    if (pair.kind === 'chords') return countStrumChanges(hits.current);
    return countNoteChanges(hits.current, targets[0], targets[1]);
  };

  const finish = (myRun: number) => {
    if (!mounted.current || myRun !== run.current) return;
    const n = tally();
    stopAll();
    const previous = bestOf(history);
    const feedback = changesFeedback(pair, n, previous, (history?.length ?? 0) > 0);
    // Una ronda sin ningún cambio (no se oyó nada, o el teléfono quedó solo) no se guarda ni suma a la racha.
    if (n > 0) recordChanges(pair.id, n);
    setCount(n);
    setResult({ count: n, feedback, best: Math.max(previous, n) });
    setPhase('result');
  };

  const start = async () => {
    const myRun = ++run.current;
    stopAll();
    hits.current = [];
    taps.current = 0;
    setCount(0);
    setResult(null);
    let useMic = !manual;
    if (useMic) {
      const status = await requestMic();
      if (!mounted.current || myRun !== run.current) return;
      useMic = status === 'ok';
      setNoMic(!useMic);
    }
    byTaps.current = !useMic;
    setPhase('countdown');
    setLeft(COUNTDOWN);
    for (let k = 1; k <= COUNTDOWN; k++) timers.current.push(setTimeout(() => mounted.current && myRun === run.current && setLeft(COUNTDOWN - k), k * 1000));
    timers.current.push(
      setTimeout(async () => {
        if (!mounted.current || myRun !== run.current) return;
        if (useMic) {
          // Los golpes antes de empezar no cuentan: se escucha recién con el «¡Ya!».
          let heard: Listener | null = null;
          try {
            heard =
              pair.kind === 'chords'
                ? await listenAttacks((timeMs) => hits.current.push(timeMs))
                : await listenNotes((note) => hits.current.push(Math.round(freqToMidi(note.freq))));
          } catch {
            // El micrófono no arrancó (por ejemplo, lo usa otra app): se cuenta tocando la pantalla.
            heard = null;
          }
          if (!mounted.current || myRun !== run.current) {
            heard?.stop();
            return;
          }
          if (!heard) {
            byTaps.current = true;
            setNoMic(true);
          }
          listener.current = heard;
        }
        const t0 = Date.now();
        setLeft(Math.round(ROUND_MS / 1000));
        setPhase('running');
        ticker.current = setInterval(() => {
          if (!mounted.current || myRun !== run.current) return;
          setLeft(Math.max(0, Math.ceil((ROUND_MS - (Date.now() - t0)) / 1000)));
          setCount(tally());
        }, TICK_MS);
        timers.current.push(setTimeout(() => finish(myRun), ROUND_MS));
      }, COUNTDOWN * 1000),
    );
  };

  const stop = () => {
    run.current += 1;
    stopAll();
    setPhase('setup');
  };

  const tap = () => {
    taps.current += 1;
    setCount(taps.current);
  };

  // Después de k cambios estás en el lado A si k es par.
  const current: 'a' | 'b' = count % 2 === 0 ? 'a' : 'b';
  const best = bestOf(history);
  const goal = nextGoal(best);
  const half = Math.floor((width - 10) / 2);
  const sides = useMemo(
    () =>
      (['a', 'b'] as const).map((side) =>
        pair.kind === 'chords'
          ? { side, chord: shapeOf(pair[side]), steps: undefined }
          : { side, chord: undefined, steps: handPlan([pair[side]], 'bass').steps },
      ),
    [pair],
  );
  const counting = manual || noMic;

  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {sides.map(({ side, chord, steps }) => {
          const on = phase === 'running' && side === current;
          return (
            <View
              key={side}
              accessible
              accessibilityLabel={t(on ? 'ui.changes.nowA11y' : 'ui.changes.sideA11y', { name: label(side) })}
              style={{ width: half, borderRadius: radius.lg, padding: 6, gap: 4, alignItems: 'center', backgroundColor: on ? colors.accentSoft : colors.card, borderWidth: 2, borderColor: on ? colors.accent : colors.border }}
            >
              <Text style={{ fontFamily: fonts.black, fontSize: 22, color: on ? colors.accentInk : colors.ink }}>{label(side)}</Text>
              <HandMap chord={chord} steps={steps} width={half - 12} />
            </View>
          );
        })}
      </View>

      {phase === 'setup' ? (
        <Card style={{ gap: 10 }}>
          <H2 style={{ fontSize: 18 }}>{t('ui.changes.howTitle')}</H2>
          {[t('ui.changes.how1'), t('ui.changes.how2'), t('ui.changes.how3')].map((step, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
              <Text style={{ fontWeight: '900', color: colors.teal, minWidth: 18 }}>{i + 1}.</Text>
              <Text style={{ flex: 1, fontSize: 15, lineHeight: 22, color: colors.ink }}>{step}</Text>
            </View>
          ))}
          <Muted>{best > 0 ? t('ui.changes.bestGoal', { best, goal }) : t('ui.changes.firstGoal')}</Muted>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: manual }}
            onPress={() => setManual((m) => !m)}
            style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10 }}
          >
            <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.ink, backgroundColor: manual ? colors.accent : 'transparent' }} />
            <Text style={{ flex: 1, color: colors.ink }}>{t('ui.changes.manual')}</Text>
          </Pressable>
          {noMic ? <Muted>{t('ui.changes.noMic')}</Muted> : null}
          <Button label={t('ui.changes.start')} onPress={() => void start()} testID="changes-start" />
        </Card>
      ) : null}

      {phase === 'countdown' || phase === 'running' ? (
        <Card style={{ gap: 12, alignItems: 'center' }}>
          {phase === 'countdown' ? (
            <Text accessibilityLiveRegion="assertive" style={{ fontFamily: fonts.black, fontSize: 64, color: colors.gold }}>
              {left > 0 ? left : t('ui.changes.go')}
            </Text>
          ) : (
            <>
              <Text style={{ fontFamily: fonts.black, fontSize: 18, color: colors.muted }}>{t('ui.changes.secondsLeft', { count: left })}</Text>
              <Text accessibilityLiveRegion="polite" accessibilityLabel={t('ui.changes.countA11y', { count })} style={{ fontFamily: fonts.black, fontSize: 72, color: colors.ink }}>
                {count}
              </Text>
              <Muted>{counting ? t('ui.changes.tapHint') : t(pair.kind === 'chords' ? 'ui.changes.strumHint' : 'ui.changes.noteHint')}</Muted>
              {counting ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('ui.changes.tap')}
                  onPress={tap}
                  testID="changes-tap"
                  style={{ alignSelf: 'stretch', minHeight: 120, borderRadius: radius.lg, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontFamily: fonts.black, fontSize: 26, color: colors.onAccent }}>{t('ui.changes.tap')}</Text>
                </Pressable>
              ) : null}
            </>
          )}
          <Button variant="secondary" label={t('ui.changes.cancel')} onPress={stop} />
        </Card>
      ) : null}

      {phase === 'result' && result ? (
        <Card style={{ gap: 12 }}>
          <Text style={{ fontFamily: fonts.black, fontSize: 56, color: colors.gold, textAlign: 'center' }}>{result.count}</Text>
          {result.count > 0 ? <H2 style={{ textAlign: 'center' }}>{t(`ui.changes.result.${result.feedback.headline}`, { best: result.best, count: result.count })}</H2> : null}
          <Muted style={{ textAlign: 'center' }}>{t('ui.changes.bestGoal', { best: result.best, goal: nextGoal(result.best) })}</Muted>
          <History values={history ?? []} />
          {result.feedback.tips.map((tip) => (
            <View key={tip.key} style={{ flexDirection: 'row', gap: 8 }}>
              <Text style={{ color: colors.teal, fontWeight: '900' }}>•</Text>
              <Text style={{ flex: 1, fontSize: 15, lineHeight: 22, color: colors.ink }}>{t(`ui.changes.tip.${tip.key}`, tip.values)}</Text>
            </View>
          ))}
          {result.count === 0 ? <Muted>{t('ui.changes.zero')}</Muted> : noMic && !manual ? <Muted>{t('ui.changes.noMic')}</Muted> : null}
          <Button label={t('ui.changes.again')} onPress={() => void start()} testID="changes-again" />
          <Button variant="secondary" label={t('ui.changes.otherPair')} onPress={() => router.back()} />
        </Card>
      ) : null}
    </View>
  );
}

/** Los últimos resultados, como barras: la tendencia importa más que un número suelto. */
function History({ values }: { values: number[] }) {
  const { t } = useTranslation();
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={t('ui.changes.historyA11y', { values: values.join(', ') })} style={{ gap: 6 }}>
      <Muted>{t('ui.changes.history')}</Muted>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 64 }}>
        {values.map((v, i) => (
          <View key={i} style={{ flex: 1, height: Math.max(4, (v / max) * 64), borderRadius: 4, backgroundColor: i === values.length - 1 ? colors.gold : colors.track }} />
        ))}
      </View>
    </View>
  );
}
