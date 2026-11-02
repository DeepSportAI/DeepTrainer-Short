import { COLLECTIONS, type Collection, type DocumentStore } from './types';

/**
 * Web belge deposu (önizleme ve tarayıcıda kullanım): koleksiyon başına bir `localStorage` anahtarı, içinde
 * kimlik → belge haritası. expo-sqlite'ın web sürümü SharedArrayBuffer başlıkları (COOP/COEP) istiyor ve alfa;
 * sözleşme aynı olduğu için ekranlar farkı görmez.
 */
const PREFIX = 'deeptrainer.docs.';

function read<T>(collection: Collection): Record<string, T> {
  try {
    const raw = globalThis.localStorage?.getItem(PREFIX + collection);
    return raw ? (JSON.parse(raw) as Record<string, T>) : {};
  } catch {
    return {};
  }
}

function write<T>(collection: Collection, map: Record<string, T>) {
  globalThis.localStorage?.setItem(PREFIX + collection, JSON.stringify(map));
}

export const store: DocumentStore = {
  async list<T>(collection: Collection) {
    return Object.values(read<T>(collection));
  },
  async get<T>(collection: Collection, id: string) {
    return read<T>(collection)[id] ?? null;
  },
  async put(collection, doc) {
    const map = read<typeof doc>(collection);
    map[doc.id] = doc;
    write(collection, map);
  },
  async remove(collection, id) {
    const map = read(collection);
    delete map[id];
    write(collection, map);
  },
  async removeWhere<T>(collection: Collection, match: (doc: T) => boolean) {
    const map = read<T>(collection);
    for (const [id, doc] of Object.entries(map)) if (match(doc)) delete map[id];
    write(collection, map);
  },
  async clear() {
    for (const collection of COLLECTIONS) globalThis.localStorage?.removeItem(PREFIX + collection);
  },
};
