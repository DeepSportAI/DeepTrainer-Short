import type { TFunction } from 'i18next';

import { levelLabel } from '@/features/assessment/labels';
import type { Assessment } from '@/features/assessment/model';
import { AREAS, STAGES, STEP_ORDER, TESTS, TEST_IDS, type TestId } from '@/features/assessment/protocol';
import { ageOf, bmiOf, fullName, type Athlete } from '@/features/athletes/model';
import type { ProgramPlan } from '@/features/programs/schema';
import { formatClock } from '@/lib/format/clock';
import { formatShortDate } from '@/lib/format/date';
import { formatDecimal } from '@/lib/format/quantity';

import { esc, escMultiline, heartRateSvg, levelBars, shell } from './html';
import { programSection } from './program-report';

/**
 * Analiz raporu (PDF) — sporcunun göreceği TEK çıktı (Kamil, 2 Kasım 2026: "Sporcu PDF olarak analizini görebilir, ona
 * uygulama verilmeyecek"). Okur sporcu: metin "sen" diliyle. İçerik: kimlik, değerlendirme özeti (dört alan + öncelik),
 * tanışma, hareket / kuvvet / kondisyon testleri (bulgular, ölçüler, nabız), ölçümler, isteğe bağlı fotoğraflar ve
 * program, antrenör notu.
 */
export type AssessmentReportInput = {
  t: TFunction;
  lang: string;
  athlete: Athlete;
  assessment: Assessment;
  coach: { coachName: string; organization: string };
  photos: { front: string | null; side: string | null } | null;
  program: ProgramPlan | null;
  exerciseName: (id: string) => string;
};

function metricText(t: TFunction, test: TestId, assessment: Assessment): string {
  const result = assessment.results[test];
  if (!result || result.metric === null) return '';
  if (test === 'conditioning' && result.option === 'row500') return `${formatClock(result.metric)} ${t('units.minutes')}`;
  if (test === 'plank') return `${result.metric} ${t('units.seconds')}`;
  return `${result.metric} ${t('units.reps')}`;
}

function testRows(t: TFunction, assessment: Assessment, tests: TestId[]): string {
  return tests
    .map((test) => {
      const result = assessment.results[test];
      if (!result) {
        return `<tr><td><h3>${esc(t(`assessment.steps.${test}.title`))}</h3></td><td colspan="2" class="muted">${esc(
          assessment.skipped.includes(test) ? t('report.skipped') : t('report.notDone'),
        )}</td></tr>`;
      }
      const checks = TESTS[test].checks
        .filter((check) => result.checks[check.id] !== null && result.checks[check.id] !== undefined)
        .map((check) =>
          result.checks[check.id]
            ? `<div class="warn">⚠ ${esc(t(`assessment.steps.${test}.checks.${check.id}`))}</div>`
            : `<div class="ok">✓ ${esc(t(`assessment.steps.${test}.checksOk.${check.id}`))}</div>`,
        )
        .join('');
      const option = test === 'conditioning' && result.option ? ` <span class="pill">${esc(t(`assessment.conditioning.option.${result.option}`))}</span>` : '';
      const hr = result.heartRate
        ? `<div class="muted" style="margin-top:4px">❤ ${esc(
            t('report.heartRate', {
              max: result.heartRate.max,
              avg: result.heartRate.avg,
              recovery: result.heartRate.recovery60 ?? '—',
            }),
          )}</div>${heartRateSvg(result.heartRate.samples, result.heartRate.endAt)}`
        : '';
      return `<tr>
        <td style="width:28%"><h3>${esc(t(`assessment.steps.${test}.title`))}</h3><div class="muted">${esc(t(`assessment.steps.${test}.target`))}</div>${option}</td>
        <td style="width:16%"><b>${esc(metricText(t, test, assessment)) || '—'}</b></td>
        <td>${checks || `<span class="muted">${esc(t('report.noChecks'))}</span>`}${result.note ? `<div style="margin-top:4px"><i>${escMultiline(result.note)}</i></div>` : ''}${hr}</td>
      </tr>`;
    })
    .join('');
}

