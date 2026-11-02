import { ArrowDownRight, ArrowUpRight, ClipboardCheck, FileText, HeartPulse, Play, Target, TriangleAlert } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { DetailCard, DetailRow, DetailSection, RowGroup } from '@/components/ui/detail-parts';
import { LevelBadge } from '@/components/ui/level-badge';
import { LineChart } from '@/components/ui/line-chart';
import { ProgressRing } from '@/components/ui/score-ring';
import { Text } from '@/components/ui/text';
import { formatAgo } from '@/lib/format/ago';
import { formatClock } from '@/lib/format/clock';
import { formatDayMonth, formatShortDate } from '@/lib/format/date';
import { formatDecimal } from '@/lib/format/quantity';
import { useColorTokens } from '@/lib/theme/tokens';

import { improved, type AnalysisView, type MetricPoint } from '../analysis';
import { levelLabel, recommendationText, stepTitle } from '../labels';
import { progressOf, type Assessment } from '../model';
import { AREAS } from '../protocol';
import { recommendNext } from '../recommend';
import { levelChange } from '../scoring';

/**
 * Analiz sekmesi (Kamil, 2 Kasım 2026: "sporcuların analiz sayfası olsun"): süren test ve sıradaki öneri, son
 * değerlendirme (dört alan + en çok geliştirilecek nokta, öncekine göre değişim), bulgular ve antrenör notları,
 * performans ölçüleri, ölçüm geçmişi ve PDF raporu.
 */
