import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { Button, Card, H2, Muted } from '../ui';
import { colors, fonts, radius } from '../../theme';
import { nowMs, playSequence, startMetronome, stopActiveSequence, type MetronomeHandle } from '../../audio/engine';
import { listenAttacks, requestMic, type Listener } from '../../audio/mic';
import { midiToFreq } from '../../music/notes';
import { TIMING_TOLERANCE_MS } from '../../music/scoring';
import { filterClicks, type Attack } from '../../music/strum';
import { HAND_INSTRUMENT } from '../exercises/Coaching';
import {
  BARS_PER_ROUND,
  BEATS_PER_BAR,
  TAP_WINDOW_MS,
  TEMPOS,
  cellsOf,
  countsOf,
  gradeRhythm,
  hasPlayed,
  makeRound,
  percentOf,
  rhythmFeedback,
  type Bar,
  type Mark,
  type RhythmFeedback,
  type RhythmLevel,
  type RhythmResult,
} from '../../music/rhythmTrainer';
import { useProgress } from '../../state/progress';

type Phase = 'setup' | 'running' | 'result';
const COUNT_IN = 4;
const LEVELS: RhythmLevel[] = [1, 2, 3];
const TICK_MS = 50;
const MARK_COLOR: Record<Mark, string> = { ok: colors.teal, early: colors.gold, late: colors.gold, miss: colors.danger };
/** Además del color, un signo: el resultado no depende solo de distinguir colores. */
const MARK_SIGN: Record<Mark, string> = { ok: '✓', early: '‹', late: '›', miss: '✕' };
/** Nota del ejemplo: La3 (220 Hz), que el parlante del teléfono reproduce bien en las tres apps. */
const EXAMPLE_MIDI = 57;
/** Padding y borde de la tarjeta que contiene la grilla (16 + 1 por lado) y el espacio entre celdas. */
const CARD_INSET = 34;
const CELL_GAP = 1;

/**
 * Entrenador de ritmo: cuatro compases en una grilla de corcheas («1 y 2 y…»),
 * con clic y cuenta previa. Se toca en el botón grande o en el instrumento
 * (el micrófono oye los ataques). Al final, cada nota queda pintada (a tiempo,
 * adelantada, atrasada, perdida) con consejos para la mano y el tempo siguiente.
 */
