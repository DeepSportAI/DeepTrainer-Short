import type { TFunction } from 'i18next';

import { ageOf, bmiOf, fullName, type Athlete } from '@/features/athletes/model';
import { findingsOf, type Assessment } from '@/features/assessment/model';
import { AREAS, TESTS, TEST_IDS } from '@/features/assessment/protocol';
import { formatClock } from '@/lib/format/clock';

import type { ProgramPreferences } from './schema';

/**
 * Sohbetin ilk mesajındaki sporcu bağlamı — değerlendirmenin okunur özeti, uygulamanın dilinde. Sporcunun adı yalnız
 * ilk adıyla gider (soyad, telefon, e-posta, fotoğraf GİTMEZ).
 */
export function clientContext(t: TFunction, athlete: Athlete, assessment: Assessment | null): string {
  const lines: string[] = [];
  const age = ageOf(athlete);
  lines.push(
    `${t('programs.context.client')}: ${athlete.firstName.trim() || fullName(athlete)}` +
      [
        athlete.gender ? `, ${t(`athleteForm.gender.${athlete.gender}`)}` : '',
        age ? `, ${t('athletes.card.age', { age })}` : '',
        athlete.heightCm ? `, ${athlete.heightCm} cm` : '',
      ].join(''),
  );

  if (!assessment) {
    lines.push(t('programs.context.noAssessment'));
    return `<client_context>\n${lines.join('\n')}\n</client_context>`;
  }

  const intro = assessment.intro;
  if (intro) {
    if (intro.experience) lines.push(`${t('assessment.intro.experience.label')}: ${t(`assessment.intro.experience.${intro.experience}`)}${intro.experienceNote ? ` (${intro.experienceNote})` : ''}`);
    lines.push(
      `${t('assessment.intro.pain.label')}: ${
        intro.pain
          ? [intro.painRegions.map((region) => t(`assessment.painRegions.${region}`)).join(', '), intro.painNote].filter(Boolean).join(' — ')
          : t('assessment.intro.pain.none')
      }`,
    );
    if (intro.goals.length > 0) lines.push(`${t('assessment.intro.goals.label')}: ${intro.goals.map((goal) => t(`assessment.goals.${goal}`)).join(', ')}`);
    if (intro.note) lines.push(`${t('assessment.intro.note')}: ${intro.note}`);
  }

  for (const id of TEST_IDS) {
    const result = assessment.results[id];
    if (!result) continue;
    const faults = TESTS[id].checks.filter((check) => result.checks[check.id] === true).map((check) => t(`assessment.steps.${id}.checks.${check.id}`));
    const metric =
      result.metric === null
        ? ''
        : id === 'conditioning' && result.option === 'row500'
          ? ` · ${formatClock(result.metric)}`
          : id === 'plank'
            ? ` · ${result.metric} ${t('units.seconds')}`
            : ` · ${result.metric} ${t('units.reps')}`;
    const option = id === 'conditioning' && result.option ? ` (${t(`assessment.conditioning.option.${result.option}`)})` : '';
    const hr = result.heartRate ? ` · ${t('heartRate.context', { max: result.heartRate.max, avg: result.heartRate.avg, recovery: result.heartRate.recovery60 ?? '—' })}` : '';
    lines.push(
      `${t(`assessment.steps.${id}.title`)}${option}${metric}${hr}: ${faults.length > 0 ? faults.join('; ') : t('programs.context.noFaults')}${result.note ? ` — ${t('programs.context.coachNote')}: ${result.note}` : ''}`,
    );
  }
  if (findingsOf(assessment).length === 0 && Object.keys(assessment.results).length > 0) lines.push(t('programs.context.cleanMovement'));

  const m = assessment.measurements;
  if (m) {
    const bmi = bmiOf(m.weightKg, m.heightCm ?? athlete.heightCm);
    lines.push(
      [
        m.weightKg ? `${t('assessment.measurements.weight')}: ${m.weightKg} kg` : null,
        m.waistCm ? `${t('assessment.measurements.waist')}: ${m.waistCm} cm` : null,
        bmi ? `${t('common.bmi')}: ${bmi.toFixed(1)}` : null,
        m.restingHr ? `${t('assessment.measurements.restingHr')}: ${m.restingHr} bpm` : null,
      ]
        .filter(Boolean)
        .join(' · '),
    );
  }

  const evaluation = assessment.evaluation;
  if (evaluation) {
    lines.push(
      `${t('assessment.result.title')}: ${AREAS.map((area) => `${t(`assessment.areas.${area}`)} ${evaluation.levels[area] ? t(`assessment.level.${area === 'conditioning' ? 'conditioning' : 'default'}.${evaluation.levels[area]}`) : '—'}`).join(', ')}`,
    );
    if (evaluation.priority) lines.push(`${t('assessment.result.priority')}: ${t(`assessment.priorities.${evaluation.priority}`)}${evaluation.priorityNote ? ` (${evaluation.priorityNote})` : ''}`);
    if (evaluation.coachNote) lines.push(`${t('programs.context.coachNote')}: ${evaluation.coachNote}`);
  }

  return `<client_context>\n${lines.filter(Boolean).join('\n')}\n</client_context>`;
}

export function preferencesText(t: TFunction, preferences: ProgramPreferences): string {
  const equipment = preferences.equipment.length
    ? preferences.equipment.map((item) => t(`exercises.equipment.${item}`)).join(', ')
    : t('exercises.equipment.bodyweight');
  return `<trainer_preferences>\n${t('programs.preferences.summary', {
    days: preferences.daysPerWeek,
    minutes: preferences.sessionMinutes,
    weeks: preferences.weeks,
    place: t(`programs.preferences.place.${preferences.place}`),
    equipment,
  })}\n</trainer_preferences>`;
}

export function samePreferences(a: ProgramPreferences, b: ProgramPreferences): boolean {
  return (
    a.daysPerWeek === b.daysPerWeek &&
    a.sessionMinutes === b.sessionMinutes &&
    a.weeks === b.weeks &&
    a.place === b.place &&
    [...a.equipment].sort().join() === [...b.equipment].sort().join()
  );
}
