import i18n from '@/lib/i18n';

import { formatClock, isClockDuration } from './clock';

export { CLOCK_FROM_SECONDS, formatClock, isClockDuration } from './clock';

/**
 * Ekranların biçimlediği büyüklükler. Web `lib/units` (PDF'te kullanılan, bayt-birebir senkron) 15 büyüklük ve
 * emperyal sistem taşır; ekranlar bunların sekizini, yalnız metrik gösterir (`report-values.ts` indirger).
 * `ratio` birimsiz oran: 10/5 RSI testinin ana değeri (RSI, "0,82") — iki ondalık, birim etiketi yok.
 */
export type Quantity = 'length' | 'duration' | 'count' | 'angle' | 'mass' | 'percentage' | 'velocity' | 'ratio';
export type LengthScale = 'cm' | 'm';

/**
 * Ölçüm değeri biçimleme.
 *
 * YALNIZ METRİK. Web'de bir birim sistemi tercihi var (metrik/emperyal) ama mobilde ayarlar
 * ekranı henüz yok ve halihazırdaki ölçüm yüzeyi de (kg, cm) metrik. İkinci bir sistemi
 * kullanıcının seçemediği bir yerde taşımak, iki platformun sessizce ayrışması demek olurdu.
 * Ayarlar geldiğinde buraya bir `system` parametresi eklenir; imza o güne hazır duruyor.
 *
 * Ondalık basamak sayısı büyüklüğe bağlı ve web'le aynı: cm bir, metre iki, süre iki, açı bir,
 * sayı sıfır, kütle bir, yüzde bir, oran (RSI) iki. Bir dakikadan uzun süre "8:43 dk" (`CLOCK_FROM_SECONDS`).
 */

const DECIMALS: Record<Quantity, number> = {
  length: 1, // ölçeğe göre aşağıda düzeltilir
  duration: 2,
  count: 0,
  angle: 1,
  mass: 1,
  percentage: 1,
  velocity: 2,
  ratio: 2,
};

const LENGTH_DECIMALS: Record<LengthScale, number> = { cm: 1, m: 2 };

/** Sözlükteki birim etiketi anahtarı. Boş etiketli büyüklükler sayıya bitişik yazılır. */
const UNIT_KEY: Record<Quantity, string | null> = {
  length: null, // ölçekten türetilir
  duration: 'units.seconds',
  count: null, // birimsiz — "29" yeterli, "29 adet" değil
  angle: 'units.degrees',
  mass: 'units.kg',
  percentage: 'units.percent',
  velocity: 'units.metersPerSecond',
  ratio: null, // birimsiz — RSI "0,82"
};

/** Birimi sayıya BİTİŞİK yazılanlar: `29`, `12.4°`, `%5`. */
const ATTACHED: ReadonlySet<Quantity> = new Set<Quantity>(['count', 'angle', 'percentage']);

export function decimalsFor(quantity: Quantity, scale: LengthScale = 'cm'): number {
  return quantity === 'length' ? LENGTH_DECIMALS[scale] : DECIMALS[quantity];
}

/** Birim etiketi. `value` verilirse uzun süre "dk" olur (sayısı `formatValue`'da "8:43"). */
export function unitLabel(quantity: Quantity, scale: LengthScale = 'cm', value?: number | null): string {
  if (isClockDuration(quantity, value)) return i18n.t('units.minutes');
  const key = quantity === 'length' ? `units.${scale}` : UNIT_KEY[quantity];
  return key ? i18n.t(key) : '';
}

/**
 * Ondalık ayırıcı dilden: İngilizce nokta, diğer dokuz dil (tr, de, es, fr, it, pt, ru, pl, sr) virgül —
 * çizimlerdeki "33,5 cm", "20,6" (Kamil, 22 Ekim: ekranda "24.2" yazıyordu). Binlik ayırıcı kullanılmaz.
 */
export function localizeDecimal(text: string): string {
  return (i18n.language ?? 'tr').startsWith('en') ? text : text.replace('.', ',');
}

/** Sayı → dilin ondalık ayırıcısıyla, sabit basamakla (`formatDecimal(24.17, 1)` → "24,2"). */
export function formatDecimal(value: number, digits: number): string {
  return localizeDecimal(value.toFixed(digits));
}

/** Sayı — birimsiz, yalnız doğru ondalıkla; uzun süre "8:43" (birimi `unitLabel(…, value)` → "dk"). */
export function formatValue(
  value: number | null | undefined,
  quantity: Quantity,
  scale: LengthScale = 'cm',
): string {
  if (value == null || !Number.isFinite(value)) return '—';
  if (isClockDuration(quantity, value)) return formatClock(value);
  return formatDecimal(value, decimalsFor(quantity, scale));
}

/** Sayı + birim. Birim bilinmiyorsa (`unit` null) yalnız sayı döner. */
export function formatQuantity(
  value: number | null | undefined,
  unit: { quantity: Quantity; scale?: LengthScale } | null,
): string {
  if (value == null || !Number.isFinite(value)) return '—';
  if (!unit) return localizeDecimal(String(Number.parseFloat(value.toFixed(2))));

  const scale = unit.scale ?? 'cm';
  const text = formatValue(value, unit.quantity, scale);
  const label = unitLabel(unit.quantity, scale, value);
  if (!label) return text;
  return ATTACHED.has(unit.quantity) ? `${text}${label}` : `${text} ${label}`;
}

/** İşaretli fark: `+3.2 cm`, `−0.08 sn`. Eksi işareti gerçek eksi (U+2212). */
export function formatSignedQuantity(
  value: number | null | undefined,
  unit: { quantity: Quantity; scale?: LengthScale } | null,
): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const text = formatQuantity(Math.abs(value), unit);
  if (text === '—') return text;
  if (value > 0) return `+${text}`;
  if (value < 0) return `−${text}`;
  return text;
}

/** Yüzde iyileşme: `+9.9%`, `−7.5%`. Bir ondalık — liste ve kart aynı hassasiyette. */
export function formatPercent(percent: number | null | undefined): string {
  if (percent == null || !Number.isFinite(percent)) return '—';
  const text = formatDecimal(Math.abs(percent), 1);
  if (percent > 0) return `+${text}%`;
  if (percent < 0) return `−${text}%`;
  return `${text}%`;
}
