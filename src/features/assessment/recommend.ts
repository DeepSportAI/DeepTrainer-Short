import { hasFinding, isStepDone, type Assessment } from './model';
import {
  PAIN_CAUTION,
  STEP_ORDER,
  type ConditioningOption,
  type PainRegion,
  type StepId,
  type TestId,
} from './protocol';

/**
 * "Şu testi yap" önerisi (Kamil, 2 Kasım 2026: testler aynı sporcuya art arda yapılır; her testin sonunda bir sonraki
 * önerilsin). Sıradaki adım protokol sırasındaki ilk yapılmamış, atlanmamış adımdır; NEDENİ ise o ana kadarki
 * bulgulardan gelir — ör. Air Squat'ta diz içe kaçtıysa Goblet Squat'ta yük altında diz-kalça uyumuna bakılır.
 *
 * Saf modül: metin anahtarı (`assessment.recommend.reason.<key>`) ve dikkat listesi döner; ekran çevirir.
 */

export type ReasonKey =
  | 'start'
  | 'default'
  | 'hingeAfterSquatBack'
  | 'reachAfterHingeBack'
  | 'plankAfterCoreFlags'
  | 'gobletAfterKneeValgus'
  | 'gobletAfterHeelLift'
  | 'pushUpAfterPlankSag'
  | 'rowAfterShouldersForward'
  | 'conditioningLowImpact'
  | 'measurements';

export type Recommendation = {
  step: StepId;
  reason: ReasonKey;
  /** Tanışmada bildirilen ağrı bu testi ilgilendiriyorsa bölgeler (uyarı satırı). */
  caution: PainRegion[];
  /** Kondisyon adımında önerilen seçenek. */
  option?: ConditioningOption;
};

function reasonFor(step: StepId, a: Assessment): ReasonKey {
  switch (step) {
    case 'intro':
      return 'start';
    case 'hipHinge':
      return hasFinding(a, 'airSquat', 'lumbarCollapse') ? 'hingeAfterSquatBack' : 'default';
    case 'overheadReach':
      return hasFinding(a, 'hipHinge', 'backRounding') ? 'reachAfterHingeBack' : 'default';
    case 'plank':
      return hasFinding(a, 'airSquat', 'lumbarCollapse') ||
        hasFinding(a, 'hipHinge', 'backRounding') ||
        hasFinding(a, 'overheadReach', 'lumbarArch')
        ? 'plankAfterCoreFlags'
        : 'default';
    case 'gobletSquat':
      if (hasFinding(a, 'airSquat', 'kneeValgus')) return 'gobletAfterKneeValgus';
      return hasFinding(a, 'airSquat', 'heelLift') ? 'gobletAfterHeelLift' : 'default';
    case 'pushUp':
      return hasFinding(a, 'plank', 'hipSag') ? 'pushUpAfterPlankSag' : 'default';
    case 'dumbbellRow':
      return hasFinding(a, 'overheadReach', 'shouldersForward') ? 'rowAfterShouldersForward' : 'default';
    case 'conditioning':
      return lowImpactNeeded(a) ? 'conditioningLowImpact' : 'default';
    case 'measurements':
      return 'measurements';
    default:
      return 'default';
  }
}

/** Diz / ayak bileği / bel ağrısında sıçramalı burpee yerine kürek önerilir. */
function lowImpactNeeded(a: Assessment): boolean {
  const regions = a.intro?.pain ? a.intro.painRegions : [];
  return regions.some((region) => region === 'knee' || region === 'ankle' || region === 'lowerBack');
}

export function suggestedConditioningOption(a: Assessment): ConditioningOption {
  return lowImpactNeeded(a) ? 'row500' : 'burpee';
}

export function cautionFor(step: StepId, a: Assessment): PainRegion[] {
  if (step === 'intro' || step === 'measurements' || !a.intro?.pain) return [];
  return a.intro.painRegions.filter((region) => PAIN_CAUTION[region].includes(step as TestId));
}

/** Sıradaki önerilen adım; hepsi bitti ya da atlandıysa null (sıra sonuçta). `after` verilirse ondan sonrakiler önce. */
export function recommendNext(a: Assessment, after?: StepId): Recommendation | null {
  const pending = STEP_ORDER.filter((step) => !isStepDone(a, step) && !a.skipped.includes(step));
  if (pending.length === 0) return null;
  const from = after ? STEP_ORDER.indexOf(after) : -1;
  const step = pending.find((item) => STEP_ORDER.indexOf(item) > from) ?? pending[0];
  return {
    step,
    reason: reasonFor(step, a),
    caution: cautionFor(step, a),
    option: step === 'conditioning' ? suggestedConditioningOption(a) : undefined,
  };
}

/** Yeniden test: önceki tamamlanan oturumda bulgu çıkan testler ("geçen sefer bulgu") — oturum listesinde işaret. */
export function flaggedLastTime(previous: Assessment | null): Set<TestId> {
  const set = new Set<TestId>();
  if (!previous) return set;
  for (const [test, result] of Object.entries(previous.results)) {
    if (result && Object.values(result.checks).some((value) => value === true)) set.add(test as TestId);
  }
  return set;
}
