import { Megaphone, Target, TriangleAlert } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { NoteField } from '@/components/ui/note-field';
import { Segmented } from '@/components/ui/segmented';
import { Text } from '@/components/ui/text';
import { ExerciseMedia } from '@/features/exercises/components/exercise-media';
import { formatClock } from '@/lib/format/clock';
import { useColorTokens } from '@/lib/theme/tokens';

import type { TestResult } from '../model';
import { CONDITIONING_OPTIONS, resolvedTest, type ConditioningOption, type PainRegion, type TestId } from '../protocol';
import { useHeartRateCapture } from '../use-heart-rate-capture';
import { CheckRow } from './check-row';
import { HeartRatePanel } from './heart-rate-panel';
import type { ShellProps } from './intro-step';
import { StepSection, StepShell } from './step-shell';
import { TestTimer } from './test-timer';

/** "2:05" → 125 sn; düz sayı da saniye kabul edilir. Geçersizse null. */
export function parseClock(text: string): number | null {
  const value = text.trim();
  if (!value) return null;
  const match = /^(\d{1,2})[:.,](\d{1,2})$/.exec(value);
  if (match) return Number(match[1]) * 60 + Number(match[2]);
  const seconds = Number(value.replace(',', '.'));
  return Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds) : null;
}

/**
 * Hareket / kuvvet / kondisyon testi: hareketin videosu ya da tanıtımı, sporcuya söylenecek KOMUT, hedef, gerekirse
 * kronometre ve saatten nabız, "kontrol et" maddeleri (Var / Yok), ölçü ve antrenör notu (sesle yazdırılabilir).
 */