export function buildAssessmentReportHtml(input: AssessmentReportInput): string {
  const { t, athlete, assessment, coach, photos, program } = input;
  const date = formatShortDate(assessment.completedAt ?? assessment.updatedAt);
  const age = ageOf(athlete);
  const evaluation = assessment.evaluation;
  const m = assessment.measurements;
  const height = m?.heightCm ?? athlete.heightCm;
  const bmi = bmiOf(m?.weightKg ?? athlete.weightKg, height);
  const intro = assessment.intro;

  const identity = [
    athlete.gender ? t(`athleteForm.gender.${athlete.gender}`) : null,
    age ? t('athletes.card.age', { age }) : null,
    height ? `${formatDecimal(height, 0)} ${t('units.cm')}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const summary = evaluation
    ? `<h2>${esc(t('report.summary'))}</h2>
      <div class="card"><table>${AREAS.map(
        (area) => `<tr><td style="width:40%"><b>${esc(t(`assessment.areas.${area}`))}</b><div class="muted">${esc(t(`assessment.areaHints.${area}`))}</div></td>
          <td><div class="level">${levelBars(evaluation.levels[area])}<b>${esc(levelLabel(t, area, evaluation.levels[area]))}</b></div></td></tr>`,
      ).join('')}</table></div>
      ${
        evaluation.priority
          ? `<div class="volt"><div class="label">${esc(t('report.priority'))}</div><div class="value">${esc(t(`assessment.priorities.${evaluation.priority}`))}</div>${
              evaluation.priorityNote ? `<div>${escMultiline(evaluation.priorityNote)}</div>` : ''
            }</div>`
          : ''
      }`
    : `<div class="card muted">${esc(t('report.noEvaluation'))}</div>`;

  const introBlock = intro
    ? `<h2>${esc(t('assessment.steps.intro.title'))}</h2>
      <div class="card"><table>
        <tr><td style="width:32%" class="muted">${esc(t('report.intro.experience'))}</td><td>${esc(intro.experience ? t(`assessment.intro.experience.${intro.experience}`) : '—')}${intro.experienceNote ? ` — ${esc(intro.experienceNote)}` : ''}</td></tr>
        <tr><td class="muted">${esc(t('report.intro.pain'))}</td><td>${
          intro.pain
            ? `${esc(intro.painRegions.map((region) => t(`assessment.painRegions.${region}`)).join(', '))}${intro.painNote ? ` — ${esc(intro.painNote)}` : ''}`
            : esc(t('assessment.intro.pain.none'))
        }</td></tr>
        <tr><td class="muted">${esc(t('report.intro.goals'))}</td><td>${esc(intro.goals.map((goal) => t(`assessment.goals.${goal}`)).join(', ') || '—')}</td></tr>
      </table></div>`
    : '';

  const stageTests = (stage: string) => TEST_IDS.filter((test) => TESTS[test].stage === stage);
  const testBlocks = STAGES.filter((stage) => stage.id !== 'intro' && stage.id !== 'measurements')
    .map((stage) => {
      const tests = stageTests(stage.id);
      if (!tests.some((test) => assessment.results[test] || assessment.skipped.includes(test))) return '';
      return `<h2>${esc(t(`assessment.stages.${stage.id}`))}</h2>
        <div class="card"><table><tr><th>${esc(t('report.columns.test'))}</th><th>${esc(t('report.columns.result'))}</th><th>${esc(t('report.columns.observations'))}</th></tr>${testRows(t, assessment, tests)}</table></div>`;
    })
    .join('');

  const measurementBlock = m
    ? `<h2>${esc(t('assessment.steps.measurements.title'))}</h2>
      <div class="grid">
        <div class="stat"><div class="label">${esc(t('assessment.measurements.weight'))}</div><div class="value">${m.weightKg !== null ? `${formatDecimal(m.weightKg, 1)} ${esc(t('units.kg'))}` : '—'}</div></div>
        <div class="stat"><div class="label">${esc(t('assessment.measurements.waist'))}</div><div class="value">${m.waistCm !== null ? `${formatDecimal(m.waistCm, 1)} ${esc(t('units.cm'))}` : '—'}</div></div>
        <div class="stat"><div class="label">${esc(t('common.bmi'))}</div><div class="value">${bmi ? formatDecimal(bmi, 1) : '—'}</div></div>
        ${m.restingHr ? `<div class="stat"><div class="label">${esc(t('assessment.measurements.restingHr'))}</div><div class="value">${m.restingHr} ${esc(t('units.bpm'))}</div></div>` : ''}
      </div>
      ${
        photos && (photos.front || photos.side)
          ? `<div class="photos">${photos.front ? `<img src="${photos.front}" />` : ''}${photos.side ? `<img src="${photos.side}" />` : ''}</div>`
          : ''
      }`
    : '';

  const coachNote = evaluation?.coachNote
    ? `<h2>${esc(t('report.coachNote'))}</h2><div class="card">${escMultiline(evaluation.coachNote)}</div>`
    : '';

  const done = STEP_ORDER.filter((step) => step === 'intro' ? assessment.intro : step === 'measurements' ? assessment.measurements : assessment.results[step]).length;

  const body = `
    <div class="band">
      <div><div class="brand">DeepTrainer<span>${esc(t('report.badge'))}</span></div><div style="font-size:10px;opacity:.85">${esc(coach.organization)}</div></div>
      <div class="meta">${esc(t('report.date', { date }))}<br/>${esc(coach.coachName ? t('report.coach', { name: coach.coachName }) : '')}</div>
    </div>
    <div style="margin-top:14px">
      <h1>${esc(fullName(athlete))}</h1>
      <div class="muted">${esc(identity)}${identity ? ' · ' : ''}${esc(t('report.completedSteps', { done, total: STEP_ORDER.length }))}</div>
    </div>
    ${summary}
    ${introBlock}
    ${testBlocks}
    ${measurementBlock}
    ${coachNote}
    ${program ? programSection(t, program, input.exerciseName) : ''}
    <div class="footer">${esc(t('report.footer', { coach: coach.coachName || t('report.yourCoach') }))}</div>`;

  return shell({ title: `${fullName(athlete)} — ${t('report.title')}`, lang: input.lang, body });
}

