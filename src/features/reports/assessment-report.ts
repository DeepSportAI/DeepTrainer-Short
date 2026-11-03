import type { TFunction } from 'i18next';

import {
  bandWidths,
  bmiScale,
  burpeeScale,
  placeOnScale,
  plankScale,
  pushUpScale,
  recoveryScale,
  restingHrScale,
  row500Scale,
  waistScale,
  type Scale,
} from '@/features/assessment/bands';
import { compareSessions, formScore, levelScore, type CompareMetricId, type MetricChange } from '@/features/assessment/compare';
import { levelLabel } from '@/features/assessment/labels';
import { findingsOf, lastActivityAt, type Assessment, type Level } from '@/features/assessment/model';
import { AREAS, TESTS, TEST_IDS, type PainRegion, type TestId } from '@/features/assessment/protocol';
import { ageOf, bmiOf, fullName, type Athlete } from '@/features/athletes/model';
import { formatGoalDelta, formatGoalValue } from '@/features/goals/format';
import { journeyPlan, type GoalStatus, type GoalView } from '@/features/goals/model';
import type { ProgramPlan } from '@/features/programs/schema';
import { formatClock } from '@/lib/format/clock';
import { formatDayMonth, formatShortDate } from '@/lib/format/date';
import { formatDecimal } from '@/lib/format/quantity';

import { esc, escMultiline, heartRateSvg, shell } from './html';
import { PDF } from './pdf-theme';
import { programSection } from './program-report';
import { bodyMapSvg, goalSvg, historySvg, radarSvg, ringSvg, scaleSvg, TONE_COLOR, type BodyRegion } from './svg';

/**
 * Analiz raporu (PDF) — sporcunun göreceği TEK çıktı; Tanita raporlarının dili (Kamil, 2 Kasım 2026: "daha fazla göze
 * hitap etsin, Tanita raporları gibi"): büyük sayılar, renkli aralık çubukları, önceki değerin izi, gelişim grafikleri.
 *
 *   Sayfa 1  Kapak: kimlik, form puanı (4 alanın ortalaması) ve önceki teste göre farkı, radar, dört alan, öncelik,
 *            öne çıkan değişimler
 *   Sayfa 2  Vücut ve performans: vücut haritası (bulgu / ağrı), VKİ · bel · nabız aralıkları, performans normları,
 *            gelişim grafikleri, isteğe bağlı fotoğraflar
 *   Sayfa 3  Hedefler (gidişat, koridor, gereken hız) ve önceki teste göre bulgular — ilk testte yok
 *   Sayfa 4  Test tablosu, antrenör notu, sıradaki ölçüm / test tarihleri
 *   Sayfa 5  İsteğe bağlı program
 *
 * Okur sporcu: metin "sen" diliyle.
 */
export type AssessmentReportInput = {
  t: TFunction;
  lang: string;
  athlete: Athlete;
  assessment: Assessment;
  /** Aynı sporcunun bütün oturumları (geçmiş grafikleri ve "önceki" için). */
  sessions: readonly Assessment[];
  goals: readonly GoalView[];
  coach: { coachName: string; organization: string };
  photos: { front: string | null; side: string | null } | null;
  program: ProgramPlan | null;
  exerciseName: (id: string) => string;
  now: number;
};

const FINDING_REGION: Record<string, BodyRegion> = {
  'airSquat.kneeValgus': 'knees',
  'airSquat.heelLift': 'ankles',
  'airSquat.lumbarCollapse': 'lowerBack',
  'hipHinge.backRounding': 'lowerBack',
  'hipHinge.hipsNotBack': 'hips',
  'overheadReach.lumbarArch': 'lowerBack',
  'overheadReach.shouldersForward': 'shoulders',
  'plank.hipSag': 'core',
  'plank.shaking': 'core',
  'gobletSquat.shallowDepth': 'hips',
  'gobletSquat.balanceLoss': 'core',
  'gobletSquat.kneeHipMisalign': 'knees',
  'pushUp.hipDrop': 'core',
  'pushUp.elbowControl': 'shoulders',
  'pushUp.neckPosition': 'neck',
  'dumbbellRow.shoulderShrug': 'shoulders',
  'dumbbellRow.backInactive': 'upperBack',
  'conditioning.heavyBreathing': 'cardio',
  'conditioning.tempoDrop': 'cardio',
};

