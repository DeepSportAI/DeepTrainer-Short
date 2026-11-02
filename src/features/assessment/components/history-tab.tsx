import { ClipboardCheck, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { DetailRow, DetailSection, RowGroup, Tag } from '@/components/ui/detail-parts';
import { ProgressRing } from '@/components/ui/score-ring';
import { Text } from '@/components/ui/text';
import { formatAgo } from '@/lib/format/ago';
import { formatShortDate } from '@/lib/format/date';
import { useColorToken } from '@/lib/theme/tokens';

import { stepShort } from '../labels';
import { doneSteps, findingsOf, lastActivityAt, progressOf, type Assessment } from '../model';

/** Geçmiş: bütün test oturumları (en yeni üstte) — tarih, yapılan testler, durum. Dokununca oturumun özeti. */
export function HistoryTab({
  sessions,
  onOpen,
  onStart,
}: {
  sessions: Assessment[];
  onOpen: (session: Assessment) => void;
  onStart: () => void;
}) {
  const { t } = useTranslation();
  const muted = useColorToken('muted-foreground');

  return (
    <View>
      <DetailSection title={t('athleteDetail.history.title')} right={sessions.length || null} />
      {sessions.length === 0 ? (
        <View className="items-center gap-2 rounded-[22px] border border-border bg-card px-4 py-6">
          <ClipboardCheck size={24} color={muted} strokeWidth={1.8} />
          <Text className="text-center text-[14px] text-muted-foreground">{t('athleteDetail.history.empty')}</Text>
        </View>
      ) : (
        <RowGroup>
          {sessions.map((session) => {
            const progress = progressOf(session);
            const steps = doneSteps(session);
            const findings = findingsOf(session).length;
            return (
              <DetailRow
                key={session.id}
                left={<ProgressRing done={progress.done} total={progress.total} size={46} stroke={5} />}
                title={`${formatShortDate(lastActivityAt(session))} · ${formatAgo(lastActivityAt(session))}`}
                subtitle={
                  <View className="mt-1 gap-1.5">
                    <Text numberOfLines={2} className="text-[13px] leading-[17px] text-muted-foreground">
                      {steps.map((step) => stepShort(t, step)).join(' · ') || t('athleteDetail.history.noSteps')}
                    </Text>
                    <View className="flex-row flex-wrap gap-1.5">
                      <Tag
                        label={session.completedAt ? t('athleteDetail.history.completed') : t('athleteDetail.history.inProgress')}
                        tone={session.completedAt ? 'default' : 'accent'}
                      />
                      {findings > 0 ? <Tag tone="warning" label={t('athleteDetail.history.findings', { count: findings })} /> : null}
                    </View>
                  </View>
                }
                onPress={() => onOpen(session)}
              />
            );
          })}
        </RowGroup>
      )}
      <View className="mt-4">
        <Button shape="pill" variant="outline" icon={Plus} label={t('athleteDetail.history.newSession')} onPress={onStart} />
      </View>
    </View>
  );
}
