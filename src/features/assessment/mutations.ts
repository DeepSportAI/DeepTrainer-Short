import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query/keys';

import type { Assessment, Evaluation, IntroAnswers, Measurements, TestResult } from './model';
import type { StepId, TestId } from './protocol';
import { assessmentRepository } from './repository';

function useInvalidate() {
  const client = useQueryClient();
  return (assessment: Assessment) => {
    client.setQueryData(queryKeys.assessment(assessment.id), assessment);
    return client.invalidateQueries({ queryKey: queryKeys.assessments });
  };
}

/** Yeni test oturumu (sporcu seçilince ya da "Yeni test"). */
export function useStartAssessment() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (athleteId: string) => assessmentRepository.create(athleteId),
    onSuccess: invalidate,
  });
}

export type StepSave =
  | { step: 'intro'; intro: IntroAnswers }
  | { step: 'measurements'; measurements: Measurements }
  | { step: TestId; result: TestResult };

export function useSaveStep(assessmentId: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (save: StepSave) =>
      assessmentRepository.update(assessmentId, (current) => {
        const skipped = current.skipped.filter((step) => step !== save.step);
        if (save.step === 'intro') return { ...current, skipped, intro: save.intro };
        if (save.step === 'measurements') return { ...current, skipped, measurements: save.measurements };
        return { ...current, skipped, results: { ...current.results, [save.step]: save.result } };
      }),
    onSuccess: invalidate,
  });
}

export function useSkipStep(assessmentId: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (step: StepId) =>
      assessmentRepository.update(assessmentId, (current) =>
        current.skipped.includes(step) ? current : { ...current, skipped: [...current.skipped, step] },
      ),
    onSuccess: invalidate,
  });
}

/** Sonuç: alan seviyeleri, öncelik ve not — oturumu tamamlar. */
export function useCompleteAssessment(assessmentId: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (evaluation: Evaluation) =>
      assessmentRepository.update(assessmentId, (current) => ({
        ...current,
        evaluation,
        completedAt: current.completedAt ?? Date.now(),
      })),
    onSuccess: invalidate,
  });
}

export function useDeleteAssessment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assessmentRepository.remove(id),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.assessments }),
  });
}