const PAIN_REGION: Partial<Record<PainRegion, BodyRegion>> = {
  neck: 'neck',
  shoulder: 'shoulders',
  lowerBack: 'lowerBack',
  hip: 'hips',
  knee: 'knees',
  ankle: 'ankles',
};

const STATUS_COLOR: Record<GoalStatus, string> = {
  notStarted: PDF.navy,
  onTrack: PDF.level.good,
  atRisk: PDF.level.medium,
  offTrack: PDF.level.weak,
  achieved: PDF.level.good,
  missed: PDF.level.weak,
};

/** A4 içerik genişliğinde (≈734 px) sütun genişlikleri — SVG viewBox'ı gerçek genişlikte olsun, yazı büyümesin. */
const BODY_W = 560;
const HALF_W = 350;
const GOAL_W = 400;

const GOAL_STATUSES: readonly GoalStatus[] = ['onTrack', 'atRisk', 'offTrack', 'achieved', 'missed', 'notStarted'];

const LEVEL_COLOR: Record<Level, string> = { weak: PDF.level.weak, medium: PDF.level.medium, good: PDF.level.good };

const CSS = `
  .page { page-break-after: always; }
  .page:last-of-type { page-break-after: auto; }
  .idgrid { display: flex; gap: 6px; margin-top: 10px; }
  .idgrid > div { flex: 1; background: ${PDF.surface}; border-radius: 8px; padding: 6px 8px; }
  .idgrid .k { font-size: 8.5px; color: ${PDF.muted}; font-weight: 600; }
  .idgrid .v { font-size: 12px; font-weight: 800; }
  .hero { display: flex; gap: 12px; margin-top: 12px; align-items: stretch; }
  .scorebox { flex: 0 0 200px; border: 1px solid ${PDF.border}; border-radius: 14px; padding: 12px; text-align: center; }
  .scorebox .title { font-size: 12px; font-weight: 800; }
  .scorebox .sub { font-size: 9px; color: ${PDF.muted}; }
  .delta { display: inline-block; margin-top: 6px; border-radius: 999px; padding: 2px 9px; font-size: 10px; font-weight: 800; }
  .radarbox { flex: 1; border: 1px solid ${PDF.border}; border-radius: 14px; padding: 8px; text-align: center; }
  .legend { font-size: 9px; color: ${PDF.muted}; }
  .legend i { display: inline-block; width: 16px; height: 3px; vertical-align: middle; margin: 0 4px 0 10px; border-radius: 2px; }
  .areas { display: flex; gap: 8px; margin-top: 10px; }
  .area { flex: 1; border: 1px solid ${PDF.border}; border-radius: 12px; padding: 8px 9px; }
  .area .n { font-size: 10px; color: ${PDF.muted}; font-weight: 700; }
  .area .l { font-size: 15px; font-weight: 800; margin: 2px 0 5px; }
  .area .bars { display: flex; gap: 3px; }
  .area .bars i { flex: 1; height: 7px; border-radius: 4px; background: ${PDF.border}; }
  .area .was { font-size: 9px; color: ${PDF.muted}; margin-top: 5px; }
  .kpis { display: flex; gap: 8px; margin-top: 10px; }
  .kpi { flex: 1; background: ${PDF.surface}; border-radius: 12px; padding: 8px 10px; }
  .kpi .k { font-size: 9px; color: ${PDF.muted}; font-weight: 700; }
  .kpi .v { font-size: 17px; font-weight: 800; }
  .kpi .d { font-size: 10px; font-weight: 800; }
  .up { color: ${PDF.success}; } .down { color: ${PDF.level.weak}; } .flat { color: ${PDF.muted}; }
  .grid2 { display: flex; gap: 14px; }
  .grid2 > div { flex: 1; min-width: 0; }
  .gauge { margin-bottom: 9px; }
  .gauge .row { display: flex; justify-content: space-between; align-items: baseline; }
  .gauge .name { font-size: 10.5px; font-weight: 700; }
  .gauge .val { font-size: 15px; font-weight: 800; }
  .gauge .tag { font-size: 9px; font-weight: 800; margin-left: 4px; }
  .hist { display: flex; flex-wrap: wrap; gap: 8px; }
  .hist > div { flex: 1 1 46%; border: 1px solid ${PDF.border}; border-radius: 10px; padding: 6px 8px; }
  .hist .k { font-size: 10px; font-weight: 700; }
  .goal { border: 1px solid ${PDF.border}; border-radius: 12px; padding: 9px 11px; margin-bottom: 8px; page-break-inside: avoid; display: flex; gap: 12px; }
  .goal .info { flex: 1.1; min-width: 0; }
  .goal .chart { flex: 1; min-width: 0; }
  .goal .t { font-size: 12.5px; font-weight: 800; }
  .goal .pill { display: inline-block; font-size: 9px; font-weight: 800; border-radius: 999px; padding: 1px 7px; color: #fff; margin-left: 6px; vertical-align: 1px; }
  .goal .nums { font-size: 10px; color: ${PDF.muted}; margin-top: 3px; }
  .goal .nums b { color: ${PDF.ink}; font-size: 12px; }
  .track { position: relative; height: 8px; border-radius: 4px; background: ${PDF.surface}; margin: 7px 0 4px; }
  .track span { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 4px; }
  .track em { position: absolute; top: -3px; width: 2px; height: 14px; background: ${PDF.ink}; }
  .goal .foot { font-size: 9.5px; color: ${PDF.muted}; }
  .lists { display: flex; gap: 10px; }
  .lists > div { flex: 1; border-radius: 10px; padding: 8px 10px; }
  .lists h4 { margin: 0 0 4px; font-size: 10.5px; }
  .lists ul { margin: 0; padding-left: 14px; font-size: 10px; }
  .next { display: flex; gap: 8px; margin-top: 10px; }
  .next > div { flex: 1; background: ${PDF.navy}; color: #fff; border-radius: 10px; padding: 8px 10px; }
  .next .k { font-size: 9px; opacity: 0.8; }
  .next .v { font-size: 13px; font-weight: 800; }
  .maplegend { font-size: 9px; color: ${PDF.muted}; margin-top: 4px; }
  .maplegend i { display: inline-block; width: 9px; height: 9px; border-radius: 50%; vertical-align: -1px; margin-right: 4px; }
`;

