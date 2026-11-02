/**
 * İlk ders test programı (30 dk) — Kamil'in akışı, 2 Kasım 2026:
 *
 *   0–3 dk   Tanışma        spor geçmişi · ağrı / sakatlık · hedef
 *   3–13 dk  Hareket        Air Squat · Hip Hinge · Overhead Reach · Plank
 *   13–21 dk Kuvvet         Goblet Squat · Push-Up (max) · Dumbbell Row (10 / kol)
 *   21–27 dk Kondisyon      A: 500 m kürek / ski (süre) · B: 1 dk burpee (tekrar)
 *   27–30 dk Ölçüm          kilo · bel çevresi · foto (ön / yan)
 *   Sonuç                   Core · Glute · Upper back · Kondisyon (zayıf / orta / iyi) + en çok geliştirilecek nokta
 *
 * Testler HEP AYNI SPORCUYA art arda yapılır (takım sırası yok): sporcu seçilir, her adımın sonunda bir sonraki önerilir
 * (`recommend.ts`). Bu dosya yalnız tanım taşır — metinler sözlükte (`assessment.steps.<id>.*`), kurallar saf modüllerde.
 *
 * Her test "kontrol et" maddeleri taşır; madde bir HATA gözlemidir ("Diz içe kaçıyor"). Antrenör "Var" / "Yok" işaretler;
 * "Var" bir bulgudur ve bağlı olduğu alanın (`areas`) puanını düşürür. Bağlı alanı olmayan madde (topuk kalkması =
 * ayak bileği mobilitesi) puana girmez, bulgu olarak rapora yazılır ve mobilite önceliğine sayılır.
 */

/** Değerlendirmenin dört alanı (sonuç kartı). */
export type Area = 'core' | 'glute' | 'upperBack' | 'conditioning';
export const AREAS: readonly Area[] = ['core', 'glute', 'upperBack', 'conditioning'];

export type StageId = 'intro' | 'movement' | 'strength' | 'conditioning' | 'measurements';
export const STAGES: readonly { id: StageId; minutes: [number, number] }[] = [
  { id: 'intro', minutes: [0, 3] },
  { id: 'movement', minutes: [3, 13] },
  { id: 'strength', minutes: [13, 21] },
  { id: 'conditioning', minutes: [21, 27] },
  { id: 'measurements', minutes: [27, 30] },
];

export type TestId =
  | 'airSquat'
  | 'hipHinge'
  | 'overheadReach'
  | 'plank'
  | 'gobletSquat'
  | 'pushUp'
  | 'dumbbellRow'
  | 'conditioning';

export type StepId = 'intro' | TestId | 'measurements';

/** Sıra = önerilen sıra. Değerlendirme (sonuç) adım değil, akışın sonu. */
export const STEP_ORDER: readonly StepId[] = [
  'intro',
  'airSquat',
  'hipHinge',
  'overheadReach',
  'plank',
  'gobletSquat',
  'pushUp',
  'dumbbellRow',
  'conditioning',
  'measurements',
];

export type CheckDef = {
  id: string;
  /** Bulgu ("Var") hangi alanın puanını düşürür; boşsa yalnız bulgudur. */
  areas: readonly Area[];
  /** Ayak bileği / kalça hareket açıklığı bulgusu — mobilite önceliğine sayılır. */
  mobility?: boolean;
};

/** Testin sayısal sonucu: tekrar (Push-Up max, burpee), tutulan saniye (Plank) ya da süre (500 m). */
export type MetricKind = 'reps' | 'holdSeconds' | 'timeSeconds';

export type ConditioningOption = 'row500' | 'burpee';
export const CONDITIONING_OPTIONS: readonly ConditioningOption[] = ['row500', 'burpee'];

export type TimerSpec = { mode: 'countdown'; seconds: number } | { mode: 'stopwatch' };

export type TestDef = {
  id: TestId;
  stage: StageId;
  /** Hedef: "10 tekrar", "30 sn", "max", "10 / kol". */
  target: { reps?: number; seconds?: number; max?: boolean; perSide?: boolean };
  checks: readonly CheckDef[];
  metric?: MetricKind;
  timer?: TimerSpec;
  /** Katalogdaki hareket (video / tanıtım). */
  exerciseId: string;
  /** Canlı nabız paneli (saat entegrasyonu). */
  heartRate?: boolean;
};

