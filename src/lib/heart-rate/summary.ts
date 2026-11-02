/**
 * Nabız kaydının özeti — saf (kronometre ve testten bağımsız). Örnekler [saniye, bpm]; 0 = kayıt başı.
 * Toparlanma (HRR60): test bitişindeki nabız ile 60 sn sonraki nabız farkı; ikisi de 5 sn'lik ortalama (tek
 * okumanın oynaklığı sonucu bozmasın).
 */
export type Sample = [seconds: number, bpm: number];

function averageAround(samples: readonly Sample[], at: number, window = 5): number | null {
  const near = samples.filter(([t]) => t >= at - window && t <= at);
  if (near.length === 0) return null;
  return near.reduce((sum, [, bpm]) => sum + bpm, 0) / near.length;
}

export type HeartRateStats = { avg: number; max: number; min: number; recovery60: number | null };

/** `endAt`: testin bittiği saniye. Toparlanma ancak bitişten en az 60 sn sonrası kaydedildiyse hesaplanır. */
export function summarize(samples: readonly Sample[], endAt: number | null): HeartRateStats | null {
  const during = endAt === null ? samples : samples.filter(([t]) => t <= endAt);
  if (during.length === 0) return null;
  const values = during.map(([, bpm]) => bpm);
  const peak = endAt === null ? null : averageAround(samples, endAt);
  const after = endAt === null ? null : averageAround(samples, endAt + 60);
  const last = samples[samples.length - 1]?.[0] ?? 0;
  return {
    avg: Math.round(values.reduce((sum, bpm) => sum + bpm, 0) / values.length),
    max: Math.max(...values),
    min: Math.min(...values),
    recovery60: peak !== null && after !== null && endAt !== null && last >= endAt + 60 ? Math.round(peak - after) : null,
  };
}

/** Grafik ve kayıt için seyreltme: en çok `limit` nokta (eşit aralıkla). */
export function downsample(samples: readonly Sample[], limit = 90): Sample[] {
  if (samples.length <= limit) return [...samples];
  const step = samples.length / limit;
  return Array.from({ length: limit }, (_, index) => samples[Math.floor(index * step)]);
}
