import { ChevronLeft, MoreHorizontal } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { OutlineButton } from '@/components/ui/detail-parts';
import { HeroStripes } from '@/components/ui/hero-stripes';
import { Text } from '@/components/ui/text';
import { useColorTokens } from '@/lib/theme/tokens';

/**
 * Sporcunun analiz sayfasının üst kartı — DeepSport Atletik'teki sporcu kartının dili (tasarım 07F · 1): geri · volt
 * baş harf · ad · iki satır · volt sayı şeridi · iki çerçeveli düğme ("Test al" / "Program").
 */
export type HeaderStat = { value: string; unit?: string; label: string; word?: boolean };

function RoundIcon({ label, onPress, children }: { label: string; onPress: () => void; children: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      className="h-11 w-11 items-center justify-center rounded-full bg-surface-2 active:opacity-70"
    >
      {children}
    </Pressable>
  );
}

export function AthleteHeader({
  name,
  initials,
  lines,
  stats,
  onBack,
  onMore,
  primary,
  secondary,
}: {
  name: string;
  initials: string;
  lines: string[];
  stats: HeaderStat[];
  onBack: () => void;
  onMore: () => void;
  primary: { label: string; icon: ReactNode; onPress: () => void };
  secondary: { label: string; icon: ReactNode; onPress: () => void };
}) {
  const { t } = useTranslation();
  const [foreground] = useColorTokens(['foreground']);

  return (
    <View className="gap-2 rounded-[24px] border border-border bg-card px-2 pb-2.5 pt-2">
      <View className="min-h-[60px] flex-row items-center gap-2.5">
        <View className="self-start">
          <RoundIcon label={t('common.back')} onPress={onBack}>
            <ChevronLeft size={20} color={foreground} strokeWidth={2} />
          </RoundIcon>
        </View>
        <View className="h-14 w-14 items-center justify-center rounded-full bg-primary">
          <Text allowFontScaling={false} className="text-[19px] font-bold text-primary-foreground">
            {initials}
          </Text>
        </View>
        <View className="flex-1">
          <Text accessibilityRole="header" numberOfLines={1} className="text-[19px] font-bold leading-6 text-foreground">
            {name}
          </Text>
          {lines.filter(Boolean).map((line) => (
            <Text key={line} numberOfLines={1} className="text-[13px] leading-[17px] text-muted-foreground">
              {line}
            </Text>
          ))}
        </View>
        <View className="self-start">
          <RoundIcon label={t('athleteDetail.more')} onPress={onMore}>
            <MoreHorizontal size={20} color={foreground} strokeWidth={2} />
          </RoundIcon>
        </View>
      </View>

      <View className="-mx-2 flex-row overflow-hidden bg-primary py-2.5">
        <HeroStripes />
        {stats.map((stat, index) => (
          <View
            key={stat.label}
            accessible
            accessibilityLabel={`${stat.label}: ${stat.value}${stat.unit ? ` ${stat.unit}` : ''}`}
            className={`flex-1 items-center gap-px px-1 ${index > 0 ? 'border-l border-primary-foreground/15' : ''}`}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              className={`${stat.word ? '' : 'font-num '}text-[17px] font-extrabold leading-[21px] text-primary-foreground`}
            >
              {stat.value}
              {stat.unit ? <Text className="text-[11px] font-semibold text-primary-foreground/70"> {stat.unit}</Text> : null}
            </Text>
            <Text numberOfLines={1} className="text-[12px] font-semibold leading-[15px] text-primary-foreground/70">
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <OutlineButton label={primary.label} icon={primary.icon} onPress={primary.onPress} />
        </View>
        <View className="flex-1">
          <OutlineButton label={secondary.label} icon={secondary.icon} onPress={secondary.onPress} />
        </View>
      </View>
    </View>
  );
}

/** Kapsül sekmeler (kart zemininde, seçili volt dolu); dar ekranda yatay kayar. */
export function PillTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: readonly { value: T; label: string }[];
  value: T;
  onChange: (tab: T) => void;
}) {
  return (
    <View className="rounded-full border border-border bg-card p-[3px]">
      <ScrollView horizontal style={{ flexGrow: 0 }} showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }} accessibilityRole="tablist">
        {tabs.map((tab) => {
          const selected = tab.value === value;
          return (
            <Pressable
              key={tab.value}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => onChange(tab.value)}
              hitSlop={{ top: 4, bottom: 4 }}
              className={`min-h-[38px] flex-grow items-center justify-center rounded-full px-3 active:opacity-70 ${selected ? 'bg-primary' : ''}`}
            >
              <Text numberOfLines={1} className={`text-[13px] ${selected ? 'font-bold text-primary-foreground' : 'font-semibold text-foreground'}`}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
