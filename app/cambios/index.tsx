import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '../../src/components/Text';
import { CloseButton, Eyebrow, H1, Muted } from '../../src/components/ui';
import { usePairLabel } from '../../src/components/practice/ChangesSession';
import { bestOf, changePairs, suggestedPair } from '../../src/music/changes';
import { HAND_INSTRUMENT } from '../../src/components/exercises/Coaching';
import { useProgress } from '../../src/state/progress';
import { colors, fonts, radius } from '../../src/theme';

/** «Cambios en un minuto»: los pares del instrumento, con el récord de cada uno y el sugerido arriba. */
export default function ChangesScreen() {
  const { t } = useTranslation();
  const label = usePairLabel();
  const history = useProgress((s) => s.changes);
  const pairs = changePairs(HAND_INSTRUMENT);
  const suggested = suggestedPair(pairs, history);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12, maxWidth: 860, width: '100%', alignSelf: 'center' }}>
        <View style={{ alignItems: 'flex-end' }}>
          <CloseButton label={t('ui.common.close')} onPress={() => router.back()} />
        </View>
        <Eyebrow>{t('ui.changes.eyebrow')}</Eyebrow>
        <H1>{t('ui.changes.title')}</H1>
        <Muted>{t('ui.changes.intro')}</Muted>
        {pairs.map((p) => {
          const best = bestOf(history[p.id]);
          const name = t('ui.changes.pair', { a: label(p, 'a'), b: label(p, 'b') });
          const isNext = p.id === suggested?.id;
          return (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel={best > 0 ? t('ui.changes.rowA11y', { name, count: best }) : name}
              onPress={() => router.push(`/cambios/${p.id}`)}
              testID={`changes-${p.id}`}
              style={{ minHeight: 64, borderRadius: radius.lg, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderWidth: isNext ? 2 : 1, borderColor: isNext ? colors.accent : colors.border }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontFamily: fonts.black, fontSize: 18, color: colors.ink }}>{name}</Text>
                {isNext ? <Text style={{ fontSize: 13, fontWeight: '800', color: colors.accentInk }}>{t('ui.changes.suggested')}</Text> : null}
              </View>
              <Text style={{ fontFamily: fonts.black, fontSize: 20, color: best > 0 ? colors.gold : colors.muted }}>{best > 0 ? t('ui.changes.bestShort', { n: best }) : t('ui.changes.notYet')}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
