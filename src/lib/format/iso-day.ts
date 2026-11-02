/**
 * Takvim günü (`YYYY-MM-DD`, YEREL) ↔ `Date` — saf, sözlüğe bağlı değil (betikten sınanır).
 *
 * `new Date('2026-10-13')` UTC gece yarısı okur; UTC'nin gerisindeki saat dilimlerinde bir önceki güne
 * düşer. Plan günleri ve seçilen başlangıç her zaman yerel gün olarak kurulur.
 */
export function isoDayToDate(iso: string): Date {
  const [year, month, day] = iso.split('T')[0].split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

/** Tarih seçicinin verdiği gün → `YYYY-MM-DD` (yerel). */
export function dateToIsoDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
