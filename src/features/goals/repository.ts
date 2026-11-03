import { store } from '@/lib/db/store';
import { newId } from '@/lib/id';

import type { Goal, GoalCheckin } from './model';

export type GoalDraft = Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'checkins'>;

export const goalRepository = {
  list(): Promise<Goal[]> {
    return store.list<Goal>('goals');
  },
  async listForAthlete(athleteId: string): Promise<Goal[]> {
    const all = await store.list<Goal>('goals');
    return all.filter((goal) => goal.athleteId === athleteId).sort((a, b) => a.createdAt - b.createdAt);
  },
  /**
   * Birden çok hedef birlikte (hedef koyma ekranı). Yeniden planlamada aynı sporcunun aynı ölçütteki eski hedefi
   * yenisiyle değişir — bir ölçütün tek bir gidişatı olur.
   */
  async createMany(drafts: GoalDraft[]): Promise<Goal[]> {
    const now = Date.now();
    const goals = drafts.map((draft) => ({ ...draft, id: newId('gl'), checkins: [], createdAt: now, updatedAt: now }));
    const replaced = new Set(drafts.map((draft) => `${draft.athleteId}:${draft.metric}`));
    await store.removeWhere<Goal>('goals', (goal) => replaced.has(`${goal.athleteId}:${goal.metric}`));
    for (const goal of goals) await store.put('goals', goal);
    return goals;
  },
  async update(id: string, change: (goal: Goal) => Goal): Promise<Goal> {
    const current = await store.get<Goal>('goals', id);
    if (!current) throw new Error('goal-not-found');
    const next = { ...change(current), updatedAt: Date.now() };
    await store.put('goals', next);
    return next;
  },
  addCheckin(id: string, value: number, note: string, at: number = Date.now()): Promise<Goal> {
    const checkin: GoalCheckin = { id: newId('ck'), value, at, note };
    return goalRepository.update(id, (goal) => ({ ...goal, checkins: [...goal.checkins, checkin] }));
  },
  remove(id: string): Promise<void> {
    return store.remove('goals', id);
  },
};
