import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '../../src/components/Text';
import { Button, Card, CloseButton, Eyebrow, H1, H2, Muted, Stars } from '../../src/components/ui';
import { Score } from '../../src/components/Listen';
import { usePracticeList, useSongbook } from '../../src/components/SongbookHooks';
import { practiceItem } from '../../src/content/drills';
import { availableTempos, liveExerciseId, liveResult, liveTargets, practiceStatusFromSong } from '../../src/content/practice';
import { backingSchedule } from '../../src/music/backing';
import { expireMissed, initLive, judgeOnset, liveAdvice, liveStats, maxHzFor, type LiveState, type LiveVerdict } from '../../src/music/live';
import { eventAt } from '../../src/music/staff';
import { PITCH_TOLERANCE_CENTS, starsFor, TIMING_TOLERANCE_MS } from '../../src/music/scoring';
import { nowMs, playBacking, type BackingHandle } from '../../src/audio/engine';
import { listenNotes, requestMic, type Listener } from '../../src/audio/mic';
import { useProgress } from '../../src/state/progress';
import { useLayout } from '../../src/hooks/useLayout';
import { colors, fonts, radius } from '../../src/theme';

type Phase = 'setup' | 'starting' | 'running' | 'done';
/** Volumen de la banda. «Medio» = 0,4, como la pista de las canciones, hasta medirlo en teléfonos (learnings.md). */
const LEVELS = { low: 0.25, mid: 0.4, high: 0.6 } as const;
type Level = keyof typeof LEVELS;

const VERDICT_COLOR: Record<LiveVerdict, string> = {
  hit: colors.teal,
  early: colors.gold,
  late: colors.gold,
  wrongNote: colors.danger,
  miss: colors.muted,
};

