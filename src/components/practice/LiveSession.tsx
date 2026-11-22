import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { Button, Card, H2, Muted, Stars } from '../ui';
import { Listen, Score } from '../Listen';
import { colors, fonts, radius } from '../../theme';
import { listenNotes, requestMic, type Listener } from '../../audio/mic';
import { nowMs, startJam, stopActiveSequence, type JamHandle } from '../../audio/engine';
import { JAM_PARTS, jamSchedule, type JamPart } from '../../music/jam';
import { DRUM_STYLES, barBeatsOfStyle, type DrumStyle } from '../../music/drums';
import { cleanDetections, isHit, judgeLive, type LiveState, type LiveTarget } from '../../music/live';
import { scoreImprov } from '../../music/improv';
import { eventAt, isRest, noteStartBeats } from '../../music/staff';
import { freqToMidi, midiAt, noteName, type Locale } from '../../music/notes';
import { starsFor, TIMING_TOLERANCE_MS, type DetectedNote } from '../../music/scoring';
import { drillExerciseId, type Drill } from '../../content/practice';
import { coach, improvExample } from '../../music/coach';
import { INSTRUMENT } from '../../instruments/current';
import type { ListenExample, ScoreEvent } from '../../content/types';
import { useProgress } from '../../state/progress';
import { useSettings } from '../../state/settings';

/** Cuenta previa: un compás de 4, o dos de 3 en zamba, chacarera y vals. */
const countInFor = (barBeats: number) => (barBeats === 3 ? 6 : 4);
const TICK_MS = 80;
const MASTERY = 0.8;
const STYLES = Object.keys(DRUM_STYLES) as DrumStyle[];
const LOOPS = [1, 2, 4] as const;

type Phase = 'setup' | 'starting' | 'running' | 'result';

const NO_LINE: ScoreEvent[] = [];
/** La partitura solo se vuelve a dibujar cuando cambia la nota actual. */
const MemoScore = React.memo(Score);

interface Result {
  stars: number;
  accuracy: number;
  bestStreak: number;
  counts: Record<'hit' | 'early' | 'late' | 'wrong' | 'miss', number>;
  /** Desvío medio de los aciertos (ms, + = tarde). */
  meanOffset: number | null;
  improv?: { notes: number; inScale: number };
  unlocked?: number;
  /** Sin micrófono: se tocó con el acompañamiento, sin evaluar. */
  unscored?: boolean;
}

/**
 * Práctica con acompañamiento y evaluación en vivo. El alumno elige tempo,
 * estilo de batería, qué instrumentos lo acompañan y cuántas vueltas; la app
 * toca la pista y juzga cada nota mientras suena.
 */
