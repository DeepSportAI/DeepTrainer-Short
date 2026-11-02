import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable } from 'react-native';

import { Text } from '@/components/ui/text';
import { useColorTokens } from '@/lib/theme/tokens';

/**
 * `text`: zeminsiz metin düğmesi (alt sayfadaki "Vazgeç", "Geri") — vurgu renginde.
 * `outline`: kart zeminli, ince kenarlıklı ikincil düğme (tasarım `.btn2`: "E-postayı yeniden gönder", "Tekrar dene",
 * "Geri"). Gri DOLU ikincil düğme yok (`secondary` değişkeni kaldırıldı, 23 Ekim): ikincil eylem çerçeveli kapsül,
 * ekranın tek birincil eylemi volt kapsül.
 * `destructiveOutline`: kart zeminli, kırmızı kenarlık ve yazı — geri alınamayan eylem ("Testi sil", "Takımı sil",
 * "Çıkış yap", "Hesabımı sil"; tasarım U2·2, U3·5·r, U4·9·b, U5·2, U5·9, 3i·l). Kırmızı DOLU düğme yok (değişken
 * kaldırıldı): ekrandaki tek dolu düğme volt; onay sayfasında yıkıcı eylem üstte, çerçeveli "Vazgeç" altında.
 */
type Variant = 'primary' | 'outline' | 'destructiveOutline' | 'text';

/**
 * Buton. Birincil düğme iki temada da volt DOLGU (`primary`) ve üstünde koyu yazı (`primary-foreground`);
 * zeminsiz `text` düğmesi yazı vurgusu (`interactive`: açıkta mürekkep lacivert, koyuda elektrik mavisi).
 *
 * Dokunma hedefi en az 44 pt (`min-h-11`); hover yok, basılı hâli `active:` ile verilir.
 * `glow` birincil eylemi öne çıkarır; parıltı açık temada kendiliğinden kaybolur
 * (bkz. `--color-glow`).
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  glow = false,
  shape = 'rounded',
  icon: Icon,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  glow?: boolean;
  /** `pill`: yeni tasarım dili (giriş akışı, 22 Ekim) — 56 pt kapsül, 17 pt yazı. */
  shape?: 'rounded' | 'pill';
  /** Etiketin solundaki simge ("Takımı test et" kamerası); yazı renginde çizilir. */
  icon?: LucideIcon;
  accessibilityHint?: string;
}) {
  const isDisabled = disabled || loading;
  const [primaryFg, foreground, glowColor, interactive, destructive] = useColorTokens([
    'primary-foreground',
    'foreground',
    'glow',
    'interactive',
    'destructive',
  ]);

  const box: Record<Variant, string> = {
    primary: 'bg-primary',
    outline: 'border border-border bg-card',
    destructiveOutline: 'border border-destructive/50 bg-card',
    text: 'bg-transparent',
  };
  // Simge ve yükleniyor göstergesi yazıyla aynı renkte (kırmızı çerçevede `destructive`).
  const iconColor =
    variant === 'outline'
      ? foreground
      : variant === 'text'
        ? interactive
        : variant === 'destructiveOutline'
          ? destructive
          : primaryFg;
  const text: Record<Variant, string> = {
    primary: 'text-primary-foreground',
    outline: 'text-foreground',
    destructiveOutline: 'text-destructive',
    text: 'text-interactive',
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      className={`flex-row items-center justify-center gap-2 px-5 active:opacity-80 ${
        shape === 'pill' ? 'min-h-14 rounded-full' : 'min-h-11 rounded-xl py-3'
      } ${box[variant]} ${isDisabled ? 'opacity-50' : ''}`}
      style={
        glow && !isDisabled && glowColor
          ? { boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 12, color: glowColor }] }
          : undefined
      }
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : Icon ? (
        <Icon size={shape === 'pill' ? 20 : 18} color={iconColor} strokeWidth={2} />
      ) : null}
      <Text className={`font-bold ${shape === 'pill' ? 'text-[17px]' : 'text-[15px]'} ${text[variant]}`}>{label}</Text>
    </Pressable>
  );
}
