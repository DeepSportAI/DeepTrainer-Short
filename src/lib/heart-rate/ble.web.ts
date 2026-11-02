import { HEART_RATE_MEASUREMENT, HEART_RATE_SERVICE, parseHeartRate, type HeartRateSource } from './types';

/**
 * Web: Web Bluetooth (Chrome / Edge; Safari ve Firefox'ta yok). Tarama yok — tarayıcı kendi seçicisini açar,
 * antrenör saati seçer. Seçilen cihaz bağlanana kadar burada tutulur.
 */
type GattCharacteristic = EventTarget & { value: DataView | null; startNotifications(): Promise<unknown> };
type GattServer = {
  connected: boolean;
  connect(): Promise<GattServer>;
  disconnect(): void;
  getPrimaryService(uuid: string): Promise<{ getCharacteristic(uuid: string): Promise<GattCharacteristic> }>;
};
type WebBluetoothDevice = EventTarget & { id: string; name?: string; gatt?: GattServer };
type WebBluetooth = {
  getAvailability?(): Promise<boolean>;
  requestDevice(options: { filters: { services: string[] }[] }): Promise<WebBluetoothDevice>;
};

const chosen = new Map<string, WebBluetoothDevice>();

function bluetooth(): WebBluetooth | null {
  const nav = globalThis.navigator as (Navigator & { bluetooth?: WebBluetooth }) | undefined;
  return nav?.bluetooth ?? null;
}

export const bleSource: HeartRateSource = {
  kind: 'web',
  async isSupported() {
    const api = bluetooth();
    if (!api) return false;
    try {
      return api.getAvailability ? await api.getAvailability() : true;
    } catch {
      return false;
    }
  },
  scan(onDevice, onError) {
    const api = bluetooth();
    if (!api) {
      onError('unsupported');
      return () => {};
    }
    api
      .requestDevice({ filters: [{ services: [HEART_RATE_SERVICE] }] })
      .then((device) => {
        chosen.set(device.id, device);
        onDevice({ id: device.id, name: device.name ?? null });
      })
      .catch((error: { name?: string }) => onError(error?.name === 'NotFoundError' ? 'cancelled' : 'permission'));
    return () => {};
  },
  async connect(deviceId, onBpm, onDisconnect) {
    const device = chosen.get(deviceId);
    if (!device?.gatt) throw new Error('connection');
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(HEART_RATE_SERVICE);
    const characteristic = await service.getCharacteristic(HEART_RATE_MEASUREMENT);
    const onValue = () => {
      const view = characteristic.value;
      if (!view) return;
      const bpm = parseHeartRate(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
      if (bpm !== null) onBpm(bpm);
    };
    characteristic.addEventListener('characteristicvaluechanged', onValue);
    device.addEventListener('gattserverdisconnected', onDisconnect);
    await characteristic.startNotifications();
    return () => {
      characteristic.removeEventListener('characteristicvaluechanged', onValue);
      device.removeEventListener('gattserverdisconnected', onDisconnect);
      if (server.connected) server.disconnect();
    };
  },
};
