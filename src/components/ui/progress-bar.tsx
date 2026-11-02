import { View } from 'react-native';

/**
 * Yatay ilerleme çubuğu (0..1). Renkler token'dan: ray `muted`, dolgu varsayılan `data` (grafik rolü),
 * tamamlanmış işlerde `success`. Ekran okuyucuya yüzde olarak bildirilir.
 */
export function ProgressBar({
  value,
  tone = 'accent',
  height = 8,
  accessibilityLabel,
}: {
  value: number;
  tone?: 'accent' | 'success';
  height?: number;
  accessibilityLabel?: string;
}) {
  const ratio = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}
      className="w-full overflow-hidden rounded-full bg-muted"
      style={{ height }}
    >
      <View
        className={`h-full rounded-full ${tone === 'success' ? 'bg-success' : 'bg-data'}`}
        style={{ width: `${ratio * 100}%` }}
      />
    </View>
  );
}
