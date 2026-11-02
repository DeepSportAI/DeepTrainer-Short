import Storage from 'expo-sqlite/kv-store';
import type { StateStorage } from 'zustand/middleware';

/**
 * Küçük, gizli OLMAYAN değerler için kalıcı depo (tema tercihi, birim sistemi, filtreler,
 * ölçüm kuyruğu). Web'deki `localStorage`'ın karşılığı.
 *
 * Token ve sırlar BURAYA YAZILMAZ — onlar `lib/auth/token-store` (SecureStore) içinde.
 */
export const kv = Storage;

/** Zustand `persist` adaptörü. */
export const zustandStorage: StateStorage = {
  getItem: (name) => Storage.getItem(name),
  setItem: (name, value) => Storage.setItem(name, value),
  removeItem: (name) => Storage.removeItem(name),
};
