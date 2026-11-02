import { View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { useColorTokens } from '@/lib/theme/tokens';

/**
 * Volt dolgulu kartın sağındaki üç eğik şerit (tasarım S00C3: ana sayfa özet kartı `.nh`, sporcu kartının
 * sayı şeridi `.ahs`). Yalnız süs: dokunmayı geçirir, ekran okuyucuya görünmez. Renk volt üstü yazının rengi,
 * düşük saydamlıkla — iki temada da aynı (volt iki temada da aynı). Kapsayıcı `overflow-hidden` olmalı ve
 * şerit İLK çocuk olarak konur ki içerik üstünde kalsın.
 */
export function HeroStripes({ width = 150, opacity = 0.09 }: { width?: number; opacity?: number }) {
  const [color] = useColorTokens(['primary-foreground']);
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width, opacity }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 160 100" preserveAspectRatio="xMaxYMid slice">
        <Polygon points="62,0 96,0 52,100 18,100" fill={color} />
        <Polygon points="104,0 122,0 78,100 60,100" fill={color} />
        <Polygon points="130,0 140,0 96,100 86,100" fill={color} />
      </Svg>
    </View>
  );
}
