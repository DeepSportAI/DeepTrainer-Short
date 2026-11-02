import { type ComponentType, type ReactNode, useRef, useState } from 'react';
import { Pressable, type TextInputProps, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { TextInput, type TextInputRef } from '@/components/ui/text-input';
import { useColorTokens } from '@/lib/theme/tokens';

/**
 * Etiketli giriş alanı.
 *
 * - Zorunluluk yıldızı vurgu rengindedir (`interactive`), hata rengiyle karışmaz.
 * - Odakta kenarlık vurguya (`interactive`) döner. Parıltı yok: `--color-glow` volt hale ve yalnız volt
 *   dolgunun (düğme, seçili çip / segment, "Test al") çevresinde durur (S00C3).
 * - Hata metni alanın altında durur ve ekran okuyucuya uyarı olarak bildirilir.
 * - Yükseklik en az 44 pt — dokunma hedefi küçülmez.
 *
 * KENARLIK, ZEMİN VE DOLGU SARMALAYICI `View`'DA; `TextInput`'ta DEĞİL. Android'de metin alanı
 * yerel bir `EditText` ve `View.setBackground()` görünümün dolgusunu arka plan çiziminin
 * dolgusuyla EZER. Odakta kenarlık rengi değiştiği için arka plan yeniden uygulanıyor, o anda
 * `TextInput`'a verilmiş yatay dolgu siliniyordu: metin sola kayıp ikonun altına giriyordu
 * (iOS'ta arka planın böyle bir dolgu semantiği yok, orada görünmüyordu). Yoga `View`
 * çocuklarını kendisi yerleştirdiği için dolgu sarmalayıcıda güvende.
 *
 * Bu yüzden ikon da mutlak konumlu değil, satırın ilk öğesi: yer açmak için dolgu hesabı yok.
 */

type IconComponent = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export function Field({
  label,
  required = false,
  error,
  icon: Icon,
  adornment,
  variant = 'default',
  labelAside,
  labelHint,
  ...inputProps
}: TextInputProps & {
  label: string;
  /** Etiketin yanında soluk not ("Açıklama · isteğe bağlı"). */
  labelAside?: string;
  /** Zorunluluk yıldızı: `default`'ta vurgu renginde, `plain`'de kırmızı (tasarım 04 `.req`). */
  required?: boolean;
  /** Etiketin yanında soluk ek ("· isteğe bağlı"). */
  labelHint?: string;
  error?: string;
  /** Alanın solundaki ikon (lucide). */
  icon?: IconComponent;
  /** Alanın sağındaki kontrol — şifre göster/gizle gibi. */
  adornment?: ReactNode;
  /**
   * `plain`: yeni tasarım dili (giriş akışı, 22 Ekim) — kart zeminli 52 pt kutu, 16 pt yazı, simge ve
   * yıldız yok. Diğer ekranlar yeni tasarıma geçene kadar `default` kalır.
   */
  variant?: 'default' | 'plain';
}) {
  const [focused, setFocused] = useState(false);
  const [muted] = useColorTokens(['muted-foreground']);
  const inputRef = useRef<TextInputRef>(null);

  const borderClass = error
    ? 'border-destructive'
    : focused
      ? 'border-interactive'
      : 'border-border';
  // Çok satırlı alanda metin üstten başlıyor; simge ortada kalırsa metinle hizasız duruyordu.
  const multiline = Boolean(inputProps.multiline);
  const plain = variant === 'plain';

  return (
    <View className="gap-1.5">
      <Text className={plain ? 'text-[13px] font-semibold text-foreground' : 'text-xs font-medium text-foreground'}>
        {label}
        {labelAside ? (
          <Text className="text-[12px] font-normal text-muted-foreground">
            {' · '}
            {labelAside}
          </Text>
        ) : null}
        {required ? <Text className={plain ? 'text-destructive' : 'text-interactive'}> *</Text> : null}
        {labelHint ? <Text className="text-[12px] font-normal text-muted-foreground"> {labelHint}</Text> : null}
      </Text>

      {/*
        Satırın tamamı dokunma hedefi: ikonun ya da boşluğun üstüne dokunmak da alanı odaklar.
        Mutlak konumlu ikon zamanında bunu bedava veriyordu, flex satırda elle bağlanıyor.
        `accessible={false}` — ekran okuyucuya duyurulan öğe içerideki metin alanı olmalı.
      */}
      <Pressable
        accessible={false}
        onPress={() => inputRef.current?.focus()}
        className={`flex-row gap-2 border ${
          plain ? 'min-h-[52px] rounded-2xl bg-card' : 'min-h-11 rounded-xl bg-muted'
        } ${multiline ? 'items-start' : 'items-center'} ${plain && !error && !focused ? 'border-input' : borderClass} ${
          Icon && !plain ? 'pl-3' : 'pl-4'
        } ${adornment ? 'pr-2' : 'pr-4'}`}
      >
        {Icon && !plain ? (
          <View className={`opacity-60 ${multiline ? 'pt-3.5' : ''}`}>
            <Icon size={16} color={muted} strokeWidth={2} />
          </View>
        ) : null}

        {/*
          Yayılım ÖNCE gelir: odak/hata görünümü ve dokunma hedefi çağıranın geçtiği bir prop ile
          sessizce ezilmesin. Çağıranın `onFocus`/`onBlur`'u aşağıda elle çağrılıyor, kaybolmuyor.
        */}
        <TextInput
          {...inputProps}
          ref={inputRef}
          accessibilityLabel={labelAside ? `${label}, ${labelAside}` : label}
          placeholderTextColor={muted}
          onFocus={(event) => {
            setFocused(true);
            inputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            inputProps.onBlur?.(event);
          }}
          className={`min-h-11 flex-1 py-3 text-foreground ${plain ? 'text-[16px]' : 'text-[15px]'}`}
        />

        {adornment}
      </Pressable>

      {error ? (
        <Text accessibilityRole="alert" className="text-xs text-destructive">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
