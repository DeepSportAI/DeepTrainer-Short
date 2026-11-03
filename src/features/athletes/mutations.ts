import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query/keys';

import { athleteRepository } from './repository';
import type { AthleteFields } from './schema';

export function useCreateAthlete() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (fields: AthleteFields) => athleteRepository.create(fields),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.athletes }),
  });
}

export function useUpdateAthlete(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (fields: AthleteFields) => athleteRepository.update(id, fields),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.athletes }),
  });
}

export function useDeleteAthlete() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => athleteRepository.remove(id),
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.athletes }),
        client.invalidateQueries({ queryKey: queryKeys.assessments }),
        client.invalidateQueries({ queryKey: queryKeys.programs }),
        client.invalidateQueries({ queryKey: queryKeys.goals }),
      ]),
  });
}
