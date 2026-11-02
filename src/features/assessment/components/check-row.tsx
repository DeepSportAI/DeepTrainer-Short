import { Check, TriangleAlert } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useColorTokens } from '@/lib/theme/tokens';

/**
 * Kontrol maddesi: "Diz içe kaçıyor mu?" — iki seçenek: "Yok" (temiz, yeşil) ve "Var" (bulgu, turuncu). Bakılmadıysa
 * ikisi de boş kalır ve puana girmez.
 */
export function CheckRow({
  label,
  value,
  onChange,
  first,
}: {
  label: string;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
  first: boolean;
}) {
  const { t } = useTranslation();
  const [success, warning, successFg, warningFg] = useColorTokens(['success', 'warning', 'success-foreground', 'warning-foreground']);

  const option = (observed: boolean) => {
    const selected = value === observed;
    const bg = selected ? (observed ? 'bg-warning border-warning' : 'bg-success border-success') : 'bg-card border-border';
    const fg = selected ? (observed ? 'text-warning-foreground' : 'text-success-foreground') : 'text-foreground';
    const Icon = observed ? TriangleAlert : Check;
    return (
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={`${label}: ${observed ? t('assessment.check.yes') : t('assessment.check.no')}`}
        onPress={() => onChange(selected ? null : observed)}
        hitSlop={{ top: 4, bottom: 4 }}
        className={`min-h-[40px] min-w-[76px] flex-row items-center justify-center gap-1 rounded-full border px-3 active:opacity-70 ${bg}`}
      >
        <Icon size={14} color={selected ? (observed ? warningFg : successFg) : observed ? warning : success} strokeWidth={2.4} />
        <Text className={`text-[13px] font-bold ${fg}`}>{observed ? t('assessment.check.yes') : t('assessment.check.no')}</Text>
      </Pressable>
    );
  };

  return (
    <View className={`flex-row items-center gap-3 py-3 ${first ? '' : 'border-t border-border'}`} accessibilityRole="radiogroup">
      <Text className="flex-1 text-[15px] font-semibold leading-[20px] text-foreground">{label}</Text>
      <View className="flex-row gap-1.5">
        {option(false)}
        {option(true)}
      </View>
    </View>
  );
}
