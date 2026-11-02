import { useRootNavigationState, useRouter, type Tabs } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { useKeyboardShown } from '@/hooks/use-keyboard-shown';
import { useTabBarPosition } from '@/lib/layout/use-layout';
import { useColorTokens } from '@/lib/theme/tokens';

import { MAIN_TABS, ProminentTabIcon, type MainTabName } from './main-tabs';

export type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

type CapsuleItem = {
  key: string;
  title: string;
  accessibilityLabel: string;
  focused: boolean;
  prominent: boolean;
  icon: (color: string) => ReactNode;
  onPress: () => void;
  onLongPress?: () => void;
};

/**
 * Yüzen sekme çubuğu (tasarım 03, bütün sekme ekranları): kenarlardan 14 pt içeride, altta kapsül;
 * seçili sekme volt dolu kapsül, simgesi ve etiketi koyu (`primary` / `primary-foreground`, S00C3); ortadaki
 * eylem (`prominent`, "Test al") volt dolu yuvarlak düğme, etiketi koyu.
 *
 * Çubuk akışın içinde durur (sahnenin üstüne binmez): çevresi sayfa zemininde, böylece listelerin
 * alt boşluğu değişmez. Alt boşluk: iOS'ta ev çizgisinin üstüne 24 pt (çizimdeki gibi), Android'de
 * gezinme çubuğunun üstüne. Klavye açıkken gizlenir. Tablette kapsül 520 pt'yi geçmez (beş sekme
 * 1000 pt'ye yayılmasın).
 */
function TabCapsule({ items }: { items: CapsuleItem[] }) {
  const insets = useSafeAreaInsets();
  const keyboardShown = useKeyboardShown();
  const [primaryFg, muted] = useColorTokens(['primary-foreground', 'muted-foreground']);

  if (keyboardShown) return null;
  const bottom = Platform.OS === 'ios' ? Math.max(insets.bottom - 10, 16) : insets.bottom + 12;

  return (
    <View className="bg-background px-3.5 pt-2" style={{ paddingBottom: bottom }}>
      <View
        accessibilityRole="tablist"
        className="w-full max-w-[520px] flex-row self-center rounded-full border border-border bg-card p-1.5"
      >
        {items.map((item) => {
          const selected = item.focused && !item.prominent;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={item.accessibilityLabel}
              onPress={item.onPress}
              onLongPress={item.onLongPress}
              className={`min-h-[52px] flex-1 items-center justify-center rounded-full px-1 active:opacity-70 ${
                item.prominent ? 'gap-1' : 'gap-0.5'
              } ${selected ? 'bg-primary' : ''}`}
            >
              {item.icon((selected ? primaryFg : muted) ?? '')}
              <Text
                numberOfLines={1}
                className={`text-[10.5px] leading-[13px] ${
                  item.prominent
                    ? 'font-semibold text-foreground'
                    : selected
                      ? 'font-extrabold text-primary-foreground'
                      : 'font-semibold text-muted-foreground'
                }`}
              >
                {item.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Sekme düzeninin çubuğu. Gezinme React Navigation'ın özel çubuk sözleşmesiyle: `tabPress` olayı yayınlanır
 * (ortadaki eylem bunu engelleyip sporcu seçimini açar), engellenmezse sekmeye geçilir.
 */
export function FloatingTabBar({ state, descriptors, navigation, prominent }: TabBarProps & { prominent?: string }) {
  const items = state.routes.map((route, index): CapsuleItem => {
    const { options } = descriptors[route.key];
    const focused = state.index === index;
    const title = typeof options.title === 'string' ? options.title : route.name;
    return {
      key: route.key,
      title,
      accessibilityLabel: options.tabBarAccessibilityLabel ?? title,
      focused,
      prominent: route.name === prominent,
      icon: (color) => options.tabBarIcon?.({ focused, color, size: 24 }),
      onPress: () => {
        const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
        if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
      },
      onLongPress: () => navigation.emit({ type: 'tabLongPress', target: route.key }),
    };
  });
  return <TabCapsule items={items} />;
}

/** Kök yığındaki ekranın altında kalan sekme (sporcuya hangi sekmeden gelindiyse o). */
function useUnderlyingTab(): MainTabName {
  const root = useRootNavigationState();
  const tabs = root?.routes.find((route) => route.name === '(tabs)')?.state;
  const name = tabs && typeof tabs.index === 'number' ? tabs.routes[tabs.index]?.name : undefined;
  return MAIN_TABS.find((tab) => tab.name === name)?.name ?? 'index';
}

/**
 * Sekmelerin DIŞINDA, kök yığında açılan ama çizimde sekme çubuğunu taşıyan ekranlar için aynı çubuk
 * (sporcu detayı, hareket detayı). Sekmeye dokununca yığın o sekmeye kadar kapanır
 * (`dismissTo`); sporcuya dönüş akışları (`router.replace` ile sporcu detayına) bozulmasın diye ekranlar
 * sekme grubuna taşınmadı. Ortadaki "Test al" her yerde olduğu gibi sporcu seçimini açar. Genişte (sol
 * şerit düzeni) çizilmez; o düzende kök yığın ekranları zaten şeritsiz. Ekranın son çocuğu olarak konur;
 * `mt-auto` yükleniyor / hata hâlinde de çubuğu en alta iter.
 */
export function StackTabBar() {
  const { t } = useTranslation();
  const router = useRouter();
  const position = useTabBarPosition();
  const active = useUnderlyingTab();
  if (position !== 'bottom') return null;

  const items = MAIN_TABS.map(({ name, href, titleKey, Icon }): CapsuleItem => {
    const title = t(titleKey);
    return {
      key: name,
      title,
      accessibilityLabel: title,
      focused: name === active,
      prominent: href === null,
      icon: (color) => (href === null ? <ProminentTabIcon /> : <Icon size={24} color={color} strokeWidth={2} />),
      onPress: () => (href === null ? router.push('/pick-athlete') : router.dismissTo(href)),
    };
  });
  return (
    <View className="mt-auto">
      <TabCapsule items={items} />
    </View>
  );
}
