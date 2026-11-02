import type { TFunction } from 'i18next';

import type { AthleteCardModel } from '@/features/athletes/components/athlete-card';
import { ageOf, fullName, initials, type Athlete } from '@/features/athletes/model';
import { formatAgo } from '@/lib/format/ago';
import { formatShortDate } from '@/lib/format/date';

import { levelLabel, levelTone, recommendationText, stepShort } from './labels';
import { hasActivity, isStepDone, progressOf, summarizeAthlete, type Assessment } from './model';
import { AREAS, STEP_ORDER } from './protocol';
import { recommendNext } from './recommend';

/** Ana sayfa kartının içeriği: sporcu + oturumları (+ program sayısı). */
export function athleteCardModel(
  t: TFunction,
  athlete: Athlete,
  assessments: readonly Assessment[],
  programCount: number,
): AthleteCardModel {
  const summary = summarizeAthlete(assessments);
  // Kartta gösterilen oturum: süren varsa o (devam edilecek), yoksa en son yapılan.
  const shown = summary.open && hasActivity(summary.open) ? summary.open : summary.latest;
  const goals = shown?.intro?.goals ?? summary.latest?.intro?.goals ?? [];
  const age = ageOf(athlete);
  const meta = [
    athlete.gender ? t(`athleteForm.gender.${athlete.gender}`) : null,
    age ? t('athletes.card.age', { age }) : null,
    goals.length > 0 ? goals.map((goal) => t(`assessment.goals.${goal}`)).join(', ') : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const evaluation = summary.latestEvaluated?.evaluation ?? null;
  const next = summary.open ? recommendNext(summary.open) : null;

  return {
    id: athlete.id,
    name: fullName(athlete),
    initials: initials(athlete),
    meta,
    lastTest: summary.lastTestAt
      ? { date: formatShortDate(summary.lastTestAt), ago: formatAgo(summary.lastTestAt) }
      : null,
    progress: shown ? progressOf(shown) : null,
    steps: shown ? STEP_ORDER.map((step) => ({ key: step, label: stepShort(t, step), done: isStepDone(shown, step) })) : [],
    levels: evaluation
      ? AREAS.map((area) => ({
          key: t(`assessment.areasShort.${area}`),
          label: levelLabel(t, area, evaluation.levels[area]),
          tone: levelTone(evaluation.levels[area]),
        }))
      : [],
    next: summary.open
      ? next
        ? recommendationText(t, next)
        : { title: t('assessment.result.title'), reason: t('assessment.recommend.reason.result') }
      : null,
    programCount,
  };
}
