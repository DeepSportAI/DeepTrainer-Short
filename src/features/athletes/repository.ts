import { store } from '@/lib/db/store';
import { newId } from '@/lib/id';

import type { Athlete } from './model';
import type { AthleteFields } from './schema';

/** Sporcu verisinin tek kapısı (bugün yerel depo; sunucu gelince yalnız bu dosya değişir). */
export const athleteRepository = {
  async list(): Promise<Athlete[]> {
    const athletes = await store.list<Athlete>('athletes');
    return athletes.sort((a, b) => b.createdAt - a.createdAt);
  },
  get(id: string): Promise<Athlete | null> {
    return store.get<Athlete>('athletes', id);
  },
  async create(fields: AthleteFields): Promise<Athlete> {
    const now = Date.now();
    const athlete: Athlete = { ...fields, id: newId('ath'), createdAt: now, updatedAt: now };
    await store.put('athletes', athlete);
    return athlete;
  },
  async update(id: string, fields: AthleteFields): Promise<Athlete> {
    const current = await store.get<Athlete>('athletes', id);
    if (!current) throw new Error('athlete-not-found');
    const athlete: Athlete = { ...current, ...fields, updatedAt: Date.now() };
    await store.put('athletes', athlete);
    return athlete;
  },
  /** Sporcu ile birlikte testleri, programları ve hedefleri de silinir. */
  async remove(id: string): Promise<void> {
    await store.removeWhere<{ athleteId: string }>('assessments', (doc) => doc.athleteId === id);
    await store.removeWhere<{ athleteId: string }>('programs', (doc) => doc.athleteId === id);
    await store.removeWhere<{ athleteId: string }>('goals', (doc) => doc.athleteId === id);
    await store.remove('athletes', id);
  },
};
