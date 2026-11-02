import type { ComponentPropsWithRef } from 'react';
// Bu dosya ve `text-input.tsx` RN metin bileşenini doğrudan içe aktaran TEK yerlerdir (`verify:theme`).
import { Text as NativeText } from 'react-native';

import { useBrandTextFont, withTextFontClass } from '@/lib/theme/fonts';

/**
 * Uygulamanın `Text`'i: React Native'inkiyle aynı, önüne metin yazı tipini (Barlow, `font-sans`) ekler.
 *
 * RN'de genel varsayılan yazı tipi yok; her metin buradan geçer. Bütün prop'lar olduğu gibi gider,
 * çağıranın `className`'i SONRA geldiği için `font-num` gibi bir aile kazanır, `style.fontFamily` de
 * her zaman kazanır. İç içe metin de aileyi yeniden alır (birim "cm" sayının fontunu miras almaz).
 * Rusçada aile eklenmez (Barlow'da Kiril yok) — bkz. `lib/theme/fonts`.
 */
export function Text(props: ComponentPropsWithRef<typeof NativeText>) {
  const brand = useBrandTextFont();
  return <NativeText {...props} className={withTextFontClass(props.className, brand)} />;
}
