import { List } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContentFrame } from '@/components/ui/content-frame';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { KEYBOARD_BEHAVIOR } from '@/lib/layout/keyboard';
import { useColorToken } from '@/lib/theme/tokens';

/**
 * Test adımı kabuğu: geri · adım adı · "Hareket testleri · 3–13 dk" · sağda test listesi; altında ilerleme çubuğu
 * (oturumdaki adım sayısı). Altta sabit eylem alanı (Kaydet ve devam / Atla). Sekme çubuğu yok: ölçüm sırasında
 * yanlışlıkla başka sekmeye geçilmesin.
 */
export function StepShell({
  title,
  subtitle,
  progress,
  onBack,
  onList,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  progress: { done: number; total: number };
  onBack: () => void;
  onList: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const foreground = useColorToken('foreground');

  return (
    <View className="flex-1 bg-background">
      <View className="gap-2.5 px-4 pb-2" style={{ paddingTop: insets.top + 8 }}>
        <ContentFrame kind="prose">
          <ScreenHeader
            title={title}
            subtitle={subtitle}
            onBack={onBack}
            backLabel={t('common.back')}
            accessory={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('assessment.session.allSteps')}
                onPress={onList}
                hitSlop={6}
                className="h-11 w-11 items-center justify-center rounded-full border border-border bg-card active:opacity-70"
              >
                <List size={20} color={foreground} strokeWidth={2} />
              </Pressable>
            }
          />
          <View className="mt-2.5 flex-row items-center gap-2.5">
            <View className="flex-1">
              <ProgressBar value={progress.done / Math.max(progress.total, 1)} height={6} />
            </View>
            <Text className="font-num text-[12px] font-bold text-muted-foreground">{`${progress.done}/${progress.total}`}</Text>
          </View>
        </ContentFrame>
      </View>
      <KeyboardAvoidingView className="flex-1" behavior={KEYBOARD_BEHAVIOR}>
        <ScrollView contentContainerClassName="px-4 pb-6 pt-2" keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <ContentFrame kind="prose" className="gap-3.5">
            {children}
          </ContentFrame>
        </ScrollView>
        <View className="border-t border-border bg-surface-bar px-4 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          <ContentFrame kind="prose">{footer}</ContentFrame>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/** Bölüm başlığı (adım içinde): "Kontrol et", "Sonuç", "Not". */
export function StepSection({ title, aside, children }: { title: string; aside?: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <View className="mx-1 flex-row items-baseline justify-between">
        <Text accessibilityRole="header" className="text-[13px] font-semibold text-muted-foreground">
          {title}
        </Text>
        {aside ? <Text className="text-[12px] text-muted-foreground">{aside}</Text> : null}
      </View>
      {children}
    </View>
  );
}
