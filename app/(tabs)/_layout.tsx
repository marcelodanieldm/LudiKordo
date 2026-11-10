import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Path } from 'react-native-svg';
import { useLayout } from '../../src/hooks/useLayout';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../src/theme';

type IconName = 'today' | 'path' | 'practice' | 'progress' | 'profile';

function TabIcon({ name, color, focused }: { name: IconName; color: string; focused: boolean }) {
  const p = { stroke: color, strokeWidth: 2.2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <View style={{ width: 52, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? colors.accentSoft : 'transparent' }}>
    <Svg width={22} height={22} viewBox="0 0 24 24">
      {name === 'today' && <Path {...p} d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />}
      {name === 'path' && (
        <>
          <Circle {...p} cx={6} cy={19} r={2} />
          <Circle {...p} cx={18} cy={5} r={2} />
          <Path {...p} d="M8 19h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7" />
        </>
      )}
      {name === 'practice' && <Path {...p} d="M2 12h3l3-8 4 16 3-10 2 2h5" />}
      {name === 'progress' && <Path {...p} d="M5 20V11M12 20V4M19 20v-6" />}
      {name === 'profile' && (
        <>
          <Circle {...p} cx={12} cy={8} r={4} />
          <Path {...p} d="M4 21a8 8 0 0 1 16 0" />
        </>
      )}
    </Svg>
    </View>
  );
}

/** Teléfono: barra inferior. Tablet: barra lateral, como en el prototipo. */
export default function TabsLayout() {
  const { t } = useTranslation();
  const { isTablet } = useLayout();
  const insets = useSafeAreaInsets();
  const tab = (name: IconName, label: string) => ({
    title: label,
    tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => <TabIcon name={name} color={color} focused={focused} />,
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentInk,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.black, fontSize: 11 },
        tabBarPosition: isTablet ? 'left' : 'bottom',
        tabBarVariant: isTablet ? 'material' : 'uikit',
        tabBarStyle: { backgroundColor: colors.bar, borderColor: colors.raised, borderTopWidth: 1, ...(isTablet ? {} : { height: 64 + insets.bottom, paddingTop: 8, paddingBottom: 8 + insets.bottom }) },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={tab('today', t('ui.tabs.today'))} />
      <Tabs.Screen name="ruta" options={tab('path', t('ui.tabs.path'))} />
      <Tabs.Screen name="practicar" options={tab('practice', t('ui.tabs.practice'))} />
      <Tabs.Screen name="progreso" options={tab('progress', t('ui.tabs.progress'))} />
      <Tabs.Screen name="perfil" options={tab('profile', t('ui.tabs.profile'))} />
    </Tabs>
  );
}
