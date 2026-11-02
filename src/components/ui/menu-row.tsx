import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useColorToken } from '@/lib/theme/tokens';

/**
 * Alt sayfa menüsündeki tek eylem satırı. Yıkıcı eylem kırmızı yazılır; ikon rengini çağıran verir. İsteğe bağlı
 * ikinci satır (ne yapacağı ya da neden kapalı olduğu), başka bir sayfaya götüren satırda ok.
 */
export function MenuRow({
  icon,
  text,
  onPress,
  destructive = false,
  description,
  chevron = false,
  disabled = false,
}: {
  icon: ReactNode;
  text: string;
  onPress: () => void;
  destructive?: boolean;
  description?: string;
  chevron?: boolean;
  disabled?: boolean;
}) {
  const muted = useColorToken('muted-foreground');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityHint={description}
      disabled={disabled}
      onPress={onPress}
      className="min-h-12 flex-row items-center gap-3 active:opacity-60"
      style={disabled ? { opacity: 0.55 } : undefined}
    >
      {icon}
      <View className="flex-1 py-1">
        <Text className={`text-[14px] font-semibold ${destructive ? 'text-destructive' : 'text-foreground'}`}>{text}</Text>
        {description ? <Text className="mt-0.5 text-[11.5px] leading-4 text-muted-foreground">{description}</Text> : null}
      </View>
      {chevron ? <ChevronRight size={16} color={muted} strokeWidth={2} /> : null}
    </Pressable>
  );
}
