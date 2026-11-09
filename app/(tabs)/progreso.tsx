import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Card, H1, Muted, ProgressBar } from '../../src/components/ui';
import { skillLevel, useProgress } from '../../src/state/progress';
import { useSettings } from '../../src/state/settings';
import { isoDate, weeklyStreak } from '../../src/state/rules';
import { totalLessons } from '../../src/content/curriculum';
import { colors } from '../../src/theme';
import type { Skill } from '../../src/content/types';

const SKILLS: Skill[] = ['technique', 'rhythm', 'fretboard', 'theory', 'ear'];
const BADGE_LABEL: Record<string, Record<string, string>> = {
  'first-lesson': { es: 'Primera lección', en: 'First lesson', pt: 'Primeira aula' },
  'in-tune': { es: 'Afinado', en: 'In tune', pt: 'Afinado' },
  'days-7': { es: '7 días', en: '7 days', pt: '7 dias' },
  'days-30': { es: '30 días', en: '30 days', pt: '30 dias' },
  'days-100': { es: '100 días', en: '100 days', pt: '100 dias' },
};

export default function Progress() {
  const { t, i18n } = useTranslation();
  const p = useProgress();
  const weeklyDays = useSettings((s) => s.weeklyDays);
  const minutes = Object.values(p.minutesByDay).reduce((a, b) => a + b, 0);
  const lessons = p.completedSet().size;
  const streak = weeklyStreak(p.practiceDays(), weeklyDays, isoDate());

  const stats = [
    { value: String(minutes), label: t('ui.progress.minutes') },
    { value: `${lessons}/${totalLessons()}`, label: t('ui.progress.lessons') },
    { value: String(streak), label: t('ui.progress.streakWeeks') },
  ];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        <H1>{t('ui.progress.title')}</H1>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {stats.map((s) => (
            <Card key={s.label} style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: colors.ink }}>{s.value}</Text>
              <Muted>{s.label}</Muted>
            </Card>
          ))}
        </View>
        <Card>
          <Text style={{ fontSize: 17, fontWeight: '800', color: colors.ink }}>{t('ui.progress.skills')}</Text>
          {SKILLS.map((sk, i) => {
            const v = skillLevel(p.skills[sk].points);
            return (
              <View key={sk} style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: '700', color: colors.ink }}>{t(`ui.progress.skill.${sk}`)}</Text>
                  <Muted>{`${v}%`}</Muted>
                </View>
                <ProgressBar value={v / 100} color={i % 2 === 0 ? colors.teal : colors.accent} />
              </View>
            );
          })}
        </Card>
        <Card>
          <Text style={{ fontSize: 17, fontWeight: '800', color: colors.ink }}>{t('ui.progress.badges')}</Text>
          {p.badges.length === 0 ? (
            <Muted>{t('ui.progress.noBadges')}</Muted>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {p.badges.map((b) => (
                <Text key={b} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, overflow: 'hidden', backgroundColor: colors.accentSoft, color: colors.accentInk, fontWeight: '700' }}>
                  ★ {BADGE_LABEL[b]?.[i18n.language] ?? b}
                </Text>
              ))}
            </View>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
