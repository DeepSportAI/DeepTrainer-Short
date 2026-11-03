import { Flag, Target } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { DetailCard, DetailSection } from '@/components/ui/detail-parts';
import { Field } from '@/components/ui/field';
import { Text } from '@/components/ui/text';
import { formatDayMonth } from '@/lib/format/date';
import { useColorTokens } from '@/lib/theme/tokens';

import { formatGoalValue } from '../format';
import { journeyPlan, summarizeGoals, type GoalView } from '../model';
import { useAddCheckin } from '../mutations';
import { GoalCard } from './goal-card';

/**
 * Hedefler sekmesi — yolculuğun kendisi: özet (kaç hedef yolunda / riskte / kaydı), takvim (başlangıç → ara
 * kontroller → yeniden test → hedef tarihi, bugün işaretli), hedef kartları. Hedef yoksa "Hedef koy".
 */
export function GoalsTab({ views, now, onSetGoals, canSetGoals }: { views: GoalView[]; now: number; onSetGoals: () => void; canSetGoals: boolean }) {
  const { t } = useTranslation();
  const [interactive] = useColorTokens(['interactive']);
  const [checkin, setCheckin] = useState<GoalView | null>(null);

  if (views.length === 0) {
    return (
      <DetailCard className="items-center gap-3 py-6">
        <Target size={28} color={interactive} strokeWidth={1.8} />
        <Text className="text-center text-[16px] font-bold text-foreground">{t('goals.empty.title')}</Text>
        <Text className="max-w-[320px] text-center text-[13px] leading-[18px] text-muted-foreground">
          {canSetGoals ? t('goals.empty.description') : t('goals.empty.needsEvaluation')}
        </Text>
        {canSetGoals ? (
          <View className="mt-1 w-full max-w-[260px]">
            <Button shape="pill" glow icon={Flag} label={t('goals.empty.action')} onPress={onSetGoals} />
          </View>
        ) : null}
      </DetailCard>
    );
  }

  const summary = summarizeGoals(views);
  const startAt = Math.min(...views.map((v) => v.goal.startAt));
  const deadline = Math.max(...views.map((v) => v.goal.deadline));
  const every = Math.min(...views.map((v) => v.goal.checkEveryDays));
  const plan = journeyPlan(startAt, deadline, every);

  return (
    <View>
      <View className="flex-row gap-2">
        {(['onTrack', 'atRisk', 'offTrack', 'achieved'] as const).map((status) => (
          <View key={status} className="flex-1 items-center rounded-[16px] border border-border bg-card py-2.5">
            <Text className={`font-num text-[22px] font-extrabold ${summary.counts[status] > 0 ? STATUS_TEXT[status] : 'text-muted-foreground'}`}>
              {summary.counts[status]}
            </Text>
            <Text numberOfLines={1} className="text-[11px] font-semibold text-muted-foreground">
              {t(`goals.status.${status}`)}
            </Text>
          </View>
        ))}
      </View>

      <DetailSection title={t('goals.journey.title')} right={t('goals.journey.span', { from: formatDayMonth(startAt), to: formatDayMonth(deadline) })} />
      <Journey plan={plan} now={now} />

      <DetailSection title={t('goals.list')} right={views.length} />
      <View className="gap-3">
        {views.map((view) => (
          <GoalCard key={view.goal.id} view={view} now={now} onCheckin={() => setCheckin(view)} />
        ))}
      </View>

      <View className="mt-4">
        <Button shape="pill" variant="outline" icon={Flag} label={t('goals.newGoals')} onPress={onSetGoals} />
      </View>

      <CheckinSheet view={checkin} onClose={() => setCheckin(null)} />
    </View>
  );
}

const STATUS_TEXT = { onTrack: 'text-success', atRisk: 'text-warning', offTrack: 'text-destructive', achieved: 'text-success' } as const;

