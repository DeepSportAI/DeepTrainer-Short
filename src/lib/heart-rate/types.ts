/**
 * Saat entegrasyonu (Kamil, 2 Kasım 2026: "Saat entegrasyonu da olacak").
 *
 * Antrenörün telefonu sporcunun saatine / göğüs bandına Bluetooth ile bağlanır ve STANDART nabız yayınını
 * (Heart Rate Service 0x180D, ölçüm 0x2A37) okur: Garmin, Polar, Coros, Suunto, Wahoo saatlerinde "nabzı yayınla"
 * modu ve bütün BLE göğüs bantları. Apple Watch yerleşik olarak yayın yapmaz (yayın uygulaması gerekir).
 *
 * Apple Health / Health Connect BİLEREK kullanılmıyor: o kaynaklar telefonun sahibinin, yani antrenörün verisini
 * okur; sporcunun uygulaması yok (rapor PDF olarak gider).
 *
 * Kaynaklar: `ble.ts` (iOS / Android, react-native-ble-plx), `ble.web.ts` (Chrome / Edge, Web Bluetooth) ve
 * geliştirmede `demo.ts` (cihazsız deneme).
 */
export type HeartRateDevice = { id: string; name: string | null };

export type HeartRateSource = {
  kind: 'ble' | 'web' | 'demo';
  isSupported(): Promise<boolean>;
  /**
   * Cihaz arar ve bulduklarını bildirir. Web'de tarayıcının kendi seçicisi açılır, seçilen tek cihaz bildirilir.
   * Dönen fonksiyon aramayı durdurur.
   */
  scan(onDevice: (device: HeartRateDevice) => void, onError: (error: HeartRateError) => void): () => void;
  /** Bağlanır ve her ölçümde `onBpm` çağırır. Dönen fonksiyon bağlantıyı keser. */
  connect(deviceId: string, onBpm: (bpm: number) => void, onDisconnect: () => void): Promise<() => void>;
};

export type HeartRateError = 'unsupported' | 'permission' | 'poweredOff' | 'cancelled' | 'connection';

export const HEART_RATE_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb';
export const HEART_RATE_MEASUREMENT = '00002a37-0000-1000-8000-00805f9b34fb';

/**
 * Nabız ölçümü (0x2A37): ilk bayt bayraklar; bit 0 = 1 ise değer 16 bit (küçük uçlu), değilse 8 bit.
 * Geçersiz ya da 25–240 dışı değer null (bağlantı başında 0 gönderen cihazlar var).
 */
export function parseHeartRate(bytes: Uint8Array): number | null {
  if (bytes.length < 2) return null;
  const sixteenBit = (bytes[0] & 0x01) === 1;
  const value = sixteenBit ? (bytes.length >= 3 ? bytes[1] | (bytes[2] << 8) : NaN) : bytes[1];
  return Number.isFinite(value) && value >= 25 && value <= 240 ? value : null;
}
