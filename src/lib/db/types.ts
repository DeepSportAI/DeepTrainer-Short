/**
 * Yerel belge deposunun sözleşmesi — platformdan bağımsız (native: SQLite, web: localStorage).
 *
 * Veri cihazda: antrenör sporcuyu kaydeder, test alır, rapor çıkarır; sunucu yok (V1). Her koleksiyon belge
 * tutar, belge kendi `id`'sini taşır ve JSON olarak saklanır. Sorgular `features/*\/repository.ts` üzerinden
 * gelir — sunucu geldiğinde yalnız depolar değişir, ekranlar ve sorgu anahtarları yerinde kalır.
 */
export type Collection = 'athletes' | 'assessments' | 'programs' | 'goals';

export const COLLECTIONS: readonly Collection[] = ['athletes', 'assessments', 'programs', 'goals'];

export type DocumentStore = {
  list<T>(collection: Collection): Promise<T[]>;
  get<T>(collection: Collection, id: string): Promise<T | null>;
  put<T extends { id: string }>(collection: Collection, doc: T): Promise<void>;
  remove(collection: Collection, id: string): Promise<void>;
  /** Koşula uyan belgeleri siler (sporcu silinince testleri ve programları). */
  removeWhere<T>(collection: Collection, match: (doc: T) => boolean): Promise<void>;
  /** Bütün koleksiyonları boşaltır (Ayarlar › Verileri sil). */
  clear(): Promise<void>;
};