function metricText(t: TFunction, test: TestId, assessment: Assessment): string {
  const result = assessment.results[test];
  if (!result || result.metric === null) return '';
  if (test === 'conditioning' && result.option === 'row500') return `${formatClock(result.metric)} ${t('units.minutes')}`;
  if (test === 'plank') return `${result.metric} ${t('units.seconds')}`;
  return `${result.metric} ${t('units.reps')}`;
}

function compareValue(t: TFunction, id: CompareMetricId, value: number): string {
  if (id === 'row500') return formatClock(value);
  if (id === 'weight') return `${formatDecimal(value, 1)} ${t('units.kg')}`;
  if (id === 'waist') return `${formatDecimal(value, 1)} ${t('units.cm')}`;
  if (id === 'plank') return `${Math.round(value)} ${t('units.seconds')}`;
  if (id === 'recovery' || id === 'restingHr') return `${Math.round(value)} ${t('units.bpm')}`;
  return `${Math.round(value)} ${t('units.reps')}`;
}

function deltaClass(change: MetricChange): string {
  return change.improved === null ? 'flat' : change.improved ? 'up' : 'down';
}

function signed(t: TFunction, change: MetricChange): string {
  const sign = change.delta > 0 ? '+' : change.delta < 0 ? '−' : '±';
  if (change.id === 'row500') return `${sign}${Math.abs(Math.round(change.delta))} ${t('units.seconds')}`;
  return `${sign}${compareValue(t, change.id, Math.abs(change.delta))}`;
}

