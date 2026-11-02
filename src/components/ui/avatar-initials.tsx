import { View } from 'react-native';

import { Text } from '@/components/ui/text';

/**
 * Volt baş harf dairesi (S00C3 `.avc`): sporcunun kendi yüzü — koçun sporcu kartındaki daireyle aynı (volt dolgu,
 * koyu yazı, iki temada aynı). Kimlikten renk türetilmez; sporcu kendini hep aynı renkte görür.
 */
export function PrimaryInitials({ initials, size = 42, radius = 13 }: { initials: string; size?: number; radius?: number }) {
  return (
    <View className="items-center justify-center bg-primary" style={{ width: size, height: size, borderRadius: radius }}>
      <Text allowFontScaling={false} style={{ fontSize: size * 0.34 }} className="font-bold text-primary-foreground">
        {initials}
      </Text>
    </View>
  );
}
