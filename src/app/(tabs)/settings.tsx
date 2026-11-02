import { useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { Database, HeartPulse, Trash2, Watch } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useConfirmSheet } from '@/components/ui/confirm-sheet';
import { ContentFrame } from '@/components/ui/content-frame';
import { Field } from '@/components/ui/field';
import { ListGroup, ListRow } from '@/components/ui/list-group';
import { Segmented } from '@/components/ui/segmented';
import { Text } from '@/components/ui/text';
import { DeviceSheet } from '@/features/assessment/components/heart-rate-panel';
import { useCoachStore } from '@/features/settings/coach-store';
import { seedDemoData } from '@/features/settings/demo-data';
import { useActiveLocale, useLocaleStore } from '@/features/settings/locale-store';
import { THEME_PREFERENCES, useThemeStore } from '@/features/settings/theme-store';
import { store } from '@/lib/db/store';
import { LOCALE_NATIVE_NAMES, SUPPORTED_LOCALES } from '@/lib/i18n';
import { useHeartRate } from '@/lib/heart-rate/store';
import { useTabSceneBottomInset } from '@/lib/layout/use-layout';
import { useColorTokens } from '@/lib/theme/tokens';

/** Ayarlar: antrenör bilgisi (PDF başlığı), saat, tema, dil, veriler. */
export default function SettingsTab() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const bottomInset = useTabSceneBottomInset();
  const client = useQueryClient();
  const confirm = useConfirmSheet();
  const [interactive, destructive] = useColorTokens(['interactive', 'destructive']);
  const coachName = useCoachStore((s) => s.coachName);
  const organization = useCoachStore((s) => s.organization);
  const setCoach = useCoachStore((s) => s.setCoach);
  const [name, setName] = useState(coachName);
  const [org, setOrg] = useState(organization);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const locale = useActiveLocale();
  const setLocale = useLocaleStore((s) => s.setLocale);
  const hr = useHeartRate();
  const [deviceOpen, setDeviceOpen] = useState(false);

  const persistCoach = () => setCoach({ coachName: name, organization: org });

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-4" contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: bottomInset + 32 }} keyboardShouldPersistTaps="handled">
        <ContentFrame kind="prose">
          <Text accessibilityRole="header" className="text-[34px] font-extrabold leading-[40px] tracking-tight text-foreground">
            {t('settings.title')}
          </Text>

          <Text className="mb-2 ml-1 mt-5 text-[13px] font-semibold text-muted-foreground">{t('settings.coach.title')}</Text>
          <View className="gap-3 rounded-[22px] border border-border bg-card px-3.5 py-3.5">
            <Field variant="plain" label={t('settings.coach.name')} value={name} onChangeText={setName} onBlur={persistCoach} placeholder={t('settings.coach.namePlaceholder')} />
            <Field variant="plain" label={t('settings.coach.organization')} value={org} onChangeText={setOrg} onBlur={persistCoach} placeholder={t('settings.coach.organizationPlaceholder')} />
            <Text className="text-[12px] text-muted-foreground">{t('settings.coach.hint')}</Text>
          </View>

          <ListGroup label={t('settings.watch.title')} footer={t('settings.watch.footer')}>
            <ListRow
              icon={hr.status === 'connected' ? <HeartPulse size={20} color={destructive} strokeWidth={2} /> : <Watch size={20} color={interactive} strokeWidth={2} />}
              label={hr.status === 'connected' ? (hr.device?.name ?? t('heartRate.unnamed')) : t('settings.watch.connect')}
              value={hr.status === 'connected' && hr.bpm ? `${hr.bpm} ${t('units.bpm')}` : null}
              description={hr.status === 'connected' ? t('settings.watch.connected') : t('settings.watch.hint')}
              onPress={() => (hr.status === 'connected' ? hr.disconnect() : setDeviceOpen(true))}
            />
          </ListGroup>

          <Text className="mb-2 ml-1 mt-5 text-[13px] font-semibold text-muted-foreground">{t('settings.theme.title')}</Text>
          <Segmented
            shape="pill"
            accessibilityLabel={t('settings.theme.title')}
            options={THEME_PREFERENCES.map((value) => ({ value, label: t(`settings.theme.${value}`) }))}
            value={theme}
            onChange={setTheme}
          />

          <Text className="mb-2 ml-1 mt-5 text-[13px] font-semibold text-muted-foreground">{t('settings.language')}</Text>
          <Segmented
            shape="pill"
            accessibilityLabel={t('settings.language')}
            options={SUPPORTED_LOCALES.map((value) => ({ value, label: LOCALE_NATIVE_NAMES[value] }))}
            value={locale}
            onChange={setLocale}
          />

          <ListGroup label={t('settings.data.title')} footer={t('settings.data.footer')}>
            {__DEV__ ? (
              <ListRow
                icon={<Database size={20} color={interactive} strokeWidth={2} />}
                label={t('settings.data.demo')}
                description={t('settings.data.demoHint')}
                onPress={() =>
                  void seedDemoData().then(() => client.invalidateQueries())
                }
              />
            ) : null}
            <ListRow
              icon={<Trash2 size={20} color={destructive} strokeWidth={2} />}
              label={t('settings.data.clear')}
              destructive
              onPress={() =>
                confirm.ask({
                  title: t('settings.data.clearConfirm.title'),
                  description: t('settings.data.clearConfirm.description'),
                  confirmLabel: t('settings.data.clear'),
                  cancelLabel: t('common.cancel'),
                  destructive: true,
                  onConfirm: () => void store.clear().then(() => client.invalidateQueries()),
                })
              }
            />
          </ListGroup>

          <Text className="mt-6 text-center text-[12px] text-muted-foreground">
            {t('settings.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
          </Text>
        </ContentFrame>
      </ScrollView>
      <DeviceSheet visible={deviceOpen} onClose={() => setDeviceOpen(false)} />
      {confirm.sheet}
    </View>
  );
}
