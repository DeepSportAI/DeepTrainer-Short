import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { useColorToken } from '@/lib/theme/tokens';

/**
 * Yuvarlak simge karosu (tasarım 03 `.tile`): kart zemini, ince kenarlık, simge vurgu renginde.
 * Takım satırının kalkanı, takım sayfasındaki "Dizilim" gibi yerlerde.
 */
export function IconTile({ icon: Icon, size = 40 }: { icon: LucideIcon; size?: number }) {
  const interactive = useColorToken('interactive');
  return (
    <View
      className="items-center justify-center rounded-full border border-border bg-card"
      style={{ width: size, height: size }}
    >
      <Icon size={Math.round(size / 2)} color={interactive} strokeWidth={2} />
    </View>
  );
}
