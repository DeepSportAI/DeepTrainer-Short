import type { Quantity } from './quantity';

/**
 * Uzun süreler dakika:saniye yazılır — "523,00 sn" değil "8:43 dk" (dayanıklılık, uzun tutuşlar). Tek kural: test
 * kartı, test detayı, Analiz, hedefler ve sporcunun ekranları `quantity.ts` üzerinden bunu kullanır. SAF (i18n yok):
 * hedef yuvarlaması (`athlete-detail-analysis`) ve doğrulama betikleri de buradan okur.
 */
export const CLOCK_FROM_SECONDS = 60;

export function isClockDuration(quantity: Quantity, value: number | null | undefined): boolean {
  return quantity === 'duration' && typeof value === 'number' && Number.isFinite(value) && Math.abs(value) >= CLOCK_FROM_SECONDS;
}

/** Saniye → "8:43" (en yakın tam saniye; eksi işareti gerçek eksi). */
export function formatClock(seconds: number): string {
  const total = Math.round(Math.abs(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${seconds < 0 ? '−' : ''}${minutes}:${String(rest).padStart(2, '0')}`;
}
