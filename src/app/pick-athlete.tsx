import { useRouter } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContentFrame } from '@/components/ui/content-frame';
import { DetailRow, RowGroup, Tag } from '@/components/ui/detail-parts';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SearchField } from '@/components/ui/search-field';
import { Text } from '@/components/ui/text';
import { hasActivity, openSession, summarizeAthlete, type Assessment } from '@/features/assessment/model';
import { useStartAssessment } from '@/features/assessment/mutations';
import { useAllAssessments } from '@/features/assessment/queries';
import { recommendNext } from '@/features/assessment/recommend';
import { fullName, initials, matchesQuery } from '@/features/athletes/model';
import { useAthletes } from '@/features/athletes/queries';
import { formatAgo } from '@/lib/format/ago';
import { useColorToken } from '@/lib/theme/tokens';

/**
 * "Test al" (alt çubuğun ortası): kimi test edeceksiniz? Testler hep tek sporcuya yapılır; sporcunun yarım kalan oturumu
 * varsa sıradaki önerilen adımdan sürer, yoksa yeni oturum açılır.
 */
export default function PickAthleteRoute() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const interactive = useColorToken('interactive');
  const athletes = useAthletes();
  const assessments = useAllAssessments();
  const start = useStartAssessment();
  const [query, setQuery] = useState('');

  const byAthlete = useMemo(() => {
    const map = new Map<string, Assessment[]>();
    for (const item of assessments.data ?? []) map.set(item.athleteId, [...(map.get(item.athleteId) ?? []), item]);
    return map;
  }, [assessments.data]);

  function pick(athleteId: string) {
    const open = openSession((byAthlete.get(athleteId) ?? []).filter(hasActivity));
    if (open) {
      const next = recommendNext(open);
      router.replace(
        next
          ? { pathname: '/athletes/[id]/session/[sessionId]/[step]', params: { id: athleteId, sessionId: open.id, step: next.step } }
          : { pathname: '/athletes/[id]/session/[sessionId]/result', params: { id: athleteId, sessionId: open.id } },
      );
      return;
    }
    start.mutate(athleteId, {
      onSuccess: (session) => router.replace({ pathname: '/athletes/[id]/session/[sessionId]', params: { id: athleteId, sessionId: session.id } }),
    });
  }

  const list = (athletes.data ?? []).filter((athlete) => matchesQuery(athlete, query));

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-4" contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        <ContentFrame kind="prose" className="gap-3.5">
          <ScreenHeader title={t('pickAthlete.title')} subtitle={t('pickAthlete.subtitle')} onBack={() => router.back()} backLabel={t('common.close')} />
          <SearchField value={query} onChangeText={setQuery} placeholder={t('athletes.search')} clearLabel={t('athletes.clearSearch')} />
          {athletes.isPending ? (
            <ActivityIndicator />
          ) : (
            <RowGroup>
              <DetailRow
                left={
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-interactive/10">
                    <UserPlus size={18} color={interactive} strokeWidth={2} />
                  </View>
                }
                title={t('pickAthlete.new')}
                subtitle={t('pickAthlete.newHint')}
                onPress={() => router.replace('/athletes/new')}
              />
              {list.map((athlete) => {
                const sessions = byAthlete.get(athlete.id) ?? [];
                const summary = summarizeAthlete(sessions);
                const open = openSession(sessions.filter(hasActivity));
                return (
                  <DetailRow
                    key={athlete.id}
                    left={
                      <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-3">
                        <Text className="text-[14px] font-bold text-foreground">{initials(athlete)}</Text>
                      </View>
                    }
                    title={fullName(athlete)}
                    subtitle={
                      <View className="mt-0.5 flex-row flex-wrap items-center gap-1.5">
                        <Text className="text-[13px] text-muted-foreground">
                          {summary.lastTestAt ? t('pickAthlete.lastTest', { when: formatAgo(summary.lastTestAt) }) : t('athletes.card.noTest')}
                        </Text>
                        {open ? <Tag tone="accent" label={t('pickAthlete.continue')} /> : null}
                      </View>
                    }
                    onPress={() => pick(athlete.id)}
                  />
                );
              })}
            </RowGroup>
          )}
          {start.isPending ? <ActivityIndicator /> : null}
        </ContentFrame>
      </ScrollView>
    </View>
  );
}
