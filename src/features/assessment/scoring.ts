import { findingsOf, type Assessment, type Level } from './model';
import { AREAS, TESTS, TEST_IDS, type Area, type Priority, type TestId } from './protocol';

/**
 * Sonuç önerisi — kontrol maddeleri ve ölçülerden alan başına seviye ÖNERİR; karar antrenörün (sonuç ekranında
 * değiştirir). Kural bilerek basit ve açık: alan için bakılan her madde 1 birim, "Var" 1 hata; ölçü normun altındaysa
 * 1, sınırdaysa 0,5 hata. Hata oranı < 0,2 → iyi, < 0,5 → orta, aksi → zayıf. Hiç bakılmamış alanın seviyesi yok.
 *
 * Normlar (genel yetişkin, başlangıç seviyesi; kadın / erkek):
 *   Plank tutuşu   ≥ 30 sn iyi · 20–29 sınır · < 20 düşük
 *   Push-Up (max)  K ≥ 15 · E ≥ 20 iyi;  K 5–14 · E 10–19 sınır
 *   1 dk burpee    ≥ 18 iyi · 10–17 sınır · < 10 düşük
 *   500 m kürek    K ≤ 2:15 · E ≤ 2:00 iyi;  +30 sn'ye kadar sınır
 *   Toparlanma     60 sn'de ≥ 20 bpm iyi · 12–19 sınır · < 12 düşük (saatten nabız varsa)
 * Push-Up sayısı alan puanına değil "üst vücut" önceliğine sayılır (itiş gücü; Upper back çekiş ve duruştur).
 */

export type Gender = 'female' | 'male' | null;

/** 0 = norm iyi, 0,5 = sınır, 1 = düşük. */
export type MetricGrade = 0 | 0.5 | 1;

export function gradePlank(seconds: number): MetricGrade {
  return seconds >= 30 ? 0 : seconds >= 20 ? 0.5 : 1;
}

export function gradePushUps(reps: number, gender: Gender): MetricGrade {
  const [good, fair] = gender === 'female' ? [15, 5] : [20, 10];
  return reps >= good ? 0 : reps >= fair ? 0.5 : 1;
}

export function gradeBurpees(reps: number): MetricGrade {
  return reps >= 18 ? 0 : reps >= 10 ? 0.5 : 1;
}

export function gradeRow500(seconds: number, gender: Gender): MetricGrade {
  const good = gender === 'female' ? 135 : 120;
  return seconds <= good ? 0 : seconds <= good + 30 ? 0.5 : 1;
}

export function gradeRecovery(drop: number): MetricGrade {
  return drop >= 20 ? 0 : drop >= 12 ? 0.5 : 1;
}

export type AreaScore = {
  area: Area;
  level: Level | null;
  /** Bakılan birim sayısı ve toplam hata (açıklama satırı için). */
  observed: number;
  faults: number;
};

type Tally = { observed: number; faults: number };

function levelFor(tally: Tally): Level | null {
  if (tally.observed === 0) return null;
  const ratio = tally.faults / tally.observed;
  return ratio < 0.2 ? 'good' : ratio < 0.5 ? 'medium' : 'weak';
}

export function scoreAreas(assessment: Assessment, gender: Gender): Record<Area, AreaScore> {
  const tally: Record<Area, Tally> = {
    core: { observed: 0, faults: 0 },
    glute: { observed: 0, faults: 0 },
    upperBack: { observed: 0, faults: 0 },
    conditioning: { observed: 0, faults: 0 },
  };

  for (const id of TEST_IDS) {
    const result = assessment.results[id];
    if (!result) continue;
    for (const check of TESTS[id].checks) {
      const value = result.checks[check.id];
      if (value === null || value === undefined) continue;
      for (const area of check.areas) {
        tally[area].observed += 1;
        if (value) tally[area].faults += 1;
      }
    }
  }

  const plank = assessment.results.plank?.metric;
  if (typeof plank === 'number') {
    tally.core.observed += 1;
    tally.core.faults += gradePlank(plank);
  }

  const conditioning = assessment.results.conditioning;
  if (conditioning && typeof conditioning.metric === 'number') {
    tally.conditioning.observed += 1;
    tally.conditioning.faults +=
      conditioning.option === 'row500' ? gradeRow500(conditioning.metric, gender) : gradeBurpees(conditioning.metric);
  }
  const recovery = conditioning?.heartRate?.recovery60;
  if (typeof recovery === 'number') {
    tally.conditioning.observed += 1;
    tally.conditioning.faults += gradeRecovery(recovery);
  }

  return Object.fromEntries(
    AREAS.map((area) => [area, { area, level: levelFor(tally[area]), ...tally[area] }]),
  ) as Record<Area, AreaScore>;
}

