import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query/keys';

import { askAssistant } from './api';
import { programRepository, type ProgramDraft } from './repository';
import type { AssistantRequest } from './schema';

/** Asistana bir tur — sonuç kaydedilmez; ekran sohbete ekler, antrenör "Kaydet" der. */
export function useAskAssistant() {
  return useMutation({ mutationFn: (body: AssistantRequest) => askAssistant(body) });
}

export function useSaveProgram() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ draft, id }: { draft: ProgramDraft; id?: string }) => programRepository.save(draft, id),
    onSuccess: (program) => {
      client.setQueryData(queryKeys.program(program.id), program);
      return client.invalidateQueries({ queryKey: queryKeys.programs });
    },
  });
}

export function useDeleteProgram() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => programRepository.remove(id),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.programs }),
  });
}
