import { ChevronRight, Flag, Play, Sparkles } from 'lucide-react-native';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { DoneMark, PendingMark } from '@/components/ui/detail-parts';
import { LevelBadge, type Tone } from '@/components/ui/level-badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Text } from '@/components/ui/text';
import { useColorTokens } from '@/lib/theme/tokens';

/**
 * Ana sayfanın sporcu kartı (Kamil, 2 Kasım 2026: "son test tarihi ne zaman oldu, hangi testler yapıldı diye bir kart
 * olsun; sporcu kartı biraz daha büyük olabilir"). Sunumsal: içerik `features/assessment/athlete-card-model.ts`'ten,
 * gezinme rotadan gelir.
 *
 * Kartın tamamı sporcunun analiz sayfasını açar; alttaki volt şerit varsa yarım kalan teste devam ettirir (sıradaki
 * önerilen testle).
 */
export type AthleteCardModel = {
  id: string;
  name: string;
  initials: string;
  meta: string;
  lastTest: { date: string; ago: string } | null;
  progress: { done: number; total: number } | null;
  steps: { key: string; label: string; done: boolean }[];
  levels: { key: string; label: string; tone: Tone | null }[];
  next: { title: string; reason: string } | null;
  programCount: number;
  /** Hedef özeti: "2 yolunda · 1 riskte", en kötü duruma göre renk; ölçüm zamanı geldiyse belirtilir. */
  goals: { text: string; tone: 'good' | 'warn' | 'bad' | 'info'; checkDue: boolean } | null;
};

export const AthleteCard = memo(function AthleteCard({
  card,
  onOpen,
  onContinue,
}: {
  card: AthleteCardModel;
  onOpen: (id: string) => void;
  onContinue: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [muted, primaryFg, success, warning, destructive, interactive] = useColorTokens([
    'muted-foreground',
    'primary-foreground',
    'success',
    'warning',
    'destructive',
    'interactive',
  ]);

  return (
    <View className="mb-3 overflow-hidden rounded-[24px] border border-border bg-card">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${card.name}, ${card.meta}`}
        accessibilityHint={t('athletes.card.openHint')}
        onPress={() => onOpen(card.id)}
        className="gap-3 px-3.5 pb-3.5 pt-3 active:opacity-80"
      >
        <View className="flex-row items-center gap-3">
          <View className="h-[52px] w-[52px] items-center justify-center rounded-full bg-primary">
            <Text allowFontScaling={false} className="text-[18px] font-bold text-primary-foreground">
              {card.initials}
            </Text>
          </View>
          <View className="flex-1">
            <Text numberOfLines={1} className="text-[18px] font-bold leading-[23px] text-foreground">
              {card.name}
            </Text>
            {card.meta ? (
              <Text numberOfLines={1} className="text-[13px] text-muted-foreground">
                {card.meta}
              </Text>
            ) : null}
          </View>
          <ChevronRight size={20} color={muted} strokeWidth={2} />
        </View>

        <View className="flex-row gap-2">
          <View className="flex-1 rounded-[14px] bg-surface-2 px-3 py-2">
            <Text className="text-[12px] font-semibold text-muted-foreground">{t('athletes.card.lastTest')}</Text>
            <Text numberOfLines={1} className="text-[15px] font-bold text-foreground">
              {card.lastTest ? card.lastTest.date : t('athletes.card.noTest')}
            </Text>
            {card.lastTest ? (
              <Text numberOfLines={1} className="text-[12px] text-muted-foreground">
                {card.lastTest.ago}
              </Text>
            ) : null}
          </View>
          <View className="flex-1 rounded-[14px] bg-surface-2 px-3 py-2">
            <Text className="text-[12px] font-semibold text-muted-foreground">{t('athletes.card.tests')}</Text>
            <Text className="font-num text-[15px] font-extrabold text-foreground">
              {card.progress ? `${card.progress.done}/${card.progress.total}` : '—'}
            </Text>
            <View className="mt-1.5">
              <ProgressBar value={card.progress ? card.progress.done / Math.max(card.progress.total, 1) : 0} height={5} />
            </View>
          </View>
        </View>

        {card.steps.length > 0 ? (
          <View className="flex-row flex-wrap gap-1.5" accessible accessibilityLabel={t('athletes.card.stepsLabel')}>
            {card.steps.map((step) => (
              <View
                key={step.key}
                className={`flex-row items-center gap-1 rounded-full border py-0.5 pl-0.5 pr-2 ${
                  step.done ? 'border-success/40 bg-success/10' : 'border-border bg-card'
                }`}
              >
                {step.done ? <DoneMark size={16} /> : <PendingMark size={16} />}
                <Text className={`text-[12px] font-semibold ${step.done ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {card.levels.length > 0 ? (
          <View className="flex-row flex-wrap gap-x-3 gap-y-1.5 border-t border-border pt-2.5">
            {card.levels.map((level) => (
              <View key={level.key} className="flex-row items-center gap-1.5">
                <Text className="text-[12px] text-muted-foreground">{level.key}</Text>
                <LevelBadge tone={level.tone} label={level.label} />
              </View>
            ))}
          </View>
        ) : null}

        {card.goals ? (
          <View className="flex-row items-center gap-2 rounded-[14px] bg-surface-2 px-3 py-2">
            <Flag size={14} color={card.goals.tone === 'good' ? success : card.goals.tone === 'warn' ? warning : card.goals.tone === 'bad' ? destructive : interactive} strokeWidth={2.2} />
            <Text numberOfLines={1} className="flex-1 text-[13px] font-semibold text-foreground">
              {card.goals.text}
            </Text>
            {card.goals.checkDue ? (
              <View className="rounded-full bg-warning/15 px-2 py-0.5">
                <Text className="text-[11px] font-bold text-warning">{t('athletes.card.checkDue')}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {card.programCount > 0 ? (
          <View className="flex-row items-center gap-1.5">
            <Sparkles size={14} color={muted} strokeWidth={2} />
            <Text className="text-[12px] text-muted-foreground">{t('athletes.card.programs', { count: card.programCount })}</Text>
          </View>
        ) : null}
      </Pressable>

      {card.next ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t('athletes.card.continue')}: ${card.next.title}`}
          onPress={() => onContinue(card.id)}
          className="flex-row items-center gap-3 bg-primary px-3.5 py-3 active:opacity-80"
        >
          <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/10">
            <Play size={16} color={primaryFg} fill={primaryFg} strokeWidth={2} />
          </View>
          <View className="flex-1">
            <Text className="text-[12px] font-semibold text-primary-foreground/70">{t('athletes.card.nextLabel')}</Text>
            <Text numberOfLines={1} className="text-[15px] font-bold text-primary-foreground">
              {card.next.title}
            </Text>
            <Text numberOfLines={1} className="text-[12px] text-primary-foreground/70">
              {card.next.reason}
            </Text>
          </View>
          <ChevronRight size={18} color={primaryFg} strokeWidth={2.2} />
        </Pressable>
      ) : null}
    </View>
  );
});
