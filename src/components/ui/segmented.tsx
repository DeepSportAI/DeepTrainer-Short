import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useColorToken } from '@/lib/theme/tokens';

export type SegmentOption<T extends string> = { value: T; label: string };

/**
 * Birkaç seçenekten biri — tema gibi az ve sabit seçenekli tercihler için. Seçili bölüm volt dolgu, koyu
 * yazı (`primary`, S00C3; koyu temada volt hale), ekran okuyucuya "seçili" bildirilir.
 *
 * `pill`: yeni tasarım dili (tasarım 03 `.seg`, Ayarlar › Tema) — kart zemininde kapsül, bölümler
 * kapsül. Görünen bölüm 38 pt; `hitSlop` dokunma alanını 44 pt'ye tamamlar. `rounded` eski düzen
 * (her bölüm en az 44 pt), henüz yenilenmeyen ekranlarda.
 *
 * `value` boş olabilir: isteğe bağlı bir soruda (geri bildirim "Bu sayfa işine yaradı mı?") hiçbir
 * bölüm seçili başlamaz.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  shape = 'rounded',
  compact = false,
}: {
  options: readonly SegmentOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  accessibilityLabel: string;
  shape?: 'rounded' | 'pill';
  /** Dar yerde (satırın altındaki seviye seçimi, tasarım 04 `.seg.sm3`): 12 pt yazı, dar dolgu. */
  compact?: boolean;
}) {
  const pill = shape === 'pill';
  const glow = useColorToken('glow');
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      className={
        pill
          ? 'flex-row gap-[3px] rounded-full border border-border bg-card p-[3px]'
          : 'flex-row rounded-xl border border-border bg-muted p-1'
      }
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            hitSlop={pill ? { top: 4, bottom: 4 } : undefined}
            className={`flex-1 items-center justify-center ${compact ? 'px-1' : 'px-2'} active:opacity-70 ${
              pill ? 'min-h-[38px] rounded-full' : 'min-h-11 rounded-lg'
            } ${selected ? 'bg-primary' : ''}`}
            style={selected && glow ? { boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 14, color: glow }] } : undefined}
          >
            <Text
              numberOfLines={1}
              className={`${compact ? 'text-[12px]' : 'text-[13px]'} ${
                selected ? 'font-bold text-primary-foreground' : pill ? 'font-medium text-foreground' : 'text-foreground'
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
