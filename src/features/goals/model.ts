import { lastActivityAt, type Assessment } from '@/features/assessment/model';
import { AREAS } from '@/features/assessment/protocol';
import { gradePlank, gradePushUps, type Gender } from '@/features/assessment/scoring';
import { bmiOf } from '@/features/athletes/model';

import { GOAL_METRICS, levelValue, type GoalMetric, type GoalMetricId } from './metrics';

/**
 * Hedef yolculuğu (Kamil, 2 Kasım 2026: "hedefini nasıl koyacaksın, kaymaması vb., onun journey'sini kurgula"):
 *
 *   1. Başlangıç  değerlendirmeden önerilen hedefler (gerçekçi haftalık hızla, süreye yayılmış)
 *   2. Plan       süre (4–12 hafta), ara kontrol sıklığı, yarı yolda ve sonda yeniden test
 *   3. Takip      her ölçüm (ara kontrol ya da yeniden test) BEKLENEN çizgiyle kıyaslanır
 *   4. Uyarı      geride kalınca "riskte" / "kaydı"; gereken haftalık hız ve bu hızla varılacak değer söylenir
 *   5. Sonuç      hedefe ulaşıldı ya da süre doldu → yeni hedef
 *
 * Saf modül: bütün kurallar burada, ekranlar ve PDF yalnız gösterir.
 */
export const DAY = 86_400_000;
export const WEEK = 7 * DAY;

export type GoalCheckin = { id: string; value: number; at: number; note: string };

export type Goal = {
  id: string;
  athleteId: string;
  metric: GoalMetricId;
  startValue: number;
  startAt: number;
  target: number;
  deadline: number;
  /** Ara kontrol sıklığı (gün). */
  checkEveryDays: number;
  sourceAssessmentId: string | null;
  checkins: GoalCheckin[];
  createdAt: number;
  updatedAt: number;
};

export type GoalPoint = { at: number; value: number; source: 'start' | 'checkin' | 'session' };

/** Başlangıç + başlangıçtan sonraki oturumlardaki değer + ara kontroller, zamana göre. */
export function goalPoints(goal: Goal, assessments: readonly Assessment[]): GoalPoint[] {
  const metric = GOAL_METRICS[goal.metric];
  const sessions: GoalPoint[] = assessments
    .filter((a) => a.id !== goal.sourceAssessmentId && lastActivityAt(a) > goal.startAt)
    .flatMap((a) => {
      const value = metric.read(a);
      return value === null ? [] : [{ at: lastActivityAt(a), value, source: 'session' as const }];
    });
  const checkins = goal.checkins.map((c) => ({ at: c.at, value: c.value, source: 'checkin' as const }));
  return [{ at: goal.startAt, value: goal.startValue, source: 'start' as const }, ...sessions, ...checkins].sort((a, b) => a.at - b.at);
}

export type GoalStatus = 'notStarted' | 'onTrack' | 'atRisk' | 'offTrack' | 'achieved' | 'missed';

export type GoalView = {
  goal: Goal;
  metric: GoalMetric;
  points: GoalPoint[];
  latest: GoalPoint;
  /** Yolun ne kadarı alındı (0 = başlangıç, 1 = hedef; geriye gidişte eksi). */
  progress: number;
  /** Son ölçümün tarihinde alınmış olması beklenen pay. */
  expectedProgress: number;
  status: GoalStatus;
  /** Son ölçümden bu yana ara kontrol süresi geçti. */
  needsCheck: boolean;
  nextCheckAt: number;
  weeksLeft: number;
  /** Kalan süre için gereken haftalık değişim (işaretli, ölçünün biriminde); bitti / süre dolduysa null. */
  requiredWeekly: number | null;
  /** Bugünkü hızla hedef tarihinde varılacak değer; tek ölçüm varsa null. */
  forecast: number | null;
  /** Bugün için beklenen değer (çizgi). */
  expectedNow: number;
};

export function expectedValue(goal: Goal, at: number): number {
  const span = Math.max(goal.deadline - goal.startAt, DAY);
  const ratio = Math.min(1, Math.max(0, (at - goal.startAt) / span));
  return goal.startValue + (goal.target - goal.startValue) * ratio;
}

