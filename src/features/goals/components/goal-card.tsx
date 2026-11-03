import { CalendarClock, Flag, Plus, TriangleAlert } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { formatAgo } from '@/lib/format/ago';
import { formatDayMonth, formatShortDate } from '@/lib/format/date';
import { useColorTokens } from '@/lib/theme/tokens';

import { formatGoalDelta, formatGoalValue } from '../format';
import type { GoalStatus, GoalView } from '../model';
import { GoalChart, STATUS_TOKEN } from './goal-chart';

/** Durum çipi: "Yolunda" · "Riskte" · "Kaydı" · "Ulaşıldı" · "Süre doldu" · "Başladı". */
export function StatusPill({ status }: { status: GoalStatus }) {
  const { t } = useTranslation();
  const tone =
    status === 'onTrack' || status === 'achieved'
      ? 'border-success/40 bg-success/10 text-success'
      : status === 'atRisk'
        ? 'border-warning/40 bg-warning/10 text-warning'
        : status === 'notStarted'
          ? 'border-interactive/30 bg-interactive/10 text-interactive'
          : 'border-destructive/40 bg-destructive/10 text-destructive';
  const [box, bg, text] = tone.split(' ');
  return (
    <View className={`rounded-full border px-2.5 py-0.5 ${box} ${bg}`}>
      <Text className={`text-[12px] font-bold ${text}`}>{t(`goals.status.${status}`)}</Text>
    </View>
  );
}

/**
 * Hedef kartı: ad + durum, başlangıç → şimdi → hedef, ilerleme çubuğu (beklenen yer çentikle), gidişat grafiği,
 * kalan süre, gereken haftalık hız ve bu hızla varılacak değer; ölçüm zamanı geldiyse uyarı + "Ölçüm ekle".
 */
