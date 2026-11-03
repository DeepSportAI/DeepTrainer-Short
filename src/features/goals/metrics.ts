import type { Assessment, Level } from '@/features/assessment/model';
import type { Area } from '@/features/assessment/protocol';

/**
 * Hedeflenebilen ölçüler. Her ölçü bir değerlendirme oturumundan okunabilir (yeniden test hedefi kendiliğinden
 * günceller) ve çoğu ara kontrolde (hızlı ölçüm) tek başına girilebilir: kilo, bel, şınav, plank…
 *
 * `weeklyRate`: öneri hızının ölçüsü — başlangıç seviyesindeki bir yetişkin için gerçekçi haftalık değişim (yön
 * `better`dan). Öneriler bu hızla süreye yayılır, böylece hedef ilk günden "kayık" başlamaz.
 */
export type GoalMetricId =
  | 'weight'
  | 'waist'
  | 'pushUp'
  | 'plank'
  | 'burpee'
  | 'row500'
  | 'restingHr'
  | 'recovery'
  | 'level.core'
  | 'level.glute'
  | 'level.upperBack'
  | 'level.conditioning';

export type GoalUnit = 'kg' | 'cm' | 'reps' | 'seconds' | 'clock' | 'bpm' | 'level';

export type GoalMetric = {
  id: GoalMetricId;
  unit: GoalUnit;
  better: 'higher' | 'lower';
  decimals: number;
  /** Ara kontrolde tek başına girilebilir mi (seviye hedefleri yalnız yeniden testle değişir). */
  checkin: boolean;
  weeklyRate: number;
  read: (assessment: Assessment) => number | null;
};

const LEVEL_VALUE: Record<Level, number> = { weak: 0, medium: 1, good: 2 };

export function levelValue(level: Level | null | undefined): number | null {
  return level ? LEVEL_VALUE[level] : null;
}

export function valueLevel(value: number): Level {
  return value >= 2 ? 'good' : value >= 1 ? 'medium' : 'weak';
}

function levelMetric(area: Area): GoalMetric {
  return {
    id: `level.${area}` as GoalMetricId,
    unit: 'level',
    better: 'higher',
    decimals: 0,
    checkin: false,
    weeklyRate: 1 / 4,
    read: (a) => levelValue(a.evaluation?.levels[area]),
  };
}

export const GOAL_METRICS: Record<GoalMetricId, GoalMetric> = {
  weight: { id: 'weight', unit: 'kg', better: 'lower', decimals: 1, checkin: true, weeklyRate: 0.5, read: (a) => a.measurements?.weightKg ?? null },
  waist: { id: 'waist', unit: 'cm', better: 'lower', decimals: 1, checkin: true, weeklyRate: 0.5, read: (a) => a.measurements?.waistCm ?? null },
  pushUp: { id: 'pushUp', unit: 'reps', better: 'higher', decimals: 0, checkin: true, weeklyRate: 1.25, read: (a) => a.results.pushUp?.metric ?? null },
  plank: { id: 'plank', unit: 'seconds', better: 'higher', decimals: 0, checkin: true, weeklyRate: 4, read: (a) => a.results.plank?.metric ?? null },
  burpee: {
    id: 'burpee',
    unit: 'reps',
    better: 'higher',
    decimals: 0,
    checkin: true,
    weeklyRate: 0.75,
    read: (a) => (a.results.conditioning?.option === 'burpee' ? (a.results.conditioning.metric ?? null) : null),
  },
  row500: {
    id: 'row500',
    unit: 'clock',
    better: 'lower',
    decimals: 0,
    checkin: true,
    weeklyRate: 2.5,
    read: (a) => (a.results.conditioning?.option === 'row500' ? (a.results.conditioning.metric ?? null) : null),
  },
  restingHr: { id: 'restingHr', unit: 'bpm', better: 'lower', decimals: 0, checkin: true, weeklyRate: 0.5, read: (a) => a.measurements?.restingHr ?? null },
  recovery: {
    id: 'recovery',
    unit: 'bpm',
    better: 'higher',
    decimals: 0,
    checkin: false,
    weeklyRate: 1,
    read: (a) => a.results.conditioning?.heartRate?.recovery60 ?? null,
  },
  'level.core': levelMetric('core'),
  'level.glute': levelMetric('glute'),
  'level.upperBack': levelMetric('upperBack'),
  'level.conditioning': levelMetric('conditioning'),
};

export const GOAL_METRIC_IDS = Object.keys(GOAL_METRICS) as GoalMetricId[];

export function isLevelMetric(id: GoalMetricId): boolean {
  return id.startsWith('level.');
}

export function levelArea(id: GoalMetricId): Area | null {
  return isLevelMetric(id) ? (id.slice('level.'.length) as Area) : null;
}
