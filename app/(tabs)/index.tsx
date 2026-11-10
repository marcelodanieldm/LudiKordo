import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../src/components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import Svg, { Circle, Defs, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import { Button, Card, Chip, Eyebrow, H1, Muted, PlayIcon, Segments } from '../../src/components/ui';
import { Kordi } from '../../src/components/Kordi';
import { useProgress } from '../../src/state/progress';
import { useSettings } from '../../src/state/settings';
import { currentWeekDays, isoDate, needsReview, weeklyStreak } from '../../src/state/rules';
import { LEVELS, lessonIdsOf, moduleOf, nextLesson } from '../../src/content/curriculum';
import { getLesson } from '../../src/content/lessons';
import { openLesson } from '../../src/navigation';
import { colors, fonts, radius } from '../../src/theme';
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
  const next = nextLesson(completed, new Set(progress.skippedLevels));
  const lesson = next ? getLesson(next) : undefined;
  const mod = next ? LEVELS.flatMap((l) => l.modules).find((m) => m.id === moduleOf(next)) : undefined;
  const modIds = mod ? lessonIdsOf(mod) : [];
  const days = progress.practiceDays();
  const week = currentWeekDays(days, today);
  const streak = weeklyStreak(days, weeklyDays, today);
  const minutesToday = progress.minutesByDay[today] ?? 0;
  const review = (Object.keys(progress.skills) as Skill[]).find((s) => needsReview(progress.skills[s].last, today));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <H1>{t('ui.today.hello')}</H1>
          <View accessible accessibilityRole="text" accessibilityLabel={t('ui.today.weekStreak', { count: streak })} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: colors.raised }}>
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-4-1-6 1-9z" fill={colors.gold} />
            </Svg>
            <Text style={{ fontSize: 15, fontWeight: '900', color: colors.gold }}>{streak}</Text>
          </View>
        </View>

        <View style={{ borderRadius: radius.xxl, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 20, gap: 14, overflow: 'hidden' }}>
          <Svg width={230} height={230} viewBox="0 0 230 230" style={{ position: 'absolute', right: -50, top: -20 }}>
            <Defs>
              <RadialGradient id="spot" cx="50%" cy="45%" r="50%">
                <Stop offset="0" stopColor={colors.accent} stopOpacity={0.32} />
                <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={115} cy={115} r={115} fill="url(#spot)" />
          </Svg>
          {next ? (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <View style={{ flex: 1, gap: 6 }}>
                  <Eyebrow>{t('ui.today.continueCard')}</Eyebrow>
                  <Muted>
                    {t('ui.common.lesson', { id: next })}
                    {mod ? ` · ${t(mod.titleKey)}` : ''}
                  </Muted>
                  {lesson ? <Text style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 30 }}>{t(lesson.titleKey)}</Text> : null}
                  {lesson ? <Chip label={t('ui.common.minutes', { count: lesson.minutes })} /> : null}
                </View>
                <Kordi size={124} />
              </View>
              {modIds.length ? <Segments total={modIds.length} done={modIds.filter((id) => completed.has(id)).length} current={modIds.indexOf(next)} /> : null}
              <Button testID="today-continue" icon={<PlayIcon />} label={t('ui.common.continue')} onPress={() => openLesson(next)} />
            </>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ flex: 1, fontFamily: fonts.display, fontSize: 22, lineHeight: 28 }}>{t('ui.today.courseDone')}</Text>
              <Kordi size={110} mood="happy" />
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Card style={{ flex: 1 }}>
            <Muted>{t('ui.today.dailyGoal')}</Muted>
            <Ring value={minutesToday} goal={dailyMinutes} unit={t('ui.common.minutes', { count: dailyMinutes })} />
          </Card>
          <Card style={{ flex: 1 }}>
            <Muted>{t('ui.today.weekStreak', { count: streak })}</Muted>
            <View style={{ flexDirection: 'row', gap: 3 }}>
              {week.map((on, i) => (
                <View key={i} style={{ flex: 1, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.gold : colors.raised }}>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: on ? colors.onAccent : colors.muted }}>{(DAY_LETTERS[i18n.language] ?? DAY_LETTERS.en)[i]}</Text>
                </View>
              ))}
            </View>
            <Text style={{ fontSize: 14, fontWeight: '700' }}>{t('ui.today.weekGoal', { done: week.filter(Boolean).length, goal: weeklyDays })}</Text>
          </Card>
        </View>

        {review ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/practicar')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingHorizontal: 16, borderRadius: radius.lg, backgroundColor: colors.tealSoft }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' }}>
              <Svg width={20} height={20} viewBox="0 0 24 24">
                <Path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" stroke={colors.onTeal} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
            <Text style={{ flex: 1, fontSize: 15, fontWeight: '800' }}>{t('ui.today.review', { skill: t(`ui.progress.skill.${review}`) })}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Ring({ value, goal, unit }: { value: number; goal: number; unit: string }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const frac = Math.min(1, goal ? value / goal : 0);
  return (
    <Svg width={84} height={84} viewBox="0 0 84 84" accessibilityLabel={`${value} / ${unit}`}>
      <Circle cx={42} cy={42} r={r} fill="none" stroke={colors.raised} strokeWidth={10} />
      <Circle cx={42} cy={42} r={r} fill="none" stroke={colors.teal} strokeWidth={10} strokeLinecap="round" strokeDasharray={`${c * frac} ${c}`} rotation={-90} origin="42, 42" />
      <SvgText x={42} y={41} textAnchor="middle" fontSize={20} fontFamily={fonts.display} fill={colors.ink}>
        {String(value)}
      </SvgText>
      <SvgText x={42} y={58} textAnchor="middle" fontSize={11} fontFamily={fonts.extrabold} fill={colors.muted}>
        {`/ ${unit}`}
      </SvgText>
    </Svg>
  );
}