/** Práctica en vivo: acompañamiento a elección y evaluación nota por nota mientras tocas. */
export default function LivePracticeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { isTablet, width } = useLayout();
  const item = practiceItem(String(id));
  const statuses = usePracticeList();
  const songs = useSongbook();
  // Una canción del cancionero usa el estado del cancionero (bloqueo y Premium).
  const songStatus = item?.id.startsWith('song-') ? songs.find((x) => `song-${x.song.id}` === item.id) : undefined;
  const status = item ? (songStatus ? practiceStatusFromSong(item, songStatus) : statuses.find((x) => x.item.id === item.id)) : undefined;
  const unlocked = useProgress((s) => (item ? s.tempo[liveExerciseId(item.id)] : undefined));
  const recordExercise = useProgress((s) => s.recordExercise);
  const unlockTempo = useProgress((s) => s.unlockTempo);
  const addMinutes = useProgress((s) => s.addMinutes);

  const tempos = item ? availableTempos(item, unlocked) : [];
  const [bpm, setBpm] = useState<number>(tempos[tempos.length - 1] ?? item?.bpm ?? 80);
  const [drums, setDrums] = useState(true);
  const [keys, setKeys] = useState(!item?.keysOff);
  const [click, setClick] = useState(false);
  const [level, setLevel] = useState<Level>('mid');
  const [phase, setPhase] = useState<Phase>('setup');
  const [evaluate, setEvaluate] = useState(true);
  const [live, setLive] = useState<LiveState | null>(null);
  const [eventPos, setEventPos] = useState(-1);
  const [flash, setFlash] = useState<LiveVerdict | null>(null);
  const [nextTempo, setNextTempo] = useState<number | null>(null);

  const backing = useRef<BackingHandle | null>(null);
  const mic = useRef<Listener | null>(null);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveRef = useRef<LiveState | null>(null);
  const mounted = useRef(true);
  /** Cada toma tiene un número: lo que llega tarde de una toma anterior se descarta. */
  const session = useRef(0);

  const contentWidth = isTablet ? Math.min(width - 96, 820) : width - 40;

  const stopAll = () => {
    session.current += 1;
    backing.current?.stop();
    backing.current = null;
    mic.current?.stop();
    mic.current = null;
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
  };
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stopAll();
    };
  }, []);

  const eventStarts = useMemo(() => (item ? item.line.map((_, i) => item.line.slice(0, i).reduce((a, e) => a + e.beats, 0)) : []), [item]);

  if (!item || !status) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ padding: 20, gap: 16 }}>
          <View style={{ alignItems: 'flex-end' }}>
            <CloseButton label={t('ui.common.close')} onPress={() => router.back()} />
          </View>
          <Muted>{t('ui.practiceLive.notFound')}</Muted>
        </View>
      </SafeAreaView>
    );
  }

  const totalBeats = item.line.reduce((a, e) => a + e.beats, 0);

  const finish = (final: LiveState | null, playedBpm: number) => {
    stopAll();
    if (!mounted.current) return;
    setPhase('done');
    setEventPos(-1);
    if (!final) return;
    const res = liveResult(final, item, playedBpm, unlocked);
    recordExercise(liveExerciseId(item.id), res.stars, item.skills);
    if (res.minutes > 0) addMinutes(res.minutes);
    if (res.unlockedNow) unlockTempo(liveExerciseId(item.id), res.unlockedNow);
    setNextTempo(res.unlockedNow);
  };

  const start = async (playBpm: number) => {
    stopAll();
    const me = session.current;
    const stale = () => !mounted.current || session.current !== me;
    setFlash(null);
    setNextTempo(null);
    setPhase('starting');
    let withMic = false;
    if (evaluate) {
      const st = await requestMic();
      if (stale()) return;
      withMic = st === 'ok';
      if (!withMic) setEvaluate(false);
    }
    const schedule = backingSchedule({ chords: item.chords, bpm: playBpm, style: item.style, drums, keys, click, countIn: 4 });
    backing.current = playBacking(schedule, { drums: drums ? LEVELS[level] : 0, keys: keys ? LEVELS[level] : 0 });
    const startMs = backing.current.startMs;
    const beatMs = (60 / playBpm) * 1000;
    const targets = liveTargets(item, startMs, playBpm);
    const maxHz = maxHzFor(targets);
    const state = withMic ? initLive(targets) : null;
    liveRef.current = state;
    setLive(state);
    setPhase('running');
    if (withMic) {
      try {
        const listener = await listenNotes((n) => {
          if (session.current !== me || !liveRef.current) return;
          const res = judgeOnset(liveRef.current, n, TIMING_TOLERANCE_MS, PITCH_TOLERANCE_CENTS, maxHz);
          if (res.verdict) {
            liveRef.current = res.state;
            setLive(res.state);
            setFlash(res.verdict);
          }
        });
        // Se detuvo o se cerró la pantalla mientras se abría el micrófono: apagar lo que llegó tarde.
        if (stale()) {
          listener?.stop();
          return;
        }
        mic.current = listener;
      } catch {
        // No se pudo abrir el micrófono: se sigue tocando con la banda, sin evaluar.
        if (stale()) return;
        liveRef.current = null;
        setLive(null);
        setEvaluate(false);
      }
    }
    // Margen para el último aviso del micrófono, como en el play-along.
    const endMs = startMs + totalBeats * beatMs + TIMING_TOLERANCE_MS + 800;
    tick.current = setInterval(() => {
      const now = nowMs();
      const beat = (now - startMs) / beatMs;
      setEventPos(beat < 0 ? -1 : eventAt(eventStarts, beat));
      if (liveRef.current) {
        const ex = expireMissed(liveRef.current, now);
        if (ex.missed.length) {
          liveRef.current = ex.state;
          setLive(ex.state);
          setFlash('miss');
        }
      }
      if (now >= endMs) finish(liveRef.current, playBpm);
    }, 50);
  };
  const busy = phase === 'running' || phase === 'starting';

  const stopEarly = () => {
    stopAll();
    setPhase('setup');
    setEventPos(-1);
  };

  const stats = live ? liveStats(live) : null;
  const toggle = (label: string, on: boolean, set: (v: boolean) => void, testID: string) => (
    <Pressable
      key={testID}
      testID={testID}
      accessibilityRole="switch"
      accessibilityState={{ checked: on, disabled: busy }}
      accessibilityLabel={label}
      disabled={busy}
      onPress={() => set(!on)}
      style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: 22, justifyContent: 'center', backgroundColor: on ? colors.accent : colors.card, borderWidth: 1, borderColor: on ? colors.accent : colors.border }}
    >
      <Text style={{ fontWeight: '800', color: on ? colors.onAccent : colors.ink }}>{`${on ? '✓ ' : ''}${label}`}</Text>
    </Pressable>
  );
  const choice = <T extends string | number>(value: T, current: T, label: string, set: (v: T) => void, testID: string, a11y?: string) => (
    <Pressable
      key={testID}
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ checked: value === current, disabled: busy }}
      accessibilityLabel={a11y ?? label}
      disabled={busy}
      onPress={() => set(value)}
      style={{ minHeight: 44, minWidth: 64, paddingHorizontal: 14, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: value === current ? colors.raised : colors.card, borderWidth: 2, borderColor: value === current ? colors.gold : colors.border }}
    >
      <Text style={{ fontWeight: '800' }}>{label}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, maxWidth: 860, width: '100%', alignSelf: 'center' }}>
        <View style={{ alignItems: 'flex-end' }}>
          <CloseButton label={t('ui.common.close')} onPress={() => router.back()} />
        </View>
        <Eyebrow>{t('ui.practiceLive.meta', { style: t(`ui.practiceLive.style.${item.style}`), level: item.level, bpm })}</Eyebrow>
        <H1>{t(item.titleKey)}</H1>
        <Text style={{ fontSize: 16, lineHeight: 24 }}>{t(item.descriptionKey)}</Text>

        {status.state !== 'open' ? (
          <Card style={{ gap: 10 }}>
            <Muted>
              {status.state === 'premium'
                ? t('ui.songbook.premium')
                : t('ui.songbook.needs', { modules: status.missing.map((m) => `${m} ${t(`content.module.${m.replace('.', '_')}`)}`).join(' · ') })}
            </Muted>
            <Button
              variant="secondary"
              label={status.state === 'premium' ? t('ui.profile.seePlans') : t('ui.songbook.toPath')}
              onPress={() => router.push(status.state === 'premium' ? '/paywall' : '/ruta')}
            />
          </Card>
        ) : (
          <>
            <Card style={{ gap: 12 }}>
              <H2 style={{ fontSize: 18 }}>{t('ui.practiceLive.band')}</H2>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {toggle(t('ui.practiceLive.drums'), drums, setDrums, 'band-drums')}
                {toggle(t('ui.practiceLive.keys'), keys, setKeys, 'band-keys')}
                {toggle(t('ui.practiceLive.click'), click, setClick, 'band-click')}
              </View>
              <Muted>{t('ui.practiceLive.volume')}</Muted>
              <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(['low', 'mid', 'high'] as Level[]).map((l) => choice(l, level, t(`ui.practiceLive.level.${l}`), setLevel, `vol-${l}`))}
              </View>
              <Muted>{t('ui.practiceLive.tempo')}</Muted>
              <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {tempos.map((b) =>
                  choice(b, bpm, `${b}`, (v) => {
                    setBpm(v);
                    setNextTempo(null);
                  }, `bpm-${b}`, t('ui.practiceLive.bpmLabel', { bpm: b })),
                )}
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {toggle(t('ui.practiceLive.evaluate'), evaluate, setEvaluate, 'band-evaluate')}
              </View>
              <Muted>{t('ui.practiceLive.headphones')}</Muted>
            </Card>

            <Card style={{ gap: 12 }}>
              <Score events={item.line} notation={item.notation} width={contentWidth - 34} current={phase === 'running' ? eventPos : -1} />
              {live ? (
                <View
                  accessible
                  accessibilityRole="progressbar"
                  accessibilityLabel={t('ui.practiceLive.progress', { done: stats?.judged ?? 0, total: live.targets.length })}
                  accessibilityValue={{ min: 0, max: live.targets.length, now: stats?.judged ?? 0 }}
                  style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                  {live.verdicts.map((v, i) => (
                    <View key={i} style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: v ? VERDICT_COLOR[v] : colors.raised }} />
                  ))}
                </View>
              ) : null}
              {phase === 'running' ? (
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <Text accessibilityLiveRegion="polite" style={{ fontFamily: fonts.display, fontSize: 32, lineHeight: 40, color: flash ? VERDICT_COLOR[flash] : colors.muted }}>
                    {live ? (flash ? t(`ui.practiceLive.verdict.${flash}`) : t('ui.practiceLive.listening')) : t('ui.practiceLive.noEval')}
                  </Text>
                  {stats ? (
                    <Muted>{t('ui.practiceLive.running', { pct: Math.round(stats.accuracy * 100), streak: live?.streak ?? 0 })}</Muted>
                  ) : null}
                </View>
              ) : null}
              {phase === 'done' && stats && live ? (
                <View style={{ alignItems: 'center', gap: 8 }}>
                  <Stars count={starsFor(live.targets.length ? stats.hits / live.targets.length : 0, 0.8)} size={32} />
                  <Text style={{ fontFamily: fonts.display, fontSize: 22 }}>{t('ui.practiceLive.result', { hits: stats.hits, total: live.targets.length })}</Text>
                  <Muted>{t('ui.practiceLive.detail', { early: stats.early, late: stats.late, wrong: stats.wrong, missed: stats.missed, best: live.bestStreak })}</Muted>
                  <Text style={{ fontSize: 16, lineHeight: 24, textAlign: 'center' }}>{t(`ui.practiceLive.advice.${liveAdvice(stats)}`)}</Text>
                  {nextTempo ? <Text style={{ color: colors.gold, fontWeight: '800' }}>{t('ui.practiceLive.unlocked', { bpm: nextTempo })}</Text> : null}
                </View>
              ) : null}
              {phase === 'done' && !live ? <Muted>{t('ui.practiceLive.doneNoEval')}</Muted> : null}
              {busy ? (
                <Button variant="secondary" label={t('ui.practiceLive.stop')} onPress={stopEarly} testID="live-stop" />
              ) : (
                <Button
                  label={phase === 'done' ? t('ui.practiceLive.again') : t('ui.practiceLive.start')}
                  onPress={() => {
                    // Después de desbloquear un tempo, «Otra vez» sube al nuevo; si no, repite el elegido.
                    const playBpm = nextTempo ?? bpm;
                    if (nextTempo) setBpm(nextTempo);
                    void start(playBpm);
                  }}
                  testID="live-start"
                />
              )}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
