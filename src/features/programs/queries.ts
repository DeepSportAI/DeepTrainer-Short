import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query/keys';

import { programRepository } from './repository';

export function useAthletePrograms(athleteId: string) {
  return useQuery({
    queryKey: queryKeys.athletePrograms(athleteId),
    queryFn: () => programRepository.listForAthlete(athleteId),
    enabled: athleteId !== '',
  });
}

export function useAllPrograms() {
  return useQuery({ queryKey: queryKeys.programs, queryFn: () => programRepository.list() });
}

export function useProgram(id: string) {
  return useQuery({ queryKey: queryKeys.program(id), queryFn: () => programRepository.get(id), enabled: id !== '' });
}
