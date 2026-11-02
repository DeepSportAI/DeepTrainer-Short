import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query/keys';

import { assessmentRepository } from './repository';

/** Bütün oturumlar — ana sayfadaki sporcu kartlarının özeti için (yerel, küçük). */
export function useAllAssessments() {
  return useQuery({ queryKey: queryKeys.assessments, queryFn: () => assessmentRepository.list() });
}

export function useAthleteAssessments(athleteId: string) {
  return useQuery({
    queryKey: queryKeys.athleteAssessments(athleteId),
    queryFn: () => assessmentRepository.listForAthlete(athleteId),
    enabled: athleteId !== '',
  });
}

export function useAssessment(id: string) {
  return useQuery({
    queryKey: queryKeys.assessment(id),
    queryFn: () => assessmentRepository.get(id),
    enabled: id !== '',
  });
}
