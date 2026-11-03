import type { TFunction } from 'i18next';

import { levelLabel } from '@/features/assessment/labels';
import { formatClock } from '@/lib/format/clock';
import { formatDecimal } from '@/lib/format/quantity';

import { levelArea, valueLevel, type GoalMetric } from './metrics';

/** "63,4 kg" · "12 tekrar" · "45 sn" · "2:05" · "68 bpm" · "Orta". */
export function formatGoalValue(t: TFunction, metric: GoalMetric, value: number): string {
  const area = levelArea(metric.id);
  if (area) return levelLabel(t, area, valueLevel(value));
  switch (metric.unit) {
    case 'clock':
      return `${formatClock(value)} ${t('units.minutes')}`;
    case 'reps':
      return `${Math.round(value)} ${t('units.reps')}`;
    case 'seconds':
      return `${Math.round(value)} ${t('units.seconds')}`;
    case 'bpm':
      return `${Math.round(value)} ${t('units.bpm')}`;
    default:
      return `${formatDecimal(value, metric.decimals)} ${t(`units.${metric.unit}`)}`;
  }
}

/** Yalnız sayı (grafik ekseni, dar yerler). */
export function formatGoalNumber(metric: GoalMetric, value: number): string {
  if (metric.unit === 'clock') return formatClock(value);
  return formatDecimal(value, metric.decimals);
}

/** İşaretli fark: "+5 tekrar", "−1,5 cm", "−0:12 dk". Seviye hedefinde adım sayısı. */
export function formatGoalDelta(t: TFunction, metric: GoalMetric, delta: number): string {
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
  if (levelArea(metric.id)) return `${sign}${t('goals.levelStep', { count: Math.abs(Math.round(delta)) })}`;
  return `${sign}${formatGoalValue(t, metric, Math.abs(delta))}`;
}

/** Değişim iyi yönde mi (kiloda düşüş, şınavda artış). */
export function isImprovement(metric: GoalMetric, delta: number): boolean {
  return metric.better === 'higher' ? delta > 0 : delta < 0;
}
