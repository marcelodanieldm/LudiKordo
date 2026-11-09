import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Path } from 'react-native-svg';
import { useLayout } from '../../src/hooks/useLayout';
import { colors } from '../../src/theme';

type IconName = 'today' | 'path' | 'practice' | 'progress' | 'profile';

function TabIcon({ name, color }: { name: IconName; color: string }) {
  const p = { stroke: color, strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      {name === 'today' && <Path {...p} d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />}
      {name === 'path' && (
        <>
          <Circle {...p} cx={6} cy={19} r={2} />
          <Circle {...p} cx={18} cy={5} r={2} />
          <Path {...p} d="M8 19h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7" />
        </>
      )}
      {name === 'practice' && (
        <>
          <Path {...p} d="M4 18L18 4M15 3l6 6" />
          <Circle {...p} cx={6} cy={17} r={3} />
        </>
      )}
      {name === 'progress' && <Path {...p} d="M4 20V10M10 20V4M16 20v-7M22 20H2" />}
      {name === 'profile' && (
        <>
          <Circle {...p} cx={12} cy={8} r={4} />
          <Path {...p} d="M4 21a8 8 0 0 1 16 0" />
        </>
      )}
    </Svg>
  );
}

/** Teléfono: barra inferior. Tablet: barra lateral, como en el prototipo. */
export default function TabsLayout() {
  const { t } = useTranslation();
  const { isTablet } = useLayout();
  const tab = (name: IconName, label: string) => ({
    title: label,
    tabBarIcon: ({ color }: { color: string }) => <TabIcon name={name} color={color} />,
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontWeight: '800', fontSize: 11 },
        tabBarPosition: isTablet ? 'left' : 'bottom',
        tabBarVariant: isTablet ? 'material' : 'uikit',
        tabBarStyle: { backgroundColor: colors.card, borderColor: colors.border },
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