function segments(t: TFunction, scale: Scale) {
  return bandWidths(scale).map(({ band, from, width }) => ({ from, width, tone: band.tone, label: t(`bands.${band.key}`) }));
}

function gauge(t: TFunction, name: string, display: string, scale: Scale, value: number, previous: number | null, width: number): string {
  const place = placeOnScale(scale, value);
  const prev = previous === null ? null : placeOnScale(scale, previous).ratio;
  return `<div class="gauge"><div class="row"><span class="name">${esc(name)}</span><span><span class="val">${esc(display)}</span><span class="tag" style="color:${TONE_COLOR[place.band.tone]}">${esc(t(`bands.${place.band.key}`))}</span></span></div>${scaleSvg(segments(t, scale), place.ratio, display, prev, width)}</div>`;
}

function levelBars(level: Level | null): string {
  const filled = level === 'weak' ? 1 : level === 'medium' ? 2 : level === 'good' ? 3 : 0;
  const color = level ? LEVEL_COLOR[level] : PDF.border;
  return `<div class="bars">${[0, 1, 2].map((i) => `<i style="background:${i < filled ? color : PDF.border}"></i>`).join('')}</div>`;
}

export function buildAssessmentReportHtml(input: AssessmentReportInput): string {
  const { t, athlete, assessment, coach, photos, program, now } = input;
  const gender = athlete.gender;
  const date = formatShortDate(lastActivityAt(assessment));
  const ordered = [...input.sessions].filter((s) => s.completedAt !== null || s.id === assessment.id).sort((a, b) => lastActivityAt(a) - lastActivityAt(b));
  const index = ordered.findIndex((s) => s.id === assessment.id);
  const previous = index > 0 ? ordered[index - 1] : null;
  const history = ordered.slice(0, index + 1);
  const comparison = previous ? compareSessions(previous, assessment) : null;
  const evaluation = assessment.evaluation;
  const prevLevels = previous?.evaluation?.levels ?? null;
  const score = formScore(evaluation?.levels);
  const prevScore = formScore(prevLevels);
  const m = assessment.measurements;
  const pm = previous?.measurements ?? null;
  const height = m?.heightCm ?? athlete.heightCm;
  const weight = m?.weightKg ?? athlete.weightKg;
  const age = ageOf(athlete);

  /* ── Sayfa 1 ── */
  const ident = [
    [t('report.id.age'), age ? String(age) : '—'],
    [t('report.id.gender'), athlete.gender ? t(`athleteForm.gender.${athlete.gender}`) : '—'],
    [t('report.id.height'), height ? `${formatDecimal(height, 0)} ${t('units.cm')}` : '—'],
    [t('report.id.weight'), weight ? `${formatDecimal(weight, 1)} ${t('units.kg')}` : '—'],
    [t('report.id.test'), t('report.id.testNo', { number: index + 1 })],
    [t('report.id.previous'), previous ? formatShortDate(lastActivityAt(previous)) : '—'],
  ]
    .map(([k, v]) => `<div><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>`)
    .join('');

  const scoreDelta =
    score !== null && prevScore !== null
      ? `<div class="delta" style="background:${score >= prevScore ? '#e3f4ec' : '#fbe4e4'};color:${score >= prevScore ? PDF.success : PDF.level.weak}">${score >= prevScore ? '+' : '−'}${Math.abs(score - prevScore)} ${esc(t('report.vsPrevious'))}</div>`
      : '';

  const labels = AREAS.map((area) => t(`assessment.areasShort.${area}`));
  const radar = evaluation
    ? radarSvg(
        labels,
        AREAS.map((a) => levelScore(evaluation.levels[a])),
        prevLevels ? AREAS.map((a) => levelScore(prevLevels[a])) : null,
        250,
      )
    : '';

  const areaTiles = evaluation
    ? AREAS.map((area) => {
        const lvl = evaluation.levels[area];
        const before = prevLevels?.[area] ?? null;
        const changed = before && lvl && before !== lvl;
        return `<div class="area"><div class="n">${esc(t(`assessment.areas.${area}`))}</div><div class="l" style="color:${lvl ? LEVEL_COLOR[lvl] : PDF.muted}">${esc(levelLabel(t, area, lvl))}</div>${levelBars(lvl)}${
          before ? `<div class="was">${esc(t('report.was', { level: levelLabel(t, area, before) }))}${changed ? ' →' : ''}</div>` : ''
        }</div>`;
      }).join('')
    : '';

  const highlights = (comparison?.metrics ?? [])
    .filter((c) => c.improved !== null)
    .sort((a, b) => Number(b.improved) - Number(a.improved))
    .slice(0, 4)
    .map(
      (c) =>
        `<div class="kpi"><div class="k">${esc(t(`compare.metric.${c.id}`))}</div><div class="v">${esc(compareValue(t, c.id, c.after))}</div><div class="d ${deltaClass(c)}">${esc(signed(t, c))}</div></div>`,
    )
    .join('');

  const glance = GOAL_STATUSES.map((status) => [status, input.goals.filter((g) => g.status === status).length] as const)
    .filter(([, count]) => count > 0)
    .map(
      ([status, count]) =>
        `<div class="kpi"><div class="v" style="color:${STATUS_COLOR[status]};font-size:24px">${count}</div><div class="k">${esc(t(`goals.status.${status}`))}</div></div>`,
    )
    .join('');

  const page1 = `<section class="page">
    <div class="band">
      <div><div class="brand">DeepTrainer<span>${esc(t('report.badge'))}</span></div><div style="font-size:10px;opacity:.85">${esc(coach.organization)}</div></div>
      <div class="meta">${esc(t('report.date', { date }))}<br/>${esc(coach.coachName ? t('report.coach', { name: coach.coachName }) : '')}</div>
    </div>
    <h1 style="margin-top:12px">${esc(fullName(athlete))}</h1>
    <div class="idgrid">${ident}</div>
    ${
      evaluation
        ? `<div class="hero">
      <div class="scorebox"><div class="title">${esc(t('report.score.title'))}</div><div class="sub">${esc(t('report.score.sub'))}</div>${ringSvg(score)}<br/>${scoreDelta}</div>
      <div class="radarbox">${radar}<div class="legend">${prevLevels ? `<i style="background:${PDF.muted}"></i>${esc(t('compare.previous'))}` : ''}<i style="background:${PDF.navy}"></i>${esc(t('compare.current'))}</div></div>
    </div>
    <div class="areas">${areaTiles}</div>
    ${evaluation.priority ? `<div class="volt"><div class="label">${esc(t('report.priority'))}</div><div class="value">${esc(t(`assessment.priorities.${evaluation.priority}`))}</div>${evaluation.priorityNote ? `<div>${escMultiline(evaluation.priorityNote)}</div>` : ''}</div>` : ''}`
        : `<div class="card muted">${esc(t('report.noEvaluation'))}</div>`
    }
    ${highlights ? `<h2>${esc(t('report.highlights', { count: comparison?.days ?? 0 }))}</h2><div class="kpis">${highlights}</div>` : ''}
    ${glance ? `<h2>${esc(t('report.goalsGlance'))}</h2><div class="kpis">${glance}</div>` : ''}
  </section>`;

  /* ── Sayfa 2 ── */
  const findingRegions = new Set<BodyRegion>(findingsOf(assessment).map((f) => FINDING_REGION[`${f.test}.${f.check}`]).filter(Boolean));
  const painRegions = new Set<BodyRegion>((assessment.intro?.pain ? assessment.intro.painRegions : []).map((r) => PAIN_REGION[r]).filter((r): r is BodyRegion => Boolean(r)));
  const bmi = bmiOf(weight, height);
  const prevBmi = bmiOf(pm?.weightKg, pm?.heightCm ?? height);
  const weightDelta = m?.weightKg && pm?.weightKg ? m.weightKg - pm.weightKg : null;
  const bodyGauges = [
    weight
      ? `<div class="gauge"><div class="row"><span class="name">${esc(t('assessment.measurements.weight'))}</span><span><span class="val">${formatDecimal(weight, 1)} ${esc(t('units.kg'))}</span>${
          weightDelta !== null ? `<span class="tag ${weightDelta < 0 ? 'up' : weightDelta > 0 ? 'down' : 'flat'}">${weightDelta > 0 ? '+' : weightDelta < 0 ? '−' : '±'}${formatDecimal(Math.abs(weightDelta), 1)} ${esc(t('units.kg'))}</span>` : ''
        }</span></div></div>`
      : '',
    bmi !== null ? gauge(t, t('common.bmi'), formatDecimal(bmi, 1), bmiScale(), bmi, prevBmi, BODY_W) : '',
    m?.waistCm ? gauge(t, t('assessment.measurements.waist'), `${formatDecimal(m.waistCm, 1)} ${t('units.cm')}`, waistScale(gender), m.waistCm, pm?.waistCm ?? null, BODY_W) : '',
    m?.restingHr ? gauge(t, t('assessment.measurements.restingHr'), `${m.restingHr} ${t('units.bpm')}`, restingHrScale(), m.restingHr, pm?.restingHr ?? null, BODY_W) : '',
  ].join('');

  const r = assessment.results;
  const pr = previous?.results;
  const c = r.conditioning;
  const perf = [
    typeof r.pushUp?.metric === 'number' ? gauge(t, t('assessment.steps.pushUp.title'), `${r.pushUp.metric} ${t('units.reps')}`, pushUpScale(gender), r.pushUp.metric, pr?.pushUp?.metric ?? null, HALF_W) : '',
    typeof r.plank?.metric === 'number' ? gauge(t, t('assessment.steps.plank.title'), `${r.plank.metric} ${t('units.seconds')}`, plankScale(), r.plank.metric, pr?.plank?.metric ?? null, HALF_W) : '',
    c && typeof c.metric === 'number'
      ? c.option === 'row500'
        ? gauge(t, t('assessment.conditioning.option.row500'), formatClock(c.metric), row500Scale(gender), c.metric, pr?.conditioning?.option === 'row500' ? (pr.conditioning.metric ?? null) : null, HALF_W)
        : gauge(t, t('assessment.conditioning.option.burpee'), `${c.metric} ${t('units.reps')}`, burpeeScale(), c.metric, pr?.conditioning?.option === 'burpee' ? (pr.conditioning.metric ?? null) : null, HALF_W)
      : '',
    typeof c?.heartRate?.recovery60 === 'number'
      ? gauge(t, t('heartRate.recovery'), `${c.heartRate.recovery60} ${t('units.bpm')}`, recoveryScale(), c.heartRate.recovery60, pr?.conditioning?.heartRate?.recovery60 ?? null, HALF_W)
      : '',
  ].filter(Boolean);

  const series = (id: CompareMetricId, read: (a: Assessment) => number | null, better: 'higher' | 'lower') => {
    const points = history.flatMap((a) => {
      const v = read(a);
      return v === null ? [] : [{ at: lastActivityAt(a), value: v, label: id === 'row500' ? formatClock(v) : formatDecimal(v, id === 'weight' || id === 'waist' ? 1 : 0) }];
    });
    if (points.length < 2) return '';
    return `<div><div class="k">${esc(t(`compare.metric.${id}`))}</div>${historySvg(points, [formatDayMonth(points[0].at), formatDayMonth(points[points.length - 1].at)], better, HALF_W - 20, 96)}</div>`;
  };
  const histories = [
    series('weight', (a) => a.measurements?.weightKg ?? null, 'lower'),
    series('waist', (a) => a.measurements?.waistCm ?? null, 'lower'),
    series('pushUp', (a) => a.results.pushUp?.metric ?? null, 'higher'),
    series('plank', (a) => a.results.plank?.metric ?? null, 'higher'),
  ].filter(Boolean);

  const page2 = `<section class="page">
    <h2 style="margin-top:0">${esc(t('report.body.title'))}</h2>
    <div class="grid2">
      <div style="flex:0 0 160px;text-align:center">${bodyMapSvg(findingRegions, painRegions, 140)}
        <div class="maplegend"><i style="background:${PDF.level.hard}"></i>${esc(t('report.body.finding'))} &nbsp; <i style="border:2px solid ${PDF.level.weak}"></i>${esc(t('report.body.pain'))}</div></div>
      <div>${bodyGauges || `<div class="muted">${esc(t('report.body.none'))}</div>`}
        ${previous ? `<div class="maplegend"><i style="background:${PDF.ink}"></i>${esc(t('report.legend.now'))} &nbsp; <i style="border:2px solid ${PDF.muted}"></i>${esc(t('report.legend.previous'))}</div>` : ''}
      </div>
    </div>
    ${perf.length ? `<h2>${esc(t('report.performance'))}</h2><div class="grid2"><div>${perf.filter((_, i) => i % 2 === 0).join('')}</div><div>${perf.filter((_, i) => i % 2 === 1).join('')}</div></div>` : ''}
    ${histories.length ? `<h2>${esc(t('report.history'))}</h2><div class="hist">${histories.join('')}</div>` : ''}
    ${
      photos && (photos.front || photos.side)
        ? `<h2>${esc(t('report.photos'))}</h2><div class="photos">${photos.front ? `<img src="${photos.front}" />` : ''}${photos.side ? `<img src="${photos.side}" />` : ''}</div>`
        : ''
    }
  </section>`;

  /* ── Sayfa 3 ── */
  const goals = input.goals
    .map((view) => {
      const color = STATUS_COLOR[view.status];
      const progress = Math.max(0, Math.min(1, view.progress));
      const open = view.status !== 'achieved' && view.status !== 'missed';
      return `<div class="goal"><div class="info">
          <div class="t">${esc(t(`goals.metric.${view.metric.id}`))}<span class="pill" style="background:${color}">${esc(t(`goals.status.${view.status}`))}</span></div>
          <div class="nums">${esc(t('goals.card.start'))} <b>${esc(formatGoalValue(t, view.metric, view.goal.startValue))}</b> · ${esc(t('goals.card.now'))} <b>${esc(formatGoalValue(t, view.metric, view.latest.value))}</b> · ${esc(t('goals.card.target'))} <b>${esc(formatGoalValue(t, view.metric, view.goal.target))}</b> (${esc(formatDayMonth(view.goal.deadline))})</div>
          <div class="track"><span style="width:${(progress * 100).toFixed(0)}%;background:${color}"></span><em style="left:${(Math.min(1, view.expectedProgress) * 100).toFixed(0)}%"></em></div>
          <div class="foot">${esc(t('report.goal.progress', { done: Math.round(progress * 100), expected: Math.round(view.expectedProgress * 100) }))}${
            open && view.requiredWeekly !== null ? ` · ${esc(t('goals.card.required', { value: formatGoalDelta(t, view.metric, view.requiredWeekly) }))}` : ''
          }</div>
        </div><div class="chart">${goalSvg({
          startAt: view.goal.startAt,
          deadline: view.goal.deadline,
          startValue: view.goal.startValue,
          target: view.goal.target,
          points: view.points,
          now,
          color,
          targetLabel: formatGoalValue(t, view.metric, view.goal.target),
        }, GOAL_W, 92)}</div></div>`;
    })
    .join('');

  const listItems = (items: { test: TestId; check: string }[]) =>
    items.map((f) => `<li>${esc(t(`assessment.steps.${f.test}.checks.${f.check}`))} <span class="muted">(${esc(t(`assessment.steps.${f.test}.title`))})</span></li>`).join('');
  const changes = comparison
    ? `<h2>${esc(t('report.findingsChange'))}</h2><div class="lists">
        <div style="background:#e3f4ec"><h4 style="color:${PDF.success}">✓ ${esc(t('report.resolved', { count: comparison.resolved.length }))}</h4><ul>${listItems(comparison.resolved) || `<li>${esc(t('report.none'))}</li>`}</ul></div>
        <div style="background:#fdf1e3"><h4 style="color:${PDF.warning}">● ${esc(t('report.persisting', { count: comparison.persisting.length }))}</h4><ul>${listItems(comparison.persisting) || `<li>${esc(t('report.none'))}</li>`}</ul></div>
        <div style="background:#fbe4e4"><h4 style="color:${PDF.level.weak}">⚠ ${esc(t('report.added', { count: comparison.added.length }))}</h4><ul>${listItems(comparison.added) || `<li>${esc(t('report.none'))}</li>`}</ul></div>
      </div>`
    : '';

  const testRows = TEST_IDS.filter((test) => assessment.results[test])
    .map((test) => {
      const result = assessment.results[test]!;
      const checks = TESTS[test].checks
        .filter((check) => result.checks[check.id] !== null && result.checks[check.id] !== undefined)
        .map((check) => (result.checks[check.id] ? `<span class="warn">⚠ ${esc(t(`assessment.steps.${test}.checks.${check.id}`))}</span>` : `<span class="ok">✓ ${esc(t(`assessment.steps.${test}.checksOk.${check.id}`))}</span>`))
        .join(' &nbsp; ');
      const hr = result.heartRate ? `<div>${heartRateSvg(result.heartRate.samples, result.heartRate.endAt)}</div>` : '';
      return `<tr><td style="width:26%"><b>${esc(t(`assessment.steps.${test}.title`))}</b></td><td style="width:14%"><b>${esc(metricText(t, test, assessment)) || '—'}</b></td><td>${checks}${result.note ? `<div><i>${escMultiline(result.note)}</i></div>` : ''}${hr}</td></tr>`;
    })
    .join('');

  const open = input.goals.filter((g) => g.status !== 'achieved' && g.status !== 'missed');
  const nextCheck = open.length ? Math.min(...open.map((g) => g.nextCheckAt)) : null;
  const retest = open.length
    ? (() => {
        const start = Math.min(...open.map((g) => g.goal.startAt));
        const end = Math.max(...open.map((g) => g.goal.deadline));
        return journeyPlan(start, end, Math.min(...open.map((g) => g.goal.checkEveryDays))).find((p) => (p.kind === 'retest' || p.kind === 'finish') && p.at > now)?.at ?? null;
      })()
    : null;

  const intro = assessment.intro;
  // İlk testte (hedef de karşılaştırma da yok) bu sayfa çıkmaz; test tablosu öne gelir.
  const page3 =
    goals || changes
      ? `<section class="page">
    ${goals ? `<h2 style="margin-top:0">${esc(t('report.goals'))}</h2>${goals}<div class="maplegend">${esc(t('report.goal.legend'))}</div>` : ''}
    ${changes}
  </section>`
      : '';

  const page4 = `<section class="page">
    <h2 style="margin-top:0">${esc(t('report.tests'))}</h2>
    <div class="card" style="margin-top:0"><table>${testRows}</table></div>
    ${
      intro
        ? `<div class="maplegend" style="margin-top:6px">${esc(t('report.intro.goals'))}: ${esc(intro.goals.map((g) => t(`assessment.goals.${g}`)).join(', ') || '—')} · ${esc(t('report.intro.pain'))}: ${esc(
            intro.pain ? intro.painRegions.map((rg) => t(`assessment.painRegions.${rg}`)).join(', ') : t('assessment.intro.pain.none'),
          )}</div>`
        : ''
    }
    ${evaluation?.coachNote ? `<h2>${esc(t('report.coachNote'))}</h2><div class="card">${escMultiline(evaluation.coachNote)}</div>` : ''}
    ${
      nextCheck || retest
        ? `<div class="next">${nextCheck ? `<div><div class="k">${esc(t('report.nextCheck'))}</div><div class="v">${esc(formatShortDate(nextCheck))}</div></div>` : ''}${
            retest ? `<div><div class="k">${esc(t('report.nextRetest'))}</div><div class="v">${esc(formatShortDate(retest))}</div></div>` : ''
          }</div>`
        : ''
    }
    <div class="footer">${esc(t('report.footer', { coach: coach.coachName || t('report.yourCoach') }))}</div>
  </section>`;

  const page5 = program ? `<section class="page">${programSection(t, program, input.exerciseName)}</section>` : '';

  return shell({ title: `${fullName(athlete)} — ${t('report.title')}`, lang: input.lang, body: page1 + page2 + page3 + page4 + page5, css: CSS });
}
