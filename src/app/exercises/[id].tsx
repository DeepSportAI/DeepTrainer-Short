import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContentFrame } from '@/components/ui/content-frame';
import { StackTabBar } from '@/components/ui/floating-tab-bar';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { getExercise } from '@/features/exercises/catalog';
import { ExerciseMedia } from '@/features/exercises/components/exercise-media';

/** Hareket detayı: video (varsa) + tanıtım, bölgeler, zorluk, ekipman. */
export default function ExerciseDetailRoute() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const exercise = getExercise(id);

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-4" contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 24 }}>
        <ContentFrame kind="prose" className="gap-4">
          <ScreenHeader
            title={exercise ? t(`exercises.items.${exercise.id}.name`) : t('exercises.notFound')}
            subtitle={exercise ? t(`exercises.categories.${exercise.category}`) : null}
            onBack={() => router.back()}
            backLabel={t('common.back')}
          />
          {exercise ? <ExerciseMedia exerciseId={exercise.id} /> : <Text className="text-[14px] text-muted-foreground">{t('exercises.notFound')}</Text>}
        </ContentFrame>
      </ScrollView>
      <StackTabBar />
    </View>
  );
}
