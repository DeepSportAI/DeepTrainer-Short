import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KEYBOARD_BEHAVIOR } from '@/lib/layout/keyboard';
import { useSceneBottomInset } from '@/lib/layout/use-layout';

import { ContentFrame } from './content-frame';
import { ScreenHeader } from './screen-header';

/**
 * Oturum içindeki form ekranlarının kabuğu: geri başlığı, klavye kaçınması, üstten hizalı
 * kaydırılan içerik ve altta sabit eylem alanı.
 *
 * Giriş akışının kabuğundan (`AuthScreen`) farkı: başlık oturum içi yığın dili, eylem alanı altta sabit.
 * Uygulama içindeki formlar (takım, profil, sporcu) uzun ve üstten okunur. Eylem düğmesi klavyeyle birlikte
 * yükselir (`KEYBOARD_BEHAVIOR`, iki platformda).
 *
 * Başlık yeni dilde (tasarım U4·10, 03S · 3i, program ekranlarıyla aynı — `ScreenHeader`): yuvarlak kenarlıklı
 * geri düğmesi, 20 pt başlık ve altında isteğe bağlı soluk satır (`subtitle`); düz zemin, parıltı yok.
 *
 * Tablette içerik ortada form genişliğinde kalır (`ContentFrame`); alanlar ekranla esnemez. Sekme yığınında da
 * açılır (Ayarlar'ın alt sayfaları, takım formu): alt boşluk sahneye göre (`useSceneBottomInset`).
 */
export function FormScreen({
  title,
  subtitle,
  onBack,
  backLabel,
  children,
  footer,
}: {
  title: string;
  /** Başlığın altındaki soluk satır ("Takımlar", takımın adı). */
  subtitle?: string | null;
  onBack: () => void;
  backLabel: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  // Sekme sahnesinde (Ayarlar'ın alt sayfaları, takım formu) alt güvenli alanı çubuk kaplar.
  const bottomInset = useSceneBottomInset();

  return (
    <View className="flex-1 bg-background">
      <View className="px-4" style={{ paddingTop: insets.top + 8 }}>
        <ContentFrame>
          <ScreenHeader title={title} subtitle={subtitle} onBack={onBack} backLabel={backLabel} />
        </ContentFrame>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={KEYBOARD_BEHAVIOR}>
        <ScrollView
          contentContainerClassName="px-4 pb-6 pt-3"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <ContentFrame>{children}</ContentFrame>
        </ScrollView>

        {footer ? (
          <View className="px-4 pt-2" style={{ paddingBottom: bottomInset }}>
            <ContentFrame>{footer}</ContentFrame>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}
