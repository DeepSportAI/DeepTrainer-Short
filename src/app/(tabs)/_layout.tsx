import { Tabs, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { FloatingTabBar } from '@/components/ui/floating-tab-bar';
import { MAIN_TABS, ProminentTabIcon } from '@/components/ui/main-tabs';
import { SIDE_TAB_WIDTH } from '@/lib/layout/breakpoints';
import { useTabBarPosition } from '@/lib/layout/use-layout';
import { useTextFontFamily } from '@/lib/theme/fonts';
import { useColorTokens } from '@/lib/theme/tokens';

/**
 * Ana sekmeler — DeepSport Atletik'in sekme düzeninin aynısı: telefonda ve dikey tablette altta yüzen kapsül
 * (`FloatingTabBar`), genişte (≥ 1024 pt) solda dikey şerit. Ortadaki "Test al" sekme değil eylem: sporcu seçimini
 * (`/pick-athlete`) sekmelerin üstüne açar; rota dosyası (`start.tsx`) yalnız yer tutar.
 */
export default function TabsLayout() {
  const { t } = useTranslation();
  const router = useRouter();
  const position = useTabBarPosition();
  const [interactive, muted, card, border, background] = useColorTokens([
    'interactive',
    'muted-foreground',
    'card',
    'border',
    'background',
  ]);
  const fontFamily = useTextFontFamily();

  return (
    <Tabs
      tabBar={position === 'bottom' ? (props) => <FloatingTabBar {...props} prominent="start" /> : undefined}
      screenOptions={{
        headerShown: false,
        tabBarPosition: position,
        tabBarVariant: position === 'left' ? 'material' : 'uikit',
        tabBarActiveTintColor: interactive,
        tabBarInactiveTintColor: muted,
        tabBarStyle: {
          backgroundColor: card,
          borderTopColor: border,
          borderRightColor: border,
          ...(position === 'left' ? { width: SIDE_TAB_WIDTH, minWidth: SIDE_TAB_WIDTH } : null),
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', ...(fontFamily ? { fontFamily } : null) },
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: background },
      }}
    >
      {MAIN_TABS.map(({ name, titleKey, Icon }) =>
        name === 'start' ? (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              title: t(titleKey),
              tabBarAccessibilityLabel: t(titleKey),
              tabBarActiveTintColor: muted,
              tabBarIcon: () => <ProminentTabIcon rail={position === 'left'} />,
            }}
            listeners={{
              tabPress: (event) => {
                event.preventDefault();
                router.push('/pick-athlete');
              },
            }}
          />
        ) : (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              title: t(titleKey),
              tabBarIcon: ({ color, size }) => <Icon size={size} color={color} strokeWidth={2} />,
            }}
          />
        ),
      )}
    </Tabs>
  );
}
