import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Appearance } from 'react-native';
import { Uniwind } from 'uniwind';

import { zustandStorage } from '@/lib/storage/kv';

/**
 * Tema tercihi: Sistem (varsayılan), Açık, Koyu, Koyu lacivert.
 *
 * Sistem telefonun temasını izler: açıkta Açık (N2-L), koyuda Koyu (N3-D). Koyu lacivert (N2-D, Kamil 22 Ekim)
 * yalnız buradan seçilir; `global.css`'teki üçüncü token bloğudur (`@variant navy`, Uniwind özel teması —
 * `metro.config.js` → `extraThemes`). Geçiş TEK çağrı: Uniwind etkin token kümesini değiştirir, sınıflar ve
 * `useColorTokens` (SVG, simge, native prop) aynı kümeden okur; ek renk tablosu yok.
 *
 * Açık ve koyuyu Uniwind `Appearance.setColorScheme` ile uyguluyor; böylece durum çubuğu, gezinti teması,
 * tarih seçici ve klavye de (`useColorScheme`) aynı seçimi görüyor. Özel temada Uniwind native şemayı
 * "sistem"e bırakır — Koyu lacivert koyu bir tema olduğu için native şema burada koyuya çekilir. Uniwind
 * özel temadayken `Appearance` olaylarını dinlemez, yani bu çağrı token kümesini geri çevirmez.
 *
 * Seçim cihazda saklanır (dil tercihi gibi); tema kişisel veri değil. DeepSport Atletik'teki deponun aynısı.
 */
export type ThemePreference = 'system' | 'light' | 'dark' | 'navy';

/** Ayarlar › Tema seçicisindeki sıra. */
export const THEME_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark', 'navy'];

function applyTheme(theme: ThemePreference) {
  Uniwind.setTheme(theme);
  if (theme === 'navy') Appearance.setColorScheme('dark');
}

type ThemeState = {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: 'deeptrainer.theme',
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        const stored = state?.theme;
        if (stored === 'light' || stored === 'dark' || stored === 'navy') applyTheme(stored);
      },
    },
  ),
);
