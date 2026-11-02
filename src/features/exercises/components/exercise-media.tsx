import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Play, VideoOff } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Tag } from '@/components/ui/detail-parts';
import { StepMeter } from '@/components/ui/level-badge';
import { Text } from '@/components/ui/text';
import { useColorTokens } from '@/lib/theme/tokens';

import { DIFFICULTY_STEPS, exerciseVideoUrl, getExercise, type Difficulty, type Region } from '../catalog';

/**
 * Hareketin gösterimi — sistematik yapı: video VARSA video (dokununca oynar, cihazın denetimleri), her durumda kısa
 * tanıtım + çalıştırdığı bölgeler + zorluk (kolay · orta · zor). Video kutusu iki temada da koyu (`overlay-base`).
 */
export function ExerciseVideo({ url }: { url: string }) {
  const { t } = useTranslation();
  const [primaryFg] = useColorTokens(['primary-foreground']);
  const [started, setStarted] = useState(false);
  const player = useVideoPlayer(url, (instance) => {
    instance.loop = true;
    instance.muted = true;
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });

  if (status === 'error') return <NoVideo text={t('exercises.media.videoError')} />;

  return (
    <View className="overflow-hidden rounded-[22px] bg-overlay-base" style={{ aspectRatio: 16 / 10 }}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls={started} />
      {!started ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('exercises.media.play')}
          onPress={() => {
            setStarted(true);
            player.play();
          }}
          className="absolute inset-0 items-center justify-center active:opacity-80"
        >
          <View className="h-14 w-14 items-center justify-center rounded-full bg-primary">
            <Play size={24} color={primaryFg} fill={primaryFg} strokeWidth={0} />
          </View>
          <Text className="mt-2 text-[12px] font-semibold text-overlay-ink">{t('exercises.media.tapToPlay')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function NoVideo({ text }: { text: string }) {
  const [muted] = useColorTokens(['muted-foreground']);
  return (
    <View className="flex-row items-center gap-2 rounded-[18px] border border-dashed border-border bg-card px-3.5 py-3">
      <VideoOff size={18} color={muted} strokeWidth={1.8} />
      <Text className="flex-1 text-[13px] text-muted-foreground">{text}</Text>
    </View>
  );
}

/** Tanıtım bloğu: açıklama, bölge çipleri, zorluk ölçeği. Katalog dışı hareket için değerler dışarıdan verilir. */
export function ExerciseIntro({
  description,
  regions,
  difficulty,
  equipment,
}: {
  description: string;
  regions: readonly Region[] | readonly string[];
  difficulty: Difficulty;
  equipment?: readonly string[];
}) {
  const { t } = useTranslation();
  return (
    <View className="gap-2.5 rounded-[22px] border border-border bg-card px-3.5 py-3">
      <Text className="text-[14px] leading-[20px] text-foreground">{description}</Text>
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-[12px] font-semibold text-muted-foreground">{t('exercises.media.difficulty')}</Text>
        <StepMeter steps={DIFFICULTY_STEPS[difficulty]} label={t(`exercises.difficulty.${difficulty}`)} />
      </View>
      <View className="gap-1.5">
        <Text className="text-[12px] font-semibold text-muted-foreground">{t('exercises.media.regions')}</Text>
        <View className="flex-row flex-wrap gap-1.5">
          {regions.map((region) => (
            <Tag key={region} label={t(`exercises.regions.${region}`)} />
          ))}
        </View>
      </View>
      {equipment && equipment.length > 0 ? (
        <Text className="text-[12px] text-muted-foreground">
          {t('exercises.media.equipment')}: {equipment.map((item) => t(`exercises.equipment.${item}`)).join(', ')}
        </Text>
      ) : null}
    </View>
  );
}

/** Katalog hareketinin tam gösterimi: video (varsa) + tanıtım. */
export function ExerciseMedia({ exerciseId, showName = false }: { exerciseId: string; showName?: boolean }) {
  const { t } = useTranslation();
  const exercise = getExercise(exerciseId);
  if (!exercise) return null;
  const url = exerciseVideoUrl(exercise);
  return (
    <View className="gap-2.5">
      {showName ? <Text className="text-[13px] font-semibold text-muted-foreground">{t(`exercises.items.${exercise.id}.name`)}</Text> : null}
      {url ? <ExerciseVideo url={url} /> : <NoVideo text={t('exercises.media.noVideo')} />}
      <ExerciseIntro
        description={t(`exercises.items.${exercise.id}.description`)}
        regions={exercise.regions}
        difficulty={exercise.difficulty}
        equipment={exercise.equipment}
      />
    </View>
  );
}
