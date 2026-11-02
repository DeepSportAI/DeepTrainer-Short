import { QueryClient, focusManager } from '@tanstack/react-query';
import { AppState, Platform, type AppStateStatus } from 'react-native';

/**
 * TanStack Query — kalıcı verinin TEK sahibi (DeepSport Atletik kuralı: veri Zustand'a yazılmaz).
 *
 * Bugün veri cihazdaki yerel depoda (`lib/db`); sorgu fonksiyonları oradan okur. Sunucu geldiğinde yalnız
 * `features/*\/repository.ts` değişir, ekranlar ve sorgu anahtarları yerinde kalır. Yerel okuma ucuz ve
 * kesin olduğu için tekrar deneme yok, bayatlık süresi uzun; yazmalar ilgili anahtarı geçersiz kılar.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      retry: Platform.OS === 'web' ? 0 : 1,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});

/** Arka plandan dönüşte sorguları tazeler (program asistanı gibi ağ isteği yapan sorgular için). */
export function initQueryPlatformBindings(): () => void {
  const sub = AppState.addEventListener('change', (status: AppStateStatus) => {
    focusManager.setFocused(status === 'active');
  });
  return () => sub.remove();
}
