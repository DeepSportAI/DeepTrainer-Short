/**
 * Gruplu liste satırının yeri (tasarım 03: satırlar tek bir kartın içinde, aralarında ayraç).
 *
 * Köşe yuvarlaklığı ve ayraç buna göre çizilir. Sütunlu düzende (tablet) her satır kendi kartıdır:
 * sütunlar arasında bölünmüş bir kart okunmuyor. Sonraki sayfa yüklenecekse son satır henüz "son"
 * değildir — alt köşeleri yeni sayfa gelince kapanır.
 *
 * Saf modül: react-native import etmez.
 */
export type RowPosition = 'single' | 'first' | 'middle' | 'last';

export function groupedRowPosition(index: number, count: number, columns: number, hasMore = false): RowPosition {
  if (columns > 1 || (count === 1 && !hasMore)) return 'single';
  if (index === 0) return 'first';
  if (index === count - 1 && !hasMore) return 'last';
  return 'middle';
}
