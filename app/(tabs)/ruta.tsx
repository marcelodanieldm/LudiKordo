import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../src/components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Card, Chip, Eyebrow, H1, H2, Muted, PlayIcon, ProgressBar, StarIcon } from '../../src/components/ui';
import { LEVELS, isUnlocked, lessonIdsOf, levelProgress, moduleOf, nextLesson } from '../../src/content/curriculum';
import { getLesson } from '../../src/content/lessons';
import { isLessonFree } from '../../src/billing/access';
import { useBilling } from '../../src/billing/purchases';
import { useProgress } from '../../src/state/progress';
import { openLesson } from '../../src/navigation';
import { colors, radius } from '../../src/theme';
import type { Level, Module } from '../../src/content/types';

/** Posición horizontal de cada nodo (fracción del ancho): un camino que serpentea. */
const ZIGZAG = [0.5, 0.74, 0.5, 0.26, 0.5, 0.74];
const ROW = 104;
const NODE = 72;

type NodeState = 'done' | 'current' | 'open' | 'locked';

export default function PathScreen() {
  const { t } = useTranslation();
  const progress = useProgress();
  const completed = progress.completedSet();
  const skipped = new Set(progress.skippedLevels);
  const next = nextLesson(completed, skipped);
  const [open, setOpen] = useState<string | null>(next ? moduleOf(next) : null);

  const stateOf = (mod: Module): NodeState => {
    const ids = lessonIdsOf(mod);
    if (ids.every((id) => completed.has(id))) return 'done';
    if (next && moduleOf(next) === mod.id) return 'current';
    return isUnlocked(ids[0], completed, skipped) ? 'open' : 'locked';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        <H1>{t('ui.path.title')}</H1>
        {LEVELS.map((level) => {
          const pct = levelProgress(level.id, completed);
          const states = level.modules.map(stateOf);
          const levelOpen = states.some((s) => s !== 'locked');
          return (
            <View key={level.id} style={{ gap: 12, opacity: levelOpen ? 1 : 0.55 }}>
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                  <H2 style={{ flex: 1, fontSize: 20 }}>{t(level.titleKey)}</H2>
                  <Muted>{t('ui.path.weeks', { from: level.weeks[0], to: level.weeks[1] })}</Muted>
                </View>
                <ProgressBar value={pct} />
                <Text style={{ fontSize: 14, fontWeight: '800', color: levelOpen ? colors.ink : colors.muted }}>
                  {levelOpen ? t('ui.path.levelProgress', { pct: Math.round(pct * 100) }) : t('ui.path.locked')}
                </Text>
              </Card>
              {levelOpen ? (
                <LevelPath
                  level={level}
                  states={states}
                  open={open}
                  onOpen={(id) => setOpen(open === id ? null : id)}
                  completed={completed}
                  skipped={skipped}
                  next={next}
                  checkpointStars={progress.checkpoints[level.id]?.stars}
                />
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function LevelPath(p: {
  level: Level;
  states: NodeState[];
  open: string | null;
  onOpen: (id: string) => void;
  completed: Set<string>;
  skipped: Set<number>;
  next: string | null;
  checkpointStars?: number;
}) {
  const { t } = useTranslation();
  const [width, setWidth] = useState(0);
  const count = p.level.modules.length + 1; // + checkpoint
  const xs = Array.from({ length: count }, (_, i) => ZIGZAG[i % ZIGZAG.length] * width);
  const ys = xs.map((_, i) => i * ROW + NODE / 2);
  const curve = (from: number, to: number) =>
    xs.slice(from, to + 1).reduce((d, x, k) => {
      const i = from + k;
      if (k === 0) return `M${x} ${ys[i]}`;
      const my = (ys[i - 1] + ys[i]) / 2;
      return `${d} C ${xs[i - 1]} ${my}, ${x} ${my}, ${x} ${ys[i]}`;
    }, '');
  const doneUntil = p.states.reduce((n, s, i) => (s === 'done' ? i + 1 : n), 0);
  const openMod = p.level.modules.find((m) => m.id === p.open);

  return (
    <View style={{ gap: 12 }}>
      <View onLayout={(e: { nativeEvent: { layout: { width: number } } }) => setWidth(e.nativeEvent.layout.width)} style={{ height: count * ROW - (ROW - NODE) }}>
        {width > 0 ? (
          <>
            <Svg width={width} height={count * ROW} style={{ position: 'absolute', left: 0, top: 0 }}>
              <Path d={curve(0, count - 1)} stroke={colors.line} strokeWidth={6} strokeLinecap="round" strokeDasharray="2 12" fill="none" />
              {doneUntil > 0 ? <Path d={curve(0, Math.min(doneUntil, count - 1))} stroke={colors.gold} strokeWidth={6} strokeLinecap="round" strokeDasharray="2 12" fill="none" /> : null}
            </Svg>
            {p.level.modules.map((mod, i) => {
              const ids = lessonIdsOf(mod);
              const done = ids.filter((id) => p.completed.has(id)).length;
              return (
                <ModuleNode
                  key={mod.id}
                  x={xs[i]}
                  y={i * ROW}
                  width={width}
                  state={p.states[i]}
                  selected={p.open === mod.id}
                  title={`${mod.id} ${t(mod.titleKey)}`}
                  sub={t('ui.path.lessonsDone', { done, total: ids.length })}
                  onPress={() => p.onOpen(mod.id)}
                />
              );
            })}
            <Checkpoint
              x={xs[count - 1]}
              y={(count - 1) * ROW}
              width={width}
              label={t('ui.path.checkpoint')}
              detail={t(p.level.checkpointKey)}
              stars={p.checkpointStars}
              onPress={() => router.push(`/checkpoint/${p.level.id}`)}
            />
          </>
        ) : null}
      </View>
      {openMod ? <LessonList mod={openMod} completed={p.completed} skipped={p.skipped} next={p.next} /> : null}
    </View>
  );
}

function ModuleNode(p: { x: number; y: number; width: number; state: NodeState; selected: boolean; title: string; sub: string; onPress: () => void }) {
  const { t } = useTranslation();
  const size = p.state === 'current' ? NODE + 16 : NODE;
  const bg = { done: colors.gold, current: colors.accent, open: colors.raised, locked: colors.raised }[p.state];
  const step = { done: colors.goldShadow, current: colors.accentShadow, open: colors.bar, locked: colors.bar }[p.state];
  const labelLeft = p.x > p.width / 2;
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${p.title}. ${p.sub}`}
        accessibilityState={{ disabled: p.state === 'locked', expanded: p.selected }}
        disabled={p.state === 'locked'}
        onPress={p.onPress}
        style={{
          position: 'absolute',
          left: p.x - size / 2,
          top: p.y - (size - NODE) / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderBottomWidth: 5,
          borderBottomColor: step,
          borderWidth: p.selected ? 3 : 0,
          borderColor: p.state === 'current' ? colors.accentInk : colors.ink,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {p.state === 'done' ? <StarIcon size={30} color={colors.onAccent} /> : null}
        {p.state === 'current' ? <PlayIcon size={32} /> : null}
        {p.state === 'open' ? <Text style={{ fontSize: 16, fontWeight: '900' }}>{p.title.split(' ')[0]}</Text> : null}
        {p.state === 'locked' ? (
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z" stroke={colors.muted} strokeWidth={2.2} fill="none" strokeLinecap="round" />
          </Svg>
        ) : null}
      </Pressable>
      <View
        style={{
          position: 'absolute',
          top: p.y + NODE / 2 - 24,
          width: Math.max(0, (labelLeft ? p.x : p.width - p.x) - size / 2 - 16),
          ...(labelLeft ? { right: p.width - p.x + size / 2 + 12, alignItems: 'flex-end' } : { left: p.x + size / 2 + 12 }),
          gap: 2,
        }}
      >
        {p.state === 'current' ? <Eyebrow>{t('ui.path.inProgress')}</Eyebrow> : null}
        <Text numberOfLines={2} style={{ fontSize: 14, fontWeight: '800', color: p.state === 'locked' ? colors.muted : colors.ink, textAlign: labelLeft ? 'right' : 'left' }}>{p.title}</Text>
        {p.state !== 'locked' ? <Text style={{ fontSize: 13, fontWeight: '700', color: colors.muted }}>{p.sub}</Text> : null}
      </View>
    </>
  );
}

function Checkpoint({ x, y, width, label, detail, stars, onPress }: { x: number; y: number; width: number; label: string; detail: string; stars?: number; onPress: () => void }) {
  const { t } = useTranslation();
  const starsLabel = t('ui.common.starsOf', { n: stars ?? 0 });
  const labelLeft = x > width / 2;
  const passed = stars !== undefined;
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${detail}${passed ? ` · ${starsLabel}` : ''}`}
        onPress={onPress}
        style={{
          position: 'absolute',
          left: x - 40,
          top: y + 4,
          width: 80,
          height: 64,
          borderRadius: 20,
          borderWidth: 2,
          borderStyle: passed ? 'solid' : 'dashed',
          borderColor: colors.gold,
          backgroundColor: passed ? colors.gold : colors.card,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg width={28} height={28} viewBox="0 0 24 24">
          <Path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" stroke={passed ? colors.onAccent : colors.gold} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Pressable>
      <View style={{ position: 'absolute', top: y + 14, width: Math.max(0, (labelLeft ? x : width - x) - 56), ...(labelLeft ? { right: width - x + 52, alignItems: 'flex-end' } : { left: x + 52 }) }}>
        <Text style={{ fontSize: 14, fontWeight: '900', color: colors.gold }}>{label}</Text>
        <Text numberOfLines={2} style={{ fontSize: 13, fontWeight: '700', color: colors.muted, textAlign: labelLeft ? 'right' : 'left' }}>
          {detail}
        </Text>
      </View>
    </>
  );
}

function LessonList({ mod, completed, skipped, next }: { mod: Module; completed: Set<string>; skipped: Set<number>; next: string | null }) {
  const { t } = useTranslation();
  const isPremium = useBilling((s) => s.isPremium);
  const progress = useProgress();
  return (
    <Card style={{ gap: 6 }}>
      <H2 style={{ fontSize: 18 }}>{`${mod.id} · ${t(mod.titleKey)}`}</H2>
      {lessonIdsOf(mod).map((id) => {
        const unlocked = isUnlocked(id, completed, skipped);
        const premium = !isPremium && !isLessonFree(id);
        const lesson = getLesson(id);
        const stars = progress.lessons[id]?.stars ?? 0;
        const current = id === next;
        return (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityState={{ disabled: !unlocked }}
            disabled={!unlocked}
            onPress={() => openLesson(id)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 12, borderRadius: radius.md, backgroundColor: current ? colors.accentSoft : 'transparent', opacity: unlocked ? 1 : 0.5 }}
          >
            <Text style={{ width: 44, fontSize: 13, fontWeight: '900', color: current ? colors.accentInk : colors.muted }}>{id}</Text>
            <Text style={{ flex: 1, fontSize: 15, fontWeight: current ? '900' : '700' }}>{lesson ? t(lesson.titleKey) : t('ui.common.lesson', { id })}</Text>
            {stars > 0 ? (
              <View style={{ flexDirection: 'row' }} accessibilityLabel={`${stars} / 3`}>
                {Array.from({ length: stars }, (_, i) => (
                  <StarIcon key={i} size={16} />
                ))}
              </View>
            ) : null}
            {premium ? <Chip label={t('ui.path.premium')} color={colors.gold} bg={colors.goldSoft} /> : null}
          </Pressable>
        );
      })}
    </Card>
  );
}
