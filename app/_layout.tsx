import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import i18n, { deviceLocale, initI18n } from '../src/i18n';
import { useSettings } from '../src/state/settings';
import { initBilling } from '../src/billing/purchases';
import { colors } from '../src/theme';

initI18n(deviceLocale());

export default function RootLayout() {
  const locale = useSettings((s) => s.locale);

  useEffect(() => {
    initI18n(locale ?? deviceLocale());
  }, [locale]);

  useEffect(() => {
    void initBilling();
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
          <Stack.Screen name="leccion/[id]" />
        </Stack>
      </SafeAreaProvider>
    </I18nextProvider>
  );
}
