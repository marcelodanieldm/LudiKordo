import React from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '../../src/components/Text';
import { Button, Card, CloseButton, Eyebrow, H1, Muted } from '../../src/components/ui';
import { LiveSession } from '../../src/components/practice/LiveSession';
import { useModuleLabel, useDrills, type DrillStatus } from '../../src/components/PracticeHooks';
import { useSongbook } from '../../src/components/SongbookHooks';
import { getDrill } from '../../src/content/practice';
import { useLayout } from '../../src/hooks/useLayout';
import { colors } from '../../src/theme';

/** Un ejercicio de práctica: configuración, toma con acompañamiento y evaluación en vivo. */
export default function DrillScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { isTablet, width } = useLayout();
  const moduleLabel = useModuleLabel();
  const drills = useDrills();
  const songs = useSongbook();
  // Una canción del cancionero (`song-<id>`) se practica igual, con el estado de la canción.
  const songStatus = String(id).startsWith('song-') ? songs.find((s) => `song-${s.song.id}` === String(id)) : undefined;
  const songDrill = songStatus ? getDrill(String(id)) : undefined;
  const status: DrillStatus | undefined = songStatus && songDrill
    ? { drill: songDrill, state: songStatus.state, missing: songStatus.missing[0], stars: 0 }
    : drills.find((d) => d.drill.id === String(id));
  const contentWidth = isTablet ? Math.min(width - 96, 820) : width - 40;

  const close = (
    <View style={{ alignItems: 'flex-end' }}>
      <CloseButton label={t('ui.common.close')} onPress={() => router.back()} />
    </View>
  );

  if (!status) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          {close}
          <Muted>{t('ui.drills.notFound')}</Muted>
        </ScrollView>
      </SafeAreaView>
    );
  }
  const { drill, state, missing } = status;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, maxWidth: 860, width: '100%', alignSelf: 'center' }}>
        {close}
        <Eyebrow>{t('ui.drills.meta', { category: t(`ui.drills.category.${drill.category}`), level: drill.level, bpm: drill.tempoSteps[0] })}</Eyebrow>
        <H1>{t(drill.titleKey)}</H1>
        <Text style={{ fontSize: 16, lineHeight: 24, color: colors.ink }}>{t(drill.descKey)}</Text>
        {state === 'open' ? (
          <LiveSession key={drill.id} drill={drill} width={contentWidth} />
        ) : state === 'premium' ? (
          <Card style={{ gap: 10 }}>
            <Muted>{t('ui.drills.premium')}</Muted>
            <Button label={t('ui.profile.seePlans')} onPress={() => router.push('/paywall')} />
          </Card>
        ) : (
          <Card style={{ gap: 10 }}>
            <Muted>{drill.lessonId ? t('ui.drills.needsLesson', { lesson: drill.lessonId }) : missing ? t('ui.drills.needs', { module: moduleLabel(missing) }) : t('ui.drills.lockedHint')}</Muted>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
