/**
 * Ekran genişliğine göre düzen kararları.
 *
 * CİHAZ TÜRÜNE DEĞİL GENİŞLİĞE bakılır. "Tablet mi?" yanlış soru: iPad'de bölünmüş görünümde
 * uygulama telefon genişliğinde açılır, telefon yan çevrilince tablet genişliğine yaklaşır,
 * katlanabilir Android'ler ikisi arasında gidip gelir. Genişlik üçünü de tek kuralla karşılar.
 *
 * Bu dosya BİLEREK bağımlılıksızdır (react-native import ETMEZ): hook'lar `use-layout.ts`
 * içinde duruyor. Böylece `npm run verify:layout` bütün genişlik aralığını cihaz açmadan,
 * uygulamanın gerçek kararlarıyla sınayabiliyor.
 */

export type Breakpoint = 'phone' | 'tablet' | 'wide';

/**
 * Eşikler cihaz tablosundan değil SATIRIN OKUNURLUĞUNDAN türetildi.
 *
 * Tek sütunda bir satır ~560 pt'yi geçince avatar solda, dokunma oku çok uzakta kalıyor ve
 * satır dağılıyor. 560'ta ikinci sütuna geçilince her sütun ~264 pt oluyor — hâlâ rahat.
 * `verify:layout` bu iki sınırı 320-1400 arası her genişlikte denetliyor; eşiği değiştirirsen
 * orada kırmızı yanar.
 */
export const TABLET_MIN = 560;
export const WIDE_MIN = 1024;

/** İki yandaki toplam boşluk. İçerik hiçbir genişlikte kenara yapışmaz. */
export const GUTTER = 32;

export const CONTENT_MAX = {
  /** Giriş, kayıt, onay kartları gibi dar sütunlar. */
  form: 440,
  /** Uzun metin; yaklaşık 65 karakterlik satır. */
  prose: 660,
  /** Liste ve ızgaralar. */
  wide: 900,
} as const;

export type ContentKind = keyof typeof CONTENT_MAX;

export function breakpointFor(width: number): Breakpoint {
  if (width >= WIDE_MIN) return 'wide';
  if (width >= TABLET_MIN) return 'tablet';
  return 'phone';
}

/**
 * İçeriğin gerçek genişliği: ekranda kalan yer ile üst sınırın küçüğü.
 *
 * Telefonda üst sınıra takılmaz, ekranı kullanır. Tablette ortalanır — bir giriş formunu
 * 1000 pt genişletmek onu kullanışlı değil saçma yapar.
 */
export function contentWidthFor(width: number, kind: ContentKind = 'form'): number {
  return Math.min(Math.max(width - GUTTER, 0), CONTENT_MAX[kind]);
}

/**
 * Listedeki sütun sayısı. Geniş ekranda tek sütun bırakmak da hata olurdu: avatarı solda,
 * dokunma okunu 900 pt ötede bırakan satırlar üretir.
 */
export function columnsFor(width: number): number {
  const breakpoint = breakpointFor(width);
  return breakpoint === 'wide' ? 3 : breakpoint === 'tablet' ? 2 : 1;
}

/** Bir sütunun gerçek genişliği — satırın okunur kalıp kalmadığını sınamak için. */
export function columnWidthFor(width: number): number {
  return contentWidthFor(width, 'wide') / columnsFor(width);
}

/**
 * Genişte (≥ `WIDE_MIN`) sekme çubuğu sola şerit olarak geçer ve sekme sahnesinden bu kadar yer alır.
 *
 * React Navigation'ın varsayılanı Material çekmece genişliği (360 pt). iPad 13" dikeyde (1032 pt) bu,
 * sahneye 672 pt bırakıp üç sütunlu listede kartları ~220 pt'ye indiriyor ve adları "A.", "C." diye
 * kesiyordu. `(tabs)/_layout.tsx` şeridi bu genişliğe sabitler; sekme sahnesindeki listeler sütunu
 * pencereden değil `tabSceneWidthFor`'dan hesaplar.
 */
export const SIDE_TAB_WIDTH = 240;

/** Sekme sahnesinin gerçek genişliği: genişte soldaki şerit düşülür. */
export function tabSceneWidthFor(width: number): number {
  return breakpointFor(width) === 'wide' ? width - SIDE_TAB_WIDTH : width;
}
