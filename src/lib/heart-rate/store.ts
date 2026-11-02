import { create } from 'zustand';

import { bleSource } from './ble';
import type { Sample } from './summary';
import type { HeartRateDevice, HeartRateError } from './types';

/**
 * Canlı nabız durumu — cihaz bağlantısı ve test sırasındaki kayıt. Kalıcı veri DEĞİL (kayıt bitince özeti test
 * sonucuna yazılır, `features/assessment`), bu yüzden Zustand'da ve bellekte.
 *
 * Demo cihaz (`DEMO_DEVICE`, yalnız geliştirmede): saat olmadan akışı denemek için. Kayıt sürerken nabız yükselir,
 * test bitince düşer — toparlanma ölçüsü gerçek bir saatteki gibi çıkar.
 */
export const DEMO_DEVICE: HeartRateDevice = { id: 'demo', name: 'Demo' };

export type HeartRateStatus = 'idle' | 'scanning' | 'connecting' | 'connected' | 'error';

type Recording = { startedAt: number; endAt: number | null; samples: Sample[] };

type HeartRateState = {
  status: HeartRateStatus;
  error: HeartRateError | null;
  devices: HeartRateDevice[];
  device: HeartRateDevice | null;
  bpm: number | null;
  recording: Recording | null;
  startScan: () => void;
  stopScan: () => void;
  connect: (device: HeartRateDevice) => Promise<void>;
  disconnect: () => void;
  startRecording: () => void;
  /** Test bitti (kronometre durdu); kayıt toparlanma için sürer. Saniye olarak bitiş anını döner. */
  markEnd: () => number | null;
  /** Kaydı bitirir ve örnekleri döner. */
  stopRecording: () => Recording | null;
};

let stopScanning: (() => void) | null = null;
let closeConnection: (() => void) | null = null;

function startDemo(onBpm: (bpm: number) => void, phase: () => Recording | null): () => void {
  let bpm = 74;
  const timer = setInterval(() => {
    const recording = phase();
    const target = !recording ? 74 : recording.endAt === null ? 168 : 112;
    const rate = recording?.endAt !== null && recording ? 0.08 : 0.12;
    bpm += (target - bpm) * rate + (Math.random() - 0.5) * 3;
    onBpm(Math.round(bpm));
  }, 1000);
  return () => clearInterval(timer);
}

export const useHeartRate = create<HeartRateState>()((set, get) => {
  function onBpm(bpm: number) {
    const { recording } = get();
    if (!recording) {
      set({ bpm });
      return;
    }
    const t = Math.round((Date.now() - recording.startedAt) / 100) / 10;
    set({ bpm, recording: { ...recording, samples: [...recording.samples, [t, bpm]] } });
  }

  function onDisconnect() {
    closeConnection = null;
    set({ status: 'error', error: 'connection', bpm: null });
  }

  return {
    status: 'idle',
    error: null,
    devices: [],
    device: null,
    bpm: null,
    recording: null,

    startScan: () => {
      stopScanning?.();
      set({ status: 'scanning', error: null, devices: [] });
      stopScanning = bleSource.scan(
        (device) => {
          const { devices } = get();
          if (!devices.some((item) => item.id === device.id)) set({ devices: [...devices, device] });
        },
        (error) => set({ status: error === 'cancelled' ? 'idle' : 'error', error: error === 'cancelled' ? null : error }),
      );
    },

    stopScan: () => {
      stopScanning?.();
      stopScanning = null;
      if (get().status === 'scanning') set({ status: 'idle' });
    },

    connect: async (device) => {
      get().stopScan();
      closeConnection?.();
      set({ status: 'connecting', error: null, device });
      try {
        closeConnection =
          device.id === DEMO_DEVICE.id
            ? startDemo(onBpm, () => get().recording)
            : await bleSource.connect(device.id, onBpm, onDisconnect);
        set({ status: 'connected' });
      } catch {
        closeConnection = null;
        set({ status: 'error', error: 'connection', device: null });
      }
    },

    disconnect: () => {
      closeConnection?.();
      closeConnection = null;
      set({ status: 'idle', device: null, bpm: null, recording: null, error: null });
    },

    startRecording: () => set({ recording: { startedAt: Date.now(), endAt: null, samples: [] } }),

    markEnd: () => {
      const { recording } = get();
      if (!recording) return null;
      const endAt = Math.round((Date.now() - recording.startedAt) / 100) / 10;
      set({ recording: { ...recording, endAt } });
      return endAt;
    },

    stopRecording: () => {
      const { recording } = get();
      set({ recording: null });
      return recording;
    },
  };
});

export function isHeartRateSupported(): Promise<boolean> {
  return bleSource.isSupported();
}
