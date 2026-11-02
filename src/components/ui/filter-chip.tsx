import { ChevronDown } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { Text } from '@/components/ui/text';
import { useColorTokens } from '@/lib/theme/tokens';

/**
 * Süzgeç / sıralama çipi (tasarım 03 `.chip`): kapsül, kart zemini; seçiliyken volt dolu, koyu yazı (S00C3).
 *
 * `count` etiketin yanında soluk yazılır ("Tümü 38"). `chevron` çip bir seçim sayfası açıyorsa
 * ("Ada göre ⌄"). Görünen yükseklik 36 pt; `hitSlop` ile dokunma alanı 44 pt'ye tamamlanır.
 */
export function FilterChip({
  label,
  count,
  active = false,
  chevron = false,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  count?: number | null;
  active?: boolean;
  chevron?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const [activeFg, foreground] = useColorTokens(['primary-foreground', 'foreground']);
  const textColor = active ? 'text-primary-foreground' : 'text-foreground';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (typeof count === 'number' ? `${label} ${count}` : label)}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      hitSlop={4}
      className={`min-h-9 flex-row items-center gap-1.5 rounded-full border px-3.5 active:opacity-70 ${
        active ? 'border-primary bg-primary' : 'border-border bg-card'
      }`}
    >
      <Text numberOfLines={1} className={`max-w-[150px] text-[13px] font-semibold ${textColor}`}>
        {label}
      </Text>
      {typeof count === 'number' ? (
        <Text className={`text-[13px] font-medium opacity-70 ${textColor}`} style={{ fontVariant: ['tabular-nums'] }}>
          {count}
        </Text>
      ) : null}
      {chevron ? <ChevronDown size={14} color={active ? activeFg : foreground} strokeWidth={2} /> : null}
    </Pressable>
  );
}
