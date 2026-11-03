import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Polygon, Polyline, Text as SvgText } from 'react-native-svg';

import { useColorTokens, type ColorToken } from '@/lib/theme/tokens';

import { formatGoalNumber, formatGoalValue } from '../format';
import { levelArea } from '../metrics';
import { expectedValue, type GoalStatus, type GoalView } from '../model';

export const STATUS_TOKEN: Record<GoalStatus, ColorToken> = {
  notStarted: 'interactive',
  onTrack: 'success',
  atRisk: 'warning',
  offTrack: 'destructive',
  achieved: 'success',
  missed: 'destructive',
};

/**
 * Hedef gidişatı: başlangıçtan hedefe BEKLENEN çizgi (kesik) ve çevresinde "yolunda koridoru" (yolun ±%10'u, soluk);
 * ölçümler (başlangıç, ara kontroller, yeniden testler) dolu çizgi + nokta, durum renginde; bugün dikey çizgi;
 * sağda hedef bayrağı. Kayma, noktaların koridorun dışına düşmesiyle bir bakışta görünür.
 */
export function GoalChart({ view, now, height = 132 }: { view: GoalView; now: number; height?: number }) {
  const { t } = useTranslation();
  const [width, setWidth] = useState(0);
  const [data, muted, border, success, fg] = useColorTokens(['data', 'muted-foreground', 'border', 'success', 'foreground']);
  const [statusColor] = useColorTokens([STATUS_TOKEN[view.status]]);
  const { goal, points, metric } = view;
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const t0 = goal.startAt;
  const t1 = Math.max(goal.deadline, points[points.length - 1].at);
  const values = [goal.startValue, goal.target, ...points.map((p) => p.value)];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = (hi - lo || 1) * 0.18;
  const yMin = lo - pad;
  const yMax = hi + pad;
  const left = 4;
  const level = levelArea(metric.id) !== null;
  // Seviye hedefinde eksen sayısı yerine "Orta" gibi etiket; sağda biraz daha yer.
  const label = (value: number) => (level ? formatGoalValue(t, metric, value) : formatGoalNumber(metric, value));
  const right = level ? 52 : 40;
  const top = 10;
  const bottom = 16;
  const x = (t: number) => left + ((t - t0) / Math.max(t1 - t0, 1)) * (width - left - right);
  const y = (v: number) => top + (1 - (v - yMin) / (yMax - yMin)) * (height - top - bottom);
  const tol = Math.abs(goal.target - goal.startValue) * 0.1;
  const dir = goal.target >= goal.startValue ? 1 : -1;
  // Koridor: beklenen çizginin "geride" tarafında %10 pay (önde olmak her zaman yolunda).
  const corridor = [
    `${x(t0)},${y(goal.startValue)}`,
    `${x(goal.deadline)},${y(goal.target)}`,
    `${x(goal.deadline)},${y(goal.target - dir * tol)}`,
    `${x(t0)},${y(goal.startValue - dir * tol)}`,
  ].join(' ');

  return (
    <View onLayout={onLayout} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Line x1={left} y1={height - bottom} x2={width - right} y2={height - bottom} stroke={border} strokeWidth={1} />
          <Polygon points={corridor} fill={success} opacity={0.14} />
          <Line x1={x(t0)} y1={y(goal.startValue)} x2={x(goal.deadline)} y2={y(goal.target)} stroke={muted} strokeWidth={1.5} strokeDasharray="5 4" />
          {now >= t0 && now <= t1 ? <Line x1={x(now)} y1={top - 4} x2={x(now)} y2={height - bottom} stroke={data} strokeWidth={1} opacity={0.5} /> : null}
          <Polyline points={points.map((p) => `${x(p.at)},${y(p.value)}`).join(' ')} fill="none" stroke={statusColor} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p, i) => (
            <Circle key={i} cx={x(p.at)} cy={y(p.value)} r={i === points.length - 1 ? 5 : 3.5} fill={statusColor} />
          ))}
          <Circle cx={x(goal.deadline)} cy={y(goal.target)} r={6} fill="none" stroke={fg} strokeWidth={2} />
          <SvgText x={x(goal.deadline) + 9} y={y(goal.target) + 4} fontSize={11} fontWeight="700" fill={fg}>
            {label(goal.target)}
          </SvgText>
          <SvgText x={x(points[points.length - 1].at) + (points.length > 1 ? 0 : 8)} y={y(view.latest.value) - 9} fontSize={11} fontWeight="700" fill={statusColor} textAnchor={points.length > 1 ? 'middle' : 'start'}>
            {label(view.latest.value)}
          </SvgText>
          <Line x1={x(goal.deadline)} y1={height - bottom} x2={x(goal.deadline)} y2={height - bottom + 4} stroke={muted} strokeWidth={1} />
          {/* Beklenen değerin bugünkü yeri */}
          {now > t0 && now < goal.deadline ? <Circle cx={x(now)} cy={y(expectedValue(goal, now))} r={3} fill={muted} /> : null}
        </Svg>
      ) : (
        <View style={{ height }} />
      )}
    </View>
  );
}
