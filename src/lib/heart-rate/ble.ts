import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager, State, type Subscription } from 'react-native-ble-plx';

import {
  HEART_RATE_MEASUREMENT,
  HEART_RATE_SERVICE,
  parseHeartRate,
  type HeartRateError,
  type HeartRateSource,
} from './types';

/**
 * iOS / Android: react-native-ble-plx. Yalnız nabız servisini yayınlayan cihazlar listelenir. Yerel modül yalnız
 * geliştirme / mağaza derlemesinde vardır (Expo Go'da yok) — o durumda kaynak "desteklenmiyor" der.
 */
let manager: BleManager | null = null;

function getManager(): BleManager | null {
  if (manager) return manager;
  try {
    manager = new BleManager();
  } catch {
    manager = null;
  }
  return manager;
}

async function androidPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const level = typeof Platform.Version === 'number' ? Platform.Version : Number.parseInt(String(Platform.Version), 10);
  const wanted =
    level >= 31
      ? [PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT]
      : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
  const result = await PermissionsAndroid.requestMultiple(wanted);
  return wanted.every((permission) => result[permission] === PermissionsAndroid.RESULTS.GRANTED);
}

function decodeBase64(value: string): Uint8Array {
  const binary = globalThis.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export const bleSource: HeartRateSource = {
  kind: 'ble',
  async isSupported() {
    return getManager() !== null;
  },
  scan(onDevice, onError) {
    const ble = getManager();
    if (!ble) {
      onError('unsupported');
      return () => {};
    }
    let stopped = false;
    void (async () => {
      if (!(await androidPermissions())) return onError('permission');
      const state = await ble.state();
      if (state === State.PoweredOff) return onError('poweredOff');
      if (state === State.Unauthorized) return onError('permission');
      if (stopped) return;
      ble.startDeviceScan([HEART_RATE_SERVICE], { allowDuplicates: false }, (error, device) => {
        if (error) {
          onError(error.errorCode === 101 ? 'permission' : 'connection');
          return;
        }
        if (device) onDevice({ id: device.id, name: device.localName ?? device.name ?? null });
      });
    })();
    return () => {
      stopped = true;
      ble.stopDeviceScan();
    };
  },
  async connect(deviceId, onBpm, onDisconnect) {
    const ble = getManager();
    if (!ble) throw new Error('unsupported' satisfies HeartRateError);
    ble.stopDeviceScan();
    const device = await ble.connectToDevice(deviceId, { timeout: 12_000 });
    await device.discoverAllServicesAndCharacteristics();
    const monitor: Subscription = device.monitorCharacteristicForService(
      HEART_RATE_SERVICE,
      HEART_RATE_MEASUREMENT,
      (error, characteristic) => {
        if (error || !characteristic?.value) return;
        const bpm = parseHeartRate(decodeBase64(characteristic.value));
        if (bpm !== null) onBpm(bpm);
      },
    );
    const dropped = ble.onDeviceDisconnected(deviceId, () => onDisconnect());
    return () => {
      monitor.remove();
      dropped.remove();
      void ble.cancelDeviceConnection(deviceId).catch(() => {});
    };
  },
};
