import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Polygon, Rect } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { useColorTokens, type ColorToken } from '@/lib/theme/tokens';

/**
 * İnfografik parçaları — sunumsal, veri dışarıdan. Renkler token'dan (`data` grafik, `level-*` durum).
 */

/* ── Radar ───────────────────────────────────────────────────────────────── */

export type RadarSeries = { values: (number | null)[]; kind: 'current' | 'previous' };

/**
 * Dört (ya da daha çok) eksenli radar: değerler 0..1. Güncel seri dolu (`data`), önceki seri kesik çizgi. Halkalar
 * ⅓ · ⅔ · 1 = zayıf · orta · iyi.
 */
export function RadarChart({ labels, series, size = 240, accessibilityLabel }: { labels: string[]; series: RadarSeries[]; size?: number; accessibilityLabel: string }) {
  const [data, muted, border] = useColorTokens(['data', 'muted-foreground', 'border']);
  const pad = 46;
  const r = size / 2 - pad;
  const cx = size / 2;
  const cy = size / 2;
  const n = labels.length;
  const point = (i: number, v: number) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + Math.cos(angle) * r * v, cy + Math.sin(angle) * r * v] as const;
  };
  const poly = (values: (number | null)[]) => values.map((v, i) => point(i, v ?? 0).join(',')).join(' ');

  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {[1 / 3, 2 / 3, 1].map((ring) => (
          <Polygon key={ring} points={poly(labels.map(() => ring))} fill="none" stroke={border} strokeWidth={1} />
        ))}
        {labels.map((label, i) => {
          const [x, y] = point(i, 1);
          return <Line key={label} x1={cx} y1={cy} x2={x} y2={y} stroke={border} strokeWidth={1} />;
        })}
        {series
          .filter((s) => s.kind === 'previous')
          .map((s, k) => (
            <Polygon key={`p${k}`} points={poly(s.values)} fill="none" stroke={muted} strokeWidth={1.5} strokeDasharray="5 4" />
          ))}
        {series
          .filter((s) => s.kind === 'current')
          .map((s, k) => (
            <Polygon key={`c${k}`} points={poly(s.values)} fill={data} fillOpacity={0.18} stroke={data} strokeWidth={2.2} strokeLinejoin="round" />
          ))}
        {series
          .filter((s) => s.kind === 'current')
          .flatMap((s) => s.values.map((v, i) => (v === null ? null : <Circle key={`d${i}`} cx={point(i, v)[0]} cy={point(i, v)[1]} r={3.5} fill={data} />)))}
      </Svg>
      {labels.map((label, i) => {
        const [x, y] = point(i, 1.22);
        return (
          <Text
            key={label}
            numberOfLines={1}
            style={{ position: 'absolute', left: x - 50, top: y - 9, width: 100, textAlign: 'center' }}
            className="text-[12px] font-semibold text-foreground"
          >
            {label}
          </Text>
        );
      })}
    </View>
  );
}

/* ── Aralık çubuğu (Tanita tarzı) ────────────────────────────────────────── */

export type ScaleSegment = { from: number; width: number; tone: 'bad' | 'warn' | 'good'; label: string };

const TONE: Record<ScaleSegment['tone'], ColorToken> = { bad: 'level-1', warn: 'level-3', good: 'level-4' };

/**
 * Bölümlü çubuk: renkli bantlar (düşük / sınır / iyi ya da VKİ aralıkları), üstte değer imleci (dolu üçgen), varsa
 * önceki değerin imleci (boş daire). Bant adları çubuğun altında.
 */
export function ScaleBar({ segments, marker, previous, accessibilityLabel }: { segments: ScaleSegment[]; marker: number; previous?: number | null; accessibilityLabel: string }) {
  const [width, setWidth] = useState(0);
  const [fg, muted, bad, warn, good, card] = useColorTokens(['foreground', 'muted-foreground', 'level-1', 'level-3', 'level-4', 'card']);
  const colors = { bad, warn, good };
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const h = 30;

  return (
    <View accessible accessibilityLabel={accessibilityLabel} onLayout={onLayout}>
      {width > 0 ? (
        <Svg width={width} height={h}>
          {segments.map((s, i) => (
            <Rect key={i} x={s.from * width + (i ? 1 : 0)} y={14} width={Math.max(0, s.width * width - (i ? 1 : 0))} height={10} rx={i === 0 || i === segments.length - 1 ? 5 : 0} fill={colors[s.tone]} opacity={0.85} />
          ))}
          {typeof previous === 'number' ? <Circle cx={Math.min(width - 6, Math.max(6, previous * width))} cy={19} r={5} fill={card} stroke={muted} strokeWidth={2} /> : null}
          <Polygon
            points={`${marker * width - 7},2 ${marker * width + 7},2 ${marker * width},12`}
            fill={fg}
            transform={`translate(${marker * width < 7 ? 7 - marker * width : marker * width > width - 7 ? width - 7 - marker * width : 0},0)`}
          />
          <Line x1={Math.min(width - 1, Math.max(1, marker * width))} y1={12} x2={Math.min(width - 1, Math.max(1, marker * width))} y2={26} stroke={fg} strokeWidth={2} />
        </Svg>
      ) : (
        <View style={{ height: h }} />
      )}
      <View className="mt-0.5 flex-row">
        {segments.map((s, i) => (
          <Text key={i} numberOfLines={1} style={{ width: `${s.width * 100}%` }} className="text-center text-[10.5px] font-semibold text-muted-foreground">
            {s.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

export { TONE as SCALE_TONE_TOKENS };
