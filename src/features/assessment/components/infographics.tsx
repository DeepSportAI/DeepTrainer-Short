import type { TFunction } from 'i18next';
import { ArrowDownRight, ArrowRight, ArrowUpRight, CheckCircle2, TriangleAlert } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { RadarChart, ScaleBar, type ScaleSegment } from '@/components/ui/charts';
import { DetailCard } from '@/components/ui/detail-parts';
import { LevelBadge } from '@/components/ui/level-badge';
import { Text } from '@/components/ui/text';
import { formatClock } from '@/lib/format/clock';
import { formatDecimal } from '@/lib/format/quantity';
import { useColorTokens } from '@/lib/theme/tokens';

import {
  bandWidths,
  bmiScale,
  burpeeScale,
  placeOnScale,
  plankScale,
  pushUpScale,
  recoveryScale,
  restingHrScale,
  row500Scale,
  waistScale,
  type Scale,
} from '../bands';
import { levelScore, type CompareMetricId, type SessionComparison } from '../compare';
import { levelLabel, stepTitle } from '../labels';
import type { Assessment, Level } from '../model';
import { AREAS, type Area } from '../protocol';
import type { Gender } from '../scoring';

export function segmentsOf(t: TFunction, scale: Scale): ScaleSegment[] {
  return bandWidths(scale).map(({ band, from, width }) => ({ from, width, tone: band.tone, label: t(`bands.${band.key}`) }));
}

/** Dört alan radarı: güncel (dolu) ve önceki değerlendirme (kesik). */
export function AreasRadar({ current, previous }: { current: Record<Area, Level | null>; previous?: Record<Area, Level | null> | null }) {
  const { t } = useTranslation();
  const labels = AREAS.map((area) => t(`assessment.areasShort.${area}`));
  return (
    <View className="items-center">
      <RadarChart
        labels={labels}
        size={250}
        accessibilityLabel={AREAS.map((area) => `${t(`assessment.areasShort.${area}`)} ${levelLabel(t, area, current[area])}`).join(', ')}
        series={[
          ...(previous ? [{ kind: 'previous' as const, values: AREAS.map((area) => levelScore(previous[area])) }] : []),
          { kind: 'current' as const, values: AREAS.map((area) => levelScore(current[area])) },
        ]}
      />
      {previous ? (
        <View className="flex-row items-center gap-4">
          <LegendLine dashed label={t('compare.previous')} />
          <LegendLine label={t('compare.current')} />
        </View>
      ) : null}
    </View>
  );
}

function LegendLine({ label, dashed = false }: { label: string; dashed?: boolean }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className={`h-[3px] w-5 rounded-full ${dashed ? 'bg-muted-foreground opacity-60' : 'bg-data'}`} />
      <Text className="text-[12px] text-muted-foreground">{label}</Text>
    </View>
  );
}

/* ── Ölçek satırı ────────────────────────────────────────────────────────── */

function ScaleRow({ label, value, unit, scale, current, previous, note }: { label: string; value: string; unit: string; scale: Scale; current: number; previous?: number | null; note?: string }) {
  const { t } = useTranslation();
  const place = placeOnScale(scale, current);
  const prev = typeof previous === 'number' ? placeOnScale(scale, previous).ratio : null;
  return (
    <View className="gap-1.5">
      <View className="flex-row items-baseline justify-between gap-2">
        <Text className="text-[14px] font-semibold text-foreground">{label}</Text>
        <Text className="text-foreground">
          <Text className="font-num text-[20px] font-extrabold">{value}</Text>
          {unit ? <Text className="text-[12px] font-semibold text-muted-foreground"> {unit}</Text> : null}
          <Text className={`text-[12px] font-bold ${place.band.tone === 'good' ? 'text-success' : place.band.tone === 'warn' ? 'text-warning' : 'text-destructive'}`}>
            {'  '}
            {t(`bands.${place.band.key}`)}
          </Text>
        </Text>
      </View>
      <ScaleBar segments={segmentsOf(t, scale)} marker={place.ratio} previous={prev} accessibilityLabel={`${label} ${value} ${unit}, ${t(`bands.${place.band.key}`)}`} />
      {note ? <Text className="text-[11.5px] text-muted-foreground">{note}</Text> : null}
    </View>
  );
}

