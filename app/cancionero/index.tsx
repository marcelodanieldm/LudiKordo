import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '../../src/components/Text';
import { Chip, CloseButton, Eyebrow, H1, Muted, StarIcon } from '../../src/components/ui';
import { useKeyLabel, useSongbook } from '../../src/components/SongbookHooks';
import { GENRES } from '../../src/content/songs';
import { colors, radius } from '../../src/theme';
import type { Genre } from '../../src/content/types';
import type { SongStatus } from '../../src/content/songbook';

/** Cancionero: canciones originales por género, ordenadas según lo que ya aprendiste. */
export default function SongbookScreen() {
  const { t } = useTranslation();
  const [genre, setGenre] = useState<Genre | undefined>(undefined);
  const list = useSongbook(genre);
  const options: (Genre | undefined)[] = [undefined, ...GENRES];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, maxWidth: 860, width: '100%', alignSelf: 'center' }}>
        <View style={{ alignItems: 'flex-end' }}>
          <CloseButton label={t('ui.common.close')} onPress={() => router.back()} />
        </View>
        <Eyebrow>{t('ui.songbook.eyebrow')}</Eyebrow>
        <H1>{t('ui.songbook.title')}</H1>
        <Muted>{t('ui.songbook.intro')}</Muted>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {options.map((g) => {
            const selected = g === genre;
            return (
              <Pressable
                key={g ?? 'all'}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setGenre(g)}
                style={{
                  minHeight: 44,
                  paddingHorizontal: 16,
                  borderRadius: 22,
                  justifyContent: 'center',
                  backgroundColor: selected ? colors.accent : colors.card,
                  borderWidth: 1,
                  borderColor: selected ? colors.accent : colors.border,
                }}
              >
                <Text style={{ fontWeight: '800', color: selected ? colors.onAccent : colors.ink }}>{g ? t(`ui.songbook.genre.${g}`) : t('ui.songbook.all')}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {list.length === 0 ? <Muted>{t('ui.songbook.empty')}</Muted> : null}
        {list.map((s) => (
          <SongRow key={s.song.id} status={s} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function SongRow({ status }: { status: SongStatus }) {
  const { t } = useTranslation();
  const keyLabel = useKeyLabel();
  const { song, state, missing, stars } = status;
  const open = state === 'open';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={open ? undefined : t('ui.songbook.lockedHint')}
      onPress={() => router.push(`/cancionero/${song.id}`)}
      testID={`song-${song.id}`}
      style={{
        minHeight: 72,
        padding: 14,
        gap: 6,
        borderRadius: radius.lg,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: open ? 'solid' : 'dashed',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ flex: 1, fontSize: 17, fontWeight: '900' }}>{t(song.titleKey)}</Text>
        {stars > 0 ? (
          <View accessible accessibilityRole="text" style={{ flexDirection: 'row' }} accessibilityLabel={t('ui.common.starsOf', { n: stars })}>
            {Array.from({ length: stars }, (_, i) => (
              <StarIcon key={i} size={16} />
            ))}
          </View>
        ) : null}
      </View>
      <Muted>{t('ui.songbook.meta', { genre: t(`ui.songbook.genre.${song.genre}`), level: song.level, key: keyLabel(song.key), bpm: song.bpm })}</Muted>
      {state === 'locked' ? (
        <Text style={{ fontSize: 14, color: colors.accentInk, fontWeight: '700' }}>
          {t('ui.songbook.needs', { modules: missing.map((m) => `${m} ${t(`content.module.${m.replace('.', '_')}`)}`).join(' · ') })}
        </Text>
      ) : null}
      {state === 'premium' ? <Chip label={t('ui.path.premium')} color={colors.gold} bg={colors.goldSoft} /> : null}
    </Pressable>
  );
}
