import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useColorToken } from '@/lib/theme/tokens';

/**
 * Yığın ekranlarının başlık satırı (tasarım dili: U4·10, 03S · 3i, 10P-3, 17N): yuvarlak kenarlıklı geri düğmesi,
 * 20 pt başlık, altında isteğe bağlı soluk satır ve sağda isteğe bağlı öğe (rozet, düğme).
 *
 * `FormScreen`, sporcu `StackScreen`'i ve okuma sayfası (`ModalDocument`) bunu çizer; güvenli alanı ve yatay
 * boşluğu kabuk verir.
 */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel,
  accessory,
}: {
  title: string;
  subtitle?: string | null;
  onBack: () => void;
  backLabel: string;
  accessory?: ReactNode;
}) {
  const foreground = useColorToken('foreground');

  return (
    <View className="min-h-11 flex-row items-center gap-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        onPress={onBack}
        hitSlop={6}
        className="h-11 w-11 items-center justify-center rounded-full border border-border bg-card active:opacity-70"
      >
        <ChevronLeft size={22} color={foreground} strokeWidth={2.2} />
      </Pressable>
      <View className="min-w-0 flex-1">
        <Text accessibilityRole="header" numberOfLines={1} className="text-[20px] font-bold leading-[26px] text-foreground">
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} className="text-[13px] text-muted-foreground">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {accessory ? <View>{accessory}</View> : null}
    </View>
  );
}
