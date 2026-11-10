import React, { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from '../../src/components/Text';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { checkpointResult, getCheckpoint, PASS_AVERAGE } from '../../src/content/checkpoints';
import { LEVELS, lessonIdsOf } from '../../src/content/curriculum';
import { canOpenLesson } from '../../src/billing/access';
import { useBilling } from '../../src/billing/purchases';
import { useProgress } from '../../src/state/progress';
import { useLayout } from '../../src/hooks/useLayout';
import { ExerciseView } from '../../src/components/exercises/ExerciseView';
import { Button, Card, CloseButton, Eyebrow, Muted, Segments, Stars } from '../../src/components/ui';
import { Kordi } from '../../src/components/Kordi';
import { colors, fonts, radius } from '../../src/theme';

type Phase = 'intro' | 'test' | 'result';

/** Checkpoint de un nivel: pruebas seguidas, sin cartoon ni tarjetas. */
export default function CheckpointScreen() {
  const { level: param } = useLocalSearchParams<{ level: string }>();
  const level = Number(param);
  const { t } = useTranslation();
  const { isTablet, width } = useLayout();
  const isPremium = useBilling((s) => s.isPremium);
  const { recordExercise, passCheckpoint, addMinutes } = useProgress();
  const completed = useProgress((s) => s.completedSet)();
  const cp = getCheckpoint(level);
  const lvl = LEVELS.find((l) => l.id === level);

  const [phase, setPhase] = useState<Phase>('intro');
  const [part, setPart] = useState(0);
  const [result, setResult] = useState<{ stars: 0 | 1 | 2 | 3; passed: boolean } | null>(null);
  const stars = useRef<number[]>([]);
  const startedAt = useRef(Date.now());

  const close = <CloseButton label={t('ui.common.close')} onPress={() => router.back()} />;

  if (!cp || !lvl) {
    return (
      <Shell close={close}>
        <Muted>{t('ui.checkpoint.notReady')}</Muted>
      </Shell>
    );
  }
  const levelIds = lvl.modules.flatMap(lessonIdsOf);
  // Mismo acceso que la última lección del nivel.
  if (!canOpenLesson(levelIds[levelIds.length - 1], isPremium)) {
    return (
      <Shell close={close}>
        <Text style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 30 }}>{t('ui.checkpoint.premium', { level })}</Text>
        <Button label={t('ui.profile.seePlans')} onPress={() => router.replace('/paywall')} />
      </Shell>
    );
  }
  const levelCompleted = levelIds.every((id) => completed.has(id));
  const contentWidth = isTablet ? Math.min(width - 96, 820) : width - 40;

  const start = () => {
    stars.current = [];
    startedAt.current = Date.now();
    setPart(0);
    setResult(null);
    setPhase('test');
  };

  const onPartDone = (s: number) => {
    const ex = cp.parts[part];
    recordExercise(ex.id, s, ex.skills);
    stars.current.push(s);
    if (part + 1 < cp.parts.length) {
      setPart(part + 1);
      return;
    }
    const r = checkpointResult(stars.current);
    if (r.passed) passCheckpoint(level, r.stars, levelCompleted);
    addMinutes(Math.max(1, Math.round((Date.now() - startedAt.current) / 60000)));
    setResult(r);
    setPhase('result');
  };

  return (
    <Shell close={close}>
      <View style={{ gap: 4 }}>
        <Eyebrow color={colors.gold}>{t('ui.checkpoint.title', { level })}</Eyebrow>
        <Text style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 31 }}>{t(cp.titleKey)}</Text>
      </View>

      {phase === 'intro' ? (
        <>
          <Card style={{ alignItems: 'center' }}>
            <Kordi size={150} light="beam" />
            <Text style={{ fontSize: 16, fontWeight: '700', lineHeight: 23, textAlign: 'center' }}>{t(cp.introKey)}</Text>
            <Muted style={{ textAlign: 'center' }}>{t('ui.checkpoint.rules', { count: cp.parts.length, avg: PASS_AVERAGE })}</Muted>
            {!levelCompleted ? (
              <View style={{ backgroundColor: colors.goldSoft, borderRadius: radius.md, padding: 12, alignSelf: 'stretch' }}>
                <Text style={{ color: colors.gold, fontWeight: '800', lineHeight: 20 }}>{t('ui.checkpoint.skipNote', { next: level + 1 })}</Text>
              </View>
            ) : null}
          </Card>
          <Button label={t('ui.checkpoint.start')} onPress={start} />
        </>
      ) : null}

      {phase === 'test' ? (
        <View style={{ gap: 14 }}>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '900', color: colors.muted }}>{t('ui.checkpoint.part', { n: part + 1, total: cp.parts.length })}</Text>
            <Segments total={cp.parts.length} done={part} current={part} color={colors.gold} />
          </View>
          <ExerciseView key={cp.parts[part].id} exercise={cp.parts[part]} onDone={onPartDone} width={contentWidth} mastery={0.8} />
        </View>
      ) : null}

      {phase === 'result' && result ? (
        <View style={{ alignItems: 'center', gap: 14 }} accessibilityLiveRegion="polite">
          <Kordi size={170} mood={result.passed ? 'happy' : 'normal'} light={result.passed ? 'glow' : 'none'} />
          <Stars count={result.stars} size={44} />
          <Text style={{ fontFamily: fonts.display, fontSize: 28, lineHeight: 34, textAlign: 'center' }}>
            {result.passed ? t('ui.checkpoint.passed') : t('ui.checkpoint.failed')}
          </Text>
          {result.passed && !levelCompleted ? <Muted style={{ textAlign: 'center' }}>{t('ui.checkpoint.unlocked', { next: level + 1 })}</Muted> : null}
          <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch' }}>
            {!result.passed ? <Button style={{ flex: 1 }} variant="secondary" label={t('ui.exercise.retry')} onPress={start} /> : null}
            <Button style={{ flex: 1 }} label={t('ui.checkpoint.backToPath')} onPress={() => router.replace('/ruta')} />
          </View>
        </View>
      ) : null}
    </Shell>
  );
}

function Shell({ children, close }: { children: React.ReactNode; close: React.ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, maxWidth: 860, width: '100%', alignSelf: 'center' }}>
        <View style={{ alignItems: 'flex-end' }}>{close}</View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
