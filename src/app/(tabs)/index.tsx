import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Plus, UserPlus, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyBlock } from '@/components/ui/empty-block';
import { FilterChip } from '@/components/ui/filter-chip';
import { HeroStripes } from '@/components/ui/hero-stripes';
import { SearchField } from '@/components/ui/search-field';
import { Text } from '@/components/ui/text';
import { athleteCardModel } from '@/features/assessment/athlete-card-model';
import { hasActivity, openSession, summarizeAthlete, type Assessment } from '@/features/assessment/model';
import { useAllAssessments } from '@/features/assessment/queries';
import { recommendNext } from '@/features/assessment/recommend';
import { AthleteCard } from '@/features/athletes/components/athlete-card';
import { matchesQuery } from '@/features/athletes/model';
import { useAthletes } from '@/features/athletes/queries';
import { useAllPrograms } from '@/features/programs/queries';
import { useDebounce } from '@/hooks/use-debounce';
import { CONTENT_MAX } from '@/lib/layout/breakpoints';
import { useListColumns, useTabSceneBottomInset } from '@/lib/layout/use-layout';
import { useColorTokens } from '@/lib/theme/tokens';

type Filter = 'all' | 'inProgress' | 'noTest' | 'evaluated';
const FILTERS: readonly Filter[] = ['all', 'inProgress', 'noTest', 'evaluated'];

const WEEK = 7 * 86_400_000;

/** Son `window` ms içinde test edilen sporcu sayısı (saat okuması bileşenin dışında). */
function countTestedSince(lastTests: (number | null)[], window: number, now: number = Date.now()): number {
  return lastTests.filter((last) => last !== null && now - last < window).length;
}

/**
 * Ana sayfa = Sporcular (Kamil, 2 Kasım 2026). Üstte volt özet kartı, arama ve süzgeç; altta büyük sporcu kartları
 * (son test tarihi, hangi testler yapıldı, seviyeler, sıradaki önerilen test). Karta dokunmak analiz sayfasını açar;
 * kartın volt şeridi yarım kalan teste kaldığı yerden devam ettirir.
 */