export function TestStep({
  shell,
  test,
  initial,
  suggestedOption,
  caution,
  saving,
  onSave,
  onSkip,
}: {
  shell: ShellProps;
  test: TestId;
  initial: TestResult | null;
  suggestedOption: ConditioningOption;
  caution: PainRegion[];
  saving: boolean;
  onSave: (result: TestResult) => void;
  onSkip: () => void;
}) {
  const { t } = useTranslation();
  const [heroFg, warning] = useColorTokens(['hero-foreground', 'warning']);
  const [option, setOption] = useState<ConditioningOption>(initial?.option ?? suggestedOption);
  const def = resolvedTest(test, test === 'conditioning' ? option : null);
  const [checks, setChecks] = useState<Record<string, boolean | null>>(initial?.checks ?? {});
  const [metricText, setMetricText] = useState(
    initial?.metric == null ? '' : def.metric === 'timeSeconds' ? formatClock(initial.metric) : String(initial.metric),
  );
  const [note, setNote] = useState(initial?.note ?? '');
  const capture = useHeartRateCapture();
  const [timerKey, setTimerKey] = useState(0);

  const metricValue = def.metric === 'timeSeconds' ? parseClock(metricText) : metricText.trim() === '' ? null : Number(metricText.replace(',', '.'));
  const metricInvalid = metricText.trim() !== '' && (metricValue === null || !Number.isFinite(metricValue) || metricValue < 0);
  const commandKey = test === 'conditioning' ? `assessment.conditioning.command.${option}` : `assessment.steps.${test}.command`;
  const targetKey = test === 'conditioning' ? `assessment.conditioning.target.${option}` : `assessment.steps.${test}.target`;

  function onTimerFinish(seconds: number) {
    capture.end();
    if (def.metric === 'holdSeconds') setMetricText(String(Math.round(seconds)));
    if (def.metric === 'timeSeconds') setMetricText(formatClock(seconds));
  }

  function save() {
    onSave({
      checks: Object.fromEntries(def.checks.map((check) => [check.id, checks[check.id] ?? null])),
      metric: metricInvalid ? null : metricValue,
      note: note.trim(),
      ...(test === 'conditioning' ? { option } : null),
      heartRate: capture.take() ?? initial?.heartRate ?? null,
      completedAt: Date.now(),
    });
  }

  return (
    <StepShell
      {...shell}
      footer={
        <View className="gap-1">
          <Button shape="pill" glow label={t('assessment.step.saveAndNext')} loading={saving} disabled={metricInvalid} onPress={save} />
          <Button variant="text" label={t('assessment.step.skip')} onPress={onSkip} disabled={saving} />
        </View>
      }
    >
      {caution.length > 0 ? (
        <View className="flex-row items-center gap-2 rounded-xl bg-warning/10 px-3 py-2.5">
          <TriangleAlert size={16} color={warning} strokeWidth={2} />
          <Text className="flex-1 text-[13px] text-foreground">
            {t('assessment.recommend.caution', { regions: caution.map((region) => t(`assessment.painRegions.${region}`)).join(', ') })}
          </Text>
        </View>
      ) : null}

      {test === 'conditioning' ? (
        <StepSection title={t('assessment.conditioning.choose')} aside={t('assessment.conditioning.suggested', { option: t(`assessment.conditioning.option.${suggestedOption}`) })}>
          <Segmented
            shape="pill"
            accessibilityLabel={t('assessment.conditioning.choose')}
            options={CONDITIONING_OPTIONS.map((value) => ({ value, label: t(`assessment.conditioning.option.${value}`) }))}
            value={option}
            onChange={(value) => {
              setOption(value);
              setMetricText('');
              capture.reset();
              setTimerKey((key) => key + 1);
            }}
          />
        </StepSection>
      ) : null}

      <View className="gap-2 rounded-[22px] bg-hero px-3.5 py-3">
        <View className="flex-row items-center gap-2">
          <Megaphone size={16} color={heroFg} strokeWidth={2} />
          <Text className="text-[12px] font-semibold text-hero-foreground/70">{t('assessment.step.command')}</Text>
        </View>
        <Text className="text-[19px] font-bold leading-[25px] text-hero-foreground">“{t(commandKey)}”</Text>
        <View className="flex-row items-center gap-1.5">
          <Target size={14} color={heroFg} strokeWidth={2} />
          <Text className="text-[13px] font-semibold text-hero-foreground/80">{t(targetKey)}</Text>
        </View>
      </View>

      <ExerciseMedia exerciseId={def.exerciseId} showName />

      {def.heartRate ? <HeartRatePanel phase={capture.phase} recoveryLeft={capture.recoveryLeft} summary={capture.summary} /> : null}

      {def.timer ? (
        <TestTimer
          key={`${timerKey}-${def.timer.mode}`}
          spec={def.timer}
          onStart={capture.start}
          onFinish={onTimerFinish}
          onReset={capture.reset}
        />
      ) : null}

      <StepSection title={t('assessment.step.checks')} aside={t('assessment.step.checksHint')}>
        <View className="rounded-[22px] border border-border bg-card px-3.5">
          {def.checks.map((check, index) => (
            <CheckRow
              key={check.id}
              first={index === 0}
              label={t(`assessment.steps.${test}.checks.${check.id}`)}
              value={checks[check.id] ?? null}
              onChange={(value) => setChecks((current) => ({ ...current, [check.id]: value }))}
            />
          ))}
        </View>
      </StepSection>

      {def.metric ? (
        <Field
          variant="plain"
          label={t(`assessment.metric.${def.metric}`)}
          placeholder={def.metric === 'timeSeconds' ? '2:05' : def.metric === 'holdSeconds' ? '30' : '12'}
          keyboardType={def.metric === 'timeSeconds' ? 'numbers-and-punctuation' : 'number-pad'}
          value={metricText}
          onChangeText={setMetricText}
          error={metricInvalid ? t('assessment.metric.invalid') : undefined}
          adornment={<Text className="pr-2 text-[13px] font-semibold text-muted-foreground">{t(`assessment.metric.unit.${def.metric}`)}</Text>}
        />
      ) : null}

      <NoteField
        label={t('assessment.step.note')}
        value={note}
        onChange={setNote}
        placeholder={t('assessment.step.notePlaceholder')}
      />
      <Text className="text-[12px] text-muted-foreground">{t('assessment.step.dictationHint')}</Text>
    </StepShell>
  );
}