export function suggestedLevels(assessment: Assessment, gender: Gender): Record<Area, Level | null> {
  const scores = scoreAreas(assessment, gender);
  return Object.fromEntries(AREAS.map((area) => [area, scores[area].level])) as Record<Area, Level | null>;
}

const LEVEL_RANK: Record<Level, number> = { weak: 0, medium: 1, good: 2 };

/** Alan → öncelik seçeneği. Upper back (çekiş / duruş) "üst vücut" önceliğine gider. */
const AREA_PRIORITY: Record<Area, Priority> = {
  core: 'core',
  glute: 'glute',
  upperBack: 'upperBody',
  conditioning: 'conditioning',
};

/**
 * "En çok geliştirmemiz gereken nokta" önerisi: en düşük seviyeli alan (eşitlikte alan sırası). Push-Up düşükse ve
 * üst vücut alanı iyi değilse üst vücut öne geçer; hiçbir alan zayıf değilken iki ve daha çok mobilite bulgusu varsa
 * mobilite. Değerlendirilmiş alan yoksa öneri yok.
 */
export function suggestPriority(
  levels: Record<Area, Level | null>,
  assessment: Assessment,
  gender: Gender,
): Priority | null {
  const rated = AREAS.filter((area) => levels[area] !== null);
  if (rated.length === 0) return null;

  const pushUps = assessment.results.pushUp?.metric;
  const pushGrade = typeof pushUps === 'number' ? gradePushUps(pushUps, gender) : null;
  if (pushGrade === 1 && levels.upperBack !== 'good') return 'upperBody';

  const weakest = rated.reduce((best, area) =>
    LEVEL_RANK[levels[area] as Level] < LEVEL_RANK[levels[best] as Level] ? area : best,
  );
  const anyWeak = rated.some((area) => levels[area] === 'weak');
  if (!anyWeak && mobilityFindings(assessment) >= 2) return 'mobility';
  if (levels[weakest] === 'good') return pushGrade && pushGrade > 0 ? 'upperBody' : null;
  return AREA_PRIORITY[weakest];
}

export function mobilityFindings(assessment: Assessment): number {
  return findingsOf(assessment).filter(({ test, check }) =>
    TESTS[test].checks.some((item) => item.id === check && item.mobility),
  ).length;
}

/** Test başına bulgu sayısı ve bakılan madde sayısı (sporcu kartı, analiz). */
export function testFaults(assessment: Assessment, test: TestId): { faults: number; observed: number } {
  const result = assessment.results[test];
  if (!result) return { faults: 0, observed: 0 };
  const values = TESTS[test].checks.map((check) => result.checks[check.id]).filter((value) => value !== null && value !== undefined);
  return { faults: values.filter(Boolean).length, observed: values.length };
}

/** Önceki değerlendirmeye göre değişim: +1 iyileşti, −1 geriledi, 0 aynı, null karşılaştırılamaz. */
export function levelChange(current: Level | null, previous: Level | null | undefined): -1 | 0 | 1 | null {
  if (!current || !previous) return null;
  const diff = LEVEL_RANK[current] - LEVEL_RANK[previous];
  return diff > 0 ? 1 : diff < 0 ? -1 : 0;
}
