import type { ReactNode } from 'react';
import { View } from 'react-native';

import { CONTENT_MAX, type ContentKind } from '@/lib/layout/breakpoints';

/**
 * İçeriği ortalar ve genişliğini sınırlar.
 *
 * Telefonda hiçbir şey yapmaz (üst sınır ekran genişliğinden büyük), tablette içeriği
 * ortada tutar. Her ekranın kendi `maxWidth` hesabını yapmaması için tek yerde duruyor —
 * yoksa biri unutulur ve yalnız o ekran tablette esner.
 */
export function ContentFrame({
  children,
  kind = 'form',
  className,
}: {
  children: ReactNode;
  kind?: ContentKind;
  className?: string;
}) {
  return (
    <View className={`w-full self-center ${className ?? ''}`} style={{ maxWidth: CONTENT_MAX[kind] }}>
      {children}
    </View>
  );
}
