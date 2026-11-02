import { emptyAssessment, type Assessment } from '@/features/assessment/model';
import type { Athlete } from '@/features/athletes/model';
import type { Program } from '@/features/programs/model';
import type { PlanExercise, ProgramPlan } from '@/features/programs/schema';
import { store } from '@/lib/db/store';

/**
 * Geliştirme demosu (yalnız `__DEV__`, Ayarlar › Veriler): akışı boş uygulamada denemek için üç sporcu — Kamil'in
 * notlarındaki örneklerle: İrem (değerlendirmesi tamam, bel boşluğu / lordoz, core zayıf, 1 dk burpee 9; elle yazılmış
 * örnek programıyla), Yunus (test yarıda) ve hiç test olmamış Deniz.
 */
const DAY = 86_400_000;

type Row = [catalogId: string, section: PlanExercise['section'], sets: number | null, reps: string, rest: number | null, cue: string];

/** Elle yazılmış ÖRNEK program (asistan çıktısı değil) — program ekranını asistan bağlanmadan göstermek için. */
function demoExercise([catalogId, section, sets, reps, rest, cue]: Row, meta: Pick<PlanExercise, 'name' | 'description' | 'regions' | 'difficulty'>): PlanExercise {
  return { catalogId, section, sets, reps, restSeconds: rest, cue, ...meta };
}

