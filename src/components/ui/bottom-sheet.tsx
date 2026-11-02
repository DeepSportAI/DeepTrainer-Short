import { X } from 'lucide-react-native';
import type { ReactNode, Ref } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { KEYBOARD_BEHAVIOR } from '@/lib/layout/keyboard';
import { useColorTokens } from '@/lib/theme/tokens';

/**
 * Alttan açılan sayfa. Eylemler başparmağın erişebildiği yerde durur.
 *
 * `dismissible={false}` iken örtüye dokunmak ve Android geri tuşu kapatmaz — süren bir işlemi
 * kullanıcı yarıda bırakamasın diye. Yükseklik içeriğe göre; uzun içerik `scroll` ile gelir.
 * Giriş alanı olan sayfa (VKİ, ölçüm) klavyeyle birlikte yükselir (`KEYBOARD_BEHAVIOR`, iki platformda).
 *
 * `variant="panel"` — yeni tasarım dili (Profil, 22 Ekim): tutamaç, başlığın sağında kapat düğmesi,
 * 40 pt köşe, alanlardan bir ton koyu zemin. Gövde kendiliğinden kayar, `footer` (birincil düğme)
 * kaymaz ve her zaman görünür kalır. Klavye İKİ PLATFORMDA da `padding` ile karşılanır: Expo 57'de
 * Android kenardan kenara çiziyor ve modal penceresi klavyeyle küçülmüyor. `KeyboardAvoidingView`
 * yalnız gerçek örtüşme kadar dolgu verdiği için pencerenin küçüldüğü bir cihazda dolgu sıfır kalır.
 * Sayfa ekrana sığmazsa (klavye açık, yatay telefon) gövde daralır, başlık ve düğme yerinde kalır.
 * `subtitle` başlığın hemen altındaki soluk satırdır (geri bildirimde testin / egzersizin adı);
 * `scrollRef` ve `onBodyLayout` kayan gövdeyi çağırana açar — klavye açılıp gövde daralınca alttaki
 * alanı görünür tutmak için (gövde kendiliğinden odaktaki alana kaymaz).
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  dismissible = true,
  closeLabel,
  onDismissed,
  variant = 'default',
  footer,
  toolbar,
  subtitle,
  scrollRef,
  onBodyLayout,
  scrollEnabled = true,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  dismissible?: boolean;
  /** Örtünün ekran okuyucuya bildirilen adı. */
  closeLabel: string;
  /**
   * YALNIZ iOS: sayfa ekrandan tamamen kalktığında. iOS kapanmakta olan bir modalın üstüne yenisini
   * açamıyor (ikincisi sessizce hiç görünmüyor); bir sayfadan diğerine geçen akışlar ikinciyi
   * burada açar. Android'de bu sınır yok ve olay gelmez — orada hemen açılır.
   */
  onDismissed?: () => void;
  variant?: 'default' | 'panel';
  /** Yalnız `panel`: gövdenin altında, kaymayan eylem alanı. */
  footer?: ReactNode;
  /** Yalnız `panel`: başlığın altında, kaymayan alan (seçim listelerinde arama kutusu). */
  toolbar?: ReactNode;
  /** Yalnız `panel`: başlığın altındaki soluk satır. */
  subtitle?: string;
  /** Yalnız `panel`: kayan gövde. */
  scrollRef?: Ref<ScrollView>;
  /** Yalnız `panel`: kayan gövdenin çerçevesi değiştiğinde (klavyeyle daralma dahil). */
  onBodyLayout?: (event: LayoutChangeEvent) => void;
  /** Yalnız `panel`: gövde kayabilir mi — sürükle-bırak sürerken kapatılır (test sırası). */
  scrollEnabled?: boolean;
}) {
  const [scrim, foreground] = useColorTokens(['scrim', 'foreground']);
  const insets = useSafeAreaInsets();
  const panel = variant === 'panel';

  function requestClose() {
    if (!dismissible) return;
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      // iOS'ta varsayılan yalnız dikey: yatay ekranda (ya da yatay açılan nokta düzenleyicinin üstünde) açılan
      // sayfa uygulamayı dikeye çeviriyordu. Uygulama her yönde açılır (`orientation: "default"`).
      supportedOrientations={['portrait', 'landscape']}
      onRequestClose={requestClose}
      onDismiss={onDismissed}
    >
      <KeyboardAvoidingView
        className="flex-1 justify-end"
        behavior={KEYBOARD_BEHAVIOR}
        style={[scrim ? { backgroundColor: scrim } : null, panel ? { paddingTop: insets.top + 8 } : null]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          onPress={requestClose}
          className="flex-1"
        />

        {panel ? (
          <View className="shrink px-2" style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
            <View className="w-full max-w-[520px] shrink self-center rounded-[40px] border border-border bg-muted px-[18px] pb-6 pt-2.5">
              <View className="h-[5px] w-10 self-center rounded-full bg-surface-3" />
              <View className="mt-3 flex-row items-center gap-2">
                <Text accessibilityRole="header" className="flex-1 text-[20px] font-bold leading-[26px] text-foreground">
                  {title}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={closeLabel}
                  accessibilityState={{ disabled: !dismissible }}
                  disabled={!dismissible}
                  onPress={requestClose}
                  className={`h-11 w-11 items-center justify-center rounded-full border border-border bg-card active:opacity-70 ${
                    dismissible ? '' : 'opacity-50'
                  }`}
                >
                  <X size={20} color={foreground} strokeWidth={2} />
                </Pressable>
              </View>

              {subtitle ? (
                <Text className="mt-1 text-[13px] leading-[18px] text-muted-foreground">{subtitle}</Text>
              ) : null}

              {toolbar ? <View className="mt-3">{toolbar}</View> : null}

              <ScrollView
                ref={scrollRef}
                onLayout={onBodyLayout}
                scrollEnabled={scrollEnabled}
                className="mt-3"
                style={{ flexGrow: 0 }}
                contentContainerClassName="gap-3"
                keyboardShouldPersistTaps="handled"
              >
                {children}
              </ScrollView>

              {footer ? <View className="mt-3">{footer}</View> : null}
            </View>
          </View>
        ) : (
          /* Tablette sayfa ekranı boydan boya kaplamaz, ortada kalır. */
          <View
            className="m-3 w-full max-w-[520px] self-center rounded-3xl border border-border bg-card p-5"
            style={{ marginBottom: Math.max(insets.bottom, 12) }}
          >
            {title ? (
              <Text className="mb-2 text-lg font-bold text-foreground">{title}</Text>
            ) : null}
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}
