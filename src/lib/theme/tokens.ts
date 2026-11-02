import { useCSSVariable } from 'uniwind';

/**
 * Token'ların JS tarafındaki tek kapısı.
 *
 * Renkler normalde `className` ile verilir ve hiçbir bileşen renk değeri görmez. Ama bazı yerlerde
 * sınıf adı işe yaramaz: SVG degrade durakları, gölge rengi, ikon rengi ve native bileşen prop'ları
 * gerçek bir değer ister. Oralarda da renk GÖMÜLMEZ — buradan okunur.
 *
 * Uniwind `oklch` değerlerini derleme anında `#rrggbb(aa)` biçimine çevirir; dönen değer doğrudan
 * `react-native-svg` ve RN stil alanlarına verilebilir. Değer ETKİN temanın bloğundan okunur — açık, koyu ya da
 * seçimle gelen Koyu lacivert (`@variant navy`, Uniwind özel teması); ayrı bir renk tablosu yok. Tema değişince
 * abonelik yeniden render eder (yalnız değeri değişen çağıranlar).
 */

export type ColorToken =
  | 'background'
  | 'foreground'
  | 'card'
  // Volt DOLGU (iki temada): birincil düğme, seçili sekme / çip / segment, "Test al". Üstündeki yazı ve simge
  // daima `primary-foreground`; açık zeminde `primary` yazı / simge rengi OLMAZ (bkz. `global.css`).
  | 'primary'
  | 'primary-foreground'
  // Yazı ve simge vurgusu: bağlantı, vurgulu simge, odak kenarı (açıkta mürekkep lacivert, koyuda elektrik mavisi).
  | 'interactive'
  | 'interactive-foreground'
  // Grafik: halka, ilerleme, çizgi, radar, kapasite çubuğu.
  | 'data'
  // Tam logo rengi (`BrandLogo`): açıkta lacivert, koyuda beyaz.
  | 'brand'
  // Kahraman kart: zemin, yazı, düğme ve düğme yazısı (bkz. `global.css`).
  | 'hero'
  | 'hero-foreground'
  | 'hero-action'
  | 'hero-action-foreground'
  | 'muted-foreground'
  | 'border'
  | 'ring'
  | 'destructive'
  // Kırmızı dolgunun üstündeki yazı / simge (kaydırınca "Sil").
  | 'destructive-foreground'
  | 'success'
  // Yeşil dolgunun üstündeki işaret ("yapıldı" dairesi).
  | 'success-foreground'
  // Uyarı: eksik test, nabız bağlantısı koptu.
  | 'warning'
  // Turuncu dolgunun üstündeki işaret (kontrol maddesinde "Var").
  | 'warning-foreground'
  // Değerlendirme merdiveni — Çok Zayıf → Çok İyi (bkz. `global.css`).
  | 'level-1'
  | 'level-2'
  | 'level-3'
  | 'level-4'
  | 'level-5'
  | 'glow'
  | 'scrim'
  | 'shadow'
  // Hep koyu katman (video kutusu, kronometre tam ekranı) — tema değişmez (bkz. `global.css`).
  | 'overlay-ink'
  | 'overlay-base'
  | 'overlay-scrim'
  | 'overlay-guide'
  | 'overlay-pending'
  | 'overlay-active'
  | 'overlay-active-foreground'
  | 'overlay-ok'
  | 'overlay-fail'
  | 'overlay-surface';

/** Tek token. Bulunamazsa `undefined` — çağıran yeri bunu görünür bir hataya çevirmeden ele almalı. */
export function useColorToken(token: ColorToken): string | undefined {
  const value = useCSSVariable(`--color-${token}`);

  return typeof value === 'string' ? value : undefined;
}

/** Birden çok token tek abonelikte. Sıra korunur. */
export function useColorTokens<const T extends readonly ColorToken[]>(
  tokens: T,
): { [K in keyof T]: string | undefined } {
  const values = useCSSVariable(tokens.map((token) => `--color-${token}`));

  return values.map((value) => (typeof value === 'string' ? value : undefined)) as {
    [K in keyof T]: string | undefined;
  };
}
