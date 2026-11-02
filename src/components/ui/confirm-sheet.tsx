import type { LucideIcon } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { Platform, View } from 'react-native';

import { BottomSheet } from './bottom-sheet';
import { Button } from './button';
import { Text } from './text';

/** Onaydan başka bir eylem (kalibrasyonda "Kaldır", değerlendirmede "Kaydetmeden çık"). */
export type ConfirmSheetAction = {
  label: string;
  onPress: () => void;
  /** Kırmızı çerçeveli kapsül (geri alınamayan eylem). */
  destructive?: boolean;
};

/**
 * Onay / bilgi sayfası — uygulamanın sistem uyarısı (`Alert.alert`) yerine kullandığı tek pencere.
 *
 * Pencere dili (tasarım 03F, U3·5·r, U4·9·b): tutamaç, solda 20 pt başlık, sağda yuvarlak kapat, tek cümle;
 * eylemler alt alta kapsül. Onay volt kapsül; yıkıcı onay kırmızı ÇERÇEVELİ (dolgu yok — ekrandaki tek dolu düğme
 * volt). İsteğe bağlı ikinci eylem (`alternate`) çerçeveli ya da kırmızı çerçeveli kapsül, en altta çerçeveli
 * "Vazgeç" (`cancelLabel`). `cancelLabel` verilmezse yalnız bilgi verir: tek düğme ("Tamam") sayfayı kapatır.
 *
 * İşlem sürerken (`pending`) kapanmaz. Tablette en fazla 520 pt, ortada (`BottomSheet`).
 */
export function ConfirmSheet({
  visible,
  title,
  description,
  confirmLabel,
  cancelLabel,
  closeLabel,
  onConfirm,
  onCancel,
  onDismissed,
  pending = false,
  destructive = false,
  icon,
  error,
  alternate,
}: {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  /** Çerçeveli "Vazgeç"; verilmezse bilgi sayfası (tek düğme). */
  cancelLabel?: string;
  /** Örtünün ve kapat düğmesinin ekran okuyucu adı; varsayılan `cancelLabel`, o da yoksa `confirmLabel`. */
  closeLabel?: string;
  onConfirm: () => void;
  /** Vazgeç, kapat düğmesi, örtü ve Android geri tuşu. */
  onCancel: () => void;
  /** YALNIZ iOS: sayfa ekrandan tamamen kalkınca (bkz. `BottomSheet`). */
  onDismissed?: () => void;
  pending?: boolean;
  destructive?: boolean;
  /** Onay düğmesinin simgesi. */
  icon?: LucideIcon;
  /** İşlem başarısızsa düğmelerin üstünde. */
  error?: string | null;
  alternate?: ConfirmSheetAction;
}) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onCancel}
      onDismissed={onDismissed}
      dismissible={!pending}
      variant="panel"
      closeLabel={closeLabel ?? cancelLabel ?? confirmLabel}
      title={title}
      footer={
        <View className="gap-2.5">
          <Button
            shape="pill"
            icon={icon}
            label={confirmLabel}
            onPress={onConfirm}
            loading={pending}
            variant={destructive ? 'destructiveOutline' : 'primary'}
          />
          {alternate ? (
            <Button
              shape="pill"
              label={alternate.label}
              onPress={alternate.onPress}
              disabled={pending}
              variant={alternate.destructive ? 'destructiveOutline' : 'outline'}
            />
          ) : null}
          {cancelLabel ? (
            <Button shape="pill" variant="outline" label={cancelLabel} onPress={onCancel} disabled={pending} />
          ) : null}
        </View>
      }
    >
      <Text className="text-[15px] leading-[21px] text-foreground">{description}</Text>
      {error ? (
        <Text accessibilityRole="alert" className="text-[13px] text-destructive">
          {error}
        </Text>
      ) : null}
    </BottomSheet>
  );
}

/** `useConfirmSheet().ask` isteği: `Alert.alert(title, message, buttons)` karşılığı. */
export type ConfirmRequest = {
  title: string;
  description: string;
  confirmLabel: string;
  /** Verilmezse bilgi sayfası (tek düğme). */
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm?: () => void;
  alternate?: ConfirmSheetAction;
  /** Vazgeç / kapat / örtü / geri tuşu. */
  onCancel?: () => void;
};

/**
 * Sistem uyarısının yerine geçen buyurgan kapı: `ask(...)` sayfayı açar, `sheet` ekranın ağacına bir kez çizilir
 * (`usePendingSheet` deseni). Sayfa her seçimde kapanır; seçilen eylem iOS'ta sayfa ekrandan TAMAMEN kalktıktan
 * sonra çalışır (`onDismissed`) — kapanmakta olan bir modalın üstüne yenisi açılamıyor, kapanırken ekran yığından
 * çıkarsa da pencere yarıda kalıyordu. Android'de bu sınır yok, eylem hemen çalışır.
 *
 * Kapanırken içerik boşalmasın diye son istek sayfa solana kadar çizilmeye devam eder.
 */
export function useConfirmSheet() {
  const [state, setState] = useState<{ request: ConfirmRequest; open: boolean } | null>(null);
  const queued = useRef<(() => void) | null>(null);

  const ask = useCallback((request: ConfirmRequest) => setState({ request, open: true }), []);

  function finish(action?: () => void) {
    setState((current) => (current ? { ...current, open: false } : current));
    if (!action) return;
    if (Platform.OS === 'ios') queued.current = action;
    else action();
  }

  function runQueued() {
    const next = queued.current;
    queued.current = null;
    next?.();
  }

  const request = state?.request;
  const sheet = request ? (
    <ConfirmSheet
      visible={state.open}
      title={request.title}
      description={request.description}
      confirmLabel={request.confirmLabel}
      cancelLabel={request.cancelLabel}
      destructive={request.destructive}
      onConfirm={() => finish(request.onConfirm)}
      alternate={
        request.alternate
          ? { ...request.alternate, onPress: () => finish(request.alternate?.onPress) }
          : undefined
      }
      onCancel={() => finish(request.onCancel)}
      onDismissed={runQueued}
    />
  ) : null;

  return { ask, sheet };
}
