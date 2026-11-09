import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { getLesson } from '../../src/content/lessons';
import { canOpenLesson } from '../../src/billing/access';
import { useBilling } from '../../src/billing/purchases';
import { useProgress } from '../../src/state/progress';
import { useSettings } from '../../src/state/settings';
import { useLayout } from '../../src/hooks/useLayout';
import { CartoonPlayer } from '../../src/components/CartoonPlayer';
import { Figure } from '../../src/components/Figure';
import { ExerciseView } from '../../src/components/exercises/ExerciseView';
import { Button, Card, Muted, Stars } from '../../src/components/ui';
import { colors, radius } from '../../src/theme';
import { xpFor } from '../../src/music/scoring';

type Step = 'watch' | 'learn' | 'noBass' | 'withBass' | 'result';
const STEPS: Exclude<Step, 'result'>[] = ['watch', 'learn', 'noBass', 'withBass'];

/** Lección en 4 pasos: Mira, Entiende, Practica sin bajo, Practica con bajo. */
export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { isTablet, width } = useLayout();
  const hasBass = useSettings((s) => s.hasBass);
  const isPremium = useBilling((s) => s.isPremium);
  const { recordExercise, completeLesson, addMinutes } = useProgress();
  const lesson = id ? getLesson(id) : undefined;

  const [step, setStep] = useState<Step>('watch');
  const [card, setCard] = useState(0);
  const [exIndex, setExIndex] = useState(0);
  const stars = useRef<number[]>([]);
  const startedAt = useRef(Date.now());

  const groups = useMemo(
    () => ({
      noBass: lesson?.exercises.filter((e) => !e.needsBass) ?? [],
      withBass: lesson?.exercises.filter((e) => e.needsBass) ?? [],
    }),
    [lesson],
  );

  if (!lesson || !id) {
    return <Message text={t('ui.lesson.notFound')} />;
  }
  if (!canOpenLesson(id, isPremium)) {
    return <Message text={t('ui.lesson.premiumLocked')} action={() => router.replace('/paywall')} actionLabel={t('ui.profile.seePlans')} />;
  }

  const contentWidth = isTablet ? Math.min(width - 96 - 320 - 64, 820) : width - 40;
  const lessonStars = (): 0 | 1 | 2 | 3 => {
    if (!stars.current.length) return 1;
    return Math.min(...stars.current) as 0 | 1 | 2 | 3;
  };

  const advanceStep = () => {
    const order: Step[] = ['watch', 'learn', 'noBass', 'withBass', 'result'];
    let next = order[order.indexOf(step) + 1];
    // Saltar grupos vacíos.
    if (next === 'noBass' && groups.noBass.length === 0) next = 'withBass';
    if (next === 'withBass' && groups.withBass.length === 0) next = 'result';
    if (next === 'result') finish();
    setExIndex(0);
    setStep(next);
  };

  const finish = () => {
    const s = lessonStars();
    completeLesson(lesson.id, s);
    addMinutes(Math.max(1, Math.round((Date.now() - startedAt.current) / 60000)));
  };

  const onExerciseDone = (group: 'noBass' | 'withBass') => (s: number) => {
    const ex = groups[group][exIndex];
    recordExercise(ex.id, s, ex.skills);
    stars.current.push(s);
    if (exIndex + 1 < groups[group].length) setExIndex(exIndex + 1);
    else advanceStep();
  };

  const body = (
    <View style={{ gap: 16 }}>
      {step === 'watch' ? (
        <>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.ink }}>{t(lesson.titleKey)}</Text>
          <CartoonPlayer lesson={lesson} />
          <Button testID="lesson-next" label={t('ui.common.next')} onPress={advanceStep} />
        </>
      ) : null}

      {step === 'learn' ? (
        <>
          <Card>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.ink }}>{t(lesson.cards[card].titleKey)}</Text>
            {lesson.cards[card].figure ? <Figure id={lesson.cards[card].figure!} width={contentWidth - 34} /> : null}
            <Text style={{ fontSize: 16, lineHeight: 24, color: colors.ink }}>{t(lesson.cards[card].bodyKey)}</Text>
          </Card>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            {lesson.cards.map((_, i) => (
              <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i === card ? colors.accent : colors.border }} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {card > 0 ? <Button style={{ flex: 1 }} variant="secondary" label={t('ui.common.back')} onPress={() => setCard(card - 1)} /> : null}
            <Button style={{ flex: 1 }} label={t('ui.common.next')} onPress={() => (card + 1 < lesson.cards.length ? setCard(card + 1) : advanceStep())} />
          </View>
        </>
      ) : null}

      {step === 'noBass' && groups.noBass[exIndex] ? (
        <ExerciseView exercise={groups.noBass[exIndex]} onDone={onExerciseDone('noBass')} width={contentWidth} mastery={lesson.mastery} />
      ) : null}

      {step === 'withBass' && groups.withBass[exIndex] ? (
        <>
          <ExerciseView exercise={groups.withBass[exIndex]} onDone={onExerciseDone('withBass')} width={contentWidth} mastery={lesson.mastery} />
          {!hasBass ? <Button variant="ghost" label={t('ui.common.skip')} onPress={advanceStep} /> : null}
        </>
      ) : null}

      {step === 'result' ? (
        <View style={{ alignItems: 'center', gap: 14, paddingVertical: 24 }} accessibilityLiveRegion="polite">
          <Stars count={lessonStars()} size={56} />
          <Text style={{ fontSize: 28, fontWeight: '700', color: colors.ink }}>{lessonStars() >= 1 ? t('ui.lesson.resultTitle') : t('ui.lesson.resultRetry')}</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.teal }}>
            {t('ui.lesson.xp', { xp: stars.current.reduce((a, s) => a + xpFor(s), 0) })}
          </Text>
          {lessonStars() === 3 ? <Muted>{t('ui.lesson.mastered')}</Muted> : null}
          <Button style={{ alignSelf: 'stretch' }} label={t('ui.lesson.backToToday')} onPress={() => router.replace('/(tabs)')} />
        </View>
      ) : null}
    </View>
  );

  const stepBar = (
    <View style={{ flexDirection: isTablet ? 'column' : 'row', gap: 8, flex: isTablet ? undefined : 1 }}>
      {STEPS.map((s, i) => {
        const reached = STEPS.indexOf(step as (typeof STEPS)[number]) >= i || step === 'result';
        return (
          <View key={s} style={{ flex: isTablet ? undefined : 1, gap: 4 }}>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: reached ? colors.accent : colors.border }} />
            <Text style={{ fontSize: 12, fontWeight: '800', color: step === s ? colors.ink : colors.muted }}>{t(`ui.lesson.steps.${s}`)}</Text>
          </View>
        );
      })}
    </View>
  );

  const closeButton = (
    <Pressable accessibilityRole="button" accessibilityLabel={t('ui.common.close')} onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, color: colors.ink }}>✕</Text>
    </Pressable>
  );

  if (isTablet) {
    return (
      <SafeAreaView style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg }}>
        <View style={{ width: 320, padding: 24, gap: 20, borderRightWidth: 1, borderColor: colors.border }}>
          {closeButton}
          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.muted }}>{t('ui.common.lesson', { id: lesson.id })}</Text>
          <Text style={{ fontSize: 26, fontWeight: '700', color: colors.ink }}>{t(lesson.titleKey)}</Text>
          <View style={{ backgroundColor: colors.tealSoft, borderRadius: radius.md, padding: 14, gap: 4 }}>
            <Text style={{ fontWeight: '800', color: colors.tealInk }}>{t('ui.lesson.objective')}</Text>
            <Text style={{ color: colors.tealInk, lineHeight: 20 }}>{t(lesson.objectiveKey)}</Text>
          </View>
          {stepBar}
        </View>
        <ScrollView contentContainerStyle={{ padding: 32, maxWidth: 900 }}>{body}</ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 8 }}>
        {closeButton}
        {stepBar}
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>{body}</ScrollView>
    </SafeAreaView>
  );
}

function Message({ text, action, actionLabel }: { text: string; action?: () => void; actionLabel?: string }) {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={{ flex: 1, padding: 24, gap: 16, justifyContent: 'center', backgroundColor: colors.bg }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.ink, textAlign: 'center' }}>{text}</Text>
      {action && actionLabel ? <Button label={actionLabel} onPress={action} /> : null}
      <Button variant="secondary" label={t('ui.common.back')} onPress={() => router.back()} />
    </SafeAreaView>
  );
}
