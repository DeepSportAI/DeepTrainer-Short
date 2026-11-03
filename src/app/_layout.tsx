import '@/global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Kalıcı tercihler AÇILIŞTA yüklensin: depo ancak ilk içe aktarıldığında okunuyor (DeepSport Atletik'teki ders).
import '@/features/settings/locale-store';
import '@/features/settings/theme-store';
import { initI18n } from '@/lib/i18n';
import { initQueryPlatformBindings, queryClient } from '@/lib/query/client';
import { useColorTokens } from '@/lib/theme/tokens';

SplashScreen.preventAutoHideAsync();
initI18n();

/**
 * Tek oturum türü: antrenör (giriş yok, veri cihazda). Sekmeler: Sporcular · Testler · [Test al] · Hareketler ·
 * Ayarlar. Sporcu detayı, test akışı, program sohbeti ve hareket detayı sekmelerin ÜSTÜNE açılır.
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [background, card, foreground, border] = useColorTokens(['background', 'card', 'foreground', 'border']);
  const navigationTheme = useMemo(() => {
    const base = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
    if (!background || !card || !foreground || !border) return base;
    return { ...base, colors: { ...base.colors, background, card, text: foreground, border } };
  }, [colorScheme, background, card, foreground, border]);

  useEffect(() => initQueryPlatformBindings(), []);
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider value={navigationTheme}>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="pick-athlete" options={{ presentation: 'modal' }} />
            <Stack.Screen name="athletes/new" />
            <Stack.Screen name="athletes/[id]/index" />
            <Stack.Screen name="athletes/[id]/edit" />
            <Stack.Screen name="athletes/[id]/goals" />
            <Stack.Screen name="athletes/[id]/session/[sessionId]/index" />
            <Stack.Screen name="athletes/[id]/session/[sessionId]/[step]" />
            <Stack.Screen name="athletes/[id]/session/[sessionId]/result" />
            <Stack.Screen name="athletes/[id]/programs/chat" />
            <Stack.Screen name="athletes/[id]/programs/[programId]" />
            <Stack.Screen name="exercises/[id]" />
            <Stack.Screen name="tests/[id]" />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
