import React from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { CloseButton, Eyebrow, H1, Muted } from '../../src/components/ui';
import { RhythmTrainer } from '../../src/components/practice/RhythmTrainer';
import { useLayout } from '../../src/hooks/useLayout';
import { colors } from '../../src/theme';

/** Entrenador de ritmo: leer y tocar cuatro compases con el clic. */
export default function RhythmTrainerScreen() {
  const { t } = useTranslation();
  const { isTablet, width } = useLayout();
  const contentWidth = isTablet ? Math.min(width - 96, 900) : width - 40;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, width: contentWidth + 40, alignSelf: 'center' }}>
        <View style={{ alignItems: 'flex-end' }}>
          <CloseButton label={t('ui.common.close')} onPress={() => router.back()} />
        </View>
        <Eyebrow>{t('ui.rhythmTrainer.eyebrow')}</Eyebrow>
        <H1>{t('ui.rhythmTrainer.title')}</H1>
        <Muted>{t('ui.rhythmTrainer.intro')}</Muted>
        <RhythmTrainer width={contentWidth} />
      </ScrollView>
    </SafeAreaView>
  );
}
