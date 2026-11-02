import { Check, ChevronRight } from 'lucide-react-native';
import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useColorToken } from '@/lib/theme/tokens';

/**
 * Detay ekranlarının ortak parçaları — DeepSport Atletik'in sporcu detayındaki (`detail-parts`) dil: bölüm başlığı,
 * 22 pt kart, satır grubu, yapıldı işareti, çerçeveli kapsül düğme. Sunumsal; veri ve gezinme ekrandan gelir.
 */

/** Bölüm başlığı: solda soluk etiket, sağda kısa bağlantı ya da sayı. */
export function DetailSection({
  title,
  right,
  onRight,
  rightLabel,
}: {
  title: string;
  right?: string | number | null;
  onRight?: () => void;
  rightLabel?: string;
}) {
  return (
    <View className="mx-1 mb-2 mt-5 flex-row items-center justify-between gap-3">
      <Text accessibilityRole="header" className="flex-1 text-[13px] font-semibold text-muted-foreground">
        {title}
      </Text>
      {right !== undefined && right !== null && right !== '' ? (
        onRight ? (
          <Pressable accessibilityRole="button" accessibilityLabel={rightLabel} onPress={onRight} hitSlop={12} className="active:opacity-60">
            <Text className="text-[14px] font-semibold text-interactive">{right}</Text>
          </Pressable>
        ) : (
          <Text className="text-[13px] text-muted-foreground">{right}</Text>
        )
      ) : null}
    </View>
  );
}

/** Kart: 22 pt köşe, kart zemini, ince kenarlık. */
export function DetailCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <View className={`rounded-[22px] border border-border bg-card px-3.5 py-3 ${className}`}>{children}</View>;
}

/** Satır grubu: satırlar tek kartın içinde, aralarında ayraç. */
export function RowGroup({ children }: { children: ReactNode }) {
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View className="overflow-hidden rounded-[22px] border border-border bg-card px-3.5">
      {rows.map((row, index) => (
        <Fragment key={row.key ?? index}>
          {index > 0 ? <View className="h-px bg-border" /> : null}
          {row}
        </Fragment>
      ))}
    </View>
  );
}

/** Grup satırı: sol öğe, başlık + alt yazı, sağ öğe, dokunulabilirse ok. */
export function DetailRow({
  left,
  title,
  subtitle,
  right,
  onPress,
  chevron,
  accessibilityLabel,
  titleTone = 'default',
}: {
  left?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  accessibilityLabel?: string;
  titleTone?: 'default' | 'destructive' | 'muted';
}) {
  const muted = useColorToken('muted-foreground');
  const body = (
    <>
      {left}
      <View className="flex-1">
        <Text
          numberOfLines={2}
          className={`text-[16px] font-semibold leading-[21px] ${
            titleTone === 'destructive' ? 'text-destructive' : titleTone === 'muted' ? 'text-muted-foreground' : 'text-foreground'
          }`}
        >
          {title}
        </Text>
        {typeof subtitle === 'string' ? (
          <Text className="mt-0.5 text-[13px] leading-[17px] text-muted-foreground">{subtitle}</Text>
        ) : (
          subtitle
        )}
      </View>
      {right}
      {(chevron ?? Boolean(onPress)) ? <ChevronRight size={18} color={muted} strokeWidth={2} /> : null}
    </>
  );
  if (!onPress) return <View className="min-h-[62px] flex-row items-center gap-3 py-2.5">{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className="min-h-[62px] flex-row items-center gap-3 py-2.5 active:opacity-70"
    >
      {body}
    </Pressable>
  );
}

/** Yapıldı işareti: dolu yeşil daire. */
export function DoneMark({ size = 22 }: { size?: number }) {
  const fg = useColorToken('success-foreground');
  return (
    <View className="items-center justify-center rounded-full bg-success" style={{ width: size, height: size }}>
      <Check size={Math.round(size * 0.6)} color={fg} strokeWidth={3} />
    </View>
  );
}

/** Yapılmadı işareti: kesik çizgili halka. */
export function PendingMark({ size = 22 }: { size?: number }) {
  return <View className="rounded-full border-2 border-dashed border-border" style={{ width: size, height: size }} />;
}

/** Sıra numarası karosu. */
export function NumberTile({ text, active = false }: { text: string; active?: boolean }) {
  return (
    <View
      className={`h-[30px] w-[30px] items-center justify-center rounded-full border ${
        active ? 'border-primary bg-primary' : 'border-border bg-card'
      }`}
    >
      <Text className={`text-[13px] font-bold ${active ? 'text-primary-foreground' : 'text-foreground'}`}>{text}</Text>
    </View>
  );
}

/** Çerçeveli kapsül düğme (sporcu kartındaki "Test al" / "Program"). */
export function OutlineButton({
  label,
  icon,
  onPress,
  disabled = false,
  compact = false,
}: {
  label: string;
  icon?: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={compact ? 4 : undefined}
      className={`flex-row items-center justify-center gap-2 rounded-full border border-border bg-card active:opacity-70 ${
        compact ? 'min-h-9 px-3' : 'min-h-[46px] px-3'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      {icon}
      <Text numberOfLines={1} className={`font-bold text-foreground ${compact ? 'text-[13px]' : 'text-[15px]'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Küçük etiket çipi (bölge, ekipman, "videolu"). `tone="accent"` volt dolu. */
export function Tag({ label, tone = 'default', icon }: { label: string; tone?: 'default' | 'accent' | 'warning'; icon?: ReactNode }) {
  const box =
    tone === 'accent' ? 'border-primary bg-primary' : tone === 'warning' ? 'border-warning/40 bg-warning/10' : 'border-border bg-surface-2';
  const text = tone === 'accent' ? 'text-primary-foreground' : tone === 'warning' ? 'text-warning' : 'text-foreground';
  return (
    <View className={`flex-row items-center gap-1 rounded-full border px-2.5 py-1 ${box}`}>
      {icon}
      <Text numberOfLines={1} className={`text-[12px] font-semibold ${text}`}>
        {label}
      </Text>
    </View>
  );
}
