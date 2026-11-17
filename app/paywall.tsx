import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '../src/components/Text';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { PurchasesPackage } from 'react-native-purchases';
import Svg, { Path } from 'react-native-svg';
import { Button, Chip, CloseButton } from '../src/components/ui';
import { useBilling, purchase, restore } from '../src/billing/purchases';
import { annualSavingsPct, formatMoney, TRIAL_DAYS, trialEndDate } from '../src/billing/access';
import { colors, fonts, radius } from '../src/theme';

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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip label={t('ui.path.premium')} color={colors.gold} bg={colors.goldSoft} />
          <CloseButton label={t('ui.common.close')} onPress={close} />
        </View>
        <Text style={{ fontFamily: fonts.display, fontSize: 32, lineHeight: 36 }}>{t('ui.paywall.title')}</Text>
        <View style={{ gap: 12 }}>
          {BENEFITS.map((b) => (
            <View key={b.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' }}>
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Path d={b.d} stroke={b.color} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
              <Text style={{ flex: 1, fontSize: 16, fontWeight: '700' }}>{t(`ui.paywall.${b.key}`)}</Text>
            </View>
          ))}
        </View>

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
            {error ? <Text style={{ color: colors.danger, fontWeight: '700' }}>{error}</Text> : null}
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
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        marginTop: p.badge ? 8 : 0,
        borderRadius: radius.xl,
        borderWidth: 2,
        borderColor: p.selected ? colors.accent : colors.line,
        backgroundColor: p.selected ? colors.accentSoft : colors.card,
      }}
    >
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: p.selected ? colors.accent : colors.muted, alignItems: 'center', justifyContent: 'center' }}>
        {p.selected ? <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent }} /> : null}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: colors.muted }}>{p.name}</Text>
        <Text style={{ fontFamily: fonts.display, fontSize: 21, lineHeight: 26 }}>{p.price}</Text>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.muted }}>{p.sub}</Text>
      </View>
      {p.badge ? (
        <View style={{ position: 'absolute', top: -12, right: 16, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: colors.gold }}>
          <Text style={{ fontSize: 12, fontWeight: '900', color: colors.onAccent }}>{p.badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const BENEFITS = [
  { key: 'b1', color: colors.accentInk, d: 'M6 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 19h6.5a3.5 3.5 0 0 0 0-7h-5a3.5 3.5 0 0 1 0-7H16' },
  { key: 'b2', color: colors.teal, d: 'M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3' },
  { key: 'b3', color: colors.gold, d: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 14 7 21l5-3 5 3-1.5-7' },
] as const;
