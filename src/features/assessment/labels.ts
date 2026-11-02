import type { TFunction } from 'i18next';

import type { Tone } from '@/components/ui/level-badge';

import type { Level } from './model';
import type { Area, StepId } from './protocol';
import type { Recommendation } from './recommend';

/** Seviye adı: kondisyonda "düşük / orta / iyi", diğer alanlarda "zayıf / orta / iyi". */
export function levelLabel(t: TFunction, area: Area, level: Level | null): string {
  if (!level) return t('assessment.level.none');
  return t(`assessment.level.${area === 'conditioning' ? 'conditioning' : 'default'}.${level}`);
}

export function levelTone(level: Level | null): Tone | null {
  return level;
}

export function stepTitle(t: TFunction, step: StepId): string {
  return t(`assessment.steps.${step}.title`);
}

export function stepShort(t: TFunction, step: StepId): string {
  return t(`assessment.steps.${step}.short`);
}

export function recommendationText(t: TFunction, recommendation: Recommendation): { title: string; reason: string } {
  return {
    title: stepTitle(t, recommendation.step),
    reason: t(`assessment.recommend.reason.${recommendation.reason}`),
  };
}
