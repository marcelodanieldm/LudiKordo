import React, { useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from '../../src/components/Text';
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
import { Button, Card, CloseButton, Eyebrow, Muted, Stars } from '../../src/components/ui';
import { Kordi } from '../../src/components/Kordi';
import { colors, fonts, radius } from '../../src/theme';
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
          {!isTablet ? (
            <View style={{ gap: 4 }}>
              <Muted>{t('ui.common.lesson', { id: lesson.id })}</Muted>
              <Text style={{ fontFamily: fonts.display, fontSize: 28, lineHeight: 33 }}>{t(lesson.titleKey)}</Text>
            </View>
          ) : null}
          <CartoonPlayer lesson={lesson} />
          {!isTablet ? <Objective text={t(lesson.objectiveKey)} /> : null}
          <Button testID="lesson-next" label={t('ui.common.next')} onPress={advanceStep} />
        </>
      ) : null}

      {step === 'learn' ? (
        <>
          <Card>
            <Text style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 29 }}>{t(lesson.cards[card].titleKey)}</Text>
            {lesson.cards[card].figure ? <Figure id={lesson.cards[card].figure!} width={contentWidth - 34} /> : null}
            <Text style={{ fontSize: 16, lineHeight: 24, color: colors.ink }}>{t(lesson.cards[card].bodyKey)}</Text>
          </Card>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            {lesson.cards.map((_, i) => (
              <View key={i} style={{ width: i === card ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: i === card ? colors.accent : colors.line }} />
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
        <View style={{ alignItems: 'center', gap: 14, paddingVertical: 12 }} accessibilityLiveRegion="polite">
          <Kordi size={190} mood={lessonStars() >= 1 ? 'happy' : 'normal'} light="glow" />
          <Stars count={lessonStars()} size={48} />
          <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 36, textAlign: 'center' }}>{lessonStars() >= 1 ? t('ui.lesson.resultTitle') : t('ui.lesson.resultRetry')}</Text>
          {lessonStars() === 3 ? <Muted style={{ fontSize: 16 }}>{t('ui.lesson.mastered')}</Muted> : null}
          <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14, backgroundColor: colors.goldSoft }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: colors.gold }}>{t('ui.lesson.xp', { xp: stars.current.reduce((a, s) => a + xpFor(s), 0) })}</Text>
          </View>
          <Button style={{ alignSelf: 'stretch', marginTop: 12 }} label={t('ui.lesson.backToToday')} onPress={() => router.replace('/(tabs)')} />
        </View>
      ) : null}
    </View>
  );

  const stepBar = (
    <View style={{ flexDirection: isTablet ? 'column' : 'row', gap: 8, flex: isTablet ? undefined : 1 }}>
      {STEPS.map((s, i) => {
        const at = step === 'result' ? STEPS.length : STEPS.indexOf(step as (typeof STEPS)[number]);
        const current = i === at;
        return (
          <View key={s} accessibilityState={{ selected: current }} style={{ flex: isTablet ? undefined : 1, gap: 5 }}>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: i < at ? colors.teal : current ? colors.accent : colors.line }} />
            <Text style={{ fontSize: 11, fontWeight: current ? '900' : '800', color: current ? colors.accentInk : colors.muted }}>{t(`ui.lesson.steps.${s}`)}</Text>
          </View>
        );
      })}
    </View>
  );

  const closeButton = <CloseButton label={t('ui.common.close')} onPress={() => router.back()} />;

  if (isTablet) {
    return (
      <SafeAreaView style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg }}>
        <View style={{ width: 320, padding: 24, gap: 20, borderRightWidth: 1, borderColor: colors.border }}>
          {closeButton}
          <Muted>{t('ui.common.lesson', { id: lesson.id })}</Muted>
          <Text style={{ fontFamily: fonts.display, fontSize: 28, lineHeight: 33 }}>{t(lesson.titleKey)}</Text>
          <Objective text={t(lesson.objectiveKey)} />
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

function Objective({ text }: { text: string }) {
  const { t } = useTranslation();
  return (
    <View style={{ backgroundColor: colors.tealSoft, borderRadius: radius.lg, padding: 14, gap: 4 }}>
      <Eyebrow color={colors.teal}>{t('ui.lesson.objective')}</Eyebrow>
      <Text style={{ fontSize: 15, fontWeight: '700', lineHeight: 21 }}>{text}</Text>
    </View>
  );
}

function Message({ text, action, actionLabel }: { text: string; action?: () => void; actionLabel?: string }) {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={{ flex: 1, padding: 24, gap: 16, justifyContent: 'center', backgroundColor: colors.bg }}>
      <Kordi size={140} />
      <Text style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 30, textAlign: 'center' }}>{text}</Text>
      {action && actionLabel ? <Button label={actionLabel} onPress={action} /> : null}
      <Button variant="secondary" label={t('ui.common.back')} onPress={() => router.back()} />
    </SafeAreaView>
  );
}