/** Yolculuk takvimi: yatay şerit; geçmiş noktalar dolu, gelecek boş, bugün volt çizgi. */
function Journey({ plan, now }: { plan: ReturnType<typeof journeyPlan>; now: number }) {
  const { t } = useTranslation();
  const start = plan[0].at;
  const end = plan[plan.length - 1].at;
  const pos = (at: number) => `${((at - start) / Math.max(end - start, 1)) * 100}%` as const;
  const today = Math.min(1, Math.max(0, (now - start) / Math.max(end - start, 1)));

  return (
    <DetailCard className="gap-3">
      <View className="mx-8 h-[58px]">
        <View className="absolute left-0 right-0 top-[11px] h-[3px] rounded-full bg-muted" />
        <View className="absolute left-0 top-[11px] h-[3px] rounded-full bg-data" style={{ width: `${today * 100}%` }} />
        {plan.map((p, i) => {
          const done = p.at <= now;
          const big = p.kind !== 'check';
          return (
            <View key={`${p.kind}-${i}`} className="absolute items-center" style={{ left: pos(p.at), marginLeft: big ? -12 : -7, top: big ? 0 : 5 }}>
              <View
                className={`items-center justify-center rounded-full border-2 ${done ? 'border-data bg-data' : 'border-border bg-card'} ${p.kind === 'finish' ? 'border-foreground' : ''}`}
                style={{ width: big ? 24 : 14, height: big ? 24 : 14 }}
              />
              {big ? (
                <Text numberOfLines={1} className="mt-1 text-[10.5px] font-semibold text-foreground" style={{ width: 70, textAlign: 'center' }}>
                  {formatDayMonth(p.at)}
                </Text>
              ) : null}
            </View>
          );
        })}
        <View className="absolute top-0 h-[26px] w-[3px] rounded-full bg-primary" style={{ left: `${today * 100}%`, marginLeft: -1 }} />
      </View>
      <View className="flex-row flex-wrap gap-x-4 gap-y-1">
        <Legend dot="bg-data" label={t('goals.journey.done')} />
        <Legend dot="bg-card border-2 border-border" label={t('goals.journey.check')} />
        <Legend dot="bg-primary" label={t('goals.journey.today')} />
      </View>
      <Text className="text-[12px] leading-[17px] text-muted-foreground">{t('goals.journey.explain')}</Text>
    </DetailCard>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className={`h-2.5 w-2.5 rounded-full ${dot}`} />
      <Text className="text-[11.5px] text-muted-foreground">{label}</Text>
    </View>
  );
}

/** Ara kontrol: tek ölçü + isteğe bağlı not; kaydedince durum yeniden hesaplanır. */
function CheckinSheet({ view, onClose }: { view: GoalView | null; onClose: () => void }) {
  const { t } = useTranslation();
  const add = useAddCheckin();
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  if (!view) return null;
  const value = Number(text.replace(',', '.').replace(':', '.'));
  const seconds = view.metric.unit === 'clock' && text.includes(':') ? Number(text.split(':')[0]) * 60 + Number(text.split(':')[1]) : null;
  const parsed = seconds ?? value;
  const valid = text.trim() !== '' && Number.isFinite(parsed) && parsed > 0;

  return (
    <BottomSheet
      visible
      onClose={onClose}
      variant="panel"
      title={t('goals.checkin.title', { metric: t(`goals.metric.${view.metric.id}`) })}
      subtitle={t('goals.checkin.subtitle', { expected: formatGoalValue(t, view.metric, view.expectedNow), target: formatGoalValue(t, view.metric, view.goal.target) })}
      closeLabel={t('common.close')}
      footer={
        <Button
          shape="pill"
          glow
          label={t('common.save')}
          disabled={!valid}
          loading={add.isPending}
          onPress={() =>
            add.mutate(
              { id: view.goal.id, value: parsed, note: note.trim() },
              {
                onSuccess: () => {
                  setText('');
                  setNote('');
                  onClose();
                },
              },
            )
          }
        />
      }
    >
      <Field variant="plain" label={t('goals.checkin.value')} placeholder={formatGoalValue(t, view.metric, view.latest.value)} keyboardType={view.metric.unit === 'clock' ? 'numbers-and-punctuation' : 'decimal-pad'} value={text} onChangeText={setText} autoFocus />
      <Field variant="plain" label={t('goals.checkin.note')} labelAside={t('common.optional')} value={note} onChangeText={setNote} />
    </BottomSheet>
  );
}
