import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';

/**
 * Tek seçimli çip sırası (tasarım dili 22 Ekim: kapsül, seçili olan volt dolu, koyu yazı). Az sayıda,
 * kısa seçenek içindir; uzun listeler `OptionSheet`'e gider. Satıra sığmayan çip alta geçer.
 *
 * `labelVariant="section"`: etiket alan etiketi değil BÖLÜM etiketi (tasarım `.sl`: küçük, soluk, büyük
 * harf) ve çiplerden bir satır aralığı uzakta — alttan açılan sayfadaki soru blokları (geri bildirim "Konu").
 */
export function ChoiceChips<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
  labelVariant = 'field',
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T | undefined;
  onChange: (value: T) => void;
  error?: string;
  labelVariant?: 'field' | 'section';
}) {
  const section = labelVariant === 'section';
  return (
    <View className={section ? 'gap-3' : 'gap-1.5'}>
      {section ? (
        <Text accessibilityRole="header" className="text-[13px] font-semibold text-muted-foreground">
          {label}
        </Text>
      ) : (
        <Text className="text-[13px] font-semibold text-foreground">{label}</Text>
      )}
      <View accessibilityRole="radiogroup" accessibilityLabel={label} className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              hitSlop={{ top: 5, bottom: 5 }}
              className={`min-h-[34px] justify-center rounded-full border px-[13px] active:opacity-70 ${
                selected ? 'border-primary bg-primary' : 'border-border bg-card'
              }`}
            >
              <Text
                className={`text-[13px] font-semibold ${selected ? 'text-primary-foreground' : 'text-foreground'}`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <Text accessibilityRole="alert" className="text-xs text-destructive">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
