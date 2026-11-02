import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query/keys';

import { athleteRepository } from './repository';

export function useAthletes() {
  return useQuery({ queryKey: queryKeys.athletes, queryFn: () => athleteRepository.list() });
}

export function useAthlete(id: string) {
  return useQuery({
    queryKey: queryKeys.athlete(id),
    queryFn: () => athleteRepository.get(id),
    enabled: id !== '',
  });
}
