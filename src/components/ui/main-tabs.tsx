import type { Href } from 'expo-router';
import { ClipboardList, Dumbbell, Plus, Settings, Users, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { useColorTokens } from '@/lib/theme/tokens';

export type MainTabName = 'index' | 'tests' | 'start' | 'exercises' | 'settings';

/**
 * Ana sekmeler: Sporcular (ana sayfa — Kamil, 2 Kasım 2026: "ana sayfada direkt sporcular formatında olsun") ·
 * Testler · [Test al] · Hareketler · Ayarlar. Sekme düzeni (`(tabs)/_layout.tsx`) ve sekmelerin dışındaki ekranlarda
 * çizilen çubuk (`StackTabBar`) aynı listeden okur. "Test al" sekme değil eylem: `href` yok, sporcu seçimini açar.
 */
export const MAIN_TABS: readonly { name: MainTabName; href: Href | null; titleKey: string; Icon: LucideIcon }[] = [
  { name: 'index', href: '/', titleKey: 'nav.athletes', Icon: Users },
  { name: 'tests', href: '/tests', titleKey: 'nav.tests', Icon: ClipboardList },
  { name: 'start', href: null, titleKey: 'nav.startTest', Icon: Plus },
  { name: 'exercises', href: '/exercises', titleKey: 'nav.exercises', Icon: Dumbbell },
  { name: 'settings', href: '/settings', titleKey: 'nav.settings', Icon: Settings },
];

/**
 * Ortadaki "Test al": altta 46 pt volt dolu daire, çubuğun içinden hafif yukarı taşar; sol şeritte 40 pt. Koyu temada
 * volt hale (`glow`, açıkta saydam).
 */
export function ProminentTabIcon({ rail = false }: { rail?: boolean }) {
  const [primaryFg, glow] = useColorTokens(['primary-foreground', 'glow']);
  const halo = glow ? { boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 18, color: glow }] } : null;
  return (
    <View
      className="items-center justify-center rounded-full bg-primary"
      style={rail ? { width: 40, height: 40, ...halo } : { width: 46, height: 46, marginTop: -4, ...halo }}
    >
      <Plus size={rail ? 22 : 24} color={primaryFg} strokeWidth={2.4} />
    </View>
  );
}