export function RhythmTrainer({ width }: { width: number }) {
  const { t } = useTranslation();
  const history = useProgress((s) => s.rhythmRounds);
  const recordRhythmRound = useProgress((s) => s.recordRhythmRound);
  const [level, setLevel] = useState<RhythmLevel>(1);
  const [bpm, setBpm] = useState<number>(TEMPOS[0]);
  const [byMic, setByMic] = useState(false);
  const [noMic, setNoMic] = useState(false);
  // Si esta ronda escucha el micrófono (en estado, para dibujar; y en ref, para las funciones del audio).
  const [micOn, setMicOn] = useState(false);
  const [starting, setStarting] = useState(false);
  const [bars, setBars] = useState<Bar[]>(() => makeRound(1));
  const [phase, setPhase] = useState<Phase>('setup');
  const [cell, setCell] = useState(-1);
  const [countIn, setCountIn] = useState(0);
  const [result, setResult] = useState<{ res: RhythmResult; feedback: RhythmFeedback } | null>(null);

  const metro = useRef<MetronomeHandle | null>(null);
  const listener = useRef<Listener | null>(null);
  const taps = useRef<number[]>([]);
  const attacks = useRef<Attack[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const run = useRef(0);
  const mounted = useRef(true);
  const usingMic = useRef(false);
  /** Lo que se toca en esta ronda (el estado puede ir un render atrás cuando «Otra ronda» cambia tempo y compases). */
  const playing = useRef<{ bars: Bar[]; bpm: number; level: RhythmLevel }>({ bars, bpm, level });

  const stopAll = () => {
    metro.current?.stop();
    metro.current = null;
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
      // El ejemplo («Escuchar cómo suena») tampoco sigue sonando al salir.
      stopActiveSequence();
    };
  }, []);

  const newBars = (l: RhythmLevel) => {
    setBars(makeRound(l));
    setResult(null);
  };

  const chooseLevel = (l: RhythmLevel) => {
    setLevel(l);
    setBars(makeRound(l));
    setResult(null);
  };

  const listen = () => {
    stopActiveSequence();
    const step = 60 / bpm;
    let at = COUNT_IN;
    const notes: { freq: number; startSec: number; durSec: number }[] = [];
    for (const bar of bars) {
      for (const e of bar) {
        if (!e.rest) notes.push({ freq: midiToFreq(EXAMPLE_MIDI), startSec: at * step, durSec: Math.min(e.beats, 1) * step * 0.6 });
        at += e.beats;
      }
    }
    playSequence(notes, { bpm, beats: COUNT_IN + BARS_PER_ROUND * BEATS_PER_BAR });
  };

  const finish = (myRun: number) => {
    const h = metro.current;
    if (!mounted.current || myRun !== run.current || !h) return;
    const { bars: round, bpm: tempo, level: lvl } = playing.current;
    const step = 60000 / tempo;
    // Con el micrófono, el clic del parlante también entra: se descarta lo que no supera
    // lo que se oyó durante la cuenta previa (donde no se toca).
    const heard = usingMic.current ? filterClicks(attacks.current, h.startMs, COUNT_IN * step).map((a) => a.timeMs) : taps.current;
    const res = usingMic.current ? gradeRhythm(round, tempo, h.startMs, heard, TIMING_TOLERANCE_MS) : gradeRhythm(round, tempo, h.startMs, heard, TAP_WINDOW_MS, true);
    stopAll();
    const feedback = rhythmFeedback(res, tempo, HAND_INSTRUMENT, !usingMic.current);
    // Sin ningún toque, la ronda no se guarda ni suma a la racha.
    if (hasPlayed(res)) recordRhythmRound(lvl, percentOf(res));
    setResult({ res, feedback });
    setCell(-1);
    setPhase('result');
  };

  const start = async (tempo = bpm, round = bars) => {
    // Mientras se pide el micrófono, no se puede volver a empezar (hay un solo detector).
    if (starting) return;
    const myRun = ++run.current;
    stopAll();
    stopActiveSequence();
    taps.current = [];
    attacks.current = [];
    setResult(null);
    setBpm(tempo);
    setBars(round);
    playing.current = { bars: round, bpm: tempo, level };
    usingMic.current = false;
    if (byMic) {
      setStarting(true);
      const status = await requestMic();
      if (!mounted.current || myRun !== run.current) {
        if (mounted.current) setStarting(false);
        return;
      }
      if (status === 'ok') {
        try {
          const heard = await listenAttacks((timeMs, rms) => attacks.current.push({ timeMs, rms }));
          if (!mounted.current || myRun !== run.current) {
            heard?.stop();
            if (mounted.current) setStarting(false);
            return;
          }
          listener.current = heard;
          usingMic.current = !!heard;
        } catch {
          usingMic.current = false;
        }
      }
      setStarting(false);
    }
    setNoMic(byMic && !usingMic.current);
    setMicOn(usingMic.current);
    const beats = BARS_PER_ROUND * BEATS_PER_BAR;
    const h = startMetronome(tempo, beats, COUNT_IN, BEATS_PER_BAR);
    metro.current = h;
    const step = 60000 / tempo;
    setPhase('running');
    ticker.current = setInterval(() => {
      if (!mounted.current || myRun !== run.current) return;
      const el = nowMs() - h.startMs;
      setCountIn(el < 0 ? Math.min(COUNT_IN, Math.floor((el + COUNT_IN * step) / step) + 1) : 0);
      setCell(el < 0 ? -1 : Math.floor(el / (step / 2)));
    }, TICK_MS);
    timers.current.push(setTimeout(() => finish(myRun), h.startMs - nowMs() + beats * step + 500));
  };

  const tap = () => {
    if (phase === 'running' && !micOn) taps.current.push(nowMs());
  };

  const cancel = () => {
    run.current += 1;
    stopAll();
    setCell(-1);
    setPhase('setup');
  };

  // Colores por nota (en orden), solo mientras se muestra el resultado de esa ronda.
  const marks = phase === 'result' ? (result?.res.marks ?? []) : [];
  const cellW = Math.floor((width - CARD_INSET - 7 * CELL_GAP) / 8);
  const syllables = Array.from({ length: 8 }, (_, k) => (k % 2 === 0 ? String(k / 2 + 1) : t('ui.rhythmTrainer.and')));
  let noteIndex = 0;
  const grid = bars.map((bar, b) => {
    const cells = cellsOf(bar);
    return (
      <View key={b} style={{ flexDirection: 'row', gap: CELL_GAP }}>
        {cells.map((c, k) => {
          const absolute = b * 8 + k;
          const mark = c === 'start' ? marks[noteIndex++] : undefined;
          const now = absolute === cell;
          const fill = c === 'rest' ? colors.track : mark ? MARK_COLOR[mark] : c === 'start' ? colors.accent : colors.accentSoft;
          return (
            <View
              key={k}
              style={{
                width: cellW,
                height: 40,
                backgroundColor: fill,
                borderTopLeftRadius: c === 'start' ? 10 : 0,
                borderBottomLeftRadius: c === 'start' ? 10 : 0,
                borderWidth: now ? 3 : 0,
                borderColor: colors.ink,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '900', color: c === 'rest' ? colors.muted : c === 'start' ? colors.bg : colors.ink }}>{c === 'rest' ? '·' : mark ? `${MARK_SIGN[mark]} ${syllables[k]}` : syllables[k]}</Text>
            </View>
          );
        })}
      </View>
    );
  });
  // Para el lector de pantalla, compás por compás: «Compás 2: 1, 2 y, 4».
  const and = t('ui.rhythmTrainer.and');
  let markAt = 0;
  const a11yGrid = bars
    .map((bar, b) => {
      const counts = countsOf(bar, and).map((c) => {
        const m = marks[markAt++];
        return m ? t('ui.rhythmTrainer.countMarked', { count: c, mark: t(`ui.rhythmTrainer.mark.${m}`) }) : c;
      });
      return t('ui.rhythmTrainer.barA11y', { n: b + 1, counts: counts.join(', ') });
    })
    .join('. ');
  const best = (l: RhythmLevel) => {
    const h = history[l];
    return h?.length ? Math.max(...h) : 0;
  };

  return (
    <View style={{ gap: 14 }}>
      <Card style={{ gap: 6 }}>
        <View accessible accessibilityRole="image" accessibilityLabel={a11yGrid} style={{ gap: 6 }}>
          {grid}
        </View>
        {phase === 'running' && countIn > 0 ? (
          <Text accessibilityLiveRegion="assertive" style={{ fontFamily: fonts.black, fontSize: 22, color: colors.gold, textAlign: 'center' }}>
            {t('ui.rhythmTrainer.countIn', { n: countIn })}
          </Text>
        ) : null}
        {phase === 'result' && result ? <Muted>{t('ui.rhythmTrainer.legend')}</Muted> : null}
      </Card>

      {phase === 'setup' ? (
        <Card style={{ gap: 12 }}>
          <H2 style={{ fontSize: 18 }}>{t('ui.rhythmTrainer.levelTitle')}</H2>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {LEVELS.map((l) => (
              <Chip key={l} selected={l === level} onPress={() => chooseLevel(l)} label={t(`ui.rhythmTrainer.level.${l}`)} sub={best(l) > 0 ? t('ui.rhythmTrainer.bestShort', { n: best(l) }) : undefined} />
            ))}
          </View>
          <H2 style={{ fontSize: 18 }}>{t('ui.rhythmTrainer.tempo')}</H2>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TEMPOS.map((b) => (
              <Chip key={b} selected={b === bpm} onPress={() => setBpm(b)} label={t('ui.rhythmTrainer.bpm', { bpm: b })} />
            ))}
          </View>
          <Pressable accessibilityRole="switch" accessibilityState={{ checked: byMic }} onPress={() => setByMic((m) => !m)} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.ink, backgroundColor: byMic ? colors.accent : 'transparent' }} />
            <Text style={{ flex: 1, color: colors.ink }}>{t('ui.rhythmTrainer.byMic')}</Text>
          </Pressable>
          {noMic ? <Muted>{t('ui.rhythmTrainer.noMic')}</Muted> : null}
          <Button variant="secondary" label={t('ui.rhythmTrainer.listen')} onPress={listen} testID="rhythm-listen" />
          <Button variant="secondary" label={t('ui.rhythmTrainer.newRound')} onPress={() => newBars(level)} />
          <Button label={t('ui.rhythmTrainer.start')} disabled={starting} onPress={() => void start()} testID="rhythm-start" />
        </Card>
      ) : null}

      {phase === 'running' ? (
        <>
          {micOn ? (
            <Muted>{t('ui.rhythmTrainer.playHint')}</Muted>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('ui.rhythmTrainer.tap')}
              onPressIn={tap}
              testID="rhythm-tap"
              style={{ minHeight: 140, borderRadius: radius.xl, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontFamily: fonts.black, fontSize: 28, color: colors.onAccent }}>{t('ui.rhythmTrainer.tap')}</Text>
            </Pressable>
          )}
          <Button variant="secondary" label={t('ui.rhythmTrainer.cancel')} onPress={cancel} />
        </>
      ) : null}

      {phase === 'result' && result ? (
        <Card style={{ gap: 12 }}>
          <Text style={{ fontFamily: fonts.black, fontSize: 52, color: colors.gold, textAlign: 'center' }}>{t('ui.rhythmTrainer.percent', { n: percentOf(result.res) })}</Text>
          <H2 style={{ textAlign: 'center' }}>{t(`ui.rhythmTrainer.result.${result.feedback.headline}`)}</H2>
          <Muted style={{ textAlign: 'center' }}>
            {t('ui.rhythmTrainer.summary', { hits: result.res.hits, total: result.res.total, extras: result.res.extras })}
          </Muted>
          {result.feedback.tips.map((tip) => (
            <View key={tip} style={{ flexDirection: 'row', gap: 8 }}>
              <Text style={{ color: colors.teal, fontWeight: '900' }}>•</Text>
              <Text style={{ flex: 1, fontSize: 15, lineHeight: 22, color: colors.ink }}>{t(`ui.rhythmTrainer.tip.${tip}`)}</Text>
            </View>
          ))}
          <Button
            label={result.feedback.nextBpm !== bpm ? t('ui.rhythmTrainer.againAt', { bpm: result.feedback.nextBpm }) : t('ui.rhythmTrainer.again')}
            onPress={() => void start(result.feedback.nextBpm, makeRound(level))}
            testID="rhythm-again"
          />
          <Button variant="secondary" label={t('ui.rhythmTrainer.repeat')} onPress={() => void start(bpm, bars)} />
          <Button
            variant="secondary"
            label={t('ui.rhythmTrainer.change')}
            onPress={() => {
              setResult(null);
              setPhase('setup');
            }}
          />
        </Card>
      ) : null}
    </View>
  );
}

function Chip({ label, sub, selected, onPress }: { label: string; sub?: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{ minHeight: 44, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 22, justifyContent: 'center', backgroundColor: selected ? colors.accent : colors.card, borderWidth: 1, borderColor: selected ? colors.accent : colors.border }}
    >
      <Text style={{ fontWeight: '800', color: selected ? colors.onAccent : colors.ink }}>{label}</Text>
      {sub ? <Text style={{ fontSize: 12, color: selected ? colors.onAccent : colors.muted }}>{sub}</Text> : null}
    </Pressable>
  );
}