export function AnalysisTab({
  view,
  heightCm,
  onContinue,
  onStart,
  onOpenResult,
  onReport,
}: {
  view: AnalysisView;
  heightCm: number | null;
  onContinue: (session: Assessment) => void;
  onStart: () => void;
  onOpenResult: (session: Assessment) => void;
  onReport: () => void;
}) {
  const { t } = useTranslation();
  const [interactive, success, destructive, warning, muted, primaryFg] = useColorTokens([
    'interactive',
    'success',
    'destructive',
    'warning',
    'muted-foreground',
    'primary-foreground',
  ]);

  if (view.sessions.length === 0 && !view.open) {
    return (
      <DetailCard className="items-center gap-3 py-6">
        <ClipboardCheck size={28} color={interactive} strokeWidth={1.8} />
        <Text className="text-center text-[16px] font-bold text-foreground">{t('athleteDetail.analysis.empty.title')}</Text>
        <Text className="max-w-[300px] text-center text-[13px] leading-[18px] text-muted-foreground">
          {t('athleteDetail.analysis.empty.description')}
        </Text>
        <View className="mt-1 w-full max-w-[260px]">
          <Button shape="pill" glow label={t('athleteDetail.analysis.empty.action')} onPress={onStart} />
        </View>
      </DetailCard>
    );
  }

  const open = view.open;
  const next = open ? recommendNext(open) : null;
  const evaluated = view.latestEvaluated;
  const evaluation = evaluated?.evaluation ?? null;
  const previousLevels = view.previousEvaluated?.evaluation?.levels;
  const levels = evaluation?.levels ?? view.draftLevels;

  const delta = (point: MetricPoint, lowerIsBetter = false) => {
    const better = improved(point, lowerIsBetter);
    if (better === null || point.previous === null) return null;
    const Icon = point.value > point.previous ? ArrowUpRight : ArrowDownRight;
    return <Icon size={16} color={better ? success : destructive} strokeWidth={2.4} />;
  };

  const series = view.measurements.filter((item) => item.weightKg !== null);
  const lastMeasure = view.measurements[view.measurements.length - 1] ?? null;

  return (
    <View>
      {open ? (
        <DetailCard className="gap-3">
          <View className="flex-row items-center gap-3">
            <ProgressRing done={progressOf(open).done} total={progressOf(open).total} />
            <View className="flex-1">
              <Text className="text-[13px] font-semibold text-muted-foreground">{t('athleteDetail.analysis.openSession')}</Text>
              <Text className="text-[16px] font-bold text-foreground">
                {next ? recommendationText(t, next).title : t('assessment.result.title')}
              </Text>
              <Text className="text-[12px] leading-[16px] text-muted-foreground">
                {next ? recommendationText(t, next).reason : t('assessment.recommend.reason.result')}
              </Text>
            </View>
          </View>
          {next && next.caution.length > 0 ? (
            <View className="flex-row items-center gap-2 rounded-xl bg-warning/10 px-3 py-2">
              <TriangleAlert size={16} color={warning} strokeWidth={2} />
              <Text className="flex-1 text-[12px] text-foreground">
                {t('assessment.recommend.caution', { regions: next.caution.map((region) => t(`assessment.painRegions.${region}`)).join(', ') })}
              </Text>
            </View>
          ) : null}
          <Button shape="pill" glow icon={Play} label={t('athleteDetail.analysis.continue')} onPress={() => onContinue(open)} />
        </DetailCard>
      ) : null}

      {levels ? (
        <>
          <DetailSection
            title={evaluation ? t('athleteDetail.analysis.evaluation') : t('athleteDetail.analysis.draftEvaluation')}
            right={evaluated ? formatShortDate(evaluated.completedAt ?? evaluated.updatedAt) : t('athleteDetail.analysis.draft')}
          />
          <RowGroup>
            {AREAS.map((area) => {
              const change = levelChange(levels[area], previousLevels?.[area]);
              return (
                <DetailRow
                  key={area}
                  title={t(`assessment.areas.${area}`)}
                  subtitle={t(`assessment.areaHints.${area}`)}
                  right={
                    <View className="flex-row items-center gap-1.5">
                      {change === 1 ? <ArrowUpRight size={16} color={success} strokeWidth={2.4} /> : null}
                      {change === -1 ? <ArrowDownRight size={16} color={destructive} strokeWidth={2.4} /> : null}
                      <LevelBadge tone={levels[area]} label={levelLabel(t, area, levels[area])} size="md" />
                    </View>
                  }
                />
              );
            })}
          </RowGroup>
          {evaluation?.priority ? (
            <View className="mt-2.5 flex-row items-center gap-3 overflow-hidden rounded-[22px] bg-primary px-3.5 py-3">
              <Target size={22} color={primaryFg} strokeWidth={2} />
              <View className="flex-1">
                <Text className="text-[12px] font-semibold text-primary-foreground/70">{t('assessment.result.priority')}</Text>
                <Text className="text-[17px] font-extrabold text-primary-foreground">{t(`assessment.priorities.${evaluation.priority}`)}</Text>
                {evaluation.priorityNote ? <Text className="text-[13px] text-primary-foreground/80">{evaluation.priorityNote}</Text> : null}
              </View>
            </View>
          ) : null}
          {!evaluation && view.latest ? (
            <View className="mt-2.5">
              <Button shape="pill" variant="outline" label={t('athleteDetail.analysis.completeResult')} onPress={() => onOpenResult(view.latest!)} />
            </View>
          ) : null}
          {evaluation?.coachNote ? (
            <DetailCard className="mt-2.5">
              <Text className="text-[12px] font-semibold text-muted-foreground">{t('assessment.result.coachNote')}</Text>
              <Text className="mt-1 text-[14px] leading-[20px] text-foreground">{evaluation.coachNote}</Text>
            </DetailCard>
          ) : null}
        </>
      ) : null}

      {view.findings.length > 0 || view.notes.length > 0 ? (
        <>
          <DetailSection title={t('athleteDetail.analysis.findings')} right={view.findings.length || null} />
          <RowGroup>
            {view.findings.map((finding) => (
              <DetailRow
                key={`${finding.test}-${finding.check}`}
                left={<TriangleAlert size={18} color={warning} strokeWidth={2} />}
                title={t(`assessment.steps.${finding.test}.checks.${finding.check}`)}
                subtitle={stepTitle(t, finding.test)}
              />
            ))}
            {view.notes.map((note) => (
              <DetailRow
                key={`note-${note.test}`}
                left={<FileText size={18} color={muted} strokeWidth={2} />}
                title={note.note}
                subtitle={t('athleteDetail.analysis.noteOf', { test: stepTitle(t, note.test) })}
              />
            ))}
          </RowGroup>
        </>
      ) : null}

      {view.pushUp || view.plank || view.conditioning ? (
        <>
          <DetailSection title={t('athleteDetail.analysis.performance')} />
          <View className="flex-row flex-wrap gap-2">
            {view.pushUp ? (
              <MetricTile
                label={t('assessment.steps.pushUp.title')}
                value={String(view.pushUp.value)}
                unit={t('units.reps')}
                previous={view.pushUp.previous !== null ? String(view.pushUp.previous) : null}
                trend={delta(view.pushUp)}
              />
            ) : null}
            {view.plank ? (
              <MetricTile
                label={t('assessment.steps.plank.title')}
                value={String(view.plank.value)}
                unit={t('units.seconds')}
                previous={view.plank.previous !== null ? String(view.plank.previous) : null}
                trend={delta(view.plank)}
              />
            ) : null}
            {view.conditioning ? (
              <MetricTile
                label={t(`assessment.conditioning.option.${view.conditioning.option}`)}
                value={view.conditioning.option === 'row500' ? formatClock(view.conditioning.value) : String(view.conditioning.value)}
                unit={view.conditioning.option === 'row500' ? t('units.minutes') : t('units.reps')}
                previous={
                  view.conditioning.previous === null
                    ? null
                    : view.conditioning.option === 'row500'
                      ? formatClock(view.conditioning.previous)
                      : String(view.conditioning.previous)
                }
                trend={delta(view.conditioning, view.conditioning.option === 'row500')}
              />
            ) : null}
            {view.heartRate ? (
              <MetricTile
                icon={<HeartPulse size={14} color={destructive} strokeWidth={2.2} />}
                label={t('heartRate.maxShort')}
                value={String(view.heartRate.max)}
                unit={t('units.bpm')}
                previous={null}
                footnote={
                  view.heartRate.recovery60 !== null ? t('heartRate.recoveryLine', { value: view.heartRate.recovery60 }) : t('heartRate.avgLine', { value: view.heartRate.avg })
                }
              />
            ) : null}
          </View>
        </>
      ) : null}

      {lastMeasure ? (
        <>
          <DetailSection title={t('athleteDetail.analysis.measurements')} right={formatAgo(lastMeasure.at)} />
          <DetailCard className="gap-3">
            <View className="flex-row">
              <Measure label={t('assessment.measurements.weight')} value={lastMeasure.weightKg !== null ? formatDecimal(lastMeasure.weightKg, 1) : '—'} unit={t('units.kg')} />
              <Measure label={t('assessment.measurements.waist')} value={lastMeasure.waistCm !== null ? formatDecimal(lastMeasure.waistCm, 1) : '—'} unit={t('units.cm')} />
              <Measure
                label={t('common.bmi')}
                value={(() => {
                  const h = lastMeasure.heightCm ?? heightCm;
                  return lastMeasure.weightKg && h ? formatDecimal(lastMeasure.weightKg / (h / 100) ** 2, 1) : '—';
                })()}
              />
            </View>
            {series.length >= 2 ? (
              <LineChart
                points={series.map((item) => ({ x: item.at, value: item.weightKg as number }))}
                formatValue={(value) => `${formatDecimal(value, 1)} ${t('units.kg')}`}
                formatX={(x) => formatDayMonth(x)}
                emptyLabel=""
              />
            ) : null}
          </DetailCard>
        </>
      ) : null}

      {view.latest ? (
        <View className="mt-5">
          <Button shape="pill" variant="outline" icon={FileText} label={t('athleteDetail.analysis.report')} onPress={onReport} />
        </View>
      ) : null}
    </View>
  );
}

