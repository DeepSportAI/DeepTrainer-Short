import type { StateStorage } from 'zustand/middleware';

/**
 * Web: küçük tercihler `localStorage`'da (expo-sqlite'ın web sürümü SharedArrayBuffer başlıkları istiyor).
 * Sözleşme native `kv.ts` ile aynı.
 */
export const kv = {
  getItem: (key: string): Promise<string | null> => Promise.resolve(globalThis.localStorage?.getItem(key) ?? null),
  setItem: (key: string, value: string): Promise<void> => Promise.resolve(globalThis.localStorage?.setItem(key, value)),
  removeItem: (key: string): Promise<void> => Promise.resolve(globalThis.localStorage?.removeItem(key)),
};

export const zustandStorage: StateStorage = {
  getItem: (name) => kv.getItem(name),
  setItem: (name, value) => kv.setItem(name, value),
  removeItem: (name) => kv.removeItem(name),
};
