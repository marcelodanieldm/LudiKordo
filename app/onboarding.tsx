import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '../src/components/Text';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Button, Pill, Card, Eyebrow, H2 } from '../src/components/ui';
import { Kordi } from '../src/components/Kordi';
import { useSettings } from '../src/state/settings';
import { colors, fonts, radius } from '../src/theme';
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: fonts.displayBold, fontSize: 22 }}>
                Ludi<Text style={{ fontFamily: fonts.displayBold, fontSize: 22, color: colors.accent }}>Kordo</Text>
              </Text>
              <View accessibilityRole="radiogroup" accessibilityLabel={t('ui.onboarding.language')} style={{ flexDirection: 'row', gap: 4, padding: 4, borderRadius: radius.md, backgroundColor: colors.card }}>
                {LANGS.map(([code, name]) => {
                  const on = i18n.language === code;
                  return (
                    <Pressable
                      key={code}
                      accessibilityRole="radio"
                      accessibilityLabel={name}
                      accessibilityState={{ checked: on }}
                      onPress={() => s.setLocale(code)}
                      style={{ minWidth: 48, minHeight: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.raised : 'transparent' }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '900', color: on ? colors.ink : colors.muted }}>{code.toUpperCase()}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View style={{ flex: 1, minHeight: 300, alignItems: 'center', justifyContent: 'flex-end' }}>
              <Kordi size={200} light="beam" />
            </View>
            <View style={{ gap: 10 }}>
              <Eyebrow color={colors.gold}>{t('ui.onboarding.appTag')}</Eyebrow>
              <Text style={{ fontFamily: fonts.display, fontSize: 34, lineHeight: 38 }}>{t('ui.onboarding.welcomeTitle')}</Text>
              <Text style={{ fontSize: 16, lineHeight: 23, color: colors.muted }}>{t('ui.onboarding.welcomeBody')}</Text>
            </View>
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
      <H2 style={{ fontSize: 19 }}>{title}</H2>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>
    </Card>
  );
}
