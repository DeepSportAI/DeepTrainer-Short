import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import i18n, { SUPPORTED_LOCALES, type AppLocale } from '@/lib/i18n';
import { zustandStorage } from '@/lib/storage/kv';

/**
 * Arayüz dili tercihi.
 *
 * Varsayılan CİHAZIN dili, seçim yapılmamışsa öyle kalır (`locale: null`). Kullanıcı elle
 * seçerse seçimi kalıcılaşır ve cihaz dili değişse bile korunur — biri Türkçe konuşup
 * telefonunu İngilizce kullanıyorsa uygulamayı Türkçe'de tutabilmeli.
 *
 * Depodan okuma asenkron; `initI18n` açılışta cihaz diliyle başlar, kayıtlı tercih gelince
 * burada uygulanır. Kullanıcı bir kare boyunca cihaz dilini görebilir, bu kabul edilebilir.
 */
type LocaleState = {
  /** null = cihazın dili kullanılsın. */
  locale: AppLocale | null;
  setLocale: (locale: AppLocale) => void;
};

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: null,
      setLocale: (locale) => {
        void i18n.changeLanguage(locale);
        set({ locale });
      },
    }),
    {
      name: 'deeptrainer.locale',
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        const stored = state?.locale;
        if (stored && SUPPORTED_LOCALES.includes(stored) && i18n.language !== stored) {
          void i18n.changeLanguage(stored);
        }
      },
    },
  ),
);

/** Şu an etkin dil — tercih yoksa cihazdan çözülen dil. */
export function useActiveLocale(): AppLocale {
  const stored = useLocaleStore((s) => s.locale);
  return stored ?? (i18n.language.slice(0, 2) as AppLocale);
}
