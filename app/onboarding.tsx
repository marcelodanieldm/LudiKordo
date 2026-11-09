import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Button, Pill, Card } from '../src/components/ui';
import { Kordi } from '../src/components/Kordi';
import { useSettings } from '../src/state/settings';
import { colors } from '../src/theme';
import type { Locale } from '../src/music/notes';

const LANGS: [Locale, string][] = [
  ['es', 'Español'],
  ['en', 'English'],
  ['pt', 'Português'],
];

/** Bienvenida y 5 preguntas. Después, el paywall (que se puede cerrar). */
export default function Onboarding() {
  const { t, i18n } = useTranslation();
  const s = useSettings();
  const [page, setPage] = useState<0 | 1>(0);
  const [played, setPlayed] = useState<boolean | null>(null);

  const finish = () => {
    s.update({ onboarded: true });
    router.replace('/(tabs)');
    router.push('/paywall');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 20, flexGrow: 1, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        {page === 0 ? (
          <>
            <View style={{ alignItems: 'center' }}>
              <Kordi size={200} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.accent, textTransform: 'uppercase' }}>{t('ui.onboarding.appTag')}</Text>
            <Text style={{ fontSize: 32, fontWeight: '700', color: colors.ink }}>{t('ui.onboarding.welcomeTitle')}</Text>
            <Text style={{ fontSize: 16, lineHeight: 24, color: colors.muted }}>{t('ui.onboarding.welcomeBody')}</Text>
            <Text style={{ fontWeight: '700', color: colors.muted }}>{t('ui.onboarding.language')}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {LANGS.map(([code, name]) => (
                <Pill key={code} label={name} selected={i18n.language === code} onPress={() => s.setLocale(code)} />
              ))}
            </View>
            <View style={{ flex: 1 }} />
            <Button testID="onboarding-start" label={t('ui.common.start')} onPress={() => setPage(1)} />
          </>
        ) : (
          <>
            <Question title={t('ui.onboarding.hasBass')}>
              <Pill label={t('ui.onboarding.yes')} selected={s.hasBass} onPress={() => s.update({ hasBass: true })} />
              <Pill label={t('ui.onboarding.notYet')} selected={!s.hasBass} onPress={() => s.update({ hasBass: false })} />
            </Question>
            <Question title={t('ui.onboarding.playedBefore')}>
              <Pill label={t('ui.onboarding.yes')} selected={played === true} onPress={() => setPlayed(true)} />
              <Pill label={t('ui.onboarding.no')} selected={played === false} onPress={() => setPlayed(false)} />
            </Question>
            <Question title={t('ui.onboarding.goal')}>
              {([5, 10, 15, 20] as const).map((m) => (
                <Pill key={m} label={t('ui.common.minutes', { count: m })} selected={s.dailyMinutes === m} onPress={() => s.update({ dailyMinutes: m })} />
              ))}
            </Question>
            <Question title={t('ui.onboarding.weekly')}>
              {[3, 4, 5, 6, 7].map((d) => (
                <Pill key={d} label={String(d)} selected={s.weeklyDays === d} onPress={() => s.update({ weeklyDays: d })} />
              ))}
            </Question>
            <Question title={t('ui.onboarding.hand')}>
              <Pill label={t('ui.onboarding.right')} selected={s.hand === 'right'} onPress={() => s.update({ hand: 'right' })} />
              <Pill label={t('ui.onboarding.left')} selected={s.hand === 'left'} onPress={() => s.update({ hand: 'left' })} />
            </Question>
            {played ? <Text style={{ color: colors.muted }}>{t('ui.onboarding.levelTest')} — {t('ui.common.comingSoon')}</Text> : null}
            <View style={{ flex: 1 }} />
            <Button testID="onboarding-finish" label={t('ui.onboarding.finish')} onPress={finish} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Question({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <Text style={{ fontSize: 17, fontWeight: '800', color: colors.ink }}>{title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>
    </Card>
  );
}
