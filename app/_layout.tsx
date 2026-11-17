import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import { View } from 'react-native';
import { setFontsReady } from '../src/components/Text';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import i18n, { deviceLocale, initI18n } from '../src/i18n';
import { useSettings } from '../src/state/settings';
import { initBilling } from '../src/billing/purchases';
import { colors } from '../src/theme';

initI18n(deviceLocale());

export default function RootLayout() {
  const locale = useSettings((s) => s.locale);
  // Las fuentes vienen dentro del paquete. Si aun así fallan, la app sigue con la fuente del sistema
  // y Text conserva los pesos (setFontsReady(false)).
  const [fontsLoaded, fontError] = useFonts({
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  useEffect(() => {
    initI18n(locale ?? deviceLocale());
  }, [locale]);

  useEffect(() => {
    void initBilling();
  }, []);

  setFontsReady(fontsLoaded);
  if (!fontsLoaded && !fontError) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <I18nextProvider i18n={i18n}>
      <SafeAreaProvider>
        <StatusBar style="light" />
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