/** Vücut ölçüleri (Tanita tarzı): VKİ, bel çevresi, dinlenik nabız — aralık çubuğunda, önceki değer boş daireyle. */
export function BodyPanel({ latest, previous, gender, heightCm }: { latest: Assessment; previous: Assessment | null; gender: Gender; heightCm: number | null }) {
  const { t } = useTranslation();
  const m = latest.measurements;
  const p = previous?.measurements ?? null;
  if (!m) return null;
  const h = m.heightCm ?? heightCm;
  const bmi = m.weightKg && h ? m.weightKg / (h / 100) ** 2 : null;
  const prevBmi = p?.weightKg && (p.heightCm ?? h) ? p.weightKg / (((p.heightCm ?? h) as number) / 100) ** 2 : null;
  const rows = [
    bmi !== null ? <ScaleRow key="bmi" label={t('common.bmi')} value={formatDecimal(bmi, 1)} unit="" scale={bmiScale()} current={bmi} previous={prevBmi} note={m.weightKg ? t('compare.weightNote', { value: formatDecimal(m.weightKg, 1) }) : undefined} /> : null,
    m.waistCm !== null ? <ScaleRow key="waist" label={t('assessment.measurements.waist')} value={formatDecimal(m.waistCm, 1)} unit={t('units.cm')} scale={waistScale(gender)} current={m.waistCm} previous={p?.waistCm ?? null} /> : null,
    m.restingHr !== null ? <ScaleRow key="hr" label={t('assessment.measurements.restingHr')} value={String(m.restingHr)} unit={t('units.bpm')} scale={restingHrScale()} current={m.restingHr} previous={p?.restingHr ?? null} /> : null,
  ].filter(Boolean);
  if (rows.length === 0) return null;
  return <DetailCard className="gap-4">{rows}</DetailCard>;
}

/** Performans ölçüleri normlara göre (düşük / sınır / iyi). */
export function PerformancePanel({ latest, previous, gender }: { latest: Assessment; previous: Assessment | null; gender: Gender }) {
  const { t } = useTranslation();
  const r = latest.results;
  const pr = previous?.results;
  const rows = [];
  if (typeof r.pushUp?.metric === 'number')
    rows.push(<ScaleRow key="pu" label={t('assessment.steps.pushUp.title')} value={String(r.pushUp.metric)} unit={t('units.reps')} scale={pushUpScale(gender)} current={r.pushUp.metric} previous={pr?.pushUp?.metric ?? null} />);
  if (typeof r.plank?.metric === 'number')
    rows.push(<ScaleRow key="pl" label={t('assessment.steps.plank.title')} value={String(r.plank.metric)} unit={t('units.seconds')} scale={plankScale()} current={r.plank.metric} previous={pr?.plank?.metric ?? null} />);
  const c = r.conditioning;
  if (c && typeof c.metric === 'number') {
    const prev = pr?.conditioning?.option === c.option ? (pr?.conditioning?.metric ?? null) : null;
    rows.push(
      c.option === 'row500' ? (
        <ScaleRow key="c" label={t('assessment.conditioning.option.row500')} value={formatClock(c.metric)} unit={t('units.minutes')} scale={row500Scale(gender)} current={c.metric} previous={prev} />
      ) : (
        <ScaleRow key="c" label={t('assessment.conditioning.option.burpee')} value={String(c.metric)} unit={t('units.reps')} scale={burpeeScale()} current={c.metric} previous={prev} />
      ),
    );
  }
  if (typeof c?.heartRate?.recovery60 === 'number')
    rows.push(<ScaleRow key="rc" label={t('heartRate.recovery')} value={String(c.heartRate.recovery60)} unit={t('units.bpm')} scale={recoveryScale()} current={c.heartRate.recovery60} previous={pr?.conditioning?.heartRate?.recovery60 ?? null} />);
  if (rows.length === 0) return null;
  return <DetailCard className="gap-4">{rows}</DetailCard>;
}