const DEMO_PLAN: ProgramPlan = {
  title: 'Üst vücut + core temeli (örnek)',
  summary:
    'Değerlendirmede core zayıf, üst vücut öncelikli çıktı; bel ağrısı bildirildiği için yük gövdeyi bükmeden verilir. Şınav eğimli başlar, çekişler kürek kemiği kontrolüyle yapılır.',
  weeks: 4,
  daysPerWeek: 3,
  sessionMinutes: 45,
  focus: ['Üst vücut', 'Core', 'Kondisyon'],
  days: [
    {
      title: 'İtiş + core',
      focus: 'Göğüs, omuz, gövde kontrolü',
      exercises: [
        demoExercise(['CAT_CAMEL', 'warmup', 2, '8', null, 'Nefesle birlikte yavaş hareket et.'], { name: 'Kedi-Deve', description: 'Omurga ısınması.', regions: ['thoracic', 'lowerBack'], difficulty: 'easy' }),
        demoExercise(['INCLINE_PUSH_UP', 'main', 3, '8-10', 60, 'Gövden tek parça, belini düşürme.'], { name: 'Eğimli Şınav', description: 'Şınava ara adım.', regions: ['chest', 'triceps', 'shoulders'], difficulty: 'easy' }),
        demoExercise(['SHOULDER_PRESS', 'main', 3, '10', 60, 'Kaburgaların kapalı, beli çukurlaştırma.'], { name: 'Omuz Press', description: 'Baş üstü itiş.', regions: ['shoulders', 'triceps'], difficulty: 'medium' }),
        demoExercise(['CONTRALATERAL_DEADBUG_ONE_SIDE', 'main', 3, '8 / taraf', 45, 'Belini yere bastır.'], { name: 'Deadbug', description: 'Gövde kontrolü.', regions: ['core', 'lowerBack'], difficulty: 'easy' }),
        demoExercise(['PLANK', 'main', 3, '25 sn', 45, 'Karnını sık, kalçan omuz hizasında.'], { name: 'Plank', description: 'Gövde dayanıklılığı.', regions: ['core', 'shoulders'], difficulty: 'easy' }),
        demoExercise(['JUMPING_JACK', 'conditioning', 3, '40 sn', 20, 'Ritmini koru.'], { name: 'Jumping Jack', description: 'Kısa kondisyon.', regions: ['cardio', 'fullBody'], difficulty: 'easy' }),
        demoExercise(['CHILD_POSE_STRETCH', 'cooldown', 1, '60 sn', null, 'Derin nefes.'], { name: 'Çocuk Pozu', description: 'Bel gevşetme.', regions: ['lowerBack', 'back'], difficulty: 'easy' }),
      ],
    },
    {
      title: 'Çekiş + kalça',
      focus: 'Sırt, kürek kemiği, glute',
      exercises: [
        demoExercise(['BAND_PULL_APART', 'warmup', 2, '12', null, 'Kürek kemiklerini birleştir.'], { name: 'Bantla Pull Apart', description: 'Sırt ısınması.', regions: ['back', 'shoulders'], difficulty: 'easy' }),
        demoExercise(['DUMBBELL_BENT_OVER_ROW', 'main', 3, '10', 60, 'Dirseğini kalçana çek, omzunu kaldırma.'], { name: 'Dambılla Bent Over Row', description: 'Çekiş.', regions: ['back', 'biceps'], difficulty: 'medium' }),
        demoExercise(['BANDED_LAT_PULLDOWN', 'main', 3, '12', 45, 'Dirsekleri yanlara indir.'], { name: 'Bantla Lat Pulldown', description: 'Dikey çekiş.', regions: ['back', 'biceps'], difficulty: 'easy' }),
        demoExercise(['HIP_BRIDGE', 'main', 3, '12', 45, 'Tepede kalçanı sık.'], { name: 'Kalça Köprüsü', description: 'Glute aktivasyonu.', regions: ['glutes', 'hamstrings'], difficulty: 'easy' }),
        demoExercise(['BIRD_DOG', 'main', 3, '8 / taraf', 45, 'Belin sabit kalsın.'], { name: 'Bird Dog', description: 'Gövde stabilitesi.', regions: ['core', 'lowerBack'], difficulty: 'easy' }),
        demoExercise(['WALL_ANGEL', 'cooldown', 2, '8', null, 'Kollar duvardan ayrılmasın.'], { name: 'Wall Angel', description: 'Duruş.', regions: ['back', 'shoulders'], difficulty: 'easy' }),
      ],
    },
    {
      title: 'Tüm vücut + kondisyon',
      focus: 'Kondisyon, alt vücut, taşıma',
      exercises: [
        demoExercise(['INCH_WORM', 'warmup', 2, '6', null, 'Ellerle yavaş yürü.'], { name: 'Inch Worm', description: 'Genel ısınma.', regions: ['hamstrings', 'shoulders'], difficulty: 'easy' }),
        demoExercise(['GOBLET_SQUAT', 'main', 3, '10', 60, 'Dizlerini dışarı ver.'], { name: 'Goblet Squat', description: 'Yük altında çömelme.', regions: ['quads', 'glutes', 'core'], difficulty: 'medium' }),
        demoExercise(['FARMER_CARRY', 'main', 3, '30 m', 45, 'Dik dur, omuzlar aşağıda.'], { name: 'Farmer Yürüyüşü', description: 'Taşıma.', regions: ['core', 'back'], difficulty: 'easy' }),
        demoExercise(['ROW_ERG', 'conditioning', 4, '250 m', 60, 'Önce bacak, sonra gövde, en son kol.'], { name: 'Kürek Ergometresi', description: 'Kondisyon.', regions: ['cardio', 'back'], difficulty: 'medium' }),
        demoExercise(['HIP_FLEXOR_STRETCH', 'cooldown', 1, '45 sn / taraf', null, 'Kalçanı sıkıp öne kaydır.'], { name: 'Kalça Fleksör Germe', description: 'Esneme.', regions: ['hips', 'quads'], difficulty: 'easy' }),
      ],
    },
  ],
  progression: 'Her hafta setlere 1-2 tekrar ekle; 3. haftada şınavı daha alçak bir yüzeye indir, plank 35 sn olsun.',
  cautions: ['Bel ağrısı olursa gövdeyi büken hareketleri bırak ve antrenörüne söyle.'],
};

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

  const program: Program = {
    id: 'demo_pr_irem',
    athleteId: irem.id,
    assessmentId: iremSession.id,
    createdAt: at + 60 * 60_000,
    updatedAt: at + 60 * 60_000,
    plan: DEMO_PLAN,
    preferences: { daysPerWeek: 3, sessionMinutes: 45, weeks: 4, place: 'gym', equipment: ['dumbbell', 'band', 'mat', 'machine'] },
    messages: [],
  };

  for (const doc of [irem, yunus, deniz]) await store.put('athletes', doc);
  for (const doc of [iremSession, yunusSession]) await store.put('assessments', doc);
  await store.put('programs', program);
}
