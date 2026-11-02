import { useSyncExternalStore } from 'react';
import { useCSSVariable } from 'uniwind';

import i18n from '@/lib/i18n';

/**
 * Yazı tipleri (F1 eşlemesi, 22 Ekim 2026): bütün metin Barlow, sayılar Barlow Semi Condensed + eşit
 * genişlikli rakam. Aile adları `src/global.css` içindeki `--font-sans` / `--font-num` token'larındadır;
 * dosyalar `assets/fonts/`, native kayıt `app.json` → `expo-font` eklentisi (yeni native derleme ister).
 *
 * React Native'de varsayılan yazı tipi yoktur: metin `components/ui/text` ve `components/ui/text-input`
 * sarmalayıcılarından geçer, onlar `font-sans` sınıfını ekler. Sayı gösterimleri `font-num` sınıfını
 * kendisi yazar (çağıranın sınıfı sonra geldiği için ailesi kazanır).
 *
 * Barlow'da Kiril yok. Rusçada metin platform yazı tipinde kalır (sarmalayıcı aile eklemez), yalnız
 * rakamlar `font-num` ile Barlow Semi Condensed olur — bir kelimenin içinde iki yazı tipi karışmaz.
 */

/** Barlow'un çizmediği alfabeyle yazılan diller: metin bu dillerde platform yazı tipinde kalır. */
const PLATFORM_TEXT_FONT_LOCALES: readonly string[] = ['ru'];

/** Metin ailesinin sınıfı (`--font-sans` → Barlow). Bileşenler bunu yazmaz; sarmalayıcı ekler. */
export const TEXT_FONT_CLASS = 'font-sans';

/** Bu dilde metin Barlow ile mi yazılır (yoksa platform yazı tipiyle mi)? */
export function usesBrandTextFont(language: string | undefined): boolean {
  return !PLATFORM_TEXT_FONT_LOCALES.includes((language ?? '').slice(0, 2).toLowerCase());
}

/** Çağıranın sınıflarının ÖNÜNE metin ailesini ekler; Uniwind'de sonraki sınıf kazanır (`font-num` gibi). */
export function withTextFontClass(className: string | undefined, brand: boolean): string | undefined {
  if (!brand) return className;
  return className ? `${TEXT_FONT_CLASS} ${className}` : TEXT_FONT_CLASS;
}

function subscribeLanguage(onChange: () => void) {
  i18n.on('languageChanged', onChange);
  return () => i18n.off('languageChanged', onChange);
}

function brandTextFontSnapshot() {
  return usesBrandTextFont(i18n.language);
}

/** Etkin dilde metin Barlow mu? Dil değişince yeniden render eder. */
export function useBrandTextFont(): boolean {
  return useSyncExternalStore(subscribeLanguage, brandTextFontSnapshot, brandTextFontSnapshot);
}

/**
 * Sınıf adı kabul etmeyen native yazı tipi alanları için (React Navigation `tabBarLabelStyle` gibi):
 * metin ailesinin adı ya da `undefined` (Rusça: platform yazı tipi). `{ fontFamily: undefined }`
 * yazmak yerine `...(family ? { fontFamily: family } : null)` ile yayın.
 */
export function useTextFontFamily(): string | undefined {
  const brand = useBrandTextFont();
  const family = useCSSVariable('--font-sans');
  return brand && typeof family === 'string' ? family : undefined;
}
