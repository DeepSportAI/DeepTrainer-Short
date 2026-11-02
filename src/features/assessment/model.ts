import {
  STEP_ORDER,
  TEST_IDS,
  type Area,
  type ConditioningOption,
  type Experience,
  type Goal,
  type PainRegion,
  type Priority,
  type StepId,
  type TestId,
} from './protocol';

/**
 * Değerlendirme oturumu (bir sporcunun bir test günü) — yerel depoda tek belge (`assessments` koleksiyonu).
 * Oturum yarıda bırakılabilir ve sonra sürdürülür; sonuç tamamlanınca `completedAt` dolar.
 */

/** Saatten okunan nabız özeti (Bluetooth nabız yayını). Örnekler kısaltılmış: [saniye, bpm]. */
export type HeartRateSummary = {
  deviceName: string | null;
  avg: number;
  max: number;
  min: number;
  /** Test bitiminden 60 sn sonra düşüş (bpm) — toparlanma. Ölçülmediyse null. */
  recovery60: number | null;
  /** Testin bittiği saniye (grafikteki kesik çizgi); toparlanma ondan sonraki 60 sn. */
  endAt: number | null;
  samples: [number, number][];
};

export type TestResult = {
  /** Madde kimliği → true = hata gözlendi ("Var"), false = yok, null/eksik = bakılmadı. */
  checks: Record<string, boolean | null>;
  metric: number | null;
  note: string;
  option?: ConditioningOption;
  heartRate?: HeartRateSummary | null;
  completedAt: number;
};

export type IntroAnswers = {
  experience: Experience | null;
  experienceNote: string;
  pain: boolean | null;
  painRegions: PainRegion[];
  painNote: string;
  goals: Goal[];
  note: string;
  completedAt: number;
};

export type Measurements = {
  weightKg: number | null;
  waistCm: number | null;
  heightCm: number | null;
  restingHr: number | null;
  photoFront: string | null;
  photoSide: string | null;
  completedAt: number;
};

export type Level = 'weak' | 'medium' | 'good';
export const LEVELS: readonly Level[] = ['weak', 'medium', 'good'];

export type Evaluation = {
  levels: Record<Area, Level | null>;
  priority: Priority | null;
  priorityNote: string;
  coachNote: string;
};

export type Assessment = {
  id: string;
  athleteId: string;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
  intro: IntroAnswers | null;
  results: Partial<Record<TestId, TestResult>>;
  measurements: Measurements | null;
  /** Antrenörün atladığı adımlar (öneri onları geçer, ilerleme saymaz). */
  skipped: StepId[];
  evaluation: Evaluation | null;
};

export function emptyAssessment(id: string, athleteId: string, now: number): Assessment {
  return {
    id,
    athleteId,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    intro: null,
    results: {},
    measurements: null,
    skipped: [],
    evaluation: null,
  };
}

export function isStepDone(assessment: Assessment, step: StepId): boolean {
  if (step === 'intro') return assessment.intro !== null;
  if (step === 'measurements') return assessment.measurements !== null;
  return Boolean(assessment.results[step]);
}

export function doneSteps(assessment: Assessment): StepId[] {
  return STEP_ORDER.filter((step) => isStepDone(assessment, step));
}

export function doneTests(assessment: Assessment): TestId[] {
  return TEST_IDS.filter((id) => Boolean(assessment.results[id]));
}

export type Progress = { done: number; total: number };

/** İlerleme: yapılan adım / bütün adımlar (atlananlar paydadan düşer). */
export function progressOf(assessment: Assessment): Progress {
  const total = STEP_ORDER.filter((step) => !assessment.skipped.includes(step) || isStepDone(assessment, step)).length;
  return { done: doneSteps(assessment).length, total };
}

/** Oturumda bir şey yapıldı mı (boş oturum "test" sayılmaz). */
export function hasActivity(assessment: Assessment): boolean {
  return doneSteps(assessment).length > 0 || assessment.evaluation !== null;
}

/** Son hareket zamanı: sonuç ya da adım kaydı. */
export function lastActivityAt(assessment: Assessment): number {
  return assessment.completedAt ?? assessment.updatedAt;
}

/** En yeniden eskiye; boş oturumlar düşer. */
export function sortedSessions(assessments: readonly Assessment[]): Assessment[] {
  return assessments.filter(hasActivity).sort((a, b) => lastActivityAt(b) - lastActivityAt(a));
}

/** Sürdürülebilir (tamamlanmamış) en yeni oturum. */
export function openSession(assessments: readonly Assessment[]): Assessment | null {
  return (
    [...assessments].filter((item) => item.completedAt === null).sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null
  );
}

/** Bulgu: "Var" işaretlenen madde. */
export type Finding = { test: TestId; check: string };

export function findingsOf(assessment: Assessment): Finding[] {
  return TEST_IDS.flatMap((test) => {
    const result = assessment.results[test];
    if (!result) return [];
    return Object.entries(result.checks)
      .filter(([, value]) => value === true)
      .map(([check]) => ({ test, check }));
  });
}

export function hasFinding(assessment: Assessment, test: TestId, check: string): boolean {
  return assessment.results[test]?.checks[check] === true;
}

/** Sporcu kartının özeti (ana sayfa): son test tarihi, yapılan testler, açık oturum, son değerlendirme. */
export type AthleteAssessmentSummary = {
  lastTestAt: number | null;
  sessionCount: number;
  latest: Assessment | null;
  open: Assessment | null;
  latestEvaluated: Assessment | null;
};

export function summarizeAthlete(assessments: readonly Assessment[]): AthleteAssessmentSummary {
  const sessions = sortedSessions(assessments);
  const latest = sessions[0] ?? null;
  return {
    lastTestAt: latest ? lastActivityAt(latest) : null,
    sessionCount: sessions.length,
    latest,
    open: openSession(assessments.filter(hasActivity)) ?? openSession(assessments),
    latestEvaluated: sessions.find((item) => item.evaluation !== null) ?? null,
  };
}
