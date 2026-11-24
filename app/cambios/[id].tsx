import React from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { CloseButton, Eyebrow, H1, Muted } from '../../src/components/ui';
import { ChangesSession, usePairLabel } from '../../src/components/practice/ChangesSession';
import { HAND_INSTRUMENT } from '../../src/components/exercises/Coaching';
import { pairById } from '../../src/music/changes';
import { useLayout } from '../../src/hooks/useLayout';
import { colors } from '../../src/theme';

/** Una ronda de cambios en un minuto para el par elegido. */
export default function ChangesPairScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { isTablet, width } = useLayout();
  const label = usePairLabel();
  const pair = pairById(HAND_INSTRUMENT, String(id));
  const contentWidth = isTablet ? Math.min(width - 96, 820) : width - 40;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, width: contentWidth + 40, alignSelf: 'center' }}>
        <View style={{ alignItems: 'flex-end' }}>
          <CloseButton label={t('ui.common.close')} onPress={() => router.back()} />
        </View>
        {pair ? (
          <>
            <Eyebrow>{t('ui.changes.title')}</Eyebrow>
            <H1>{t('ui.changes.pair', { a: label(pair, 'a'), b: label(pair, 'b') })}</H1>
            <ChangesSession pair={pair} width={contentWidth} />
          </>
        ) : (
          <Muted>{t('ui.changes.notFound')}</Muted>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