function MetricTile({
  label,
  value,
  unit,
  previous,
  trend,
  icon,
  footnote,
}: {
  label: string;
  value: string;
  unit: string;
  previous: string | null;
  trend?: ReactNode;
  icon?: ReactNode;
  footnote?: string;
}) {
  const { t } = useTranslation();
  return (
    <View className="min-w-[46%] flex-1 rounded-[18px] border border-border bg-card px-3 py-2.5">
      <View className="flex-row items-center gap-1">
        {icon}
        <Text numberOfLines={1} className="flex-1 text-[12px] font-semibold text-muted-foreground">
          {label}
        </Text>
        {trend}
      </View>
      <Text className="mt-0.5 text-foreground">
        <Text className="font-num text-[24px] font-extrabold">{value}</Text>
        <Text className="text-[12px] font-semibold text-muted-foreground"> {unit}</Text>
      </Text>
      {footnote ? (
        <Text className="text-[12px] text-muted-foreground">{footnote}</Text>
      ) : previous !== null ? (
        <Text className="text-[12px] text-muted-foreground">{t('athleteDetail.analysis.previous', { value: previous })}</Text>
      ) : null}
    </View>
  );
}

function Measure({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View className="flex-1">
      <Text className="text-[12px] font-semibold text-muted-foreground">{label}</Text>
      <Text className="text-foreground">
        <Text className="font-num text-[20px] font-extrabold">{value}</Text>
        {unit && value !== '—' ? <Text className="text-[12px] font-semibold text-muted-foreground"> {unit}</Text> : null}
      </Text>
    </View>
  );
}