/** Hedefin durumu. Geride kalma payı: yolun %10'u "yolunda", %25'i "riskte", ötesi "kaydı". */
export function goalView(goal: Goal, assessments: readonly Assessment[], now: number = Date.now()): GoalView {
  const metric = GOAL_METRICS[goal.metric];
  const points = goalPoints(goal, assessments);
  const latest = points[points.length - 1];
  const total = goal.target - goal.startValue;
  const progress = total === 0 ? 1 : (latest.value - goal.startValue) / total;
  const span = Math.max(goal.deadline - goal.startAt, DAY);
  const expectedProgress = Math.min(1, Math.max(0, (latest.at - goal.startAt) / span));
  const weeksLeft = Math.max(0, (goal.deadline - now) / WEEK);

  let status: GoalStatus;
  if (progress >= 1) status = 'achieved';
  else if (now > goal.deadline) status = 'missed';
  else if (latest.source === 'start') status = 'notStarted';
  else {
    const lag = expectedProgress - progress;
    status = lag <= 0.1 ? 'onTrack' : lag <= 0.25 ? 'atRisk' : 'offTrack';
  }

  const interval = goal.checkEveryDays * DAY;
  const nextCheckAt = Math.min(latest.at + interval, goal.deadline);
  const forecast =
    latest.at > goal.startAt && latest.source !== 'start'
      ? goal.startValue + (latest.value - goal.startValue) * (span / (latest.at - goal.startAt))
      : null;

  return {
    goal,
    metric,
    points,
    latest,
    progress,
    expectedProgress,
    status,
    needsCheck: status !== 'achieved' && status !== 'missed' && now > latest.at + interval + DAY / 2,
    nextCheckAt,
    weeksLeft,
    requiredWeekly:
      status === 'achieved' || status === 'missed' ? null : (goal.target - latest.value) / Math.max(weeksLeft, 0.5),
    forecast,
    expectedNow: expectedValue(goal, now),
  };
}

/* ── Yolculuk planı ──────────────────────────────────────────────────────── */

export type Checkpoint = { at: number; kind: 'start' | 'check' | 'retest' | 'finish' };

/**
 * Takvim: başlangıç, her `checkEveryDays`'te ara kontrol, 6 haftadan uzun hedefte yarı yolda yeniden test, sonda
 * final testi. Hedeflerin en erken başlangıcı ile en geç bitişi arasında, sporcunun bütün hedefleri için tek takvim.
 */
export function journeyPlan(startAt: number, deadline: number, checkEveryDays: number): Checkpoint[] {
  const points: Checkpoint[] = [{ at: startAt, kind: 'start' }];
  const weeks = (deadline - startAt) / WEEK;
  const mid = weeks >= 6 ? startAt + Math.round(weeks / 2) * WEEK : null;
  for (let at = startAt + checkEveryDays * DAY; at < deadline - DAY; at += checkEveryDays * DAY) {
    points.push({ at, kind: mid !== null && Math.abs(at - mid) < 3 * DAY ? 'retest' : 'check' });
  }
  if (mid !== null && !points.some((p) => p.kind === 'retest')) points.push({ at: mid, kind: 'retest' });
  points.push({ at: deadline, kind: 'finish' });
  return points.sort((a, b) => a.at - b.at);
}

export type AthleteGoalsSummary = {
  active: number;
  counts: Record<GoalStatus, number>;
  needsCheck: number;
  nextCheckAt: number | null;
  /** En kötü durum (kartta tek renk): kaydı > riskte > yolunda. */
  worst: GoalStatus | null;
};

const SEVERITY: GoalStatus[] = ['offTrack', 'missed', 'atRisk', 'notStarted', 'onTrack', 'achieved'];

