import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '../../src/components/Text';
import { Button, Card, CloseButton, Eyebrow, H1, H2, Muted, Stars } from '../../src/components/ui';
import { Listen } from '../../src/components/Listen';
import { PlayAlongExercise as PlayAlong } from '../../src/components/exercises/PlayAlongExercise';
import { useKeyLabel, useSongbook } from '../../src/components/SongbookHooks';
import { useModuleLabel } from '../../src/components/PracticeHooks';
import { songExerciseId } from '../../src/content/songbook';
import { getSong, songExample } from '../../src/content/songs';
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
  const keyLabel = useKeyLabel();
  const moduleLabel = useModuleLabel();
  const unlockedBpm = useProgress((s) => (song ? s.tempo[songExerciseId(song.id)] : undefined));
  const [running, setRunning] = useState(false);
  const recordExercise = useProgress((s) => s.recordExercise);
  const addMinutes = useProgress((s) => s.addMinutes);
  const [round, setRound] = useState(0);
  const [saved, setSaved] = useState<number | null>(null);
  const contentWidth = isTablet ? Math.min(width - 96, 820) : width - 40;
  // Memorizado: si cambia el ejemplo, Listen corta el sonido.
  const example = useMemo(() => (song ? songExample(song) : null), [song]);

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
        <Eyebrow>{t('ui.songbook.meta', { genre: t(`ui.songbook.genre.${song.genre}`), level: song.level, key: keyLabel(song.key), bpm: Math.max(song.bpm, unlockedBpm ?? 0) })}</Eyebrow>
        <H1>{t(song.titleKey)}</H1>
        <Text style={{ fontSize: 16, lineHeight: 24, color: colors.ink }}>{t(song.descriptionKey)}</Text>

        <Card style={{ gap: 10 }}>
          <H2 style={{ fontSize: 18 }}>{t('ui.songbook.chords')}</H2>
          <View accessible accessibilityRole="text" accessibilityLabel={t('ui.songbook.chordsLabel', { chords: song.chords.join(', ') })} style={{ gap: 6 }}>
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
            {/* Durante la toma no se muestra el ejemplo: el micrófono lo oiría. */}
            {!running ? (
              <Card style={{ gap: 10 }}>
                <H2 style={{ fontSize: 18 }}>{t('ui.songbook.listen')}</H2>
                {example ? <Listen example={example} width={contentWidth - 34} testID={`listen-${song.id}`} /> : null}
              </Card>
            ) : null}
            {saved !== null ? (
              <Card style={{ gap: 10, alignItems: 'center' }}>
                <Stars count={saved} size={32} />
                <Muted>{t('ui.songbook.saved')}</Muted>
                <Button label={t('ui.songbook.again')} onPress={() => setSaved(null)} />
              </Card>
            ) : (
              <PlayAlong
                key={round}
                exercise={exercise}
                mastery={0.8}
                width={contentWidth}
                onRunningChange={setRunning}
                onDone={(stars) => {
                  recordExercise(exercise.id, stars, song.skills);
                  // Minutos tocados de verdad (una toma corta no suma un minuto entero).
                  const minutes = Math.round(song.line.reduce((a, e) => a + e.beats, 0) / Math.max(song.bpm, unlockedBpm ?? 0));
                  if (minutes > 0) addMinutes(minutes);
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
              {t('ui.songbook.needs', { modules: status.missing.map((m) => moduleLabel(m)).join(' · ') })}
            </Text>
            <Button variant="secondary" label={t('ui.songbook.toPath')} onPress={() => router.push('/ruta')} />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
