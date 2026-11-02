import * as SQLite from 'expo-sqlite';

import type { Collection, DocumentStore } from './types';

/**
 * Native belge deposu: tek tablo, koleksiyon + kimlik birincil anahtar, gövde JSON. Şema bilerek yalın:
 * alanlar uygulamayla birlikte büyüyor (değerlendirme sonuçları, program günleri) ve her değişiklik bir tablo
 * göçü istemesin. Sıralama ve süzme bellekte yapılır — bir antrenörün sporcu ve test sayısı (yüzler) buna uygun.
 */
let opening: Promise<SQLite.SQLiteDatabase> | null = null;

function database(): Promise<SQLite.SQLiteDatabase> {
  if (!opening) {
    opening = (async () => {
      const db = await SQLite.openDatabaseAsync('deeptrainer.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS docs (
          collection TEXT NOT NULL,
          id TEXT NOT NULL,
          data TEXT NOT NULL,
          updated_at INTEGER NOT NULL,
          PRIMARY KEY (collection, id)
        );
      `);
      return db;
    })();
  }
  return opening;
}

type Row = { data: string };

export const store: DocumentStore = {
  async list<T>(collection: Collection) {
    const db = await database();
    const rows = await db.getAllAsync<Row>('SELECT data FROM docs WHERE collection = ?', [collection]);
    return rows.map((row) => JSON.parse(row.data) as T);
  },
  async get<T>(collection: Collection, id: string) {
    const db = await database();
    const row = await db.getFirstAsync<Row>('SELECT data FROM docs WHERE collection = ? AND id = ?', [collection, id]);
    return row ? (JSON.parse(row.data) as T) : null;
  },
  async put(collection, doc) {
    const db = await database();
    await db.runAsync(
      'INSERT OR REPLACE INTO docs (collection, id, data, updated_at) VALUES (?, ?, ?, ?)',
      [collection, doc.id, JSON.stringify(doc), Date.now()],
    );
  },
  async remove(collection, id) {
    const db = await database();
    await db.runAsync('DELETE FROM docs WHERE collection = ? AND id = ?', [collection, id]);
  },
  async removeWhere<T>(collection: Collection, match: (doc: T) => boolean) {
    const docs = await this.list<T & { id: string }>(collection);
    for (const doc of docs) if (match(doc)) await this.remove(collection, doc.id);
  },
  async clear() {
    const db = await database();
    await db.runAsync('DELETE FROM docs');
  },
};
