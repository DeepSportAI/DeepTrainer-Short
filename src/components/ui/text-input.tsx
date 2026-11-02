import type { ComponentPropsWithRef } from 'react';
// Bu dosya ve `text.tsx` RN metin bileşenini doğrudan içe aktaran TEK yerlerdir (`verify:theme`).
import { TextInput as NativeTextInput } from 'react-native';

import { useBrandTextFont, withTextFontClass } from '@/lib/theme/fonts';

/**
 * Uygulamanın `TextInput`'u: React Native'inkiyle aynı, önüne metin yazı tipini (Barlow, `font-sans`)
 * ekler. Bütün prop'lar (ref dahil) olduğu gibi gider; çağıranın `className`'i ve `style`'ı kazanır.
 * Rusçada aile eklenmez — bkz. `lib/theme/fonts`.
 */
export function TextInput(props: ComponentPropsWithRef<typeof NativeTextInput>) {
  const brand = useBrandTextFont();
  return <NativeTextInput {...props} className={withTextFontClass(props.className, brand)} />;
}

/** `useRef<TextInputRef>(null)` → `focus()`, `blur()`: RN örnek tipi. */
export type TextInputRef = NativeTextInput;
