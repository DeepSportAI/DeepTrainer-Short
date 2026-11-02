import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, View } from 'react-native';

import { IntroStep } from '@/features/assessment/components/intro-step';
import { MeasurementsStep } from '@/features/assessment/components/measurements-step';
import { NextStepSheet } from '@/features/assessment/components/next-step-sheet';
import { TestStep } from '@/features/assessment/components/test-step';
import { stepTitle } from '@/features/assessment/labels';
import { progressOf, type Assessment } from '@/features/assessment/model';
import { useSaveStep, useSkipStep, type StepSave } from '@/features/assessment/mutations';
import { STAGES, STEP_ORDER, isTestStep, stageOf, type StepId } from '@/features/assessment/protocol';
import { useAssessment } from '@/features/assessment/queries';
import { cautionFor, recommendNext, suggestedConditioningOption, type Recommendation } from '@/features/assessment/recommend';
import { fullName } from '@/features/athletes/model';
import { useAthlete } from '@/features/athletes/queries';

/**
 * Bir test adımı. Kaydedince (ya da atlayınca) "sıradaki önerilen test" penceresi açılır; "Başla" o adımı bu ekranın
 * YERİNE açar (yığın büyümez, geri tuşu oturum listesine döner).
 */
export default function SessionStepRoute() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; sessionId: string; step: string }>();
  const athleteId = params.id ?? '';
  const sessionId = params.sessionId ?? '';
  const step = (STEP_ORDER as readonly string[]).includes(params.step ?? '') ? (params.step as StepId) : null;

  const athlete = useAthlete(athleteId);
  const assessment = useAssessment(sessionId);
  const save = useSaveStep(sessionId);
  const skip = useSkipStep(sessionId);
  const [next, setNext] = useState<{ open: boolean; recommendation: Recommendation | null }>({ open: false, recommendation: null });

  if (!step || !assessment.data || !athlete.data) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  const session = assessment.data;
  const stage = STAGES.find((item) => item.id === stageOf(step));
  const shell = {
    title: stepTitle(t, step),
    subtitle: `${t(`assessment.stages.${stageOf(step)}`)} · ${t('assessment.minutes', { from: stage?.minutes[0], to: stage?.minutes[1] })} · ${fullName(athlete.data)}`,
    progress: progressOf(session),
    onBack: () => router.back(),
    onList: () => router.dismissTo({ pathname: '/athletes/[id]/session/[sessionId]', params: { id: athleteId, sessionId } }),
  };

  const afterSave = (updated: Assessment) => setNext({ open: true, recommendation: recommendNext(updated, step) });
  const onSave = (payload: StepSave) => save.mutate(payload, { onSuccess: afterSave });
  const onSkip = () => skip.mutate(step, { onSuccess: afterSave });

  const go = (action: () => void) => {
    setNext((current) => ({ ...current, open: false }));
    setTimeout(action, Platform.OS === 'ios' ? 350 : 0);
  };

  return (
    <>
      {step === 'intro' ? (
        <IntroStep shell={shell} initial={session.intro} saving={save.isPending} onSave={(intro) => onSave({ step: 'intro', intro })} />
      ) : step === 'measurements' ? (
        <MeasurementsStep
          shell={shell}
          initial={session.measurements}
          heightCm={athlete.data.heightCm}
          saving={save.isPending}
          onSave={(measurements) => onSave({ step: 'measurements', measurements })}
          onSkip={onSkip}
        />
      ) : isTestStep(step) ? (
        <TestStep
          key={step}
          shell={shell}
          test={step}
          initial={session.results[step] ?? null}
          suggestedOption={suggestedConditioningOption(session)}
          caution={cautionFor(step, session)}
          saving={save.isPending}
          onSave={(result) => onSave({ step, result })}
          onSkip={onSkip}
        />
      ) : null}

      <NextStepSheet
        visible={next.open}
        recommendation={next.recommendation}
        savedTitle={stepTitle(t, step)}
        onClose={() => setNext((current) => ({ ...current, open: false }))}
        onStart={() =>
          go(() =>
            next.recommendation
              ? router.replace({
                  pathname: '/athletes/[id]/session/[sessionId]/[step]',
                  params: { id: athleteId, sessionId, step: next.recommendation.step },
                })
              : undefined,
          )
        }
        onList={() => go(shell.onList)}
        onResult={() => go(() => router.replace({ pathname: '/athletes/[id]/session/[sessionId]/result', params: { id: athleteId, sessionId } }))}
      />
    </>
  );
}
