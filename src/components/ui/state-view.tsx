import { ActivityIndicator, View } from 'react-native';

import { Text } from '@/components/ui/text';

import { Button } from './button';

/**
 * Yükleniyor / boş / hata durumları. Ekranlar bunları kullanır, kendi durum kutularını yazmaz —
 * böylece üç durum uygulama boyunca aynı görünür ve aynı davranır.
 *
 * Hata metni HER ZAMAN ne olduğunu ve ne yapılacağını söyler; "bir hata oluştu" yasak. Eylem (Tekrar dene)
 * çerçeveli kapsül: ekranın tek volt düğmesi ilerleten eyleme kalır.
 */

export function LoadingState({ label }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 py-12">
      <ActivityIndicator />
      {label ? <Text className="text-sm text-muted-foreground">{label}</Text> : null}
    </View>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-2 px-6 py-12">
      <Text className="text-center text-lg font-semibold text-foreground">{title}</Text>
      {description ? (
        <Text className="text-center text-sm text-muted-foreground">{description}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <View className="mt-3">
          <Button shape="pill" variant="outline" label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
  retryLabel,
}: {
  message: string;
  onRetry?: () => void;
  retryLabel: string;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-6 py-12">
      <Text accessibilityRole="alert" className="text-center text-base text-foreground">
        {message}
      </Text>
      {onRetry ? <Button shape="pill" variant="outline" label={retryLabel} onPress={onRetry} /> : null}
    </View>
  );
}
