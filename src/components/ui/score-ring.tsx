import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { useColorTokens, type ColorToken } from '@/lib/theme/tokens';

/**
 * Halkalar (sporcu detayı, yetenek kartı): tamamlanma ("7/9") ve 0–100 puan. Renk token'dan; ekran
 * okuyucu değeri halkanın yanındaki metinden okur (halka gizli).
 *
 * Ortadaki sayı SVG metni değil, halkanın üstüne bindirilmiş `Text` (`font-num`): SVG metni yazı tipi
 * sarmalayıcısından geçmez, iOS'ta da özel ailenin ağırlığını eski yazı tipi yolundan seçer.
 */

/** Tamamlanma halkası ("7/9"). */
export function ProgressRing({ done, total, size = 52, stroke = 6 }: { done: number; total: number; size?: number; stroke?: number }) {
  const [data, track] = useColorTokens(['data', 'border']);
  const radius = size / 2 - stroke / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = total > 0 ? Math.min(1, done / total) : 0;
  return (
    <RingFrame size={size}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={data}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - ratio)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text className="font-num text-[14px] font-extrabold text-foreground">{`${done}/${total}`}</Text>
    </RingFrame>
  );
}

/** Puan halkası (0–100), renk kademe token'ından. `value` yoksa kesik çizgili "?" halkası. */
export function ScoreRing({ value, tone, size = 56, stroke = 5 }: { value: number | null; tone: ColorToken; size?: number; stroke?: number }) {
  const [color, track] = useColorTokens([tone, 'border']);
  const radius = size / 2 - stroke / 2;
  const circumference = 2 * Math.PI * radius;
  if (value === null) {
    return (
      <RingFrame size={size}>
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={2} strokeDasharray="5 5" />
        </Svg>
        <Text className="text-[12px] font-bold text-muted-foreground">?</Text>
      </RingFrame>
    );
  }
  const ratio = Math.max(0, Math.min(1, value / 100));
  return (
    <RingFrame size={size}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - ratio)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text className="font-num text-[17px] font-extrabold text-foreground">{String(Math.round(value))}</Text>
    </RingFrame>
  );
}

/** Halka kutusu: SVG arkada, sayı ortada; ikisi de ekran okuyucudan gizli. */
function RingFrame({ size, children }: { size: number; children: ReactNode }) {
  return (
    <View
      style={{ width: size, height: size }}
      className="items-center justify-center"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {children}
    </View>
  );
}
