import { findingsOf, lastActivityAt, type Assessment, type Finding, type Level } from './model';
import { AREAS, type Area, type TestId } from './protocol';
import { levelChange } from './scoring';

/**
 * Önceki durum → sonraki durum (yeniden test). İki oturum arasında: alan seviyeleri, ölçüler (şınav, plank, kondisyon,
 * kilo, bel, dinlenik nabız, toparlanma), bulgular (çözülen / yeni / süren). Saf; analiz sekmesi ve PDF aynı sonucu çizer.
 */
export type CompareMetricId = 'pushUp' | 'plank' | 'burpee' | 'row500' | 'recovery' | 'weight' | 'waist' | 'restingHr';

export type MetricChange = {
  id: CompareMetricId;
  before: number;
  after: number;
  delta: number;
  /** İyi yönde mi (kiloda / belde / 500 m'de / nabızda düşüş iyidir). */
  improved: boolean | null;
};

export type SessionComparison = {
  before: Assessment;
  after: Assessment;
  days: number;
  levels: { area: Area; before: Level | null; after: Level | null; change: -1 | 0 | 1 | null }[];
  metrics: MetricChange[];
  resolved: Finding[];
  added: Finding[];
  persisting: Finding[];
};

const LOWER_IS_BETTER: ReadonlySet<CompareMetricId> = new Set(['row500', 'weight', 'waist', 'restingHr']);

function readMetric(a: Assessment, id: CompareMetricId): number | null {
  switch (id) {
    case 'pushUp':
      return a.results.pushUp?.metric ?? null;
    case 'plank':
      return a.results.plank?.metric ?? null;
    case 'burpee':
      return a.results.conditioning?.option === 'burpee' ? (a.results.conditioning.metric ?? null) : null;
    case 'row500':
      return a.results.conditioning?.option === 'row500' ? (a.results.conditioning.metric ?? null) : null;
    case 'recovery':
      return a.results.conditioning?.heartRate?.recovery60 ?? null;
    case 'weight':
      return a.measurements?.weightKg ?? null;
    case 'waist':
      return a.measurements?.waistCm ?? null;
    case 'restingHr':
      return a.measurements?.restingHr ?? null;
  }
}

export const COMPARE_METRICS: readonly CompareMetricId[] = ['pushUp', 'plank', 'burpee', 'row500', 'recovery', 'weight', 'waist', 'restingHr'];

const key = (f: Finding) => `${f.test}.${f.check}`;

export function compareSessions(before: Assessment, after: Assessment): SessionComparison {
  const levels = AREAS.map((area) => {
    const b = before.evaluation?.levels[area] ?? null;
    const a = after.evaluation?.levels[area] ?? null;
    return { area, before: b, after: a, change: levelChange(a, b) };
  });

  const metrics = COMPARE_METRICS.flatMap((id): MetricChange[] => {
    const b = readMetric(before, id);
    const a = readMetric(after, id);
    if (b === null || a === null) return [];
    const delta = a - b;
    return [{ id, before: b, after: a, delta, improved: delta === 0 ? null : LOWER_IS_BETTER.has(id) ? delta < 0 : delta > 0 }];
  });

  // Bulgu yalnız iki oturumda da bakılmış testte kıyaslanır (sonradan yapılmamış test "çözüldü" sayılmaz).
  const testedBoth = (test: TestId) => Boolean(before.results[test] && after.results[test]);
  const beforeFindings = findingsOf(before).filter((f) => testedBoth(f.test));
  const afterFindings = findingsOf(after).filter((f) => testedBoth(f.test));
  const afterKeys = new Set(afterFindings.map(key));
  const beforeKeys = new Set(beforeFindings.map(key));

  return {
    before,
    after,
    days: Math.round((lastActivityAt(after) - lastActivityAt(before)) / 86_400_000),
    levels,
    metrics,
    resolved: beforeFindings.filter((f) => !afterKeys.has(key(f))),
    added: afterFindings.filter((f) => !beforeKeys.has(key(f))),
    persisting: afterFindings.filter((f) => beforeKeys.has(key(f))),
  };
}

/** Alan seviyesinden 0..1 puan (radar ve form puanı): zayıf ⅓, orta ⅔, iyi 1. */
export function levelScore(level: Level | null | undefined): number | null {
  return level === 'weak' ? 1 / 3 : level === 'medium' ? 2 / 3 : level === 'good' ? 1 : null;
}

/**
 * Form puanı (0–100): dört alanın puan ortalaması. Raporun kapağındaki büyük sayı — kaynağı açık: "4 alanın
 * ortalaması". Değerlendirilmemiş alan ortalamaya girmez; hiçbiri yoksa null.
 */
export function formScore(levels: Record<Area, Level | null> | null | undefined): number | null {
  if (!levels) return null;
  const scores = AREAS.map((area) => levelScore(levels[area])).filter((v): v is number => v !== null);
  if (scores.length === 0) return null;
  return Math.round((scores.reduce((sum, v) => sum + v, 0) / scores.length) * 100);
}
