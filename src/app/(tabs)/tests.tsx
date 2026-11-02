import { useRouter } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ContentFrame } from '@/components/ui/content-frame';
import { DetailRow, DetailSection, NumberTile, RowGroup } from '@/components/ui/detail-parts';
import { HeroStripes } from '@/components/ui/hero-stripes';
import { Text } from '@/components/ui/text';
import { stepTitle } from '@/features/assessment/labels';
import { STAGES, STEP_ORDER, stageOf } from '@/features/assessment/protocol';
import { useTabSceneBottomInset } from '@/lib/layout/use-layout';
import { useColorToken } from '@/lib/theme/tokens';

/**
 * Önerilen testler: İlk ders test programı (30 dk) — aşamalar, süreleri ve her testin ne ölçtüğü. Test bir sporcuya
 * "Test al" ile yapılır; buradan protokol okunur.
 */
export default function TestsTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = useTabSceneBottomInset();
  const primaryFg = useColorToken('primary-foreground');

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-4" contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: bottomInset + 32 }}>
        <ContentFrame kind="prose">
          <Text accessibilityRole="header" className="text-[34px] font-extrabold leading-[40px] tracking-tight text-foreground">
            {t('tests.title')}
          </Text>

          <View className="mt-3.5 gap-2 overflow-hidden rounded-[22px] bg-primary px-3.5 py-3.5">
            <HeroStripes width={190} opacity={0.1} />
            <View className="flex-row items-center gap-1.5">
              <Clock size={15} color={primaryFg} strokeWidth={2.2} />
              <Text className="text-[12px] font-semibold text-primary-foreground/75">{t('tests.protocol.duration')}</Text>
            </View>
            <Text className="text-[22px] font-extrabold text-primary-foreground">{t('tests.protocol.title')}</Text>
            <Text className="text-[14px] leading-[20px] text-primary-foreground">{t('tests.protocol.description')}</Text>
            <View className="mt-1 self-start">
              <Button shape="pill" variant="outline" label={t('tests.protocol.start')} onPress={() => router.push('/pick-athlete')} />
            </View>
          </View>

          {STAGES.map((stage) => (
            <View key={stage.id}>
              <DetailSection title={t(`assessment.stages.${stage.id}`)} right={t('assessment.minutes', { from: stage.minutes[0], to: stage.minutes[1] })} />
              <RowGroup>
                {STEP_ORDER.filter((step) => stageOf(step) === stage.id).map((step) => (
                  <DetailRow
                    key={step}
                    left={<NumberTile text={String(STEP_ORDER.indexOf(step) + 1)} />}
                    title={stepTitle(t, step)}
                    subtitle={t(`assessment.steps.${step}.target`)}
                    onPress={() => router.push({ pathname: '/tests/[id]', params: { id: step } })}
                  />
                ))}
              </RowGroup>
            </View>
          ))}

          <DetailSection title={t('assessment.result.title')} />
          <View className="rounded-[22px] border border-border bg-card px-3.5 py-3">
            <Text className="text-[14px] leading-[20px] text-foreground">{t('tests.resultDescription')}</Text>
          </View>
        </ContentFrame>
      </ScrollView>
    </View>
  );
}
