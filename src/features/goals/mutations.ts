import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query/keys';

import { goalRepository, type GoalDraft } from './repository';

function useInvalidateGoals() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: queryKeys.goals });
}

export function useCreateGoals() {
  const invalidate = useInvalidateGoals();
  return useMutation({ mutationFn: (drafts: GoalDraft[]) => goalRepository.createMany(drafts), onSuccess: invalidate });
}

export function useAddCheckin() {
  const invalidate = useInvalidateGoals();
  return useMutation({
    mutationFn: ({ id, value, note }: { id: string; value: number; note: string }) => goalRepository.addCheckin(id, value, note),
    onSuccess: invalidate,
  });
}

export function useUpdateGoal() {
  const invalidate = useInvalidateGoals();
  return useMutation({
    mutationFn: ({ id, target, deadline }: { id: string; target: number; deadline: number }) =>
      goalRepository.update(id, (goal) => ({ ...goal, target, deadline })),
    onSuccess: invalidate,
  });
}

export function useDeleteGoal() {
  const invalidate = useInvalidateGoals();
  return useMutation({ mutationFn: (id: string) => goalRepository.remove(id), onSuccess: invalidate });
}
