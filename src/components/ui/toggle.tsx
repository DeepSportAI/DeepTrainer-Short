import { Switch, type SwitchProps } from 'react-native';

import { useColorTokens } from '@/lib/theme/tokens';

/**
 * Aç / kapa anahtarı — RN `Switch`'in renkleri token'dan (S00C3): açıkken volt ray (`primary`) ve koyu düğme
 * (`primary-foreground`; beyaz düğme volt rayda 1,2:1 kalır, görünmez), kapalıyken `border` ray ve platformun
 * kendi düğmesi. Renk prop'u çağıran yerde yazılmaz; anahtar gereken her yer bunu kullanır.
 */
export function Toggle(props: Omit<SwitchProps, 'trackColor' | 'thumbColor' | 'ios_backgroundColor'>) {
  const [primary, primaryFg, border] = useColorTokens(['primary', 'primary-foreground', 'border']);
  return (
    <Switch
      {...props}
      trackColor={{ true: primary, false: border }}
      thumbColor={props.value ? primaryFg : undefined}
      ios_backgroundColor={border}
    />
  );
}
