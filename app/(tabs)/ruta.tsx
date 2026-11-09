import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Card, H1, Muted, ProgressBar } from '../../src/components/ui';
import { LEVELS, isUnlocked, lessonIdsOf, levelProgress, moduleOf, nextLesson } from '../../src/content/curriculum';
import { getLesson } from '../../src/content/lessons';
import { isLessonFree } from '../../src/billing/access';
import { useBilling } from '../../src/billing/purchases';
import { useProgress } from '../../src/state/progress';
import { openLesson } from '../../src/navigation';
import { colors, radius } from '../../src/theme';

export default function Path() {
  const { t } = useTranslation();
  const progress = useProgress();
  const isPremium = useBilling((s) => s.isPremium);
  const completed = progress.completedSet();
  const skipped = new Set(progress.skippedLevels);
  const next = nextLesson(completed);
  const [open, setOpen] = useState<string | null>(next ? moduleOf(next) : null);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        <H1>{t('ui.path.title')}</H1>
        {LEVELS.map((level) => {
          const pct = levelProgress(level.id, completed);
          const levelOpen = level.modules.some((m) => isUnlocked(lessonIdsOf(m)[0], completed, skipped));
          return (
            <Card key={level.id} style={!levelOpen ? { opacity: 0.6 } : undefined}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: colors.ink, flex: 1 }}>{t(level.titleKey)}</Text>
                <Muted>{levelOpen ? t('ui.path.levelProgress', { pct: Math.round(pct * 100) }) : t('ui.path.locked')}</Muted>
              </View>
              <Muted>{t('ui.path.weeks', { from: level.weeks[0], to: level.weeks[1] })}</Muted>
              <ProgressBar value={pct} />
              {levelOpen
                ? level.modules.map((mod) => {
                    const ids = lessonIdsOf(mod);
                    const done = ids.filter((id) => completed.has(id)).length;
                    const expanded = open === mod.id;
                    return (
                      <View key={mod.id} style={{ gap: 6 }}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityState={{ expanded }}
                          onPress={() => setOpen(expanded ? null : mod.id)}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingHorizontal: 12, borderRadius: 12, borderWidth: expanded ? 2 : 1, borderColor: expanded ? colors.teal : colors.border, backgroundColor: expanded ? colors.tealSoft : colors.card }}
                        >
                          <View style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: done === ids.length ? colors.teal : colors.track }}>
                            <Text style={{ fontWeight: '800', fontSize: 13, color: done === ids.length ? '#FFFFFF' : colors.muted }}>{mod.id}</Text>
                          </View>
                          <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: colors.ink }}>{t(mod.titleKey)}</Text>
                          <Muted>{`${done}/${ids.length}`}</Muted>
                        </Pressable>
                        {expanded
                          ? ids.map((id) => {
                              const unlocked = isUnlocked(id, completed, skipped);
                              const premium = !isPremium && !isLessonFree(id);
                              const lesson = getLesson(id);
                              const stars = progress.lessons[id]?.stars ?? 0;
                              return (
                                <Pressable
                                  key={id}
                                  accessibilityRole="button"
                                  accessibilityState={{ disabled: !unlocked }}
                                  disabled={!unlocked}
                                  onPress={() => openLesson(id)}
                                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, marginLeft: 48, paddingHorizontal: 12, borderRadius: radius.sm, backgroundColor: id === next ? colors.accentSoft : 'transparent', opacity: unlocked ? 1 : 0.5 }}
                                >
                                  <Text style={{ flex: 1, color: colors.ink, fontWeight: id === next ? '800' : '600' }}>
                                    {id} {lesson ? `· ${t(lesson.titleKey)}` : ''}
                                  </Text>
                                  {stars > 0 ? <Text style={{ color: colors.gold, fontWeight: '800' }}>{'★'.repeat(stars)}</Text> : null}
                                  {premium ? <Text style={{ fontSize: 12, fontWeight: '800', color: colors.accentInk }}>{t('ui.path.premium')}</Text> : null}
                                </Pressable>
                              );
                            })
                          : null}
                      </View>
                    );
                  })
                : null}
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: colors.accentSoft, borderRadius: 12, padding: 12 }}>
                <Text style={{ color: colors.accent, fontSize: 16 }}>◆</Text>
                <Text style={{ flex: 1, fontWeight: '700', color: colors.ink }}>{t(level.checkpointKey)}</Text>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
