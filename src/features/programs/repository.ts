import { store } from '@/lib/db/store';
import { newId } from '@/lib/id';

import type { ChatMessage, Program } from './model';
import type { ProgramPlan, ProgramPreferences } from './schema';

export type ProgramDraft = {
  athleteId: string;
  assessmentId: string | null;
  plan: ProgramPlan;
  preferences: ProgramPreferences;
  messages: ChatMessage[];
};

export const programRepository = {
  async listForAthlete(athleteId: string): Promise<Program[]> {
    const all = await store.list<Program>('programs');
    return all.filter((item) => item.athleteId === athleteId).sort((a, b) => b.updatedAt - a.updatedAt);
  },
  list(): Promise<Program[]> {
    return store.list<Program>('programs');
  },
  get(id: string): Promise<Program | null> {
    return store.get<Program>('programs', id);
  },
  /** Yeni program ya da var olanın güncellemesi (sohbetle düzenleme aynı kaydı değiştirir). */
  async save(draft: ProgramDraft, id?: string): Promise<Program> {
    const now = Date.now();
    const current = id ? await store.get<Program>('programs', id) : null;
    const program: Program = current
      ? { ...current, ...draft, updatedAt: now }
      : { ...draft, id: newId('pr'), createdAt: now, updatedAt: now };
    await store.put('programs', program);
    return program;
  },
  remove(id: string): Promise<void> {
    return store.remove('programs', id);
  },
};
