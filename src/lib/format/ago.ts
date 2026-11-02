import i18n from '@/lib/i18n';

/**
 * "bugün" · "dün" · "3 gün önce" · "2 hafta önce" · "4 ay önce" — takvim gününe göre (saat farkı değil).
 * Saf hesap `agoParts`'ta; metin sözlükten (`time.ago.*`).
 */
export type AgoUnit = 'today' | 'yesterday' | 'days' | 'weeks' | 'months';

export function agoParts(epoch: number, now: number = Date.now()): { unit: AgoUnit; count: number } {
  const start = (value: number) => {
    const date = new Date(value);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  };
  const days = Math.max(0, Math.round((start(now) - start(epoch)) / 86_400_000));
  if (days === 0) return { unit: 'today', count: 0 };
  if (days === 1) return { unit: 'yesterday', count: 1 };
  if (days < 14) return { unit: 'days', count: days };
  if (days < 60) return { unit: 'weeks', count: Math.floor(days / 7) };
  return { unit: 'months', count: Math.floor(days / 30) };
}

export function formatAgo(epoch: number, now: number = Date.now()): string {
  const { unit, count } = agoParts(epoch, now);
  return i18n.t(`time.ago.${unit}`, { count });
}
