import { BottomTabBarHeightContext } from 'expo-router/js-tabs';
import { useContext } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  breakpointFor,
  columnsFor,
  contentWidthFor,
  tabSceneWidthFor,
  type Breakpoint,
  type ContentKind,
} from './breakpoints';

/**
 * Düzen kararlarının React tarafı — hepsi `breakpoints.ts` içindeki saf fonksiyonları sarmalar.
 * Karar mantığı orada duruyor ki betikten sınanabilsin; burada yalnız ekran genişliği okunur.
 */

export function useBreakpoint(): Breakpoint {
  return breakpointFor(useWindowDimensions().width);
}

export function useContentWidth(kind: ContentKind = 'form'): number {
  return contentWidthFor(useWindowDimensions().width, kind);
}

/**
 * Liste sütun sayısı. Sekme sahnesindeki listeler `inTabs` verir: genişte soldaki sekme şeridi sahneden
 * yer alıyor, sütun pencereye göre hesaplanırsa kartlar sıkışır (bkz. `SIDE_TAB_WIDTH`).
 */
export function useListColumns({ inTabs = false }: { inTabs?: boolean } = {}): number {
  const width = useWindowDimensions().width;
  return columnsFor(inTabs ? tabSceneWidthFor(width) : width);
}

/**
 * Sekme çubuğunun yeri: genişte (tablet yatay) solda dikey bir şerit, diğer genişliklerde altta.
 * Altta duran çubuk ekranın alt güvenli alanını kendisi karşılar; solda dururken bu iş sahnenin
 * kendisine kalır — bkz. `useTabSceneBottomInset`.
 */
export function useTabBarPosition(): 'bottom' | 'left' {
  return breakpointFor(useWindowDimensions().width) === 'wide' ? 'left' : 'bottom';
}

/**
 * Sekme ekranındaki listenin altına bırakılacak güvenli alan. Çubuk alttayken sıfır (alt güvenli
 * alanı çubuk zaten kaplıyor; ikinci kez eklemek listenin altında boş bir şerit bırakıyordu),
 * soldayken cihazın alt güvenli alanı.
 */
export function useTabSceneBottomInset(): number {
  const position = useTabBarPosition();
  const insets = useSafeAreaInsets();
  return position === 'left' ? insets.bottom : 0;
}

/**
 * Ekranın alt boşluğu: sekme sahnesinde (Profil › Ayarlar › Onaylar, Takımlar › Takımı düzenle) alttaki çubuk
 * cihazın alt güvenli alanını zaten kaplar, yalnız küçük bir pay kalır; sekmelerin üstünde açılan ekranda cihazın
 * alt güvenli alanı. Kabuklar (`FormScreen`) aynı bileşeni iki yerde de kullanabilsin diye sahnenin kendisinden
 * okunur — sekme sahnesi `BottomTabBarHeightContext` sağlar, kök yığın sağlamaz.
 */
export function useSceneBottomInset(minimum = 12): number {
  const inTabScene = useContext(BottomTabBarHeightContext) !== undefined;
  const tabInset = useTabSceneBottomInset();
  const insets = useSafeAreaInsets();
  return inTabScene ? Math.max(tabInset, minimum) : Math.max(insets.bottom, minimum);
}
