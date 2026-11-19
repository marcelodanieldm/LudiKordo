import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '../../src/components/Text';
import { Chip, CloseButton, Eyebrow, H1, Muted, StarIcon } from '../../src/components/ui';
import { useModuleLabel, useDrills, type DrillStatus } from '../../src/components/PracticeHooks';
import { DRILL_CATEGORIES, type DrillCategory } from '../../src/content/practice';
import { colors, radius } from '../../src/theme';

/** Práctica de habilidades: ejercicios por habilidad, con acompañamiento y evaluación en vivo. */
export default function DrillsScreen() {
  const { t } = useTranslation();
  const all = useDrills();
  const [cat, setCat] = useState<DrillCategory | undefined>(undefined);
  // Solo las categorías que tienen ejercicios en este instrumento.
  const cats = DRILL_CATEGORIES.filter((c) => all.some((d) => d.drill.category === c));
  const list = all
    .filter((d) => !cat || d.drill.category === cat)
    .sort((a, b) => Number(a.state !== 'open') - Number(b.state !== 'open') || a.drill.level - b.drill.level);
  const options: (DrillCategory | undefined)[] = [undefined, ...cats];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, maxWidth: 860, width: '100%', alignSelf: 'center' }}>
        <View style={{ alignItems: 'flex-end' }}>
          <CloseButton label={t('ui.common.close')} onPress={() => router.back()} />
        </View>
        <Eyebrow>{t('ui.drills.eyebrow')}</Eyebrow>
        <H1>{t('ui.drills.title')}</H1>
        <Muted>{t('ui.drills.intro')}</Muted>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {options.map((c) => {
            const selected = c === cat;
            return (
              <Pressable
                key={c ?? 'all'}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setCat(c)}
                style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: 22, justifyContent: 'center', backgroundColor: selected ? colors.accent : colors.card, borderWidth: 1, borderColor: selected ? colors.accent : colors.border }}
              >
                <Text style={{ fontWeight: '800', color: selected ? colors.onAccent : colors.ink }}>{c ? t(`ui.drills.category.${c}`) : t('ui.drills.all')}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {list.map((s) => (
          <DrillRow key={s.drill.id} status={s} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function DrillRow({ status }: { status: DrillStatus }) {
  const { t } = useTranslation();
  const moduleLabel = useModuleLabel();
  const { drill, state, missing, stars } = status;
  const open = state === 'open';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={open ? undefined : t('ui.drills.lockedHint')}
      onPress={() => router.push(`/practica/${drill.id}`)}
      testID={`drill-${drill.id}`}
      style={{ minHeight: 72, padding: 14, gap: 6, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderStyle: open ? 'solid' : 'dashed' }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ flex: 1, fontSize: 17, fontWeight: '900' }}>{t(drill.titleKey)}</Text>
        {stars > 0 ? (
          <View accessible accessibilityRole="text" style={{ flexDirection: 'row' }} accessibilityLabel={t('ui.common.starsOf', { n: stars })}>
            {Array.from({ length: stars }, (_, i) => (
              <StarIcon key={i} size={16} />
            ))}
          </View>
        ) : null}
      </View>
      <Muted>{t('ui.drills.meta', { category: t(`ui.drills.category.${drill.category}`), level: drill.level, bpm: drill.tempoSteps[0] })}</Muted>
      {state === 'locked' && missing ? (
        <Text style={{ fontSize: 14, color: colors.accentInk, fontWeight: '700' }}>{t('ui.drills.needs', { module: moduleLabel(missing) })}</Text>
      ) : null}
      {state === 'premium' ? <Chip label={t('ui.path.premium')} color={colors.gold} bg={colors.goldSoft} /> : null}
    </Pressable>
  );
}
