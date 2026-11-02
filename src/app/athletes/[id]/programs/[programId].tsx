import { useLocalSearchParams, useRouter } from 'expo-router';
import { FileText, MessageSquareText, PlayCircle, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { useConfirmSheet } from '@/components/ui/confirm-sheet';
import { ContentFrame } from '@/components/ui/content-frame';
import { DetailCard, DetailSection, Tag } from '@/components/ui/detail-parts';
import { StepMeter } from '@/components/ui/level-badge';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { useAthlete } from '@/features/athletes/queries';
import { DIFFICULTY_STEPS, getExercise } from '@/features/exercises/catalog';
import { ExerciseIntro, ExerciseMedia } from '@/features/exercises/components/exercise-media';
import { exerciseCount } from '@/features/programs/model';
import { useDeleteProgram } from '@/features/programs/mutations';
import { useProgram } from '@/features/programs/queries';
import type { PlanExercise } from '@/features/programs/schema';
import { useShareProgramReport } from '@/features/reports/use-reports';
import { useColorTokens } from '@/lib/theme/tokens';

/**
 * Kayıtlı program: günler ve hareketler (doz, dinlenme, ipucu, bölgeler, zorluk). Harekete dokununca videosu (varsa)
 * ya da tanıtımı açılır. PDF olarak sporcuya paylaşılır; "Sohbetle düzenle" asistanla kaldığı yerden sürer.
 */
export default function ProgramRoute() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, programId } = useLocalSearchParams<{ id: string; programId: string }>();
  const athlete = useAthlete(id ?? '');
  const program = useProgram(programId ?? '');
  const share = useShareProgramReport();
  const remove = useDeleteProgram();
  const confirm = useConfirmSheet();
  const [selected, setSelected] = useState<PlanExercise | null>(null);
  const [interactive] = useColorTokens(['interactive']);

  if (!program.data || !athlete.data) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }
  const { plan } = program.data;

  const nameOf = (exercise: PlanExercise) => {
    const catalog = getExercise(exercise.catalogId);
    return catalog ? t(`exercises.items.${catalog.id}.name`) : exercise.name;
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-4" contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }}>
        <ContentFrame kind="prose">
          <ScreenHeader title={plan.title} subtitle={t('programs.view.meta', { days: plan.daysPerWeek, minutes: plan.sessionMinutes, weeks: plan.weeks, count: exerciseCount(plan) })} onBack={() => router.back()} backLabel={t('common.back')} />

          <DetailCard className="mt-4 gap-2">
            <Text className="text-[14px] leading-[20px] text-foreground">{plan.summary}</Text>
            {plan.focus.length > 0 ? (
              <View className="flex-row flex-wrap gap-1.5">
                {plan.focus.map((item) => (
                  <Tag key={item} label={item} tone="accent" />
                ))}
              </View>
            ) : null}
          </DetailCard>

          <View className="mt-3 flex-row gap-2">
            <View className="flex-1">
              <Button shape="pill" glow icon={FileText} label={t('programs.view.sharePdf')} loading={share.isPending} onPress={() => share.mutate({ athlete: athlete.data!, plan, updatedAt: program.data!.updatedAt })} />
            </View>
            <View className="flex-1">
              <Button
                shape="pill"
                variant="outline"
                icon={MessageSquareText}
                label={t('programs.view.editInChat')}
                onPress={() => router.push({ pathname: '/athletes/[id]/programs/chat', params: { id: id ?? '', programId: programId ?? '' } })}
              />
            </View>
          </View>
          {share.isError ? <Text className="mt-2 text-[13px] text-destructive">{t('report.sheet.error')}</Text> : null}

          {plan.days.map((day, dayIndex) => (
            <View key={`${day.title}-${dayIndex}`}>
              <DetailSection title={`${t('programs.preview.day', { number: dayIndex + 1 })} · ${day.title}`} right={day.focus} />
              <View className="overflow-hidden rounded-[22px] border border-border bg-card">
                {day.exercises.map((exercise, index) => {
                  const catalog = getExercise(exercise.catalogId);
                  const dose = [exercise.sets ? `${exercise.sets} ×` : null, exercise.reps].filter(Boolean).join(' ');
                  return (
                    <Pressable
                      key={`${exercise.name}-${index}`}
                      accessibilityRole="button"
                      onPress={() => setSelected(exercise)}
                      className={`gap-1.5 px-3.5 py-3 active:opacity-70 ${index > 0 ? 'border-t border-border' : ''}`}
                    >
                      <View className="flex-row items-center gap-2">
                        <Text className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-bold text-muted-foreground">{t(`programs.sections.${exercise.section}`)}</Text>
                        <Text numberOfLines={1} className="flex-1 text-[15px] font-bold text-foreground">
                          {nameOf(exercise)}
                        </Text>
                        {catalog?.video ? <PlayCircle size={18} color={interactive} strokeWidth={2} /> : null}
                      </View>
                      <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
                        {dose ? <Text className="font-num text-[14px] font-extrabold text-foreground">{dose}</Text> : null}
                        {exercise.restSeconds ? <Text className="text-[12px] text-muted-foreground">{t('programs.view.rest', { seconds: exercise.restSeconds })}</Text> : null}
                        <StepMeter steps={DIFFICULTY_STEPS[exercise.difficulty]} label={t(`exercises.difficulty.${exercise.difficulty}`)} />
                      </View>
                      {exercise.cue ? <Text className="text-[13px] italic text-muted-foreground">{exercise.cue}</Text> : null}
                      <View className="flex-row flex-wrap gap-1">
                        {exercise.regions.slice(0, 4).map((region) => (
                          <Tag key={region} label={t(`exercises.regions.${region}`)} />
                        ))}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}

          <DetailSection title={t('report.program.progression')} />
          <DetailCard>
            <Text className="text-[14px] leading-[20px] text-foreground">{plan.progression}</Text>
          </DetailCard>
          {plan.cautions.length > 0 ? (
            <>
              <DetailSection title={t('report.program.cautions')} />
              <DetailCard className="gap-1">
                {plan.cautions.map((item) => (
                  <Text key={item} className="text-[14px] leading-[20px] text-foreground">
                    • {item}
                  </Text>
                ))}
              </DetailCard>
            </>
          ) : null}

          <View className="mt-6">
            <Button
              shape="pill"
              variant="destructiveOutline"
              icon={Trash2}
              label={t('programs.view.delete')}
              onPress={() =>
                confirm.ask({
                  title: t('programs.view.deleteConfirm.title'),
                  description: t('programs.view.deleteConfirm.description', { title: plan.title }),
                  confirmLabel: t('programs.view.delete'),
                  cancelLabel: t('common.cancel'),
                  destructive: true,
                  onConfirm: () => remove.mutate(programId ?? '', { onSuccess: () => router.back() }),
                })
              }
            />
          </View>
          <Text className="mt-3 text-center text-[11px] text-muted-foreground">
            {t('programs.view.footnote')}
          </Text>
        </ContentFrame>
      </ScrollView>

      <BottomSheet visible={selected !== null} onClose={() => setSelected(null)} variant="panel" title={selected ? nameOf(selected) : ''} closeLabel={t('common.close')}>
        {selected ? (
          getExercise(selected.catalogId) ? (
            <ExerciseMedia exerciseId={selected.catalogId!} />
          ) : (
            <View className="gap-2">
              <Text className="text-[12px] text-muted-foreground">{t('programs.view.notInCatalog')}</Text>
              <ExerciseIntro description={selected.description} regions={selected.regions} difficulty={selected.difficulty} />
            </View>
          )
        ) : null}
      </BottomSheet>
      {confirm.sheet}
    </View>
  );
}