export function GoalCard({ view, now, onCheckin }: { view: GoalView; now: number; onCheckin?: () => void }) {
  const { t } = useTranslation();
  const [warning, interactive, muted, primaryFg] = useColorTokens(['warning', 'interactive', 'muted-foreground', 'primary-foreground']);
  const [statusColor] = useColorTokens([STATUS_TOKEN[view.status]]);
  const { goal, metric } = view;
  const name = t(`goals.metric.${metric.id}`);
  const progress = Math.max(0, Math.min(1, view.progress));
  const expected = Math.max(0, Math.min(1, view.expectedProgress));
  const delta = view.latest.value - goal.startValue;
  const open = view.status !== 'achieved' && view.status !== 'missed';

  return (
    <View className="gap-3 rounded-[22px] border border-border bg-card px-3.5 py-3.5">
      <View className="flex-row items-center gap-2">
        <Text className="flex-1 text-[17px] font-bold text-foreground">{name}</Text>
        <StatusPill status={view.status} />
      </View>

      <View className="flex-row items-end">
        <Figure label={t('goals.card.start')} value={formatGoalValue(t, metric, goal.startValue)} sub={formatDayMonth(goal.startAt)} />
        <Figure label={t('goals.card.now')} value={formatGoalValue(t, metric, view.latest.value)} sub={view.latest.source === 'start' ? '—' : formatGoalDelta(t, metric, delta)} strong />
        <Figure label={t('goals.card.target')} value={formatGoalValue(t, metric, goal.target)} sub={formatDayMonth(goal.deadline)} align="right" />
      </View>

      <View accessible accessibilityLabel={t('goals.card.progressLabel', { percent: Math.round(progress * 100) })}>
        <View className="h-2.5 overflow-hidden rounded-full bg-muted">
          <View className="h-full rounded-full" style={{ width: `${progress * 100}%`, backgroundColor: statusColor }} />
        </View>
        <View className="absolute top-[-3px] h-4 w-[3px] rounded-full bg-foreground" style={{ left: `${expected * 100}%`, marginLeft: -1 }} />
        <View className="mt-1 flex-row justify-between">
          <Text className="text-[11px] text-muted-foreground">{t('goals.card.covered', { percent: Math.round(progress * 100) })}</Text>
          <Text className="text-[11px] text-muted-foreground">{t('goals.card.expectedMark')}</Text>
        </View>
      </View>

      <GoalChart view={view} now={now} />

      <View className="gap-1">
        {open ? (
          <Text className="text-[13px] leading-[18px] text-foreground">
            {t('goals.card.weeksLeft', { count: Math.max(1, Math.round(view.weeksLeft)) })}
            {view.requiredWeekly !== null ? ` · ${t('goals.card.required', { value: formatGoalDelta(t, metric, view.requiredWeekly) })}` : ''}
          </Text>
        ) : view.status === 'achieved' ? (
          <Text className="text-[13px] font-semibold text-success">{t('goals.card.achieved')}</Text>
        ) : (
          <Text className="text-[13px] font-semibold text-destructive">{t('goals.card.missed', { date: formatShortDate(goal.deadline) })}</Text>
        )}
        {open && view.forecast !== null ? (
          <Text className="text-[12px] leading-[16px] text-muted-foreground">
            {t('goals.card.forecast', { date: formatDayMonth(goal.deadline), value: formatGoalValue(t, metric, view.forecast) })}
          </Text>
        ) : null}
        {view.status === 'atRisk' || view.status === 'offTrack' ? (
          <View className="mt-1 flex-row items-start gap-2 rounded-xl bg-warning/10 px-3 py-2">
            <TriangleAlert size={15} color={warning} strokeWidth={2} />
            <Text className="flex-1 text-[12px] leading-[16px] text-foreground">{t(`goals.card.advice.${view.status}`)}</Text>
          </View>
        ) : null}
      </View>

      {open ? (
        <View className="flex-row items-center gap-2 border-t border-border pt-3">
          <CalendarClock size={16} color={view.needsCheck ? warning : muted} strokeWidth={2} />
          <Text className={`flex-1 text-[13px] ${view.needsCheck ? 'font-semibold text-warning' : 'text-muted-foreground'}`}>
            {view.needsCheck
              ? t('goals.card.checkDue', { ago: formatAgo(view.latest.at) })
              : t('goals.card.nextCheck', { date: formatDayMonth(view.nextCheckAt) })}
          </Text>
          {onCheckin && metric.checkin ? (
            <Pressable
              accessibilityRole="button"
              onPress={onCheckin}
              className={`flex-row items-center gap-1 rounded-full px-3 py-2 active:opacity-75 ${view.needsCheck ? 'bg-primary' : 'border border-border bg-card'}`}
            >
              <Plus size={15} color={view.needsCheck ? primaryFg : interactive} strokeWidth={2.4} />
              <Text className={`text-[13px] font-bold ${view.needsCheck ? 'text-primary-foreground' : 'text-foreground'}`}>{t('goals.card.addCheckin')}</Text>
            </Pressable>
          ) : !metric.checkin ? (
            <View className="flex-row items-center gap-1">
              <Flag size={13} color={muted} strokeWidth={2} />
              <Text className="text-[12px] text-muted-foreground">{t('goals.card.retestOnly')}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function Figure({ label, value, sub, strong = false, align = 'left' }: { label: string; value: string; sub: string; strong?: boolean; align?: 'left' | 'right' }) {
  return (
    <View className={`flex-1 ${align === 'right' ? 'items-end' : strong ? 'items-center' : ''}`}>
      <Text className="text-[11px] font-semibold text-muted-foreground">{label}</Text>
      <Text numberOfLines={1} className={`font-num ${strong ? 'text-[20px]' : 'text-[15px]'} font-extrabold text-foreground`}>
        {value}
      </Text>
      <Text numberOfLines={1} className="text-[11px] text-muted-foreground">
        {sub}
      </Text>
    </View>
  );
}
