import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { sortedSessions } from '@/features/assessment/model';
import { useAthleteAssessments } from '@/features/assessment/queries';
import { fullName } from '@/features/athletes/model';
import { useAthlete } from '@/features/athletes/queries';
import { GoalSetup } from '@/features/goals/components/goal-setup';
import { useCreateGoals } from '@/features/goals/mutations';

/** Hedef koy: son değerlendirmeden (ya da `assessmentId`) önerilen hedefler. Kaydedince sporcunun Hedefler sekmesi. */
export default function GoalsSetupRoute() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id, assessmentId } = useLocalSearchParams<{ id: string; assessmentId?: string }>();
  const athleteId = id ?? '';
  const athlete = useAthlete(athleteId);
  const assessments = useAthleteAssessments(athleteId);
  const create = useCreateGoals();

  const assessment = useMemo(() => {
    const sessions = sortedSessions(assessments.data ?? []);
    return sessions.find((item) => item.id === assessmentId) ?? sessions.find((item) => item.evaluation) ?? null;
  }, [assessments.data, assessmentId]);

  if (!athlete.data || assessments.isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }
  if (!assessment) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background px-6">
        <Text className="text-center text-[15px] text-foreground">{t('goals.empty.needsEvaluation')}</Text>
        <Button shape="pill" variant="outline" label={t('common.back')} onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <GoalSetup
      assessment={assessment}
      gender={athlete.data.gender}
      heightCm={athlete.data.heightCm}
      athleteId={athleteId}
      subtitle={fullName(athlete.data)}
      saving={create.isPending}
      onBack={() => router.back()}
      onSave={(drafts) =>
        create.mutate(drafts, {
          onSuccess: () => router.replace({ pathname: '/athletes/[id]', params: { id: athleteId, tab: 'goals' } }),
        })
      }
    />
  );
}
