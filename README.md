# DeepTrainer (Short)

Antrenörün sporcusuna **ilk ders test programını** (30 dk) uyguladığı, sonucu **PDF rapor** olarak paylaştığı ve
**program asistanıyla** (yazarak ya da sesle) antrenman programı oluşturduğu uygulama. DeepSport Atletik ile aynı
altyapı ve tasarım dili.

- Ana sayfa: sporcular — son test tarihi, yapılan testler, seviyeler, sıradaki önerilen test
- Test akışı: Tanışma → Air Squat → Hip Hinge → Overhead Reach → Plank → Goblet Squat → Push-Up → Dumbbell Row →
  Kondisyon (500 m kürek / 1 dk burpee) → Ölçüm → Sonuç; her adımın sonunda sıradaki test önerilir
- Saat: Bluetooth nabız yayını (Garmin, Polar, Coros, Suunto, Wahoo, göğüs bandı) — kondisyon testinde canlı nabız ve
  60 sn toparlanma
- Hareket kütüphanesi: 93 hareket, 79'u videolu; tanıtım, bölgeler, zorluk
- PDF: analiz raporu ve program (sporcuya uygulama verilmez)

## Kurulum

```bash
npm install
cp .env.example .env      # ANTHROPIC_API_KEY (program asistanı, yalnız sunucuda)
npx expo run:android      # ya da: npx expo run:ios
npx expo start --web      # tarayıcı önizlemesi
```

Ayrıntılı kurallar: [CLAUDE.md](CLAUDE.md).
