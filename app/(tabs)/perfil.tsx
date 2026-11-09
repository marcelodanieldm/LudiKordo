import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Button, Card, H1, Pill } from '../../src/components/ui';
import { useSettings } from '../../src/state/settings';
import { openManageSubscription, restore, useBilling } from '../../src/billing/purchases';
import { colors } from '../../src/theme';
import type { Locale, Notation } from '../../src/music/notes';

export default function Profile() {
  const { t, i18n } = useTranslation();
  const s = useSettings();
  const isPremium = useBilling((b) => b.isPremium);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        <H1>{t('ui.profile.title')}</H1>
        <Row title={t('ui.profile.language')}>
          {(
            [
              ['es', 'Español'],
              ['en', 'English'],
              ['pt', 'Português'],
            ] as [Locale, string][]
          ).map(([code, name]) => (
            <Pill key={code} label={name} selected={i18n.language === code} onPress={() => s.setLocale(code)} />
          ))}
        </Row>
        {i18n.language !== 'en' ? (
          <Row title={t('ui.profile.notation')}>
            {(
              [
                ['both', t('ui.profile.notationBoth')],
                ['solfege', t('ui.profile.notationSolfege')],
                ['letters', t('ui.profile.notationLetters')],
              ] as [Notation, string][]
            ).map(([n, label]) => (
              <Pill key={n} label={label} selected={s.notation === n} onPress={() => s.update({ notation: n })} />
            ))}
          </Row>
        ) : null}
        <Row title={t('ui.profile.hand')}>
          <Pill label={t('ui.onboarding.right')} selected={s.hand === 'right'} onPress={() => s.update({ hand: 'right' })} />
          <Pill label={t('ui.onboarding.left')} selected={s.hand === 'left'} onPress={() => s.update({ hand: 'left' })} />
        </Row>
        <Row title={t('ui.profile.dailyGoal')}>
          {([5, 10, 15, 20] as const).map((m) => (
            <Pill key={m} label={t('ui.common.minutes', { count: m })} selected={s.dailyMinutes === m} onPress={() => s.update({ dailyMinutes: m })} />
          ))}
        </Row>
        <Row title={t('ui.profile.weeklyGoal')}>
          {[3, 4, 5, 6, 7].map((d) => (
            <Pill key={d} label={String(d)} selected={s.weeklyDays === d} onPress={() => s.update({ weeklyDays: d })} />
          ))}
        </Row>
        <Card>
          <Text style={{ fontSize: 16, fontWeight: '800', color: colors.ink }}>
            {t('ui.profile.subscription')}: {isPremium ? t('ui.profile.statusPremium') : t('ui.profile.statusFree')}
          </Text>
          {!isPremium ? <Button variant="secondary" label={t('ui.profile.seePlans')} onPress={() => router.push('/paywall')} /> : null}
          <Button variant="ghost" label={t('ui.profile.manage')} onPress={() => void openManageSubscription()} />
          <Button variant="ghost" label={t('ui.profile.restore')} onPress={() => void restore()} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.muted }}>{title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>
    </Card>
  );
}
