import { store } from '@/lib/db/store';
import { deletePhoto } from '@/lib/files/photos';
import { newId } from '@/lib/id';

import { emptyAssessment, type Assessment } from './model';

export const assessmentRepository = {
  list(): Promise<Assessment[]> {
    return store.list<Assessment>('assessments');
  },
  async listForAthlete(athleteId: string): Promise<Assessment[]> {
    const all = await store.list<Assessment>('assessments');
    return all.filter((item) => item.athleteId === athleteId).sort((a, b) => b.createdAt - a.createdAt);
  },
  get(id: string): Promise<Assessment | null> {
    return store.get<Assessment>('assessments', id);
  },
  async create(athleteId: string): Promise<Assessment> {
    const assessment = emptyAssessment(newId('as'), athleteId, Date.now());
    await store.put('assessments', assessment);
    return assessment;
  },
  /** Belgeyi okuyup değiştirir ve yazar; `updatedAt` her yazmada güncellenir. */
  async update(id: string, change: (current: Assessment) => Assessment): Promise<Assessment> {
    const current = await store.get<Assessment>('assessments', id);
    if (!current) throw new Error('assessment-not-found');
    const next = { ...change(current), updatedAt: Date.now() };
    await store.put('assessments', next);
    return next;
  },
  async remove(id: string): Promise<void> {
    const current = await store.get<Assessment>('assessments', id);
    deletePhoto(current?.measurements?.photoFront);
    deletePhoto(current?.measurements?.photoSide);
    await store.remove('assessments', id);
  },
};