export default function AthletesHome() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = useTabSceneBottomInset();
  const columns = useListColumns({ inTabs: true });
  const [foreground, muted, primaryFg] = useColorTokens(['foreground', 'muted-foreground', 'primary-foreground']);

  const athletes = useAthletes();
  const assessments = useAllAssessments();
  const programs = useAllPrograms();
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 200);
  const [filter, setFilter] = useState<Filter>('all');

  const byAthlete = useMemo(() => {
    const map = new Map<string, Assessment[]>();
    for (const item of assessments.data ?? []) map.set(item.athleteId, [...(map.get(item.athleteId) ?? []), item]);
    return map;
  }, [assessments.data]);

  const programCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of programs.data ?? []) map.set(item.athleteId, (map.get(item.athleteId) ?? 0) + 1);
    return map;
  }, [programs.data]);

  const statusOf = (athleteId: string): Exclude<Filter, 'all'> | null => {
    const list = byAthlete.get(athleteId) ?? [];
    const open = openSession(list.filter(hasActivity));
    if (open) return 'inProgress';
    const summary = summarizeAthlete(list);
    if (summary.sessionCount === 0) return 'noTest';
    return summary.latestEvaluated ? 'evaluated' : null;
  };

  const list = athletes.data ?? [];
  const counts = Object.fromEntries(FILTERS.map((key) => [key, key === 'all' ? list.length : list.filter((a) => statusOf(a.id) === key).length])) as Record<Filter, number>;
  const visible = list.filter((athlete) => matchesQuery(athlete, debounced) && (filter === 'all' || statusOf(athlete.id) === filter));

  const testedThisWeek = countTestedSince(list.map((athlete) => summarizeAthlete(byAthlete.get(athlete.id) ?? []).lastTestAt), WEEK);

  // Sıra: süren testi olanlar üstte, sonra son test tarihi (yeniden eskiye), sonra hiç test olmayanlar (yeni kayıt üstte).
  const rank = (athleteId: string) => {
    const summary = summarizeAthlete(byAthlete.get(athleteId) ?? []);
    return { open: statusOf(athleteId) === 'inProgress' ? 0 : 1, last: summary.lastTestAt ?? -1 };
  };
  const ordered = [...visible].sort((a, b) => {
    const ra = rank(a.id);
    const rb = rank(b.id);
    return ra.open - rb.open || rb.last - ra.last || b.createdAt - a.createdAt;
  });
  const cards = ordered.map((athlete) => athleteCardModel(t, athlete, byAthlete.get(athlete.id) ?? [], programCount.get(athlete.id) ?? 0));

  function continueTest(athleteId: string) {
    const open = openSession(byAthlete.get(athleteId) ?? []);
    if (!open) return;
    const next = recommendNext(open);
    router.push(
      next
        ? { pathname: '/athletes/[id]/session/[sessionId]/[step]', params: { id: athleteId, sessionId: open.id, step: next.step } }
        : { pathname: '/athletes/[id]/session/[sessionId]/result', params: { id: athleteId, sessionId: open.id } },
    );
  }

  const loading = athletes.isPending || assessments.isPending;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <FlashList
        data={loading ? [] : cards}
        keyExtractor={(item) => item.id}
        numColumns={columns}
        renderItem={({ item }) => (
          <View style={columns > 1 ? { paddingHorizontal: 5 } : undefined}>
            <AthleteCard
              card={item}
              onOpen={(id) => router.push({ pathname: '/athletes/[id]', params: { id } })}
              onContinue={continueTest}
            />
          </View>
        )}
        style={{ width: '100%', maxWidth: CONTENT_MAX.wide + 32, alignSelf: 'center' }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: bottomInset + 24 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <View className="gap-3.5 pb-3.5">
            <View className="flex-row items-end justify-between gap-2">
              <Text accessibilityRole="header" className="flex-1 text-[34px] font-extrabold leading-[40px] tracking-tight text-foreground">
                {t('athletes.title')}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('athletes.add')}
                onPress={() => router.push('/athletes/new')}
                hitSlop={4}
                className="h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-80"
              >
                <Plus size={22} color={primaryFg} strokeWidth={2.4} />
              </Pressable>
            </View>

            <View className="flex-row overflow-hidden rounded-[22px] border border-primary bg-primary px-2 py-4">
              <HeroStripes width={190} opacity={0.1} />
              {[
                { value: list.length, label: t('athletes.stats.athletes') },
                { value: testedThisWeek, label: t('athletes.stats.thisWeek') },
                { value: counts.inProgress, label: t('athletes.stats.inProgress') },
              ].map((item, index) => (
                <View
                  key={item.label}
                  accessible
                  accessibilityLabel={`${item.value} ${item.label}`}
                  className={`flex-1 items-center gap-0.5 ${index > 0 ? 'border-l border-primary-foreground/15' : ''}`}
                >
                  <Text className="font-num text-[26px] font-extrabold tracking-tight text-primary-foreground">
                    {loading ? '—' : item.value}
                  </Text>
                  <Text className="text-center text-[13px] font-semibold text-primary-foreground/75">{item.label}</Text>
                </View>
              ))}
            </View>

            {list.length > 0 ? (
              <>
                <SearchField value={query} onChangeText={setQuery} placeholder={t('athletes.search')} clearLabel={t('athletes.clearSearch')} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
                  {FILTERS.map((key) => (
                    <FilterChip
                      key={key}
                      label={t(`athletes.filters.${key}`)}
                      count={counts[key]}
                      active={filter === key}
                      onPress={() => setFilter(key)}
                    />
                  ))}
                </ScrollView>
              </>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View className="py-20">
              <ActivityIndicator color={muted} />
            </View>
          ) : list.length === 0 ? (
            <EmptyBlock
              icon={<UserPlus size={26} color={foreground} strokeWidth={1.6} />}
              title={t('athletes.empty.first.title')}
              description={t('athletes.empty.first.description')}
              actionLabel={t('athletes.empty.first.action')}
              onAction={() => router.push('/athletes/new')}
            />
          ) : (
            <EmptyBlock
              icon={<Users size={26} color={muted} strokeWidth={1.6} />}
              title={t('athletes.empty.filtered.title')}
              description={t('athletes.empty.filtered.description')}
              actionLabel={t('athletes.empty.filtered.action')}
              onAction={() => {
                setQuery('');
                setFilter('all');
              }}
              secondary
            />
          )
        }
      />
    </View>
  );
}