export function summarizeGoals(views: readonly GoalView[]): AthleteGoalsSummary {
  const counts = { notStarted: 0, onTrack: 0, atRisk: 0, offTrack: 0, achieved: 0, missed: 0 } as Record<GoalStatus, number>;
  for (const view of views) counts[view.status] += 1;
  const open = views.filter((v) => v.status !== 'achieved' && v.status !== 'missed');
  return {
    active: open.length,
    counts,
    needsCheck: open.filter((v) => v.needsCheck).length,
    nextCheckAt: open.length ? Math.min(...open.map((v) => v.nextCheckAt)) : null,
    worst: views.length ? (SEVERITY.find((status) => counts[status] > 0) ?? null) : null,
  };
}

/* ── Öneri ───────────────────────────────────────────────────────────────── */

export type GoalSuggestion = {
  metric: GoalMetricId;
  startValue: number;
  target: number;
  reason: 'priority' | 'coreWeak' | 'fatLoss' | 'conditioning' | 'weakestArea';
};

const roundTo = (value: number, step: number) => Math.round(value / step) * step;

/**
 * Değerlendirmeden hedef önerisi (en çok 5). Hız `weeklyRate`, tavanlar normlardan: şınavda "iyi" eşiği, plankta 60 sn,
 * burpee'de 20. Hedef en az bir adım ileride olur (aksi hâlde ilk ölçümde "ulaşıldı" derdi).
 */
export function suggestGoals(assessment: Assessment, gender: Gender, heightCm: number | null, weeks: number): GoalSuggestion[] {
  const out: GoalSuggestion[] = [];
  const add = (s: GoalSuggestion) => {
    if (!out.some((item) => item.metric === s.metric) && s.target !== s.startValue) out.push(s);
  };
  const levels = assessment.evaluation?.levels;
  const priority = assessment.evaluation?.priority ?? null;
  const pushUps = GOAL_METRICS.pushUp.read(assessment);
  const plank = GOAL_METRICS.plank.read(assessment);

  if (pushUps !== null && (priority === 'upperBody' || gradePushUps(pushUps, gender) > 0)) {
    const cap = gender === 'female' ? 15 : 20;
    add({ metric: 'pushUp', startValue: pushUps, target: Math.max(pushUps + 2, Math.min(cap, pushUps + Math.round(1.25 * weeks))), reason: priority === 'upperBody' ? 'priority' : 'weakestArea' });
  }
  if (plank !== null && (levels?.core === 'weak' || levels?.core === 'medium' || gradePlank(plank) > 0 || priority === 'core')) {
    add({ metric: 'plank', startValue: plank, target: Math.max(plank + 5, Math.min(60, roundTo(plank + 4 * weeks, 5))), reason: priority === 'core' ? 'priority' : 'coreWeak' });
  }
  const fatLoss = assessment.intro?.goals.includes('fatLoss') ?? false;
  const waist = GOAL_METRICS.waist.read(assessment);
  if (fatLoss && waist !== null) add({ metric: 'waist', startValue: waist, target: roundTo(waist - 0.5 * weeks, 0.5), reason: 'fatLoss' });
  const weight = GOAL_METRICS.weight.read(assessment);
  const bmi = bmiOf(weight, assessment.measurements?.heightCm ?? heightCm);
  if (fatLoss && weight !== null && bmi !== null && bmi >= 24) {
    add({ metric: 'weight', startValue: weight, target: roundTo(weight - 0.5 * weeks, 0.5), reason: 'fatLoss' });
  }
  if (levels?.conditioning === 'weak' || levels?.conditioning === 'medium' || priority === 'conditioning') {
    const burpee = GOAL_METRICS.burpee.read(assessment);
    const row = GOAL_METRICS.row500.read(assessment);
    if (burpee !== null) add({ metric: 'burpee', startValue: burpee, target: Math.max(burpee + 2, Math.min(20, burpee + Math.round(0.75 * weeks))), reason: 'conditioning' });
    if (row !== null) add({ metric: 'row500', startValue: row, target: roundTo(row - 2.5 * weeks, 5), reason: 'conditioning' });
  }
  const weakest = AREAS.find((area) => levels?.[area] === 'weak');
  if (weakest) add({ metric: `level.${weakest}` as GoalMetricId, startValue: levelValue('weak') ?? 0, target: 1, reason: 'weakestArea' });
  return out.slice(0, 5);
}
