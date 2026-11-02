import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useColorToken, type ColorToken } from '@/lib/theme/tokens';

/**
 * Üç kademeli seviye (zayıf / orta / iyi — kondisyonda düşük / orta / iyi): renkli nokta + ad. Renkler
 * değerlendirme merdiveninden (`level-*`), volt ile karışmaz.
 */
export type Tone = 'weak' | 'medium' | 'good';

export const TONE_TOKENS: Record<Tone, ColorToken> = { weak: 'level-1', medium: 'level-3', good: 'level-4' };

export function LevelBadge({ tone, label, size = 'sm' }: { tone: Tone | null; label: string; size?: 'sm' | 'md' }) {
  const color = useColorToken(tone ? TONE_TOKENS[tone] : 'border');
  return (
    <View className="flex-row items-center gap-1.5">
      <View className={size === 'md' ? 'h-2.5 w-2.5 rounded-full' : 'h-2 w-2 rounded-full'} style={{ backgroundColor: color }} />
      <Text className={`${size === 'md' ? 'text-[14px]' : 'text-[12px]'} font-semibold ${tone ? 'text-foreground' : 'text-muted-foreground'}`}>
        {label}
      </Text>
    </View>
  );
}

/** Üç çubuklu ölçek (hareket zorluğu: kolay 1 · orta 2 · zor 3). */
export function StepMeter({ steps, total = 3, label }: { steps: number; total?: number; label?: string }) {
  const tone: ColorToken = steps <= 1 ? 'level-4' : steps === 2 ? 'level-3' : 'level-2';
  const fill = useColorToken(tone);
  const track = useColorToken('border');
  return (
    <View className="flex-row items-center gap-1.5" accessible accessibilityLabel={label}>
      <View className="flex-row items-end gap-[3px]">
        {Array.from({ length: total }, (_, index) => (
          <View
            key={index}
            className="w-[5px] rounded-full"
            style={{ height: 7 + index * 3, backgroundColor: index < steps ? fill : track }}
          />
        ))}
      </View>
      {label ? <Text className="text-[12px] font-semibold text-foreground">{label}</Text> : null}
    </View>
  );
}