export const TESTS: Record<TestId, TestDef> = {
  airSquat: {
    id: 'airSquat',
    stage: 'movement',
    target: { reps: 10 },
    exerciseId: 'AIR_SQUAT',
    checks: [
      { id: 'kneeValgus', areas: ['glute'] },
      { id: 'heelLift', areas: [], mobility: true },
      { id: 'lumbarCollapse', areas: ['core'] },
    ],
  },
  hipHinge: {
    id: 'hipHinge',
    stage: 'movement',
    target: { reps: 10 },
    exerciseId: 'HIP_HINGE_DRILL',
    checks: [
      { id: 'backRounding', areas: ['core'] },
      { id: 'hipsNotBack', areas: ['glute'] },
    ],
  },
  overheadReach: {
    id: 'overheadReach',
    stage: 'movement',
    target: { reps: 10 },
    exerciseId: 'OVERHEAD_REACH',
    checks: [
      { id: 'lumbarArch', areas: ['core'] },
      { id: 'shouldersForward', areas: ['upperBack'], mobility: true },
    ],
  },
  plank: {
    id: 'plank',
    stage: 'movement',
    target: { seconds: 30 },
    exerciseId: 'PLANK',
    metric: 'holdSeconds',
    timer: { mode: 'countdown', seconds: 30 },
    checks: [
      { id: 'hipSag', areas: ['core'] },
      { id: 'shaking', areas: ['core'] },
    ],
  },
  gobletSquat: {
    id: 'gobletSquat',
    stage: 'strength',
    target: { reps: 10 },
    exerciseId: 'GOBLET_SQUAT',
    checks: [
      { id: 'shallowDepth', areas: ['glute'], mobility: true },
      { id: 'balanceLoss', areas: ['core'] },
      { id: 'kneeHipMisalign', areas: ['glute'] },
    ],
  },
  pushUp: {
    id: 'pushUp',
    stage: 'strength',
    target: { max: true },
    exerciseId: 'PUSH_UP',
    metric: 'reps',
    checks: [
      { id: 'hipDrop', areas: ['core'] },
      { id: 'elbowControl', areas: ['upperBack'] },
      { id: 'neckPosition', areas: ['upperBack'] },
    ],
  },
  dumbbellRow: {
    id: 'dumbbellRow',
    stage: 'strength',
    target: { reps: 10, perSide: true },
    exerciseId: 'DUMBBELL_BENT_OVER_ROW',
    checks: [
      { id: 'shoulderShrug', areas: ['upperBack'] },
      { id: 'backInactive', areas: ['upperBack'] },
    ],
  },
  conditioning: {
    id: 'conditioning',
    stage: 'conditioning',
    target: {},
    // Seçeneğe göre değişir: `conditioningExercise`.
    exerciseId: 'BURPEE',
    heartRate: true,
    checks: [
      { id: 'heavyBreathing', areas: ['conditioning'] },
      { id: 'tempoDrop', areas: ['conditioning'] },
    ],
  },
};

export const TEST_IDS = Object.keys(TESTS) as TestId[];

export function isTestStep(step: StepId): step is TestId {
  return step in TESTS;
}

/** Kondisyon seçeneğinin ölçüsü ve kronometresi: A süre (kronometre), B 60 sn'de tekrar (geri sayım). */
export function conditioningSpec(option: ConditioningOption): { metric: MetricKind; timer: TimerSpec; exerciseId: string } {
  return option === 'row500'
    ? { metric: 'timeSeconds', timer: { mode: 'stopwatch' }, exerciseId: 'ROW_ERG' }
    : { metric: 'reps', timer: { mode: 'countdown', seconds: 60 }, exerciseId: 'BURPEE' };
}

/** Bir testin etkin tanımı (kondisyonda seçilen seçenek ölçüyü, kronometreyi ve hareketi belirler). */
export function resolvedTest(id: TestId, option: ConditioningOption | null): TestDef {
  const base = TESTS[id];
  if (id !== 'conditioning') return base;
  const spec = conditioningSpec(option ?? 'burpee');
  return { ...base, metric: spec.metric, timer: spec.timer, exerciseId: spec.exerciseId };
}

export function stageOf(step: StepId): StageId {
  if (step === 'intro') return 'intro';
  if (step === 'measurements') return 'measurements';
  return TESTS[step].stage;
}

/* ── Tanışma ─────────────────────────────────────────────────────────────── */

export type Experience = 'regular' | 'occasional' | 'none';
export const EXPERIENCES: readonly Experience[] = ['regular', 'occasional', 'none'];

export type Goal = 'fatLoss' | 'muscle' | 'conditioning';
export const GOALS: readonly Goal[] = ['fatLoss', 'muscle', 'conditioning'];

export type PainRegion = 'neck' | 'shoulder' | 'lowerBack' | 'hip' | 'knee' | 'ankle' | 'wrist' | 'other';
export const PAIN_REGIONS: readonly PainRegion[] = ['neck', 'shoulder', 'lowerBack', 'hip', 'knee', 'ankle', 'wrist', 'other'];

/** Ağrı bölgesi → dikkat edilecek testler (öneri kartı uyarısı; test atlanmaz, karar antrenörün). */
export const PAIN_CAUTION: Record<PainRegion, readonly TestId[]> = {
  neck: ['pushUp'],
  shoulder: ['overheadReach', 'pushUp', 'dumbbellRow'],
  lowerBack: ['hipHinge', 'plank', 'gobletSquat', 'dumbbellRow'],
  hip: ['airSquat', 'gobletSquat', 'hipHinge'],
  knee: ['airSquat', 'gobletSquat', 'conditioning'],
  ankle: ['airSquat', 'gobletSquat', 'conditioning'],
  wrist: ['plank', 'pushUp'],
  other: [],
};

/* ── Öncelik ─────────────────────────────────────────────────────────────── */

/** "En çok geliştirmemiz gereken nokta" seçenekleri (alanlardan geniş: üst vücut, alt vücut, mobilite). */
export type Priority = 'core' | 'glute' | 'upperBody' | 'lowerBody' | 'conditioning' | 'mobility';
export const PRIORITIES: readonly Priority[] = ['upperBody', 'core', 'glute', 'lowerBody', 'conditioning', 'mobility'];
