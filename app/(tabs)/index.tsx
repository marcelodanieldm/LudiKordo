import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { Button, Card, H1, Muted } from '../../src/components/ui';
import { useProgress } from '../../src/state/progress';
import { useSettings } from '../../src/state/settings';
import { currentWeekDays, isoDate, needsReview, weeklyStreak } from '../../src/state/rules';
import { nextLesson } from '../../src/content/curriculum';
import { getLesson } from '../../src/content/lessons';
import { openLesson } from '../../src/navigation';
import { colors, radius } from '../../src/theme';
import type { Skill } from '../../src/content/types';

const DAY_LETTERS: Record<string, string[]> = {
  es: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  pt: ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'],
};

export default function Today() {
  const { t, i18n } = useTranslation();
  const { dailyMinutes, weeklyDays } = useSettings();
  const progress = useProgress();
  const today = isoDate();
  const completed = progress.completedSet();
  const next = nextLesson(completed);
  const lesson = next ? getLesson(next) : undefined;
  const days = progress.practiceDays();
  const week = currentWeekDays(days, today);
  const streak = weeklyStreak(days, weeklyDays, today);
  const minutesToday = progress.minutesByDay[today] ?? 0;
  const review = (Object.keys(progress.skills) as Skill[]).find((s) => needsReview(progress.skills[s].last, today));

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        <H1>{t('ui.today.hello')}</H1>

        <View style={{ backgroundColor: colors.night, borderRadius: radius.xl, padding: 20, gap: 10 }}>
          {next ? (
            <>
              <Text style={{ color: '#F7B58F', fontWeight: '800', fontSize: 13, textTransform: 'uppercase' }}>{t('ui.today.continueCard')}</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 21, fontWeight: '700' }}>
                {t('ui.common.lesson', { id: next })}
                {lesson ? ` · ${t(lesson.titleKey)}` : ''}
              </Text>
              {lesson ? <Text style={{ color: colors.nightMuted }}>{t('ui.common.minutes', { count: lesson.minutes })}</Text> : null}
              <Button testID="today-continue" label={`▶ ${t('ui.common.continue')}`} onPress={() => openLesson(next)} />
            </>
          ) : (
            <Text style={{ color: '#FFFFFF', fontSize: 18 }}>{t('ui.today.courseDone')}</Text>
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Card style={{ flex: 1 }}>
            <Muted>{t('ui.today.dailyGoal')}</Muted>
            <Ring value={minutesToday} goal={dailyMinutes} />
          </Card>
          <Card style={{ flex: 1 }}>
            <Muted>{t('ui.today.weekStreak', { count: streak })}</Muted>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {week.map((on, i) => (
                <View key={i} style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.teal : colors.track }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: on ? '#FFFFFF' : colors.muted }}>{(DAY_LETTERS[i18n.language] ?? DAY_LETTERS.en)[i]}</Text>
                </View>
              ))}
            </View>
            <Muted>{t('ui.today.weekGoal', { done: week.filter(Boolean).length, goal: weeklyDays })}</Muted>
          </Card>
        </View>

        {review ? (
          <Card style={{ backgroundColor: colors.tealSoft, borderColor: colors.tealSoft }}>
            <Text style={{ color: colors.tealInk, fontWeight: '700' }}>{t('ui.today.review', { skill: t(`ui.progress.skill.${review}`) })}</Text>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Ring({ value, goal }: { value: number; goal: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const frac = Math.min(1, goal ? value / goal : 0);
  return (
    <Svg width={72} height={72} viewBox="0 0 72 72" accessibilityLabel={`${value} / ${goal} min`}>
      <Circle cx={36} cy={36} r={r} fill="none" stroke={colors.track} strokeWidth={8} />
      <Circle cx={36} cy={36} r={r} fill="none" stroke={colors.teal} strokeWidth={8} strokeLinecap="round" strokeDasharray={`${c * frac} ${c}`} rotation={-90} origin="36, 36" />
      <SvgText x={36} y={41} textAnchor="middle" fontSize={15} fontWeight="800" fill={colors.ink}>
        {`${value}/${goal}`}
      </SvgText>
    </Svg>
  );
}
