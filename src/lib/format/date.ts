import i18n from '@/lib/i18n';

import { dateToIsoDay, isoDayToDate } from './iso-day';

/**
 * Tarih biçimleme.
 *
 * `toLocaleDateString` KULLANILMIYOR: Hermes'in `Intl` kapsamı platforma ve sürüme göre değişiyor
 * ve eksik olduğu yerde sessizce ISO biçimine düşüyor — ekranda "2026-09-18" beliriyor ve kimse
 * fark etmiyor. Ay adları sözlükten geliyor, yani çıktı her cihazda aynı ve çeviriyle geliyor.
 */

function monthNames(): string[] {
  const value = i18n.t('common.months', { returnObjects: true });
  return Array.isArray(value) ? (value as string[]) : [];
}

/** `18 Eyl 2026` */
export function formatShortDate(epoch: number): string {
  const date = new Date(epoch);
  const month = monthNames()[date.getMonth()] ?? String(date.getMonth() + 1);
  return `${String(date.getDate()).padStart(2, '0')} ${month} ${date.getFullYear()}`;
}

/** `18 Eyl` — grafik ekseni gibi dar yerler için. */
export function formatDayMonth(epoch: number): string {
  const date = new Date(epoch);
  const month = monthNames()[date.getMonth()] ?? String(date.getMonth() + 1);
  return `${String(date.getDate()).padStart(2, '0')} ${month}`;
}

/** Tarih seçicinin gösterdiği hâl: `18 Eylül 2026`. */
export function formatLongDate(epoch: number): string {
  const date = new Date(epoch);
  const value = i18n.t('common.monthsLong', { returnObjects: true });
  const long = Array.isArray(value) ? (value as string[]) : [];
  const month = long[date.getMonth()] ?? monthNames()[date.getMonth()] ?? '';
  return `${date.getDate()} ${month} ${date.getFullYear()}`;
}

/** Saat: `16:42` (24 saat, bütün dillerde aynı biçim). */
export function formatTime(epoch: number): string {
  const date = new Date(epoch);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** Ay ve yıl: `Mart 2026` (profilde "… beri üye"). */
export function formatMonthYear(epoch: number): string {
  const date = new Date(epoch);
  const value = i18n.t('common.monthsLong', { returnObjects: true });
  const long = Array.isArray(value) ? (value as string[]) : [];
  const month = long[date.getMonth()] ?? monthNames()[date.getMonth()] ?? '';
  return `${month} ${date.getFullYear()}`.trim();
}

/* ── Takvim günü (ISO `YYYY-MM-DD`, yerel) ─────────────────────────────────── */

function weekdayNames(kind: 'weekdaysShort' | 'weekdaysLong'): string[] {
  const value = i18n.t(`common.${kind}`, { returnObjects: true });
  return Array.isArray(value) ? (value as string[]) : [];
}

export { dateToIsoDay, isoDayToDate };

/** `Pzt` */
export function formatWeekdayShort(iso: string): string {
  const date = isoDayToDate(iso);
  return weekdayNames('weekdaysShort')[date.getDay()] ?? '';
}

/** Plan günü kartı: `Pzt 13 Eki`. */
export function formatDayCard(iso: string): string {
  const date = isoDayToDate(iso);
  return `${formatWeekdayShort(iso)} ${formatDayMonth(date.getTime())}`.trim();
}

/** Başlangıç satırı: `13 Ekim 2026 Pazartesi`. */
export function formatLongDateWithWeekday(iso: string): string {
  const date = isoDayToDate(iso);
  const weekday = weekdayNames('weekdaysLong')[date.getDay()] ?? '';
  return `${formatLongDate(date.getTime())} ${weekday}`.trim();
}
