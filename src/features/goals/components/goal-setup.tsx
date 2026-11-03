import { Check, Minus, Plus } from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { FormScreen } from '@/components/ui/form-screen';
import { Text } from '@/components/ui/text';
import { lastActivityAt, type Assessment } from '@/features/assessment/model';
import type { Gender } from '@/features/assessment/scoring';
import { formatDayMonth } from '@/lib/format/date';
import { useColorTokens } from '@/lib/theme/tokens';

import { formatGoalDelta, formatGoalValue } from '../format';
import { GOAL_METRICS, GOAL_METRIC_IDS, isLevelMetric, type GoalMetricId } from '../metrics';
import { WEEK, suggestGoals, type GoalSuggestion } from '../model';
import type { GoalDraft } from '../repository';

const WEEK_OPTIONS = [4, 6, 8, 12] as const;
const CHECK_OPTIONS = [7, 14] as const;

const STEP: Record<string, number> = { kg: 0.5, cm: 0.5, reps: 1, seconds: 5, clock: 5, bpm: 1, level: 1 };

type Row = GoalSuggestion & { on: boolean; suggested: boolean };

/**
 * Hedef koyma (yolculuğun 1. ve 2. adımı): süre ve ara kontrol sıklığı seçilir; değerlendirmeden önerilen hedefler
 * açık gelir, hedef −/+ ile ayarlanır, satır gereken haftalık hızı söyler. Değerlendirmede ölçüsü olan diğer
 * ölçüler de eklenebilir. Başlangıç değeri ve tarihi değerlendirmenin kendisi.
 */
export function GoalSetup({
  assessment,
  gender,
  heightCm,
  athleteId,
  saving,
  onSave,
  onBack,
  subtitle,
}: {
  assessment: Assessment;
  gender: Gender;
  heightCm: number | null;
  athleteId: string;
  saving: boolean;
  onSave: (drafts: GoalDraft[]) => void;
  onBack: () => void;
  subtitle: string;
}) {
  const { t } = useTranslation();
  const [weeks, setWeeks] = useState<(typeof WEEK_OPTIONS)[number]>(8);
  const [checkEvery, setCheckEvery] = useState<(typeof CHECK_OPTIONS)[number]>(14);
  const suggestions = useMemo(() => suggestGoals(assessment, gender, heightCm, weeks), [assessment, gender, heightCm, weeks]);

  // Kullanıcının değişiklikleri (aç/kapa, hedef) ölçü kimliğine göre; süre değişince öneri yeniden hesaplanır.
  const [overrides, setOverrides] = useState<Record<string, { on?: boolean; target?: number }>>({});
  const others: GoalSuggestion[] = GOAL_METRIC_IDS.filter((id) => !suggestions.some((s) => s.metric === id)).flatMap((id): GoalSuggestion[] => {
    const metric = GOAL_METRICS[id];
    const start = metric.read(assessment);
    if (start === null) return [];
    const step = metric.weeklyRate * weeks * (metric.better === 'higher' ? 1 : -1);
    const target = isLevelMetric(id) ? Math.min(2, start + 1) : start + Math.round(step / STEP[metric.unit]) * STEP[metric.unit];
    return target === start ? [] : [{ metric: id, startValue: start, target, reason: 'priority' }];
  });

  const rows: Row[] = [
    ...suggestions.map((s) => ({ ...s, suggested: true, on: overrides[s.metric]?.on ?? true, target: overrides[s.metric]?.target ?? s.target })),
    ...others.map((s) => ({ ...s, suggested: false, on: overrides[s.metric]?.on ?? false, target: overrides[s.metric]?.target ?? s.target })),
  ];
  const startAt = lastActivityAt(assessment);
  const deadline = startAt + weeks * WEEK;
  const chosen = rows.filter((row) => row.on);

  const set = (metric: GoalMetricId, change: { on?: boolean; target?: number }) =>
    setOverrides((current) => ({ ...current, [metric]: { ...current[metric], ...change } }));

  return (
    <FormScreen
      title={t('goals.setup.title')}
      subtitle={subtitle}
      onBack={onBack}
      backLabel={t('common.back')}
      footer={
        <Button
          shape="pill"
          glow
          label={t('goals.setup.save', { count: chosen.length })}
          disabled={chosen.length === 0}
          loading={saving}
          onPress={() =>
            onSave(
              chosen.map((row) => ({
                athleteId,
                metric: row.metric,
                startValue: row.startValue,
                startAt,
                target: row.target,
                deadline,
                checkEveryDays: checkEvery,
                sourceAssessmentId: assessment.id,
              })),
            )
          }
        />
      }
    >
      <View className="gap-4">
        <Text className="text-[14px] leading-[20px] text-muted-foreground">{t('goals.setup.lead')}</Text>
        <ChoiceChips
          label={t('goals.setup.duration')}
          options={WEEK_OPTIONS.map((w) => ({ value: String(w), label: t('goals.setup.weeks', { count: w }) }))}
          value={String(weeks)}
          onChange={(value) => setWeeks(Number(value) as (typeof WEEK_OPTIONS)[number])}
        />
        <ChoiceChips
          label={t('goals.setup.checkEvery')}
          options={CHECK_OPTIONS.map((d) => ({ value: String(d), label: t(`goals.setup.every.${d}`) }))}
          value={String(checkEvery)}
          onChange={(value) => setCheckEvery(Number(value) as (typeof CHECK_OPTIONS)[number])}
        />
        <Text className="text-[13px] text-foreground">
          {t('goals.setup.window', { from: formatDayMonth(startAt), to: formatDayMonth(deadline) })}
        </Text>

        <Text className="mt-1 text-[13px] font-semibold text-muted-foreground">{t('goals.setup.suggested')}</Text>
        {rows.filter((r) => r.suggested).map((row) => (
          <GoalRow key={row.metric} row={row} weeks={weeks} onToggle={() => set(row.metric, { on: !row.on })} onTarget={(target) => set(row.metric, { target, on: true })} />
        ))}
        {rows.some((r) => !r.suggested) ? <Text className="mt-1 text-[13px] font-semibold text-muted-foreground">{t('goals.setup.others')}</Text> : null}
        {rows.filter((r) => !r.suggested).map((row) => (
          <GoalRow key={row.metric} row={row} weeks={weeks} onToggle={() => set(row.metric, { on: !row.on })} onTarget={(target) => set(row.metric, { target, on: true })} />
        ))}
      </View>
    </FormScreen>
  );
}