export function LiveSession({ drill, width }: { drill: Drill; width: number }) {
  const { t, i18n } = useTranslation();
  const notation = useSettings((s) => s.notation);
  const exId = drillExerciseId(drill.id);
  const unlockedBpm = useProgress((s) => s.tempo[exId]) ?? drill.tempoSteps[0];
  const unlockTempo = useProgress((s) => s.unlockTempo);
  const recordExercise = useProgress((s) => s.recordExercise);
  const addMinutes = useProgress((s) => s.addMinutes);

  // Un tempo lento para empezar y los escalones del ejercicio (los más rápidos se ganan con 3 estrellas).
  const tempos = useMemo(() => [Math.max(40, drill.tempoSteps[0] - 15), ...drill.tempoSteps], [drill]);
  const [bpm, setBpm] = useState(drill.tempoSteps[0]);
  const [style, setStyle] = useState<DrumStyle>(drill.style);
  const [parts, setParts] = useState<JamPart[]>(() => drill.parts.filter((p) => JAM_PARTS.includes(p)));
  const [loops, setLoops] = useState<number>(drill.chords.length >= 8 ? 1 : 2);
  const [phase, setPhase] = useState<Phase>('setup');
  const [live, setLive] = useState<LiveState | null>(null);
  const [improvLive, setImprovLive] = useState<{ count: number; inScale: number; last: { midi: number; ok: boolean } | null } | null>(null);
  const [eventPos, setEventPos] = useState(-1);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [noMic, setNoMic] = useState(false);

  const jam = useRef<JamHandle | null>(null);
  const listener = useRef<Listener | null>(null);
  const timers = useRef<{ tick?: ReturnType<typeof setInterval>; end?: ReturnType<typeof setTimeout> }>({});
  const mounted = useRef(true);
  const starting = useRef(false);
  const runId = useRef(0);

  const stopAll = () => {
    if (timers.current.tick) clearInterval(timers.current.tick);
    if (timers.current.end) clearTimeout(timers.current.end);
    timers.current = {};
    listener.current?.stop();
    listener.current = null;
    jam.current?.stop();
    jam.current = null;
  };
  useEffect(
    () => () => {
      mounted.current = false;
      stopAll();
    },
    [],
  );

  const line = drill.line ?? NO_LINE;
  // Los estilos del selector tienen el mismo compás que el ejercicio (4/4, o 3/4 y 6/8).
  const barBeats = barBeatsOfStyle(drill.style);
  const COUNT_IN = countInFor(barBeats);
  const lineBeats = drill.chords.length * barBeats;
  const eventStarts = useMemo(() => line.map((_, i) => line.slice(0, i).reduce((a, e) => a + e.beats, 0)), [line]);
  const noteBeats = useMemo(() => noteStartBeats(line), [line]);
  const noteMidis = useMemo(() => line.flatMap((e) => (isRest(e) ? [] : [midiAt(e.string, e.fret)])), [line]);
  const label = (midi: number) => noteName(midi, i18n.language as Locale, notation);
  // Ejemplo sonoro al tempo elegido: la línea del ejercicio, o la escala en una frase para improvisar.
  const example = useMemo<ListenExample>(
    () =>
      drill.kind === 'improv'
        ? { events: improvExample(drill.scale ?? [], INSTRUMENT.strings), bpm, click: true, show: 'tab', beatsPerBar: 4 }
        : { events: line, bpm, click: true, beatsPerBar: barBeats === 3 ? 3 : 4 },
    [drill, line, bpm, barBeats],
  );
  const togglePart = (p: JamPart) => setParts((ps) => (ps.includes(p) ? ps.filter((x) => x !== p) : [...ps, p]));

  const start = async () => {
    if (starting.current) return;
    starting.current = true;
    const myRun = ++runId.current;
    try {
      stopActiveSequence();
      setPhase('starting');
      const status = await requestMic();
      if (!mounted.current || myRun !== runId.current) return;
      const scored = status === 'ok';
      setNoMic(!scored);
      setResult(null);
      setLive(null);
      setImprovLive(null);
      setEventPos(-1);

      const detected: DetectedNote[] = [];
      if (scored) {
        const heard = await listenNotes((n) => detected.push(n));
        if (!mounted.current || myRun !== runId.current) {
          heard?.stop();
          return;
        }
        if (!heard) setNoMic(true);
        listener.current = heard;
      }
      const sched = jamSchedule({ chords: drill.chords, bpm, style, loops, parts, countIn: COUNT_IN });
      jam.current = startJam({ ...sched, bpm, countIn: COUNT_IN, beatsPerBar: barBeats });
      setPhase('running');
      const step = 60000 / bpm;
      const startMs = jam.current.startMs;
      const t0 = startMs - COUNT_IN * step;
      const backing = sched.notes.map((n) => ({ timeMs: t0 + n.startSec * 1000, midi: Math.round(freqToMidi(n.freq)) }));
      // Bombo y caja tienen altura: el detector puede tomarlos por notas.
      const drumHits = sched.drums.filter((d) => d.kind === 'kick' || d.kind === 'snare').map((d) => t0 + d.startSec * 1000);
      const targets: LiveTarget[] = Array.from({ length: loops }, (_, loop) =>
        noteBeats.map((b, k) => ({ timeMs: startMs + (loop * lineBeats + b) * step, midi: noteMidis[k] })),
      ).flat();
      const clean = () => cleanDetections(detected, backing, drumHits, targets).filter((d) => d.timeMs >= startMs - 300);
      // Solo se vuelve a dibujar cuando cambia algo (una nota nueva o un veredicto).
      let lastKey = '';

      timers.current.tick = setInterval(() => {
        const now = nowMs();
        const beat = (now - startMs) / step;
        setCountdown(beat < 0 ? Math.ceil(-beat) : null);
        if (drill.kind === 'line') {
          setEventPos(beat < 0 ? -1 : eventAt(eventStarts, beat % lineBeats));
          if (listener.current) {
            const s = judgeLive(targets, clean(), now);
            const key = s.verdicts.join(',');
            if (key !== lastKey) {
              lastKey = key;
              setLive(s);
            }
          }
        } else if (listener.current) {
          const notes = clean();
          if (String(notes.length) === lastKey) return;
          lastKey = String(notes.length);
          const pcs = notes.map((d) => ((Math.round(freqToMidi(d.freq)) % 12) + 12) % 12);
          const inScale = pcs.filter((pc) => drill.scale!.includes(pc)).length;
          const lastNote = notes[notes.length - 1];
          setImprovLive({
            count: notes.length,
            inScale: notes.length ? inScale / notes.length : 0,
            last: lastNote ? { midi: Math.round(freqToMidi(lastNote.freq)), ok: drill.scale!.includes(pcs[pcs.length - 1]) } : null,
          });
        }
      }, TICK_MS);

      timers.current.end = setTimeout(
        () => {
          const scoredRun = Boolean(listener.current);
          const final = clean();
          stopAll();
          if (!mounted.current) return;
          setCountdown(null);
          const minutes = Math.round(((sched.bodyBeats + COUNT_IN) * step) / 60000);
          if (minutes > 0) addMinutes(minutes);
          if (!scoredRun) {
            setResult({ stars: 0, accuracy: 0, bestStreak: 0, counts: { hit: 0, early: 0, late: 0, wrong: 0, miss: 0 }, meanOffset: null, unscored: true });
            setPhase('result');
            return;
          }
          let r: Result;
          if (drill.kind === 'line') {
            const s = judgeLive(targets, final, Infinity);
            const counts = { hit: 0, early: 0, late: 0, wrong: 0, miss: 0 };
            s.verdicts.forEach((v) => {
              if (v !== 'pending') counts[v]++;
            });
            const offs = s.offsets.filter((o): o is number => o !== null);
            const accuracy = targets.length ? s.hits / targets.length : 0;
            r = { stars: starsFor(accuracy, MASTERY), accuracy, bestStreak: s.bestStreak, counts, meanOffset: offs.length ? offs.reduce((a, o) => a + o, 0) / offs.length : null };
          } else {
            const ir = scoreImprov(final, drill.scale!, drill.minNotes! * loops);
            r = { stars: starsFor(ir.accuracy, MASTERY), accuracy: ir.accuracy, bestStreak: 0, counts: { hit: 0, early: 0, late: 0, wrong: 0, miss: 0 }, meanOffset: null, improv: { notes: ir.notes, inScale: ir.inScale } };
          }
          // Tres estrellas en el escalón más alto abierto desbloquean el siguiente.
          if (r.stars === 3 && bpm >= unlockedBpm) {
            const next = drill.tempoSteps.find((s) => s > bpm);
            if (next) {
              unlockTempo(exId, next);
              r.unlocked = next;
            }
          }
          if (r.stars > 0) recordExercise(exId, r.stars, drill.skills);
          setResult(r);
          setPhase('result');
        },
        startMs - nowMs() + sched.bodyBeats * step + TIMING_TOLERANCE_MS + 400,
      );
    } finally {
      starting.current = false;
      // Si algo cortó el arranque, volver a la configuración.
      if (mounted.current && myRun === runId.current && !jam.current) setPhase((p) => (p === 'starting' ? 'setup' : p));
    }
  };

  const stop = () => {
    runId.current++;
    stopAll();
    setCountdown(null);
    setPhase('setup');
  };

  // ───────────── Vista ─────────────

  const chip = (key: string, text: string, selected: boolean, onPress: () => void, disabled = false) => (
    <Pressable
      key={key}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        minHeight: 44,
        paddingHorizontal: 14,
        borderRadius: 22,
        justifyContent: 'center',
        backgroundColor: selected ? colors.accent : colors.card,
        borderWidth: 1,
        borderColor: selected ? colors.accent : colors.border,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <Text style={{ fontWeight: '800', color: selected ? colors.onAccent : colors.ink }}>{text}</Text>
    </Pressable>
  );

  const row = (title: string, children: React.ReactNode) => (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 14, fontWeight: '900', color: colors.muted }}>{title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>
    </View>
  );

  const verdictColor = (v: string) => (v === 'hit' ? colors.teal : v === 'early' || v === 'late' ? colors.gold : colors.accentInk);

  const lastVerdict = live && live.last >= 0 ? live.verdicts[live.last] : null;
  const lastIndex = live?.last ?? -1;
  const notesPerLoop = noteMidis.length;
  const loopNow = lastIndex >= 0 ? Math.floor(lastIndex / Math.max(1, notesPerLoop)) : 0;

  const steps = [
    t(drill.kind === 'improv' ? 'ui.drills.howTo.listenImprov' : 'ui.drills.howTo.listen'),
    t(`ui.drills.howTo.cat.${drill.category}`),
    drill.kind === 'improv' ? t('ui.drills.howTo.scoringImprov', { beats: COUNT_IN, n: drill.minNotes ?? 0 }) : t('ui.drills.howTo.scoring', { beats: COUNT_IN }),
  ];

  const coaching = result
    ? coach({
        category: drill.category,
        stars: result.stars,
        accuracy: result.accuracy,
        counts: result.counts,
        meanOffset: result.meanOffset,
        bpm,
        tempos,
        unlocked: result.unlocked,
        improv: result.improv ? { ...result.improv, required: (drill.minNotes ?? 0) * loops } : undefined,
        unscored: result.unscored,
      })
    : null;

  return (
    <View style={{ gap: 14 }}>
      {phase === 'setup' || phase === 'starting' ? (
        <Card style={{ gap: 10 }}>
          <H2 style={{ fontSize: 18 }}>{t('ui.drills.howTo.title')}</H2>
          {steps.map((step, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
              <Text style={{ fontWeight: '900', color: colors.teal, minWidth: 18 }}>{i + 1}.</Text>
              <Text style={{ flex: 1, fontSize: 15, lineHeight: 22, color: colors.ink }}>{step}</Text>
            </View>
          ))}
          <Listen example={example} width={width - 34} testID="drill-example" />
        </Card>
      ) : null}

      {phase === 'setup' || phase === 'starting' ? (
        <Card style={{ gap: 14 }}>
          {row(
            t('ui.drills.tempo'),
            tempos.map((b, i) => chip(`t${b}`, i === 0 ? t('ui.drills.slow', { bpm: b }) : t('ui.drills.bpm', { bpm: b }), bpm === b, () => setBpm(b), i > 0 && b > unlockedBpm)),
          )}
          {drill.tempoSteps.some((b) => b > unlockedBpm) ? <Muted>{t('ui.drills.tempoLocked')}</Muted> : null}
          {row(
            t('ui.drills.with'),
            JAM_PARTS.map((p) => chip(p, t(`ui.drills.part.${p}`), parts.includes(p), () => togglePart(p))),
          )}
          {parts.includes('drums') ? row(t('ui.drills.styleTitle'), STYLES.filter((s) => barBeatsOfStyle(s) === barBeats).map((s) => chip(s, t(`ui.drills.style.${s}`), style === s, () => setStyle(s)))) : null}
          {row(
            t('ui.drills.loops'),
            LOOPS.map((n) => chip(`l${n}`, t('ui.drills.loopsN', { n }), loops === n, () => setLoops(n))),
          )}
          <Muted>{t('ui.drills.headphones')}</Muted>
          <Button label={t('ui.drills.start')} disabled={phase === 'starting'} onPress={() => void start()} testID="drill-start" />
        </Card>
      ) : null}

      {drill.kind === 'line' ? (
        <Card style={{ gap: 10, alignItems: 'center' }}>
          <MemoScore events={line} notation={drill.notation ?? 'tab'} width={width - 34} current={phase === 'running' ? eventPos : -1} beatsPerBar={barBeats} />
          {phase === 'running' && loops > 1 ? <Muted>{t('ui.drills.loopOf', { n: Math.min(loops, loopNow + 1), total: loops })}</Muted> : null}
        </Card>
      ) : (
        <Card style={{ gap: 8 }}>
          <H2 style={{ fontSize: 18 }}>{t('ui.drills.scale')}</H2>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.gold }}>{drill.scale!.map((pc) => label(60 + pc)).join(' · ')}</Text>
          <Muted>{t('ui.drills.chordsLine', { chords: drill.chords.join(' – ') })}</Muted>
        </Card>
      )}

      {phase === 'running' ? (
        <Card style={{ gap: 12, alignItems: 'center' }}>
          <View accessibilityLiveRegion="polite" style={{ alignItems: 'center', gap: 4, minHeight: 64, justifyContent: 'center' }}>
            {countdown !== null ? (
              <Text style={{ fontFamily: fonts.display, fontSize: 44, lineHeight: 50, color: colors.gold }}>{countdown}</Text>
            ) : noMic ? (
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.ink, textAlign: 'center' }}>{t('ui.drills.noMicPlaying')}</Text>
            ) : drill.kind === 'line' ? (
              lastVerdict && lastVerdict !== 'pending' ? (
                <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: verdictColor(lastVerdict), textAlign: 'center' }}>
                  {lastVerdict === 'wrong' && live!.played[lastIndex] !== null
                    ? t('ui.drills.wrongNote', { played: label(live!.played[lastIndex]!), expected: label(noteMidis[lastIndex % notesPerLoop]) })
                    : t(`ui.drills.verdict.${lastVerdict}`)}
                </Text>
              ) : (
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.teal }}>{t('ui.drills.go')}</Text>
              )
            ) : improvLive?.last ? (
              <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: improvLive.last.ok ? colors.teal : colors.accentInk }}>
                {t(improvLive.last.ok ? 'ui.drills.inScale' : 'ui.drills.outScale', { note: label(improvLive.last.midi) })}
              </Text>
            ) : (
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.teal }}>{t('ui.drills.goImprov')}</Text>
            )}
          </View>

          {!noMic && drill.kind === 'line' && live ? (
            <>
              <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch' }}>
                <Stat label={t('ui.drills.accuracy')} value={t('ui.drills.percent', { n: Math.round(live.accuracy * 100) })} />
                <Stat label={t('ui.drills.streak')} value={String(live.streak)} />
                <Stat label={t('ui.drills.notes')} value={`${live.decided}/${live.verdicts.length}`} />
              </View>
              <TimingMeter offset={lastIndex >= 0 ? live.offsets[lastIndex] : null} label={t('ui.drills.timing')} early={t('ui.drills.verdict.early')} late={t('ui.drills.verdict.late')} />
              <View accessible accessibilityLabel={t('ui.drills.dotsLabel', { hits: live.hits, decided: live.decided })} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center' }}>
                {live.verdicts.slice(loopNow * notesPerLoop, (loopNow + 1) * notesPerLoop).map((v, i) => (
                  <View key={i} style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: v === 'pending' ? colors.raised : isHit(v) ? (v === 'hit' ? colors.teal : colors.gold) : colors.accent }} />
                ))}
              </View>
            </>
          ) : null}
          {!noMic && drill.kind === 'improv' && improvLive ? (
            <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch' }}>
              <Stat label={t('ui.drills.inScalePct')} value={t('ui.drills.percent', { n: Math.round(improvLive.inScale * 100) })} />
              <Stat label={t('ui.drills.notes')} value={`${improvLive.count}/${drill.minNotes! * loops}`} />
            </View>
          ) : null}
          <Button variant="secondary" label={t('ui.drills.stop')} onPress={stop} testID="drill-stop" />
        </Card>
      ) : null}

      {phase === 'result' && result ? (
        <Card style={{ gap: 12, alignItems: 'center' }}>
          {result.unscored ? (
            <Muted style={{ textAlign: 'center' }}>{t('ui.drills.coach.unscored')}</Muted>
          ) : (
            <>
              <Stars count={result.stars} size={36} />
              <Text style={{ fontFamily: fonts.display, fontSize: 28, lineHeight: 34, color: colors.ink }}>
                {result.improv ? t('ui.drills.resultImprov', { percent: Math.round(result.improv.inScale * 100), notes: result.improv.notes }) : t('ui.drills.resultLine', { percent: Math.round(result.accuracy * 100) })}
              </Text>
              {!result.improv ? (
                <>
                  <Muted style={{ textAlign: 'center' }}>{t('ui.drills.breakdown', result.counts)}</Muted>
                  <Muted>{t('ui.drills.bestStreak', { n: result.bestStreak })}</Muted>
                </>
              ) : null}
              {result.unlocked ? <Text style={{ fontWeight: '800', color: colors.teal }}>{t('ui.drills.unlocked', { bpm: result.unlocked })}</Text> : null}
              {coaching ? <Text style={{ fontSize: 16, fontWeight: '800', lineHeight: 23, color: colors.ink, textAlign: 'center' }}>{t(coaching.headline)}</Text> : null}
            </>
          )}
          {coaching ? (
            <View style={{ alignSelf: 'stretch', gap: 8, padding: 12, borderRadius: radius.lg, backgroundColor: colors.raised }}>
              <Text style={{ fontSize: 14, fontWeight: '900', color: colors.muted }}>{t('ui.drills.coach.tipsTitle')}</Text>
              {coaching.tips.map((tip) => (
                <View key={tip.key} style={{ flexDirection: 'row', gap: 8 }}>
                  <Text style={{ fontWeight: '900', color: colors.teal }}>•</Text>
                  <Text style={{ flex: 1, fontSize: 15, lineHeight: 22, color: colors.ink }}>{t(tip.key, tip.params)}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch' }}>
            <Button style={{ flex: 1 }} label={t('ui.drills.again')} onPress={() => void start()} />
            <Button style={{ flex: 1 }} variant="secondary" label={t('ui.drills.settings')} onPress={() => setPhase('setup')} />
          </View>
        </Card>
      ) : null}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { t } = useTranslation();
  return (
    <View accessible accessibilityLabel={t('ui.drills.statA11y', { label, value })} style={{ flex: 1, padding: 10, borderRadius: radius.lg, backgroundColor: colors.raised, alignItems: 'center', gap: 2 }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 28, color: colors.ink }}>{value}</Text>
      <Text style={{ fontSize: 12, fontWeight: '800', color: colors.muted, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

/** Dónde cayó la última nota respecto del pulso: a la izquierda, antes; a la derecha, tarde. */
function TimingMeter({ offset, label, early, late }: { offset: number | null; label: string; early: string; late: string }) {
  const { t } = useTranslation();
  const pos = offset === null ? null : Math.max(-1, Math.min(1, offset / TIMING_TOLERANCE_MS));
  return (
    <View accessible accessibilityLabel={offset === null ? label : t('ui.drills.statA11y', { label, value: t('ui.drills.ms', { n: Math.round(offset) }) })} style={{ alignSelf: 'stretch', gap: 4 }}>
      <View style={{ height: 14, borderRadius: 7, backgroundColor: colors.raised, justifyContent: 'center' }}>
        <View style={{ position: 'absolute', left: '50%', width: 2, height: 14, marginLeft: -1, backgroundColor: colors.teal }} />
        {pos !== null ? <View style={{ position: 'absolute', left: `${50 + pos * 46}%`, width: 14, height: 14, marginLeft: -7, borderRadius: 7, backgroundColor: Math.abs(pos) <= 0.5 ? colors.teal : colors.gold }} /> : null}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 12, color: colors.muted, fontWeight: '700' }}>{early}</Text>
        <Text style={{ fontSize: 12, color: colors.muted, fontWeight: '700' }}>{late}</Text>
      </View>
    </View>
  );
}
