import { ChevronRight } from 'lucide-react-native';
import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useColorToken } from '@/lib/theme/tokens';

/**
 * Gruplu liste — Profil ve Ayarlar'ın satırları (iOS ayarları düzeni).
 *
 * Satırlar arasındaki ayraçları grup kendisi koyar; satırın "sonuncu muyum" bilmesi gerekmez,
 * koşullu bir satır gizlenince ayraç da kendiliğinden düşer.
 *
 * Ölçüler tasarım 03'ten (22 Ekim): grup 22 pt yuvarlak, düz kart zemini; satır en az 62 pt,
 * etiket 16 pt yarı kalın; ayraç satır içeriğiyle aynı hizada.
 */
export function ListGroup({
  label,
  footer,
  flush = false,
  children,
}: {
  label?: string;
  footer?: string;
  /** Üst boşluk yok (alttan sayfanın içinde, ilk öğe). */
  flush?: boolean;
  children: ReactNode;
}) {
  const rows = Children.toArray(children).filter(isValidElement);

  return (
    <View className={flush ? '' : 'mt-5'}>
      {label ? (
        <Text
          accessibilityRole="header"
          className="mb-2 ml-1 text-[13px] font-semibold text-muted-foreground"
        >
          {label}
        </Text>
      ) : null}
      <View className="overflow-hidden rounded-[22px] border border-border bg-card">
        {rows.map((row, index) => (
          <Fragment key={row.key ?? index}>
            {index > 0 ? <View className="mx-4 h-px bg-border" /> : null}
            {row}
          </Fragment>
        ))}
      </View>
      {footer ? (
        <Text className="ml-1 mt-2 text-[12px] leading-4 text-muted-foreground">{footer}</Text>
      ) : null}
    </View>
  );
}

/**
 * Grup satırı. `onPress` verilirse dokunulabilir ve sağda ok çıkar; verilmezse salt okunur
 * bilgi satırıdır. `destructive` yıkıcı eylemler (çıkış, hesap silme) içindir.
 */
export function ListRow({
  label,
  value,
  description,
  onPress,
  destructive = false,
  accessory,
  accessibilityHint,
  icon,
}: {
  label: string;
  value?: string | null;
  description?: string | null;
  onPress?: () => void;
  destructive?: boolean;
  /** Sağdaki özel öğe (anahtar, rozet). Verilirse ok çizilmez. */
  accessory?: ReactNode;
  accessibilityHint?: string;
  /** Soldaki simge karosu (alttan sayfadaki eylem listeleri). */
  icon?: ReactNode;
}) {
  const muted = useColorToken('muted-foreground');

  const body = (
    <>
      {icon}
      <View className="flex-1">
        <Text className={`text-[16px] font-semibold ${destructive ? 'text-destructive' : 'text-foreground'}`}>
          {label}
        </Text>
        {description ? (
          <Text className="mt-0.5 text-[13px] leading-[17px] text-muted-foreground">{description}</Text>
        ) : null}
      </View>
      {value ? (
        <Text numberOfLines={1} className="max-w-[55%] text-[15px] text-muted-foreground">
          {value}
        </Text>
      ) : null}
      {accessory ?? (onPress && !destructive ? <ChevronRight size={18} color={muted} strokeWidth={2} /> : null)}
    </>
  );

  if (!onPress) {
    return <View className="min-h-[62px] flex-row items-center gap-3 px-4 py-3">{body}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      className="min-h-[62px] flex-row items-center gap-3 px-4 py-3 active:bg-muted/60"
    >
      {body}
    </Pressable>
  );
}