function GoalRow({ row, weeks, onToggle, onTarget }: { row: Row; weeks: number; onToggle: () => void; onTarget: (target: number) => void }) {
  const { t } = useTranslation();
  const [primaryFg, fg] = useColorTokens(['primary-foreground', 'foreground']);
  const metric = GOAL_METRICS[row.metric];
  const step = STEP[metric.unit];
  const level = isLevelMetric(row.metric);
  const weekly = (row.target - row.startValue) / weeks;
  const tooFast = !level && Math.abs(weekly) > metric.weeklyRate * 1.6;

  return (
    <View className={`gap-2.5 rounded-[20px] border px-3.5 py-3 ${row.on ? 'border-primary bg-card' : 'border-border bg-card'}`}>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: row.on }} onPress={onToggle} className="flex-row items-center gap-3 active:opacity-70">
        <View className={`h-6 w-6 items-center justify-center rounded-md border-2 ${row.on ? 'border-primary bg-primary' : 'border-input bg-card'}`}>
          {row.on ? <Check size={15} color={primaryFg} strokeWidth={3} /> : null}
        </View>
        <View className="flex-1">
          <Text className="text-[16px] font-bold text-foreground">{t(`goals.metric.${row.metric}`)}</Text>
          {row.suggested ? <Text className="text-[12px] text-muted-foreground">{t(`goals.reason.${row.reason}`)}</Text> : null}
        </View>
      </Pressable>
      {row.on ? (
        <>
          <View className="flex-row items-center gap-2">
            <Text className="text-[14px] text-muted-foreground">{formatGoalValue(t, metric, row.startValue)}</Text>
            <Text className="text-[14px] text-muted-foreground">→</Text>
            <View className="flex-1" />
            <Stepper label={t('goals.setup.decrease')} onPress={() => onTarget(level ? Math.max(0, row.target - 1) : row.target - step)}>
              <Minus size={16} color={fg} strokeWidth={2.4} />
            </Stepper>
            <Text className="min-w-[96px] text-center font-num text-[18px] font-extrabold text-foreground">{formatGoalValue(t, metric, row.target)}</Text>
            <Stepper label={t('goals.setup.increase')} onPress={() => onTarget(level ? Math.min(2, row.target + 1) : row.target + step)}>
              <Plus size={16} color={fg} strokeWidth={2.4} />
            </Stepper>
          </View>
          {!level ? (
            <Text className={`text-[12px] ${tooFast ? 'font-semibold text-warning' : 'text-muted-foreground'}`}>
              {tooFast ? t('goals.setup.tooFast', { value: formatGoalDelta(t, metric, weekly) }) : t('goals.setup.pace', { value: formatGoalDelta(t, metric, weekly) })}
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

function Stepper({ label, onPress, children }: { label: string; onPress: () => void; children: ReactNode }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6} className="h-10 w-10 items-center justify-center rounded-full border border-border bg-background active:opacity-70">
      {children}
    </Pressable>
  );
}
