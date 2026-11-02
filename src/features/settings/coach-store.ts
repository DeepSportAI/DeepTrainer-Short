import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/storage/kv';

/**
 * Antrenör bilgisi — PDF raporunun başlığında ve altında görünür (ad, salon / kulüp). Giriş yok; cihazda saklanan
 * küçük bir tercih (kv), kayıt verisi değil.
 */
type CoachState = {
  coachName: string;
  organization: string;
  setCoach: (coach: { coachName: string; organization: string }) => void;
};

export const useCoachStore = create<CoachState>()(
  persist(
    (set) => ({
      coachName: '',
      organization: '',
      setCoach: ({ coachName, organization }) => set({ coachName: coachName.trim(), organization: organization.trim() }),
    }),
    { name: 'deeptrainer.coach', storage: createJSONStorage(() => zustandStorage) },
  ),
);
