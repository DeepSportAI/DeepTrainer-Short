import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query/keys';

import { goalRepository } from './repository';

export function useAllGoals() {
  return useQuery({ queryKey: queryKeys.goals, queryFn: () => goalRepository.list() });
}

export function useAthleteGoals(athleteId: string) {
  return useQuery({
    queryKey: queryKeys.athleteGoals(athleteId),
    queryFn: () => goalRepository.listForAthlete(athleteId),
    enabled: athleteId !== '',
  });
}
