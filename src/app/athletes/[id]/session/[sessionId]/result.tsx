import { useLocalSearchParams, useRouter } from 'expo-router';
import { CircleCheck, FileText, Flag, MessageSquarePlus, Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { FormScreen } from '@/components/ui/form-screen';
import { NoteField } from '@/components/ui/note-field';
import { Segmented } from '@/components/ui/segmented';
import { Text } from '@/components/ui/text';
import { levelLabel } from '@/features/assessment/labels';
import { LEVELS, type Level } from '@/features/assessment/model';
import { useCompleteAssessment } from '@/features/assessment/mutations';
import { AREAS, PRIORITIES, type Area, type Priority } from '@/features/assessment/protocol';
import { useAssessment } from '@/features/assessment/queries';
import { scoreAreas, suggestPriority } from '@/features/assessment/scoring';
import { fullName } from '@/features/athletes/model';
import { useAthlete } from '@/features/athletes/queries';
import { useAthletePrograms } from '@/features/programs/queries';
import { ReportSheet } from '@/features/reports/components/report-sheet';
import { useShareAssessmentReport } from '@/features/reports/use-reports';
import { formatShortDate } from '@/lib/format/date';
import { useColorTokens } from '@/lib/theme/tokens';

/**
 * Sonuç (akışın sonu): Core · Glute · Upper back · Kondisyon — her biri zayıf / orta / iyi (kondisyonda düşük / orta /
 * iyi). Uygulama bulgulardan ÖNERİR, antrenör seçer. Ardından "en çok geliştirmemiz gereken nokta" ve not ("Programı
 * buna göre yazacağım"). Kaydedince: program oluştur · PDF rapor.
 */
export default function SessionResultRoute() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id, sessionId } = useLocalSearchParams<{ id: string; sessionId: string }>();
  const athleteId = id ?? '';
  const athlete = useAthlete(athleteId);
  const assessment = useAssessment(sessionId ?? '');
  const programs = useAthletePrograms(athleteId);
  const complete = useCompleteAssessment(sessionId ?? '');
  const report = useShareAssessmentReport();
  const [primaryFg, success] = useColorTokens(['primary-foreground', 'success']);

  const gender = athlete.data?.gender ?? null;
  const scores = useMemo(() => (assessment.data ? scoreAreas(assessment.data, gender) : null), [assessment.data, gender]);
  const [levels, setLevels] = useState<Record<Area, Level | null> | null>(null);
  const [priority, setPriority] = useState<Priority | null | undefined>(undefined);
  const [priorityNote, setPriorityNote] = useState<string | null>(null);
  const [coachNote, setCoachNote] = useState<string | null>(null);
  const [doneOpen, setDoneOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  if (!assessment.data || !athlete.data || !scores) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  const session = assessment.data;
  const saved = session.evaluation;
  const suggested = Object.fromEntries(AREAS.map((area) => [area, scores[area].level])) as Record<Area, Level | null>;
  const current = levels ?? saved?.levels ?? suggested;
  const suggestedPriority = suggestPriority(current, session, gender);
  const currentPriority = priority === undefined ? (saved?.priority ?? suggestedPriority) : priority;
  const name = fullName(athlete.data);

  const after = (action: () => void) => {
    setDoneOpen(false);
    setTimeout(action, Platform.OS === 'ios' ? 350 : 0);
  };

  return (
    <>
      <FormScreen
        title={t('assessment.result.title')}
        subtitle={name}
        onBack={() => router.back()}
        backLabel={t('common.back')}
        footer={
          <Button
            shape="pill"
            glow
            icon={CircleCheck}
            label={saved ? t('assessment.result.update') : t('assessment.result.save')}
            loading={complete.isPending}
            onPress={() =>
              complete.mutate(
                {
                  levels: current,
                  priority: currentPriority ?? null,
                  priorityNote: (priorityNote ?? saved?.priorityNote ?? '').trim(),
                  coachNote: (coachNote ?? saved?.coachNote ?? '').trim(),
                },
                { onSuccess: () => setDoneOpen(true) },
              )
            }
          />
        }
      >
        <View className="gap-4">
          <Text className="text-[14px] leading-[20px] text-muted-foreground">{t('assessment.result.lead')}</Text>

          {AREAS.map((area) => (
            <View key={area} className="gap-2 rounded-[22px] border border-border bg-card px-3.5 py-3">
              <View className="flex-row items-baseline justify-between gap-2">
                <Text className="text-[17px] font-bold text-foreground">{t(`assessment.areas.${area}`)}</Text>
                <Text className="text-[12px] text-muted-foreground">{t(`assessment.areaHints.${area}`)}</Text>
              </View>
              <Segmented
                shape="pill"
                accessibilityLabel={t(`assessment.areas.${area}`)}
                options={LEVELS.map((level) => ({ value: level, label: levelLabel(t, area, level) }))}
                value={current[area] ?? undefined}
                onChange={(level) => setLevels({ ...current, [area]: level })}
              />
              <View className="flex-row items-center gap-1.5">
                <Sparkles size={13} color={success} strokeWidth={2} />
                <Text className="flex-1 text-[12px] leading-[16px] text-muted-foreground">
                  {scores[area].level
                    ? t('assessment.result.suggestion', {
                        level: levelLabel(t, area, scores[area].level),
                        faults: formatFaults(scores[area].faults),
                        observed: scores[area].observed,
                      })
                    : t('assessment.result.noData')}
                </Text>
              </View>
            </View>
          ))}

          <View className="gap-2.5 rounded-[22px] bg-primary px-3.5 py-3.5">
            <Text className="text-[15px] font-bold text-primary-foreground">{t('assessment.result.priorityQuestion')}</Text>
            {suggestedPriority ? (
              <View className="flex-row items-center gap-1.5">
                <Sparkles size={13} color={primaryFg} strokeWidth={2} />
                <Text className="text-[12px] text-primary-foreground/80">
                  {t('assessment.result.prioritySuggestion', { priority: t(`assessment.priorities.${suggestedPriority}`) })}
                </Text>
              </View>
            ) : null}
          </View>
          <ChoiceChips
            label={t('assessment.result.priority')}
            options={PRIORITIES.map((value) => ({ value, label: t(`assessment.priorities.${value}`) }))}
            value={currentPriority ?? undefined}
            onChange={setPriority}
          />
          <NoteField
            label={t('assessment.result.priorityNote')}
            value={priorityNote ?? saved?.priorityNote ?? ''}
            onChange={setPriorityNote}
            placeholder={t('assessment.result.priorityNotePlaceholder')}
          />
          <NoteField
            label={t('assessment.result.coachNote')}
            value={coachNote ?? saved?.coachNote ?? ''}
            onChange={setCoachNote}
            placeholder={t('assessment.result.coachNotePlaceholder')}
          />
        </View>
      </FormScreen>

      <BottomSheet
        visible={doneOpen}
        onClose={() => setDoneOpen(false)}
        variant="panel"
        title={t('assessment.result.doneTitle')}
        subtitle={t('assessment.result.doneSubtitle', { name })}
        closeLabel={t('common.close')}
        footer={
          <View className="gap-2.5">
            <Button
              shape="pill"
              glow
              icon={Flag}
              label={t('assessment.result.setGoals')}
              onPress={() => after(() => router.replace({ pathname: '/athletes/[id]/goals', params: { id: athleteId, assessmentId: session.id } }))}
            />
            <Button
              shape="pill"
              variant="outline"
              icon={MessageSquarePlus}
              label={t('assessment.result.createProgram')}
              onPress={() => after(() => router.replace({ pathname: '/athletes/[id]/programs/chat', params: { id: athleteId, assessmentId: session.id } }))}
            />
            <Button shape="pill" variant="outline" icon={FileText} label={t('assessment.result.report')} onPress={() => after(() => setReportOpen(true))} />
            <Button variant="text" label={t('assessment.result.backToAthlete')} onPress={() => after(() => router.dismissTo({ pathname: '/athletes/[id]', params: { id: athleteId } }))} />
          </View>
        }
      >
        <Text className="text-[15px] leading-[21px] text-foreground">{t('assessment.result.doneDescription')}</Text>
      </BottomSheet>

      <ReportSheet
        visible={reportOpen}
        sessionLabel={t('report.sheet.session', { date: formatShortDate(session.completedAt ?? session.updatedAt) })}
        hasPhotos={Boolean(session.measurements?.photoFront || session.measurements?.photoSide)}
        programTitle={programs.data?.[0]?.plan.title ?? null}
        pending={report.isPending}
        error={report.isError ? t('report.sheet.error') : null}
        onClose={() => setReportOpen(false)}
        onCreate={({ includePhotos, includeProgram }) =>
          report.mutate(
            { athlete: athlete.data!, assessment: session, includePhotos, program: includeProgram ? (programs.data?.[0]?.plan ?? null) : null },
            { onSuccess: () => setReportOpen(false) },
          )
        }
      />
    </>
  );
}

function formatFaults(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.', ',');
}