/* ── Önceki / sonraki ────────────────────────────────────────────────────── */

const METRIC_UNIT: Record<CompareMetricId, 'reps' | 'seconds' | 'clock' | 'bpm' | 'kg' | 'cm'> = {
  pushUp: 'reps',
  plank: 'seconds',
  burpee: 'reps',
  row500: 'clock',
  recovery: 'bpm',
  weight: 'kg',
  waist: 'cm',
  restingHr: 'bpm',
};

export function formatCompareValue(t: TFunction, id: CompareMetricId, value: number): string {
  const unit = METRIC_UNIT[id];
  if (unit === 'clock') return formatClock(value);
  if (unit === 'kg' || unit === 'cm') return `${formatDecimal(value, 1)} ${t(`units.${unit}`)}`;
  return `${Math.round(value)} ${t(`units.${unit}`)}`;
}

/** Önceki test → bu test: alan seviyeleri, ölçü farkları, çözülen / yeni bulgular. */
export function ComparisonCard({ comparison }: { comparison: SessionComparison }) {
  const { t } = useTranslation();
  const [success, destructive, muted, warning] = useColorTokens(['success', 'destructive', 'muted-foreground', 'warning']);
  const arrow = (improved: boolean | null, up: boolean) => {
    const Icon = improved === null ? ArrowRight : up ? ArrowUpRight : ArrowDownRight;
    return <Icon size={16} color={improved === null ? muted : improved ? success : destructive} strokeWidth={2.4} />;
  };

  return (
    <DetailCard className="gap-3">
      <Text className="text-[13px] text-muted-foreground">{t('compare.span', { count: comparison.days })}</Text>

      <View className="gap-2">
        {comparison.levels
          .filter((l) => l.before || l.after)
          .map((l) => (
            <View key={l.area} className="flex-row items-center gap-2">
              <Text className="w-[92px] text-[13px] font-semibold text-foreground">{t(`assessment.areasShort.${l.area}`)}</Text>
              <LevelBadge tone={l.before} label={levelLabel(t, l.area, l.before)} />
              {arrow(l.change === null || l.change === 0 ? null : l.change > 0, (l.change ?? 0) >= 0)}
              <LevelBadge tone={l.after} label={levelLabel(t, l.area, l.after)} size="md" />
            </View>
          ))}
      </View>

      {comparison.metrics.length > 0 ? (
        <View className="gap-1.5 border-t border-border pt-3">
          {comparison.metrics.map((m) => (
            <View key={m.id} className="flex-row items-center gap-2">
              <Text className="flex-1 text-[13px] text-foreground">{t(`compare.metric.${m.id}`)}</Text>
              <Text className="text-[13px] text-muted-foreground">{formatCompareValue(t, m.id, m.before)}</Text>
              {arrow(m.improved, m.delta > 0)}
              <Text className="min-w-[74px] text-right font-num text-[14px] font-extrabold text-foreground">{formatCompareValue(t, m.id, m.after)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {comparison.resolved.length + comparison.added.length > 0 ? (
        <View className="gap-1.5 border-t border-border pt-3">
          {comparison.resolved.map((f) => (
            <View key={`r${f.test}${f.check}`} className="flex-row items-start gap-2">
              <CheckCircle2 size={15} color={success} strokeWidth={2.2} />
              <Text className="flex-1 text-[13px] text-foreground">
                <Text className="font-semibold text-success">{t('compare.resolved')}</Text> · {t(`assessment.steps.${f.test}.checks.${f.check}`)} ({stepTitle(t, f.test)})
              </Text>
            </View>
          ))}
          {comparison.added.map((f) => (
            <View key={`a${f.test}${f.check}`} className="flex-row items-start gap-2">
              <TriangleAlert size={15} color={warning} strokeWidth={2.2} />
              <Text className="flex-1 text-[13px] text-foreground">
                <Text className="font-semibold text-warning">{t('compare.added')}</Text> · {t(`assessment.steps.${f.test}.checks.${f.check}`)} ({stepTitle(t, f.test)})
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </DetailCard>
  );
}
