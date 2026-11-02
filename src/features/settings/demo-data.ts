import { emptyAssessment, type Assessment } from '@/features/assessment/model';
import type { Athlete } from '@/features/athletes/model';
import { store } from '@/lib/db/store';

/**
 * Geliştirme demosu (yalnız `__DEV__`, Ayarlar › Veriler): akışı boş uygulamada denemek için üç sporcu — Kamil'in
 * notlarındaki örneklerle: İrem (değerlendirmesi tamam, bel boşluğu / lordoz, core zayıf, 1 dk burpee 9), Yunus
 * (test yarıda, burpee 15 hedefi) ve hiç test olmamış Deniz.
 */
const DAY = 86_400_000;

function athlete(id: string, firstName: string, lastName: string, extra: Partial<Athlete>, now: number): Athlete {
  return { id, firstName, lastName, gender: null, birthYear: null, heightCm: null, weightKg: null, phone: '', email: '', note: '', createdAt: now, updatedAt: now, ...extra };
}

export async function seedDemoData(now: number = Date.now()): Promise<void> {
  const irem = athlete('demo_irem', 'İrem', 'Yılmaz', { gender: 'female', birthYear: 1997, heightCm: 165, weightKg: 63 }, now - 20 * DAY);
  const yunus = athlete('demo_yunus', 'Yunus', 'Demir', { gender: 'male', birthYear: 1992, heightCm: 181, weightKg: 84 }, now - 9 * DAY);
  const deniz = athlete('demo_deniz', 'Deniz', 'Kaya', { gender: 'male', birthYear: 2001, heightCm: 176 }, now - DAY);

  const at = now - 3 * DAY;
  const iremSession: Assessment = {
    ...emptyAssessment('demo_as_irem', irem.id, at - 40 * 60_000),
    completedAt: at,
    updatedAt: at,
    intro: { experience: 'occasional', experienceNote: 'Pilates, ara ara koşu', pain: true, painRegions: ['lowerBack'], painNote: 'Uzun oturunca bel ağrısı', goals: ['fatLoss', 'conditioning'], note: '', completedAt: at - 38 * 60_000 },
    results: {
      airSquat: { checks: { kneeValgus: false, heelLift: false, lumbarCollapse: true }, metric: null, note: '', completedAt: at - 35 * 60_000 },
      hipHinge: { checks: { backRounding: false, hipsNotBack: false }, metric: null, note: 'İrem lordoz oluşuyor', completedAt: at - 33 * 60_000 },
      overheadReach: { checks: { lumbarArch: true, shouldersForward: false }, metric: null, note: 'Bel boşluğu artıyor', completedAt: at - 31 * 60_000 },
      plank: { checks: { hipSag: true, shaking: true }, metric: 22, note: '', completedAt: at - 29 * 60_000 },
      gobletSquat: { checks: { shallowDepth: false, balanceLoss: false, kneeHipMisalign: false }, metric: null, note: '', completedAt: at - 24 * 60_000 },
      pushUp: { checks: { hipDrop: true, elbowControl: true, neckPosition: false }, metric: 4, note: 'Core zayıf', completedAt: at - 21 * 60_000 },
      dumbbellRow: { checks: { shoulderShrug: true, backInactive: false }, metric: null, note: '', completedAt: at - 18 * 60_000 },
      conditioning: { checks: { heavyBreathing: true, tempoDrop: true }, metric: 9, option: 'burpee', note: '', completedAt: at - 10 * 60_000, heartRate: null },
    },
    measurements: { weightKg: 63.4, waistCm: 76, heightCm: 165, restingHr: 72, photoFront: null, photoSide: null, completedAt: at - 5 * 60_000 },
    evaluation: {
      levels: { core: 'weak', glute: 'medium', upperBack: 'medium', conditioning: 'weak' },
      priority: 'upperBody',
      priorityNote: 'Üst vücut, ardından core',
      coachNote: 'Programı buna göre yazacağım: önce gövde kontrolü, şınavı dizden başlat.',
    },
  };

  const started = now - 2 * 60 * 60_000;
  const yunusSession: Assessment = {
    ...emptyAssessment('demo_as_yunus', yunus.id, started),
    updatedAt: started + 12 * 60_000,
    intro: { experience: 'regular', experienceNote: 'Fitness, 2 yıl', pain: false, painRegions: [], painNote: '', goals: ['muscle'], note: '', completedAt: started + 3 * 60_000 },
    results: {
      airSquat: { checks: { kneeValgus: true, heelLift: false, lumbarCollapse: false }, metric: null, note: 'Sağ diz içe kaçıyor', completedAt: started + 7 * 60_000 },
      hipHinge: { checks: { backRounding: false, hipsNotBack: false }, metric: null, note: '', completedAt: started + 10 * 60_000 },
    },
  };

  for (const doc of [irem, yunus, deniz]) await store.put('athletes', doc);
  for (const doc of [iremSession, yunusSession]) await store.put('assessments', doc);
}
