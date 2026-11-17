import React from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '../../src/components/Text';
import { Button, Card, CloseButton, Eyebrow, H1, Muted } from '../../src/components/ui';
import { Figure } from '../../src/components/Figure';
import { Listen } from '../../src/components/Listen';
import { theorySheet } from '../../src/content/theory';
import { canOpenLesson } from '../../src/billing/access';
import { useBilling } from '../../src/billing/purchases';
import { useLayout } from '../../src/hooks/useLayout';
import { colors, fonts } from '../../src/theme';

/** Ficha teórica de un módulo: todas sus tarjetas y ejemplos sonoros en una sola página. */
export default function TheorySheetScreen() {
  const { module: param } = useLocalSearchParams<{ module: string }>();
  const { t } = useTranslation();
  const { isTablet, width } = useLayout();
  const isPremium = useBilling((s) => s.isPremium);
  const sheet = theorySheet(String(param), (id) => canOpenLesson(id, isPremium));
  const contentWidth = isTablet ? Math.min(width - 96, 820) : width - 40;
  const cardInner = contentWidth - 34;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, maxWidth: 860, width: '100%', alignSelf: 'center' }}>
        <View style={{ alignItems: 'flex-end' }}>
          <CloseButton label={t('ui.common.close')} onPress={() => router.back()} />
        </View>
        {!sheet ? (
          <Muted>{t('ui.theory.empty')}</Muted>
        ) : (
          <>
            <Eyebrow>{t('ui.theory.eyebrow', { id: sheet.module.id })}</Eyebrow>
            <H1>{t(sheet.module.titleKey)}</H1>
            <Muted>{t(sheet.module.goalKey)}</Muted>
            {sheet.sections.length === 0 && sheet.locked === 0 ? <Muted>{t('ui.theory.empty')}</Muted> : null}
            {sheet.sections.map((sec) => (
              <View key={sec.lessonId} style={{ gap: 10 }}>
                <Text style={{ fontFamily: fonts.display, fontSize: 20, lineHeight: 26, color: colors.gold }}>{`${sec.lessonId} · ${t(sec.titleKey)}`}</Text>
                {sec.cards.map((c, i) => (
                  <Card key={c.titleKey} style={{ gap: 10 }}>
                    <Text style={{ fontFamily: fonts.display, fontSize: 18, lineHeight: 24 }}>{t(c.titleKey)}</Text>
                    {c.figure ? <Figure id={c.figure} width={cardInner} /> : null}
                    <Text style={{ fontSize: 16, lineHeight: 24, color: colors.ink }}>{t(c.bodyKey)}</Text>
                    {c.listen ? <Listen example={c.listen} width={cardInner} testID={`listen-${sec.lessonId}-${i}`} /> : null}
                  </Card>
                ))}
              </View>
            ))}
            {sheet.locked > 0 ? (
              <Card style={{ gap: 10 }}>
                <Muted>{t('ui.theory.locked', { count: sheet.locked })}</Muted>
                <Button label={t('ui.profile.seePlans')} onPress={() => router.push('/paywall')} />
              </Card>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
