import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { PlayCircle, Dumbbell } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyBlock } from '@/components/ui/empty-block';
import { FilterChip } from '@/components/ui/filter-chip';
import { StepMeter } from '@/components/ui/level-badge';
import { SearchField } from '@/components/ui/search-field';
import { Text } from '@/components/ui/text';
import {
  DIFFICULTIES,
  DIFFICULTY_STEPS,
  EXERCISES,
  EXERCISE_CATEGORIES,
  filterExercises,
  type Difficulty,
  type ExerciseCategory,
} from '@/features/exercises/catalog';
import { useDebounce } from '@/hooks/use-debounce';
import { CONTENT_MAX } from '@/lib/layout/breakpoints';
import { useListColumns, useTabSceneBottomInset } from '@/lib/layout/use-layout';
import { useColorTokens } from '@/lib/theme/tokens';

/**
 * Hareket kütüphanesi: videolu hareketler videosuyla, videosuzlar kısa tanıtım + bölgeler + zorlukla. Arama, bölüm
 * (alt vücut, üst vücut, core, kondisyon, mobilite), zorluk ve "yalnız videolu" süzgeci.
 */
export default function ExercisesTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = useTabSceneBottomInset();
  const columns = useListColumns({ inTabs: true });
  const [interactive, muted] = useColorTokens(['interactive', 'muted-foreground']);
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 200);
  const [category, setCategory] = useState<ExerciseCategory | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [videoOnly, setVideoOnly] = useState(false);

  const list = useMemo(
    () =>
      filterExercises(EXERCISES, { query: debounced, category, difficulty, region: null, videoOnly }, (id) => t(`exercises.items.${id}.name`)),
    [debounced, category, difficulty, videoOnly, t],
  );
  const videoCount = EXERCISES.filter((item) => item.video).length;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <FlashList
        data={list}
        numColumns={columns}
        keyExtractor={(item) => item.id}
        style={{ width: '100%', maxWidth: CONTENT_MAX.wide + 32, alignSelf: 'center' }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: bottomInset + 24 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <View className="gap-3.5 pb-3.5">
            <View>
              <Text accessibilityRole="header" className="text-[34px] font-extrabold leading-[40px] tracking-tight text-foreground">
                {t('exercises.title')}
              </Text>
              <Text className="text-[13px] text-muted-foreground">{t('exercises.subtitle', { count: EXERCISES.length, videos: videoCount })}</Text>
            </View>
            <SearchField value={query} onChangeText={setQuery} placeholder={t('exercises.search')} clearLabel={t('athletes.clearSearch')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              <FilterChip label={t('exercises.all')} active={category === null} onPress={() => setCategory(null)} />
              {EXERCISE_CATEGORIES.map((value) => (
                <FilterChip key={value} label={t(`exercises.categories.${value}`)} active={category === value} onPress={() => setCategory(category === value ? null : value)} />
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {DIFFICULTIES.map((value) => (
                <FilterChip key={value} label={t(`exercises.difficulty.${value}`)} active={difficulty === value} onPress={() => setDifficulty(difficulty === value ? null : value)} />
              ))}
              <FilterChip label={t('exercises.videoOnly')} active={videoOnly} onPress={() => setVideoOnly(!videoOnly)} />
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => (
          <View style={columns > 1 ? { paddingHorizontal: 5 } : undefined}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/exercises/[id]', params: { id: item.id } })}
              className="mb-2 flex-row items-center gap-3 rounded-[20px] border border-border bg-card px-3.5 py-3 active:opacity-75"
            >
              <View className="h-11 w-11 items-center justify-center rounded-full bg-surface-2">
                {item.video ? <PlayCircle size={22} color={interactive} strokeWidth={2} /> : <Dumbbell size={20} color={muted} strokeWidth={2} />}
              </View>
              <View className="flex-1 gap-0.5">
                <Text numberOfLines={1} className="text-[15px] font-bold text-foreground">
                  {t(`exercises.items.${item.id}.name`)}
                </Text>
                <Text numberOfLines={1} className="text-[12px] text-muted-foreground">
                  {item.regions.slice(0, 3).map((region) => t(`exercises.regions.${region}`)).join(' · ')}
                </Text>
              </View>
              <StepMeter steps={DIFFICULTY_STEPS[item.difficulty]} label={t(`exercises.difficulty.${item.difficulty}`)} />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <EmptyBlock
            icon={<Dumbbell size={26} color={muted} strokeWidth={1.6} />}
            title={t('exercises.empty.title')}
            description={t('exercises.empty.description')}
            actionLabel={t('exercises.empty.action')}
            secondary
            onAction={() => {
              setQuery('');
              setCategory(null);
              setDifficulty(null);
              setVideoOnly(false);
            }}
          />
        }
      />
    </View>
  );
}
