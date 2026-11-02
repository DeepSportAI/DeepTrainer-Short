import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, Flag, SkipForward, Trash2 } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { useConfirmSheet } from '@/components/ui/confirm-sheet';
import { ContentFrame } from '@/components/ui/content-frame';
import { DetailRow, DetailSection, DoneMark, NumberTile, RowGroup, Tag } from '@/components/ui/detail-parts';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { recommendationText, stepTitle } from '@/features/assessment/labels';
import { isStepDone, sortedSessions } from '@/features/assessment/model';
import { useDeleteAssessment } from '@/features/assessment/mutations';
import { STAGES, STEP_ORDER, stageOf, type StepId } from '@/features/assessment/protocol';
import { useAssessment, useAthleteAssessments } from '@/features/assessment/queries';
import { flaggedLastTime, recommendNext } from '@/features/assessment/recommend';
import { testFaults } from '@/features/assessment/scoring';
import { fullName } from '@/features/athletes/model';
import { useAthlete } from '@/features/athletes/queries';
import { formatClock } from '@/lib/format/clock';
import { formatShortDate } from '@/lib/format/date';
import { useColorTokens } from '@/lib/theme/tokens';

/**
 * Test oturumu: 30 dakikalık ilk ders programı aşama aşama — yapılanlar (özetiyle), sıradaki ÖNERİLEN adım (volt kart,
 * nedeniyle), atlananlar; geçen oturumda bulgu çıkan testler işaretli. Herhangi bir adıma dokunup o testi yapmak da
 * serbest. En altta sonuç (değerlendirme).
 */
