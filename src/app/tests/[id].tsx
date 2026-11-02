import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContentFrame } from '@/components/ui/content-frame';
import { DetailSection } from '@/components/ui/detail-parts';
import { StackTabBar } from '@/components/ui/floating-tab-bar';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { stepTitle } from '@/features/assessment/labels';
import { STAGES, STEP_ORDER, TESTS, isTestStep, stageOf, type StepId } from '@/features/assessment/protocol';
import { ExerciseMedia } from '@/features/exercises/components/exercise-media';

/** Test açıklaması: amacı, komutu, hedefi, kontrol edilecekler ve hareketin videosu / tanıtımı. */
export default function TestDetailRoute() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const step = (STEP_ORDER as readonly string[]).includes(id ?? '') ? (id as StepId) : 'intro';
  const stage = STAGES.find((item) => item.id === stageOf(step));

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-4" contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 24 }}>
        <ContentFrame kind="prose" className="gap-1">
          <ScreenHeader
            title={stepTitle(t, step)}
            subtitle={`${t(`assessment.stages.${stageOf(step)}`)} · ${t('assessment.minutes', { from: stage?.minutes[0], to: stage?.minutes[1] })}`}
            onBack={() => router.back()}
            backLabel={t('common.back')}
          />
          <Text className="mt-3 text-[15px] leading-[22px] text-foreground">{t(`assessment.steps.${step}.why`)}</Text>
          {isTestStep(step) ? (
            <>
              <DetailSection title={t('assessment.step.command')} />
              <View className="rounded-[22px] bg-hero px-3.5 py-3">
                <Text className="text-[17px] font-bold leading-[23px] text-hero-foreground">
                  “{t(step === 'conditioning' ? 'assessment.conditioning.command.burpee' : `assessment.steps.${step}.command`)}”
                </Text>
                <Text className="mt-1 text-[13px] text-hero-foreground/80">{t(`assessment.steps.${step}.target`)}</Text>
              </View>
              <DetailSection title={t('assessment.step.checks')} />
              <View className="gap-1.5 rounded-[22px] border border-border bg-card px-3.5 py-3">
                {TESTS[step].checks.map((check) => (
                  <Text key={check.id} className="text-[14px] leading-[20px] text-foreground">
                    • {t(`assessment.steps.${step}.checks.${check.id}`)}
                  </Text>
                ))}
              </View>
              <DetailSection title={t('tests.movement')} />
              <ExerciseMedia exerciseId={TESTS[step].exerciseId} showName />
            </>
          ) : null}
        </ContentFrame>
      </ScrollView>
      <StackTabBar />
    </View>
  );
}
