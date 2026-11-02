import { useState } from 'react';
import { type LayoutChangeEvent, Pressable, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { useColorTokens } from '@/lib/theme/tokens';

export type ChartPoint = { x: number; value: number };

/**
 * Basit çizgi grafiği.
 *
 * Web'de değerler farenin üzerine gelmesiyle okunuyor. Dokunmatikte "üzerine gelme" diye bir şey
 * yok, o yüzden okuma AÇIK: grafiğe dokunulan yere en yakın nokta seçilir ve değeri üstte yazılır.
 * Seçim yapılmamışsa son nokta okunur — en çok merak edilen o.
 *
 * Kütüphane kullanılmadı; çizgi, nokta ve taban çizgisinden ibaret bir grafik için bağımlılık
 * eklemek gereksiz. Tasarım sistemi zaten SVG üstünde duruyor.
 */
export function LineChart({
  points,
  color,
  height = 96,
  formatValue,
  formatX,
  emptyLabel,
}: {
  points: ChartPoint[];
  /** Çizgi rengi; verilmezse vurgu rengi. */
  color?: string;
  height?: number;
  formatValue: (value: number) => string;
  formatX: (x: number) => string;
  emptyLabel: string;
}) {
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [data, muted, border] = useColorTokens(['data', 'muted-foreground', 'border']);

  const stroke = color ?? data;
  const padY = 10;

  function handleLayout(event: LayoutChangeEvent) {
    const next = event.nativeEvent.layout.width;
    setWidth((current) => (current === next ? current : next));
  }

  if (points.length < 2) {
    return (
      <View className="items-center justify-center py-6" style={{ height }}>
        <Text className="text-center text-[11px] text-muted-foreground">{emptyLabel}</Text>
      </View>
    );
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  // Düz bir seri (tüm değerler aynı) sıfıra bölmeye yol açar; o durumda çizgi ortadan geçer.
  const span = max - min || 1;

  const step = points.length > 1 ? width / (points.length - 1) : 0;
  const toX = (index: number) => index * step;
  const toY = (value: number) => padY + (1 - (value - min) / span) * (height - padY * 2);

  const activeIndex = selected ?? points.length - 1;
  const active = points[activeIndex];

  return (
    <View onLayout={handleLayout}>
      <View className="mb-1.5 flex-row items-baseline justify-between">
        <Text className="text-[11px] text-muted-foreground">{formatX(active.x)}</Text>
        <Text className="text-[13px] font-semibold text-foreground">
          {formatValue(active.value)}
        </Text>
      </View>

      <Pressable
        accessibilityRole="adjustable"
        accessibilityLabel={`${formatX(active.x)} — ${formatValue(active.value)}`}
        onPress={(event) => {
          if (step <= 0) return;
          const index = Math.round(event.nativeEvent.locationX / step);
          setSelected(Math.max(0, Math.min(points.length - 1, index)));
        }}
        style={{ height }}
      >
        {width > 0 ? (
          <Svg width={width} height={height}>
            <Line x1={0} y1={height - 1} x2={width} y2={height - 1} stroke={border} strokeWidth={1} />
            <Polyline
              points={points.map((point, index) => `${toX(index)},${toY(point.value)}`).join(' ')}
              fill="none"
              stroke={stroke}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((point, index) => (
              <Circle
                key={point.x}
                cx={toX(index)}
                cy={toY(point.value)}
                r={index === activeIndex ? 4.5 : 2.4}
                fill={index === activeIndex ? stroke : muted}
              />
            ))}
          </Svg>
        ) : null}
      </Pressable>

      <View className="mt-1 flex-row justify-between">
        <Text className="text-[10px] text-muted-foreground">{formatX(points[0].x)}</Text>
        <Text className="text-[10px] text-muted-foreground">
          {formatX(points[points.length - 1].x)}
        </Text>
      </View>
    </View>
  );
}
