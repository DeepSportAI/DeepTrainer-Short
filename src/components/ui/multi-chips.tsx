import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useColorToken } from '@/lib/theme/tokens';

/** Çok seçimli çip sırası (hedefler, ağrı bölgeleri, ekipman) — `ChoiceChips`'in çoklu karşılığı, aynı görünüm. */
export function MultiChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: readonly { value: T; label: string }[];
  value: readonly T[];
  onChange: (value: T[]) => void;
}) {
  const primaryFg = useColorToken('primary-foreground');
  return (
    <View className="gap-1.5">
      {label ? <Text className="text-[13px] font-semibold text-foreground">{label}</Text> : null}
      <View accessibilityLabel={label} className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const selected = value.includes(option.value);
          return (
            <Pressable
              key={option.value}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              onPress={() => onChange(selected ? value.filter((item) => item !== option.value) : [...value, option.value])}
              hitSlop={{ top: 5, bottom: 5 }}
              className={`min-h-[34px] flex-row items-center gap-1 rounded-full border px-[13px] active:opacity-70 ${
                selected ? 'border-primary bg-primary' : 'border-border bg-card'
              }`}
            >
              {selected ? <Check size={14} color={primaryFg} strokeWidth={2.6} /> : null}
              <Text className={`text-[13px] font-semibold ${selected ? 'text-primary-foreground' : 'text-foreground'}`}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
