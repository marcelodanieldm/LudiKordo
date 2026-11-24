import React from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { CloseButton, Eyebrow, H1, Muted } from '../../src/components/ui';
import { FretTrainer } from '../../src/components/practice/FretTrainer';
import { useLayout } from '../../src/hooks/useLayout';
import { colors } from '../../src/theme';

/** Entrenador del mástil: encontrar notas en cada cuerda, un minuto por ronda. */
export default function FretTrainerScreen() {
  const { t } = useTranslation();
  const { isTablet, width } = useLayout();
  const contentWidth = isTablet ? Math.min(width - 96, 900) : width - 40;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, width: contentWidth + 40, alignSelf: 'center' }}>
        <View style={{ alignItems: 'flex-end' }}>
          <CloseButton label={t('ui.common.close')} onPress={() => router.back()} />
        </View>
        <Eyebrow>{t('ui.fretTrainer.eyebrow')}</Eyebrow>
        <H1>{t('ui.fretTrainer.title')}</H1>
        <Muted>{t('ui.fretTrainer.intro')}</Muted>
        <FretTrainer width={contentWidth} />
      </ScrollView>
    </SafeAreaView>
  );
}
