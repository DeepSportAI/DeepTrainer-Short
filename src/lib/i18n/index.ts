import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import tr from './locales/tr.json';

/**
 * Diller — DeepSport Atletik'teki i18next kurgusunun aynısı, iki dille: TR (varsayılan) ve EN (yedek).
 *
 * TR ve EN hep eşit ve eksiksiz: eksik anahtarda i18next anahtarın KENDİSİNİ basar
 * (`npm run verify:i18n` iki dosyayı ve koddaki anahtarları denetler).
 * Hitap: antrenörün okuduğu cümleler "siz"; sporcuya okunan komutlar ve PDF raporu "sen".
 */
export const SUPPORTED_LOCALES = ['tr', 'en'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = 'tr';

/** Dillerin kendi adları — çevrilmez. */
export const LOCALE_NATIVE_NAMES: Record<AppLocale, string> = {
  tr: 'Türkçe',
  en: 'English',
};

export function deviceLocale(): AppLocale {
  const tag = getLocales()[0]?.languageCode?.toLowerCase();
  return SUPPORTED_LOCALES.includes(tag as AppLocale) ? (tag as AppLocale) : DEFAULT_LOCALE;
}

export function initI18n(locale: AppLocale = deviceLocale()) {
  if (i18n.isInitialized) return i18n;

  void i18n.use(initReactI18next).init({
    resources: {
      tr: { translation: tr },
      en: { translation: en },
    },
    lng: locale,
    fallbackLng: 'en',
    // React zaten kaçış yapıyor; i18next'in kendi kaçışı çift kaçışa yol açar.
    interpolation: { escapeValue: false },
    returnNull: false,
  });

  return i18n;
}

export default i18n;
