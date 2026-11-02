import { Bluetooth, HeartPulse, RefreshCw, Watch, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { DetailRow, RowGroup } from '@/components/ui/detail-parts';
import { Text } from '@/components/ui/text';
import { DEMO_DEVICE, isHeartRateSupported, useHeartRate } from '@/lib/heart-rate/store';
import { formatClock } from '@/lib/format/clock';
import { useColorTokens } from '@/lib/theme/tokens';

import type { HeartRateSummary } from '../model';

/**
 * Saat / nabız paneli: bağlı değilse "Saat bağla" (cihaz seçimi), bağlıysa canlı nabız. Test sırasında kayıt, bitince
 * 60 sn toparlanma geri sayımı, sonunda özet (ort · en yüksek · toparlanma).
 */
export function HeartRatePanel({
  phase,
  recoveryLeft,
  summary,
}: {
  phase: 'idle' | 'recording' | 'recovery' | 'done';
  recoveryLeft: number;
  summary: HeartRateSummary | null;
}) {
  const { t } = useTranslation();
  const [destructive, interactive, muted] = useColorTokens(['destructive', 'interactive', 'muted-foreground']);
  const status = useHeartRate((s) => s.status);
  const bpm = useHeartRate((s) => s.bpm);
  const device = useHeartRate((s) => s.device);
  const recording = useHeartRate((s) => s.recording);
  const disconnect = useHeartRate((s) => s.disconnect);
  const [sheetOpen, setSheetOpen] = useState(false);

  const connected = status === 'connected';
  const peak = recording && recording.samples.length > 0 ? Math.max(...recording.samples.map(([, value]) => value)) : null;

  if (!connected) {
    return (
      <>
        <Pressable
          accessibilityRole="button"
          onPress={() => setSheetOpen(true)}
          className="flex-row items-center gap-3 rounded-[22px] border border-dashed border-border bg-card px-3.5 py-3 active:opacity-75"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-interactive/10">
            <Watch size={20} color={interactive} strokeWidth={2} />
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-bold text-foreground">{t('heartRate.connect')}</Text>
            <Text className="text-[12px] leading-[16px] text-muted-foreground">
              {status === 'error' ? t(`heartRate.errors.${useHeartRate.getState().error ?? 'connection'}`) : t('heartRate.connectHint')}
            </Text>
          </View>
          {status === 'connecting' ? <ActivityIndicator color={muted} /> : <Bluetooth size={18} color={muted} strokeWidth={2} />}
        </Pressable>
        <DeviceSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
      </>
    );
  }

  return (
    <View className="gap-2 rounded-[22px] border border-border bg-card px-3.5 py-3">
      <View className="flex-row items-center gap-3">
        <HeartPulse size={26} color={destructive} strokeWidth={2.2} />
        <View className="flex-1">
          <Text className="text-foreground">
            <Text className="font-num text-[34px] font-extrabold">{bpm ?? '—'}</Text>
            <Text className="text-[13px] font-semibold text-muted-foreground"> {t('units.bpm')}</Text>
          </Text>
          <Text numberOfLines={1} className="text-[12px] text-muted-foreground">
            {device?.name ?? t('heartRate.unnamed')} · {t(`heartRate.phase.${phase}`, { seconds: formatClock(recoveryLeft) })}
          </Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={t('heartRate.disconnect')} onPress={disconnect} hitSlop={8} className="h-10 w-10 items-center justify-center rounded-full border border-border active:opacity-70">
          <X size={18} color={muted} strokeWidth={2} />
        </Pressable>
      </View>
      {phase === 'recording' && peak !== null ? (
        <Text className="text-[12px] text-muted-foreground">{t('heartRate.peakSoFar', { value: peak })}</Text>
      ) : null}
      {summary ? (
        <View className="flex-row gap-2">
          <Stat label={t('heartRate.avg')} value={String(summary.avg)} />
          <Stat label={t('heartRate.max')} value={String(summary.max)} />
          <Stat label={t('heartRate.recovery')} value={summary.recovery60 === null ? '—' : `−${summary.recovery60}`} />
        </View>
      ) : null}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-[14px] bg-surface-2 px-2.5 py-1.5">
      <Text className="text-[11px] font-semibold text-muted-foreground">{label}</Text>
      <Text className="font-num text-[18px] font-extrabold text-foreground">{value}</Text>
    </View>
  );
}

/** Cihaz seçimi: yakındaki nabız yayınlayan saatler / bantlar. Geliştirmede "Demo" cihaz da listelenir. */
export function DeviceSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [interactive] = useColorTokens(['interactive']);
  const status = useHeartRate((s) => s.status);
  const devices = useHeartRate((s) => s.devices);
  const error = useHeartRate((s) => s.error);
  const startScan = useHeartRate((s) => s.startScan);
  const stopScan = useHeartRate((s) => s.stopScan);
  const connect = useHeartRate((s) => s.connect);
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    if (!visible) return;
    void isHeartRateSupported().then(setSupported);
    return () => stopScan();
  }, [visible, stopScan]);

  const choose = (device: { id: string; name: string | null }) => {
    onClose();
    void connect(device);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      variant="panel"
      title={t('heartRate.sheet.title')}
      subtitle={t('heartRate.sheet.subtitle')}
      closeLabel={t('common.close')}
      footer={
        supported ? (
          <Button
            shape="pill"
            icon={status === 'scanning' ? undefined : RefreshCw}
            loading={status === 'scanning'}
            label={status === 'scanning' ? t('heartRate.sheet.scanning') : t('heartRate.sheet.scan')}
            onPress={startScan}
          />
        ) : null
      }
    >
      {supported === false ? (
        <Text className="text-[14px] leading-[20px] text-foreground">{t('heartRate.sheet.unsupported')}</Text>
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" className="text-[13px] text-destructive">
          {t(`heartRate.errors.${error}`)}
        </Text>
      ) : null}
      {devices.length > 0 || __DEV__ ? (
        <RowGroup>
          {devices.map((device) => (
            <DetailRow
              key={device.id}
              left={<Watch size={20} color={interactive} strokeWidth={2} />}
              title={device.name ?? t('heartRate.unnamed')}
              subtitle={t('heartRate.sheet.tapToConnect')}
              onPress={() => choose(device)}
            />
          ))}
          {__DEV__ ? (
            <DetailRow
              key="demo"
              left={<HeartPulse size={20} color={interactive} strokeWidth={2} />}
              title={t('heartRate.sheet.demo')}
              subtitle={t('heartRate.sheet.demoHint')}
              onPress={() => choose(DEMO_DEVICE)}
            />
          ) : null}
        </RowGroup>
      ) : null}
      <Text className="text-[12px] leading-[17px] text-muted-foreground">{t('heartRate.sheet.help')}</Text>
    </BottomSheet>
  );
}
