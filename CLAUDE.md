@AGENTS.md

# DeepTrainer (Short) — çalışma kuralları

Antrenörün tek kişiye uyguladığı **ilk ders test programı** (30 dk) → sonuç → PDF rapor → program asistanıyla antrenman
programı. Expo (React Native) uygulaması; altyapı ve tasarım dili **DeepSport Atletik Mobil ile aynı**
(`../DeepSportAthleticMobil`): aynı token bloğu, aynı ortak bileşenler, aynı durum sahipliği tablosu.

Ürün kararları (Kamil, 2 Kasım 2026):
- Antrenör sporcu ekler, sporcuya testleri **art arda** uygular (takım sırası yok). Her adımın sonunda **sıradaki test
  önerilir** — nedeniyle (`features/assessment/recommend.ts`).
- Ana sayfa = Sporcular. Büyük sporcu kartı: son test tarihi, yapılan testler, seviyeler, sıradaki öneri. Karttan
  analiz sayfasına, analiz sayfasından teste gidilir.
- **Sporcuya uygulama verilmez**; analizini (ve programını) PDF olarak görür.
- Program asistanı: antrenör yazarak ya da **dikte** ile ister ("söylesin yazsın hemen program oluştursun"); dikte
  durunca mesaj kendiliğinden gider.
- Hareketler: video varsa videolu; her hareketin kısa tanıtımı, çalıştırdığı bölgeler ve zorluğu (kolay · orta · zor).
- **Saat entegrasyonu**: sporcunun saatinden / göğüs bandından standart Bluetooth nabız yayını (0x180D). Apple Health /
  Health Connect kullanılmaz — onlar telefonun sahibinin (antrenörün) verisini okur.

## Durum sahipliği — CRITICAL (Atletik'le aynı)

| Konu | Araç |
|---|---|
| Kalıcı veri (sporcu, test oturumu, program) | TanStack Query → `features/*/repository.ts` → `lib/db` |
| Arayüz durumu, canlı nabız bağlantısı | Zustand (global) / `useState` (yerel) |
| Formlar / doğrulama | react-hook-form / Zod |
| Stil | Uniwind (Tailwind sınıfları) |
| Diller | i18next (tr, en) |
| Küçük tercihler (tema, dil, antrenör adı) | `expo-sqlite/kv-store` (`lib/storage/kv`) |

Veri bugün **cihazda**: native'de SQLite belge tablosu (`lib/db/store.ts`), web önizlemesinde localStorage
(`store.web.ts`, aynı sözleşme). Sunucu gelince yalnız `repository.ts` dosyaları değişir.

## Tasarım token'ları — CRITICAL

- Renkler yalnız `src/global.css` token bloğundan (Atletik'in bloğunun aynısı: açık N2, koyu N3, Koyu lacivert).
  Bileşene renk gömülmez; sınıf adı kabul etmeyen yerde `lib/theme/tokens.ts` (`useColorTokens`).
- `primary` (volt) yalnız DOLGU, üstünde `primary-foreground`; `text-primary` yasak. Yazı / simge vurgusu
  `interactive`, grafik `data`, durum `success` / `warning` / `destructive`, seviye `level-1…5`.
- Tek istisna PDF: kâğıda hep açık temayla basılır, açık bloğun hex'leri `features/reports/pdf-theme.ts`'te.
- Metin `components/ui/text` ve `text-input` sarmalayıcılarından (Barlow; web'de Google Fonts, `app/+html.tsx`).

## Mimari

```
src/
  app/          Expo Router rotaları (ince; özellikleri birleştirir). api/program+api.ts = sunucu rotası
  features/     athletes · assessment · exercises · programs · reports · settings
  lib/          db · heart-rate · speech · i18n · query · theme · layout · format · files · storage
  components/   ortak arayüz (ui/ Atletik'ten)
```

Özellik bağımlılığı TEK YÖNLÜ ve döngüsüz: `athletes`, `exercises` yaprak; `assessment → athletes`;
`programs → athletes, assessment, exercises`; `reports → hepsi`; `settings → athletes, assessment` (demo verisi).
`lib/` hiçbir `features/` dosyasını içe aktarmaz. Sorgu anahtarları `lib/query/keys.ts`'te (başka özelliğin verisini
geçersiz kılmak için içe aktarma gerekmez).

## Test protokolü

- Tanım `features/assessment/protocol.ts` (aşamalar, adımlar, kontrol maddeleri, ölçüler, kronometre, hareket);
  metinler sözlükte `assessment.steps.<id>.*`. Kontrol maddesi bir HATA gözlemidir; "Var" = bulgu.
- Sonuç önerisi `scoring.ts` (saf, normlar dosyanın başında); karar antrenörün (sonuç ekranında değiştirir).
- Öneri `recommend.ts` (saf): sıradaki yapılmamış adım + bulgulara göre nedeni + ağrı uyarısı + kondisyon seçeneği.

## Program asistanı (Claude API)

- Sunucu rotası `src/app/api/program+api.ts` (Expo Router API route, `web.output: "server"`). Anahtar
  `ANTHROPIC_API_KEY` yalnız sunucuda (`.env`, git dışı); uygulama paketine girmez.
- Model `claude-opus-5-5`, çaba `medium`, akışla istenip son mesaj beklenir; yapılandırılmış çıktı
  (`features/programs/schema.ts` → `assistantOutputSchema`), sunucu tarafı yedek model (`fallbacks: 'default'`).
- Sistem istemi `features/programs/prompt.ts` (dil başına sabit, önbellek dostu; katalog listesi içinde).
  Sporcu bağlamı sohbetin ilk mesajında (`context.ts`): yalnız ilk ad gider; soyad, iletişim, fotoğraf gitmez.
- Katalog dışı `catalogId` uygulamada null'a çevrilir (`sanitizePlan`).
- Geliştirmede göreli `/api/program` Expo dev sunucusuna gider; yayındaki native derlemede `EXPO_PUBLIC_API_URL`.

## Ürün metni

"AI", "yapay zeka", "YZ" kullanılmaz ("program asistanı", "analiz"). Hitap: antrenörün okuduğu cümleler "siz";
sporcuya okunan komutlar ve PDF raporu "sen". Kullanıcıya görünen metin koda gömülmez (`t(...)`); TR ve EN eşit.

## Doğrulama

`npm run verify` (tip denetimi + `verify:i18n`) ve `npx expo lint`. Yeni rota eklenince Metro bir kez çalışmalı
(rota tipleri ve `src/uniwind-types.d.ts` üretilir; ikincisi commit edilir).

## Çalıştırma

```bash
npm install
npx expo run:android      # dev build (BLE, dikte, SQLite yerel modülleri — Expo Go'da yok)
npx expo start --web      # tarayıcı önizlemesi (Web Bluetooth Chrome'da; veri localStorage)
```
Android için `JAVA_HOME` = JDK 17 (Homebrew `openjdk@17`; Android Studio'nun JBR 25'i CMake / prefab adımında
"restricted method" uyarısıyla düşüyor), `ANDROID_HOME` = `~/Library/Android/sdk`.
