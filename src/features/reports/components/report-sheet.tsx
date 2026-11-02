import { FileText } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Toggle } from '@/components/ui/toggle';

/**
 * PDF raporu penceresi: hangi oturum, fotoğraflar eklensin mi (varsayılan KAPALI — sporcunun fotoğrafı paylaşılan bir
 * dosyaya ancak antrenör seçerse girer), son program eklensin mi.
 */
export function ReportSheet({
  visible,
  sessionLabel,
  hasPhotos,
  programTitle,
  pending,
  error,
  onClose,
  onCreate,
}: {
  visible: boolean;
  sessionLabel: string;
  hasPhotos: boolean;
  programTitle: string | null;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onCreate: (options: { includePhotos: boolean; includeProgram: boolean }) => void;
}) {
  const { t } = useTranslation();
  const [includePhotos, setIncludePhotos] = useState(false);
  const [includeProgram, setIncludeProgram] = useState(true);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      dismissible={!pending}
      variant="panel"
      title={t('report.sheet.title')}
      subtitle={sessionLabel}
      closeLabel={t('common.close')}
      footer={
        <View className="gap-2">
          {error ? (
            <Text accessibilityRole="alert" className="text-[13px] text-destructive">
              {error}
            </Text>
          ) : null}
          <Button
            shape="pill"
            glow
            icon={FileText}
            loading={pending}
            label={t('report.sheet.create')}
            onPress={() => onCreate({ includePhotos: hasPhotos && includePhotos, includeProgram: programTitle !== null && includeProgram })}
          />
        </View>
      }
    >
      <Text className="text-[14px] leading-[20px] text-foreground">{t('report.sheet.description')}</Text>
      <View className="rounded-[18px] border border-border bg-card px-3.5">
        <View className="min-h-[58px] flex-row items-center gap-3 py-2">
          <View className="flex-1">
            <Text className="text-[15px] font-semibold text-foreground">{t('report.sheet.photos')}</Text>
            <Text className="text-[12px] text-muted-foreground">
              {hasPhotos ? t('report.sheet.photosHint') : t('report.sheet.noPhotos')}
            </Text>
          </View>
          <Toggle value={hasPhotos && includePhotos} onValueChange={setIncludePhotos} disabled={!hasPhotos} />
        </View>
        <View className="h-px bg-border" />
        <View className="min-h-[58px] flex-row items-center gap-3 py-2">
          <View className="flex-1">
            <Text className="text-[15px] font-semibold text-foreground">{t('report.sheet.program')}</Text>
            <Text numberOfLines={1} className="text-[12px] text-muted-foreground">
              {programTitle ?? t('report.sheet.noProgram')}
            </Text>
          </View>
          <Toggle value={programTitle !== null && includeProgram} onValueChange={setIncludeProgram} disabled={programTitle === null} />
        </View>
      </View>
    </BottomSheet>
  );
}
