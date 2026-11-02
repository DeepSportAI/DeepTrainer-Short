import { Search, X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { TextInput } from '@/components/ui/text-input';
import { useColorTokens } from '@/lib/theme/tokens';

/**
 * Yuvarlak arama alanı. Metin varken sağda temizleme düğmesi belirir — telefonda
 * uzun bir aramayı tek tek silmek zahmetli.
 */
export function SearchField({
  value,
  onChangeText,
  placeholder,
  clearLabel,
}: {
  value: string;
  onChangeText: (next: string) => void;
  placeholder: string;
  clearLabel: string;
}) {
  const [muted, foreground] = useColorTokens(['muted-foreground', 'foreground']);

  return (
    <View className="min-h-12 flex-row items-center gap-2.5 rounded-full border border-border bg-card px-4">
      <Search size={18} color={muted} strokeWidth={2} />
      <TextInput
        accessibilityLabel={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={muted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        className="flex-1 py-3 text-[16px] text-foreground"
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={clearLabel}
          onPress={() => onChangeText('')}
          hitSlop={8}
          className="active:opacity-60"
        >
          <X size={18} color={foreground} strokeWidth={2} />
        </Pressable>
      ) : null}
    </View>
  );
}
