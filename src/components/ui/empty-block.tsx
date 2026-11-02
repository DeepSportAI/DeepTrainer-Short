import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

import { Button } from './button';

/**
 * Liste ekranlarının boş/hata bloğu: simge, başlık, ne yapılacağını söyleyen açıklama ve tek eylem.
 *
 * `secondary` hata ve "süzgeç boş" durumları için: eylem çerçeveli kapsül, parıltısız. Volt (parıltılı)
 * kapsül yalnız "ilk kaydı ekle" gibi ilerleten eylemde kullanılır.
 */
export function EmptyBlock({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondary = false,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
  secondary?: boolean;
}) {
  return (
    <View className="items-center px-6 py-16">
      <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-surface-3">{icon}</View>
      <Text className="text-center text-base font-bold text-foreground">{title}</Text>
      <Text className="mt-1 max-w-[260px] text-center text-[12.5px] leading-5 text-muted-foreground">
        {description}
      </Text>
      <View className="mt-4 w-full max-w-[240px]">
        <Button
          shape="pill"
          label={actionLabel}
          onPress={onAction ?? (() => {})}
          disabled={!onAction}
          variant={secondary ? 'outline' : 'primary'}
          glow={!secondary}
        />
      </View>
    </View>
  );
}
