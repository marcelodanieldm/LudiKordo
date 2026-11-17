import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '../../src/components/Text';
import { Button, Card, CloseButton, Eyebrow, H1, H2, Muted, Stars } from '../../src/components/ui';
import { Listen } from '../../src/components/Listen';
import { ExerciseView } from '../../src/components/exercises/ExerciseView';
import { useSongbook } from '../../src/components/SongbookHooks';
import { songExerciseId } from '../../src/content/songbook';
import { getSong } from '../../src/content/songs';
import { isRest } from '../../src/music/staff';
import { useProgress } from '../../src/state/progress';
import { useLayout } from '../../src/hooks/useLayout';
import { colors, fonts, radius } from '../../src/theme';
import type { PlayAlongExercise } from '../../src/content/types';

const BARS_PER_ROW = 4;

/** Una canción: cifrado, ejemplo sonoro y tocarla con el bajo a tempo. */
export default function SongScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { isTablet, width } = useLayout();
  const song = getSong(String(id));
  const status = useSongbook().find((s) => s.song.id === song?.id);
  const recordExercise = useProgress((s) => s.recordExercise);
  const addMinutes = useProgress((s) => s.addMinutes);
  const [round, setRound] = useState(0);
  const [saved, setSaved] = useState<number | null>(null);
  const contentWidth = isTablet ? Math.min(width - 96, 820) : width - 40;

  const exercise = useMemo<PlayAlongExercise | null>(
    () =>
      song
        ? {
            id: songExerciseId(song.id),
            kind: 'playAlong',
            needsBass: true,
            skills: song.skills,
            promptKey: 'ui.songbook.playPrompt',
            notes: song.line.flatMap((e) => (isRest(e) ? [] : [{ string: e.string, fret: e.fret }])),
            score: song.line,
            notation: song.notation,
            bpm: song.bpm,
            tempoSteps: song.tempoSteps,
          }
        : null,
    [song],
  );

  const close = (
    <View style={{ alignItems: 'flex-end' }}>
      <CloseButton label={t('ui.common.close')} onPress={() => router.back()} />
    </View>
  );

  if (!song || !status || !exercise) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          {close}
          <Muted>{t('ui.songbook.notFound')}</Muted>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const rows = Array.from({ length: Math.ceil(song.chords.length / BARS_PER_ROW) }, (_, r) => song.chords.slice(r * BARS_PER_ROW, (r + 1) * BARS_PER_ROW));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, maxWidth: 860, width: '100%', alignSelf: 'center' }}>
        {close}
        <Eyebrow>{t('ui.songbook.meta', { genre: t(`ui.songbook.genre.${song.genre}`), level: song.level, key: song.key, bpm: song.bpm })}</Eyebrow>
        <H1>{t(song.titleKey)}</H1>
        <Text style={{ fontSize: 16, lineHeight: 24, color: colors.ink }}>{t(song.descriptionKey)}</Text>

        <Card style={{ gap: 10 }}>
          <H2 style={{ fontSize: 18 }}>{t('ui.songbook.chords')}</H2>
          <View accessibilityLabel={t('ui.songbook.chordsLabel', { chords: song.chords.join(', ') })} style={{ gap: 6 }}>
            {rows.map((row, r) => (
              <View key={r} style={{ flexDirection: 'row', gap: 6 }}>
                {row.map((c, i) => (
                  <View key={i} style={{ flex: 1, minHeight: 44, borderRadius: radius.md, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: fonts.display, fontSize: 18, color: colors.gold }}>{c}</Text>
                  </View>
                ))}
                {row.length < BARS_PER_ROW ? Array.from({ length: BARS_PER_ROW - row.length }, (_, i) => <View key={`f${i}`} style={{ flex: 1 }} />) : null}
              </View>
            ))}
          </View>
          <Muted>{t('ui.songbook.chordsHint')}</Muted>
        </Card>

        {status.state === 'open' ? (
          <>
            <Card style={{ gap: 10 }}>
              <H2 style={{ fontSize: 18 }}>{t('ui.songbook.listen')}</H2>
              <Listen example={{ events: song.line, bpm: song.bpm, show: song.notation, click: true }} width={contentWidth - 34} testID={`listen-${song.id}`} />
            </Card>
            {saved !== null ? (
              <Card style={{ gap: 10, alignItems: 'center' }}>
                <Stars count={saved} size={32} />
                <Muted>{t('ui.songbook.saved')}</Muted>
                <Button label={t('ui.songbook.again')} onPress={() => setSaved(null)} />
              </Card>
            ) : (
              <ExerciseView
                key={round}
                exercise={exercise}
                mastery={0.8}
                width={contentWidth}
                onDone={(stars) => {
                  recordExercise(exercise.id, stars, song.skills);
                  addMinutes(Math.max(1, Math.round(song.line.reduce((a, e) => a + e.beats, 0) / song.bpm)));
                  setSaved(stars);
                  setRound((x) => x + 1);
                }}
              />
            )}
          </>
        ) : status.state === 'premium' ? (
          <Card style={{ gap: 10 }}>
            <Muted>{t('ui.songbook.premium')}</Muted>
            <Button label={t('ui.profile.seePlans')} onPress={() => router.push('/paywall')} />
          </Card>
        ) : (
          <Card style={{ gap: 10 }}>
            <Text style={{ fontSize: 16, lineHeight: 24 }}>
              {t('ui.songbook.needs', { modules: status.missing.map((m) => `${m} ${t(`content.module.${m.replace('.', '_')}`)}`).join(' · ') })}
            </Text>
            <Button variant="secondary" label={t('ui.songbook.toPath')} onPress={() => router.push('/ruta')} />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
