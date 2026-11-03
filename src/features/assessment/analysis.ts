import { compareSessions, type SessionComparison } from './compare';
import { findingsOf, lastActivityAt, openSession, sortedSessions, type Assessment, type Finding } from './model';
import type { ConditioningOption, TestId } from './protocol';
import { suggestedLevels, type Gender } from './scoring';

/**
 * Sporcunun analiz sayfasının modeli — saf. Son oturum (yapılmış bir şey olan en yeni), bir önceki, son
 * değerlendirilen ve onun öncesi; bulgular, performans ölçüleri (önceki değerle), ölçüm serisi.
 */
export type MetricPoint = { value: number; previous: number | null };

export type AnalysisView = {
  sessions: Assessment[];
  latest: Assessment | null;
  previous: Assessment | null;
  open: Assessment | null;
  latestEvaluated: Assessment | null;
  previousEvaluated: Assessment | null;
  /** Son oturum değerlendirilmediyse önerilen (taslak) seviyeler. */
  draftLevels: ReturnType<typeof suggestedLevels> | null;
  findings: (Finding & { note: string })[];
  notes: { test: TestId; note: string }[];
  pushUp: MetricPoint | null;
  plank: MetricPoint | null;
  conditioning: (MetricPoint & { option: ConditioningOption }) | null;
  heartRate: { max: number; avg: number; recovery60: number | null } | null;
  measurements: { at: number; weightKg: number | null; waistCm: number | null; heightCm: number | null }[];
  /** Önceki değerlendirme → son değerlendirme (yoksa önceki oturum → son oturum). */
  comparison: SessionComparison | null;
};

function metric(latest: Assessment | null, previous: Assessment | null, test: TestId): MetricPoint | null {
  const value = latest?.results[test]?.metric;
  if (typeof value !== 'number') return null;
  const before = previous?.results[test]?.metric;
  return { value, previous: typeof before === 'number' ? before : null };
}

export function analysisView(assessments: readonly Assessment[], gender: Gender): AnalysisView {
  const sessions = sortedSessions(assessments);
  const latest = sessions[0] ?? null;
  const previous = sessions[1] ?? null;
  const evaluated = sessions.filter((item) => item.evaluation !== null);
  const latestEvaluated = evaluated[0] ?? null;

  const conditioningResult = latest?.results.conditioning;
  const previousConditioning = sessions
    .slice(1)
    .map((item) => item.results.conditioning)
    .find((result) => result?.option === conditioningResult?.option && typeof result?.metric === 'number');

  const after = latestEvaluated ?? latest;
  const before = (latestEvaluated ? evaluated[1] : previous) ?? null;

  return {
    comparison: after && before && after.id !== before.id ? compareSessions(before, after) : null,
    sessions,
    latest,
    previous,
    open: openSession(sessions),
    latestEvaluated,
    previousEvaluated: evaluated[1] ?? null,
    draftLevels: latest && latest.evaluation === null ? suggestedLevels(latest, gender) : null,
    findings: latest
      ? findingsOf(latest).map((finding) => ({ ...finding, note: latest.results[finding.test]?.note ?? '' }))
      : [],
    notes: latest
      ? Object.entries(latest.results)
          .filter(([, result]) => Boolean(result?.note.trim()))
          .map(([test, result]) => ({ test: test as TestId, note: result!.note.trim() }))
      : [],
    pushUp: metric(latest, previous, 'pushUp'),
    plank: metric(latest, previous, 'plank'),
    conditioning:
      conditioningResult && typeof conditioningResult.metric === 'number' && conditioningResult.option
        ? {
            option: conditioningResult.option,
            value: conditioningResult.metric,
            previous: typeof previousConditioning?.metric === 'number' ? previousConditioning.metric : null,
          }
        : null,
    heartRate: conditioningResult?.heartRate
      ? {
          max: conditioningResult.heartRate.max,
          avg: conditioningResult.heartRate.avg,
          recovery60: conditioningResult.heartRate.recovery60,
        }
      : null,
    measurements: [...sessions]
      .reverse()
      .filter((item) => item.measurements !== null)
      .map((item) => ({
        at: lastActivityAt(item),
        weightKg: item.measurements!.weightKg,
        waistCm: item.measurements!.waistCm,
        heightCm: item.measurements!.heightCm,
      })),
  };
}

/** Ölçünün yönü: tekrar ve tutuş için artış iyidir, 500 m süresi için azalış. */
export function improved(point: MetricPoint, lowerIsBetter = false): boolean | null {
  if (point.previous === null || point.previous === point.value) return null;
  return lowerIsBetter ? point.value < point.previous : point.value > point.previous;
}
