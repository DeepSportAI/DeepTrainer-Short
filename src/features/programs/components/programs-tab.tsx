import { CalendarDays, MessageSquarePlus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { DetailRow, DetailSection, RowGroup } from '@/components/ui/detail-parts';
import { Text } from '@/components/ui/text';
import { formatShortDate } from '@/lib/format/date';
import { useColorToken } from '@/lib/theme/tokens';

import { exerciseCount, type Program } from '../model';

/** Programlar: kaydedilen antrenman programları ve "Program oluştur" (sohbet). */
export function ProgramsTab({
  programs,
  onOpen,
  onCreate,
}: {
  programs: Program[];
  onOpen: (program: Program) => void;
  onCreate: () => void;
}) {
  const { t } = useTranslation();
  const interactive = useColorToken('interactive');

  return (
    <View>
      <View className="gap-3 rounded-[22px] border border-border bg-card px-3.5 py-3.5">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-interactive/10">
            <MessageSquarePlus size={20} color={interactive} strokeWidth={2} />
          </View>
          <View className="flex-1">
            <Text className="text-[16px] font-bold text-foreground">{t('programs.tab.createTitle')}</Text>
            <Text className="text-[13px] leading-[17px] text-muted-foreground">{t('programs.tab.createDescription')}</Text>
          </View>
        </View>
        <Button shape="pill" glow label={t('programs.tab.create')} onPress={onCreate} />
      </View>

      <DetailSection title={t('programs.tab.saved')} right={programs.length || null} />
      {programs.length === 0 ? (
        <Text className="mx-1 text-[13px] text-muted-foreground">{t('programs.tab.empty')}</Text>
      ) : (
        <RowGroup>
          {programs.map((program) => (
            <DetailRow
              key={program.id}
              left={
                <View className="h-10 w-10 items-center justify-center rounded-full border border-border bg-background">
                  <CalendarDays size={18} color={interactive} strokeWidth={2} />
                </View>
              }
              title={program.plan.title}
              subtitle={t('programs.tab.meta', {
                days: program.plan.daysPerWeek,
                weeks: program.plan.weeks,
                count: exerciseCount(program.plan),
                date: formatShortDate(program.updatedAt),
              })}
              onPress={() => onOpen(program)}
            />
          ))}
        </RowGroup>
      )}
    </View>
  );
}
