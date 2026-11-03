import type { Gender } from './scoring';

/**
 * Aralık ölçekleri — Tanita raporlarındaki gibi "nerede duruyorum" çubukları (uygulama ve PDF aynı ölçeği çizer).
 * Performans normları puanlamayla AYNI eşikler (`scoring.ts` buradan okur); vücut ölçüleri genel kabul gören
 * sınırlar: VKİ (DSÖ), bel çevresi risk eşikleri (kadın 80 / 88, erkek 94 / 102 cm), dinlenik nabız.
 */
export type BandTone = 'bad' | 'warn' | 'good';

export type Band = { to: number; tone: BandTone; key: string };

export type Scale = {
  min: number;
  max: number;
  /** Soldan sağa; her bant bir öncekinin bittiği yerden `to`'ya kadar. */
  bands: Band[];
};

export const NORMS = {
  plank: { fair: 20, good: 30 },
  pushUp: { female: { fair: 5, good: 15 }, male: { fair: 10, good: 20 } },
  burpee: { fair: 10, good: 18 },
  /** 500 m: iyi eşiği (sn) ve sınır payı. */
  row500: { female: 135, male: 120, margin: 30 },
  recovery: { fair: 12, good: 20 },
} as const;

export function bmiScale(): Scale {
  return {
    min: 15,
    max: 35,
    bands: [
      { to: 18.5, tone: 'warn', key: 'under' },
      { to: 25, tone: 'good', key: 'normal' },
      { to: 30, tone: 'warn', key: 'over' },
      { to: 35, tone: 'bad', key: 'obese' },
    ],
  };
}

export function waistScale(gender: Gender): Scale {
  const [ok, high] = gender === 'male' ? [94, 102] : [80, 88];
  return {
    min: ok - 25,
    max: high + 20,
    bands: [
      { to: ok, tone: 'good', key: 'normal' },
      { to: high, tone: 'warn', key: 'increased' },
      { to: high + 20, tone: 'bad', key: 'high' },
    ],
  };
}

export function restingHrScale(): Scale {
  return {
    min: 45,
    max: 100,
    bands: [
      { to: 60, tone: 'good', key: 'athletic' },
      { to: 80, tone: 'good', key: 'normal' },
      { to: 100, tone: 'warn', key: 'high' },
    ],
  };
}

function higherIsBetter(fair: number, good: number, max: number): Scale {
  return {
    min: 0,
    max,
    bands: [
      { to: fair, tone: 'bad', key: 'low' },
      { to: good, tone: 'warn', key: 'fair' },
      { to: max, tone: 'good', key: 'good' },
    ],
  };
}

export function pushUpScale(gender: Gender): Scale {
  const n = gender === 'female' ? NORMS.pushUp.female : NORMS.pushUp.male;
  return higherIsBetter(n.fair, n.good, n.good * 2);
}

export function plankScale(): Scale {
  return higherIsBetter(NORMS.plank.fair, NORMS.plank.good, 90);
}

export function burpeeScale(): Scale {
  return higherIsBetter(NORMS.burpee.fair, NORMS.burpee.good, 30);
}

export function recoveryScale(): Scale {
  return higherIsBetter(NORMS.recovery.fair, NORMS.recovery.good, 40);
}

/** 500 m'de süre kısaldıkça iyi: ölçek soldan "iyi" başlar. */
export function row500Scale(gender: Gender): Scale {
  const good = gender === 'female' ? NORMS.row500.female : NORMS.row500.male;
  return {
    min: good - 30,
    max: good + NORMS.row500.margin + 60,
    bands: [
      { to: good, tone: 'good', key: 'good' },
      { to: good + NORMS.row500.margin, tone: 'warn', key: 'fair' },
      { to: good + NORMS.row500.margin + 60, tone: 'bad', key: 'low' },
    ],
  };
}

/** Değerin ölçekteki yeri (0..1, kenarlara kırpılır) ve düştüğü bant. */
export function placeOnScale(scale: Scale, value: number): { ratio: number; band: Band } {
  const ratio = Math.min(1, Math.max(0, (value - scale.min) / (scale.max - scale.min)));
  const band = scale.bands.find((b) => value < b.to) ?? scale.bands[scale.bands.length - 1];
  return { ratio, band };
}

/** Bantların ölçekteki genişlikleri (0..1), çizim için. */
export function bandWidths(scale: Scale): { band: Band; from: number; width: number }[] {
  let from = scale.min;
  return scale.bands.map((band) => {
    const start = (from - scale.min) / (scale.max - scale.min);
    const width = (Math.min(band.to, scale.max) - from) / (scale.max - scale.min);
    from = band.to;
    return { band, from: start, width };
  });
}