export default function SessionOverviewRoute() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, sessionId } = useLocalSearchParams<{ id: string; sessionId: string }>();
  const athleteId = id ?? '';
  const athlete = useAthlete(athleteId);
  const assessment = useAssessment(sessionId ?? '');
  const all = useAthleteAssessments(athleteId);
  const remove = useDeleteAssessment();
  const confirm = useConfirmSheet();
  const [primaryFg, muted] = useColorTokens(['primary-foreground', 'muted-foreground']);

  const previous = useMemo(
    () => sortedSessions(all.data ?? []).find((item) => item.id !== sessionId && item.completedAt !== null) ?? null,
    [all.data, sessionId],
  );

  if (!assessment.data || !athlete.data) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  const session = assessment.data;
  const next = recommendNext(session);
  const flagged = flaggedLastTime(previous);
  const openStep = (step: StepId) =>
    router.push({ pathname: '/athletes/[id]/session/[sessionId]/[step]', params: { id: athleteId, sessionId: session.id, step } });
  const openResult = () => router.push({ pathname: '/athletes/[id]/session/[sessionId]/result', params: { id: athleteId, sessionId: session.id } });

  const summaryOf = (step: StepId): string => {
    if (step === 'intro') {
      const intro = session.intro;
      if (!intro) return '';
      return [intro.goals.map((goal) => t(`assessment.goals.${goal}`)).join(', '), intro.pain ? t('assessment.session.painReported') : null].filter(Boolean).join(' · ');
    }
    if (step === 'measurements') {
      const m = session.measurements;
      if (!m) return '';
      return [m.weightKg ? `${m.weightKg} ${t('units.kg')}` : null, m.waistCm ? `${t('assessment.measurements.waistShort')} ${m.waistCm} ${t('units.cm')}` : null].filter(Boolean).join(' · ');
    }
    const result = session.results[step];
    if (!result) return '';
    const { faults, observed } = testFaults(session, step);
    const metric =
      result.metric === null
        ? null
        : step === 'conditioning' && result.option === 'row500'
          ? formatClock(result.metric)
          : step === 'plank'
            ? `${result.metric} ${t('units.seconds')}`
            : `${result.metric} ${t('units.reps')}`;
    return [metric, observed > 0 ? (faults > 0 ? t('assessment.session.faults', { count: faults }) : t('assessment.session.clean')) : null].filter(Boolean).join(' · ');
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-4" contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }}>
        <ContentFrame kind="prose">
          <ScreenHeader
            title={t('assessment.session.title')}
            subtitle={`${fullName(athlete.data)} · ${formatShortDate(session.createdAt)}`}
            onBack={() => router.back()}
            backLabel={t('common.back')}
          />

          {next ? (
            <View className="mt-4 gap-2.5 overflow-hidden rounded-[22px] bg-primary px-3.5 py-3.5">
              <Text className="text-[12px] font-semibold text-primary-foreground/70">
                {isStepDone(session, 'intro') ? t('assessment.session.nextRecommended') : t('assessment.session.startHere')}
              </Text>
              <Text className="text-[22px] font-extrabold leading-[26px] text-primary-foreground">{recommendationText(t, next).title}</Text>
              <Text className="text-[14px] leading-[19px] text-primary-foreground">{recommendationText(t, next).reason}</Text>
              <View className="mt-1 self-start">
                <Button shape="pill" variant="outline" icon={ArrowRight} label={t('assessment.session.start')} onPress={() => openStep(next.step)} />
              </View>
            </View>
          ) : (
            <View className="mt-4 gap-2 rounded-[22px] bg-primary px-3.5 py-3.5">
              <Text className="text-[18px] font-extrabold text-primary-foreground">{t('assessment.next.allDone')}</Text>
              <Text className="text-[14px] text-primary-foreground">{t('assessment.next.allDoneDescription')}</Text>
              <View className="mt-1 self-start">
                <Button shape="pill" variant="outline" icon={Flag} label={t('assessment.next.toResult')} onPress={openResult} />
              </View>
            </View>
          )}

          {STAGES.map((stage) => {
            const steps = STEP_ORDER.filter((step) => stageOf(step) === stage.id);
            return (
              <View key={stage.id}>
                <DetailSection title={t(`assessment.stages.${stage.id}`)} right={t('assessment.minutes', { from: stage.minutes[0], to: stage.minutes[1] })} />
                <RowGroup>
                  {steps.map((step) => {
                    const done = isStepDone(session, step);
                    const skipped = session.skipped.includes(step);
                    const isNext = next?.step === step;
                    return (
                      <DetailRow
                        key={step}
                        left={done ? <DoneMark size={30} /> : skipped ? <SkipForward size={22} color={muted} strokeWidth={2} /> : <NumberTile text={String(STEP_ORDER.indexOf(step) + 1)} active={isNext} />}
                        title={stepTitle(t, step)}
                        titleTone={skipped && !done ? 'muted' : 'default'}
                        subtitle={
                          <View className="mt-0.5 gap-1">
                            <Text className="text-[13px] leading-[17px] text-muted-foreground">
                              {done ? summaryOf(step) || t('assessment.session.done') : skipped ? t('assessment.session.skipped') : t(`assessment.steps.${step}.target`)}
                            </Text>
                            {(flagged as Set<string>).has(step) || isNext ? (
                              <View className="flex-row flex-wrap gap-1.5">
                                {isNext ? <Tag tone="accent" label={t('assessment.session.recommended')} /> : null}
                                {(flagged as Set<string>).has(step) ? <Tag tone="warning" label={t('assessment.session.flaggedLastTime')} /> : null}
                              </View>
                            ) : null}
                          </View>
                        }
                        onPress={() => openStep(step)}
                      />
                    );
                  })}
                </RowGroup>
              </View>
            );
          })}

          <DetailSection title={t('assessment.result.title')} />
          <RowGroup>
            <DetailRow
              left={
                <View className="h-[30px] w-[30px] items-center justify-center rounded-full bg-primary">
                  <Flag size={15} color={primaryFg} strokeWidth={2.2} />
                </View>
              }
              title={session.evaluation ? t('assessment.session.resultDone') : t('assessment.session.resultTodo')}
              subtitle={t('assessment.session.resultHint')}
              onPress={openResult}
            />
          </RowGroup>

          <View className="mt-6">
            <Button
              shape="pill"
              variant="destructiveOutline"
              icon={Trash2}
              label={t('assessment.session.delete')}
              onPress={() =>
                confirm.ask({
                  title: t('assessment.session.deleteConfirm.title'),
                  description: t('assessment.session.deleteConfirm.description'),
                  confirmLabel: t('assessment.session.delete'),
                  cancelLabel: t('common.cancel'),
                  destructive: true,
                  onConfirm: () => remove.mutate(session.id, { onSuccess: () => router.back() }),
                })
              }
            />
          </View>
        </ContentFrame>
      </ScrollView>
      {confirm.sheet}
    </View>
  );
}
