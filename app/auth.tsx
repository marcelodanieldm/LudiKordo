import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '../src/components/Text';
import { Button } from '../src/components/ui';
import { useSession } from '../src/billing/session';
import { colors, fonts } from '../src/theme';

/**
 * Pantalla de la vuelta del inicio de sesión (`<esquema>://auth#…`). El enlace lo
 * resuelve `listenForAuth` (src/billing/session.ts); acá solo se muestra cómo va.
 */
export default function AuthReturn() {
  const { t } = useTranslation();
  const account = useSession((s) => s.account);
  const status = useSession((s) => s.status);
  const toProfile = () => router.replace('/(tabs)/perfil');

  useEffect(() => {
    if (account && status !== 'error') {
      const id = setTimeout(toProfile, 900);
      return () => clearTimeout(id);
    }
  }, [account, status]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
        {status === 'error' ? (
          <>
            <Text style={{ fontFamily: fonts.display, fontSize: 24, textAlign: 'center' }}>{t('ui.account.error')}</Text>
            <Button label={t('ui.common.back')} onPress={toProfile} />
          </>
        ) : account ? (
          <Text style={{ fontFamily: fonts.display, fontSize: 24, textAlign: 'center' }}>{t('ui.account.done', { email: account.email })}</Text>
        ) : (
          <>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={{ fontSize: 17, color: colors.muted }}>{t('ui.account.connecting')}</Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
