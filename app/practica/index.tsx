import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '../../src/components/Text';
import { Chip, CloseButton, Eyebrow, H1, H2, Muted, StarIcon } from '../../src/components/ui';
import { usePracticeList } from '../../src/components/SongbookHooks';
import { colors, radius } from '../../src/theme';
import type { Skill } from '../../src/content/types';
import type { PracticeStatus } from '../../src/content/practice';

const ORDER: Skill[] = ['rhythm', 'technique', 'fretboard', 'theory'];

/** Práctica de habilidades: ejercicios en vivo con banda, agrupados por habilidad. */
export default function PracticeListScreen() {
  const { t } = useTranslation();
  const list = usePracticeList();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, maxWidth: 860, width: '100%', alignSelf: 'center' }}>
        <View style={{ alignItems: 'flex-end' }}>
          <CloseButton label={t('ui.common.close')} onPress={() => router.back()} />
        </View>
        <Eyebrow>{t('ui.practiceLive.eyebrow')}</Eyebrow>
        <H1>{t('ui.practiceLive.title')}</H1>
        <Muted>{t('ui.practiceLive.intro')}</Muted>
        {ORDER.map((skill) => {
          const items = list.filter((s) => s.item.focus === skill);
          if (items.length === 0) return null;
          return (
            <View key={skill} style={{ gap: 10 }}>
              <H2 style={{ fontSize: 20, marginTop: 8 }}>{t(`ui.progress.skill.${skill}`)}</H2>
              {items.map((s) => (
                <Row key={s.item.id} status={s} />
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ status }: { status: PracticeStatus }) {
  const { t } = useTranslation();
  const { item, state, missing, stars } = status;
  return (
    <Pressable
      accessibilityRole="button"
      testID={`drill-${item.id}`}
      onPress={() => router.push(`/practica/${item.id}`)}
      style={{ minHeight: 72, padding: 14, gap: 6, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderStyle: state === 'open' ? 'solid' : 'dashed' }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ flex: 1, fontSize: 17, fontWeight: '900' }}>{t(item.titleKey)}</Text>
        {stars > 0 ? (
          <View accessible accessibilityRole="text" accessibilityLabel={t('ui.common.starsOf', { n: stars })} style={{ flexDirection: 'row' }}>
            {Array.from({ length: stars }, (_, i) => (
              <StarIcon key={i} size={16} />
            ))}
          </View>
        ) : null}
      </View>
      <Muted>{t('ui.practiceLive.meta', { style: t(`ui.practiceLive.style.${item.style}`), level: item.level, bpm: item.bpm })}</Muted>
      {state === 'locked' ? (
        <Text style={{ fontSize: 14, color: colors.accentInk, fontWeight: '700' }}>
          {t('ui.songbook.needs', { modules: missing.map((m) => `${m} ${t(`content.module.${m.replace('.', '_')}`)}`).join(' · ') })}
        </Text>
      ) : null}
      {state === 'premium' ? <Chip label={t('ui.path.premium')} color={colors.gold} bg={colors.goldSoft} /> : null}
    </Pressable>
  );
}
