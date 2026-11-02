import { Mic, Square } from 'lucide-react-native';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useDictation, type DictationError } from '@/lib/speech/use-dictation';
import { useColorTokens } from '@/lib/theme/tokens';

/**
 * Mikrofon düğmesi: dokun → dinle (volt dolu, kare "durdur" simgesi), tekrar dokun → durur ve metin `onText`'e gider.
 * Dinlerken canlı metin `onLive` ile verilir (alan içinde gösterilsin). Hata kısa bir satırla çağırana bildirilir.
 */
export function DictationButton({
  onText,
  onLive,
  onError,
  size = 44,
}: {
  onText: (text: string) => void;
  onLive?: (text: string | null) => void;
  onError?: (error: DictationError | null) => void;
  size?: number;
}) {
  const { t } = useTranslation();
  const dictation = useDictation({ onFinal: onText });
  const [primaryFg, interactive] = useColorTokens(['primary-foreground', 'interactive']);

  useEffect(() => {
    onLive?.(dictation.listening ? dictation.live : null);
  }, [dictation.listening, dictation.live, onLive]);
  useEffect(() => {
    onError?.(dictation.error);
  }, [dictation.error, onError]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={dictation.listening ? t('dictation.stop') : t('dictation.start')}
      accessibilityState={{ selected: dictation.listening }}
      onPress={() => void dictation.toggle()}
      hitSlop={6}
      className={`items-center justify-center rounded-full active:opacity-70 ${
        dictation.listening ? 'bg-primary' : 'border border-border bg-card'
      }`}
      style={{ width: size, height: size }}
    >
      {dictation.listening ? (
        <Square size={size * 0.36} color={primaryFg} fill={primaryFg} strokeWidth={2} />
      ) : (
        <Mic size={size * 0.45} color={interactive} strokeWidth={2} />
      )}
    </Pressable>
  );
}

/** Dikte hatasının tek satırı (izin yok, cihazda konuşma tanıma yok…). */
export function DictationErrorLine({ error }: { error: DictationError | null }) {
  const { t } = useTranslation();
  if (!error) return null;
  return (
    <View>
      <Text accessibilityRole="alert" className="text-[12px] text-destructive">
        {t(`dictation.errors.${error}`)}
      </Text>
    </View>
  );
}
