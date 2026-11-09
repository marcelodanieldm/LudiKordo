import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { PurchasesPackage } from 'react-native-purchases';
import { Button } from '../src/components/ui';
import { useBilling, purchase, restore } from '../src/billing/purchases';
import { annualSavingsPct, formatMoney, TRIAL_DAYS, trialEndDate } from '../src/billing/access';
import { colors, radius } from '../src/theme';

type Plan = 'annual' | 'semiannual';

/**
 * Paywall honesto: precio total del período en grande, fecha exacta del primer
 * cobro, «seguir gratis» con el mismo peso visual y restaurar compras.
 */
export default function Paywall() {
  const { t, i18n } = useTranslation();
  const { annual, semiannual } = useBilling();
  const [plan, setPlan] = useState<Plan>('annual');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));
  const pkg = plan === 'annual' ? annual : semiannual;
  const hasTrial = Boolean(annual?.product.defaultOption?.freePhase);
  const savings = annual && semiannual ? annualSavingsPct(annual.product.price, semiannual.product.price) : 0;
  const perMonth = (p: PurchasesPackage, months: number) => formatMoney(p.product.price / months, p.product.currencyCode, i18n.language);

  const buy = async () => {
    if (!pkg) return;
    setBusy(true);
    setError(null);
    try {
      if (await purchase(pkg)) close();
    } catch {
      setError(t('ui.paywall.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: colors.ink }}>{t('ui.paywall.title')}</Text>
        {['b1', 'b2', 'b3'].map((b) => (
          <Text key={b} style={{ fontSize: 15, color: colors.ink }}>
            ✓ {t(`ui.paywall.${b}`)}
          </Text>
        ))}

        {annual && semiannual ? (
          <>
            <PlanCard
              selected={plan === 'annual'}
              onPress={() => setPlan('annual')}
              name={t('ui.paywall.annual')}
              badge={savings > 0 ? t('ui.paywall.save', { pct: savings }) : undefined}
              price={t('ui.paywall.perYear', { price: annual.product.priceString })}
              sub={`${t('ui.paywall.perMonth', { price: perMonth(annual, 12) })}${hasTrial ? ` · ${t('ui.paywall.trialDays', { count: TRIAL_DAYS })}` : ''}`}
            />
            <PlanCard
              selected={plan === 'semiannual'}
              onPress={() => setPlan('semiannual')}
              name={t('ui.paywall.semiannual')}
              price={t('ui.paywall.perSix', { price: semiannual.product.priceString })}
              sub={t('ui.paywall.perMonth', { price: perMonth(semiannual, 6) })}
            />
            <Text style={{ fontSize: 13, lineHeight: 19, color: colors.muted }}>
              {plan === 'annual' && hasTrial
                ? t('ui.paywall.termsTrial', { date: trialEndDate(new Date(), i18n.language), price: annual.product.priceString })
                : t('ui.paywall.termsSemi')}
            </Text>
            {error ? <Text style={{ color: colors.accentInk, fontWeight: '700' }}>{error}</Text> : null}
            <Button
              disabled={busy}
              label={plan === 'annual' && hasTrial ? t('ui.paywall.ctaTrial', { count: TRIAL_DAYS }) : t('ui.paywall.ctaSubscribe')}
              onPress={() => void buy()}
            />
          </>
        ) : (
          <Text style={{ color: colors.muted }}>{t('ui.paywall.unavailable')}</Text>
        )}

        <Button testID="paywall-free" variant="secondary" label={t('ui.paywall.free')} onPress={close} />
        <Button variant="ghost" label={t('ui.paywall.restore')} onPress={() => void restore().then((ok) => ok && close())} />
      </ScrollView>
    </SafeAreaView>
  );
}

function PlanCard(p: { selected: boolean; onPress: () => void; name: string; price: string; sub: string; badge?: string }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: p.selected }}
      onPress={p.onPress}
      style={{ padding: 16, gap: 4, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: p.selected ? 3 : 2, borderColor: p.selected ? colors.accent : colors.border }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 17, fontWeight: '800', color: colors.ink }}>{p.name}</Text>
        {p.badge ? (
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF', backgroundColor: colors.teal, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' }}>
            {p.badge}
          </Text>
        ) : null}
      </View>
      <Text style={{ fontSize: 20, fontWeight: '800', color: colors.ink }}>{p.price}</Text>
      <Text style={{ fontSize: 14, color: colors.muted }}>{p.sub}</Text>
    </Pressable>
  );
}
