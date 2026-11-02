import { ArrowRight, ListChecks, Sparkles, TriangleAlert } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useColorTokens } from '@/lib/theme/tokens';

import { recommendationText } from '../labels';
import { stageOf } from '../protocol';
import type { Recommendation } from '../recommend';

/**
 * Bir test bitince açılan öneri (Kamil, 2 Kasım 2026: "birincinin sonunda şu testi yap diye öneri versinler"):
 * sıradaki önerilen adım, NEDEN o (bulgulara göre) ve varsa ağrı uyarısı. "Başla" doğrudan o adımı açar; başka bir
 * test seçmek için liste. Hepsi bittiyse sonuca geçilir.
 */
export function NextStepSheet({
  visible,
  recommendation,
  savedTitle,
  onStart,
  onList,
  onResult,
  onClose,
}: {
  visible: boolean;
  recommendation: Recommendation | null;
  savedTitle: string;
  onStart: () => void;
  onList: () => void;
  onResult: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [primaryFg, warning] = useColorTokens(['primary-foreground', 'warning']);
  const text = recommendation ? recommendationText(t, recommendation) : null;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      variant="panel"
      title={recommendation ? t('assessment.next.title') : t('assessment.next.allDone')}
      subtitle={t('assessment.next.saved', { step: savedTitle })}
      closeLabel={t('common.close')}
      footer={
        <View className="gap-2.5">
          {recommendation ? (
            <Button shape="pill" glow icon={ArrowRight} label={t('assessment.next.start', { step: text?.title })} onPress={onStart} />
          ) : (
            <Button shape="pill" glow icon={ArrowRight} label={t('assessment.next.toResult')} onPress={onResult} />
          )}
          <Button shape="pill" variant="outline" icon={ListChecks} label={t('assessment.next.chooseOther')} onPress={onList} />
        </View>
      }
    >
      {recommendation && text ? (
        <View className="gap-2.5 overflow-hidden rounded-[22px] bg-primary px-3.5 py-3">
          <View className="flex-row items-center gap-2">
            <Sparkles size={16} color={primaryFg} strokeWidth={2.2} />
            <Text className="text-[12px] font-semibold text-primary-foreground/70">{t(`assessment.stages.${stageOf(recommendation.step)}`)}</Text>
          </View>
          <Text className="text-[22px] font-extrabold leading-[26px] text-primary-foreground">{text.title}</Text>
          <Text className="text-[14px] leading-[20px] text-primary-foreground">{text.reason}</Text>
          {recommendation.option ? (
            <Text className="text-[13px] font-semibold text-primary-foreground/80">
              {t('assessment.next.option', { option: t(`assessment.conditioning.option.${recommendation.option}`) })}
            </Text>
          ) : null}
        </View>
      ) : (
        <Text className="text-[15px] leading-[21px] text-foreground">{t('assessment.next.allDoneDescription')}</Text>
      )}
      {recommendation && recommendation.caution.length > 0 ? (
        <View className="flex-row items-center gap-2 rounded-xl bg-warning/10 px-3 py-2.5">
          <TriangleAlert size={16} color={warning} strokeWidth={2} />
          <Text className="flex-1 text-[13px] text-foreground">
            {t('assessment.recommend.caution', { regions: recommendation.caution.map((region) => t(`assessment.painRegions.${region}`)).join(', ') })}
          </Text>
        </View>
      ) : null}
    </BottomSheet>
  );
}
