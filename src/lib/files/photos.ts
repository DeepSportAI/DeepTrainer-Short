import { Directory, File, Paths } from 'expo-file-system';

/**
 * Ölçüm fotoğrafları (ön / yan) — native: uygulamanın belge klasörüne kopyalanır (seçicinin önbellek dosyası
 * silinebilir), kayıt yalnız dosya adresini tutar. PDF'e gömülürken base64'e çevrilir (iOS'ta yazdırma yerel
 * dosya adresini okuyamaz; expo-print belgesi).
 */
function photosDirectory(): Directory {
  const dir = new Directory(Paths.document, 'photos');
  if (!dir.exists) dir.create({ idempotent: true, intermediates: true });
  return dir;
}

export async function persistPhoto(sourceUri: string, name: string): Promise<string> {
  const target = new File(photosDirectory(), `${name}.jpg`);
  if (target.exists) target.delete();
  await new File(sourceUri).copy(target);
  return target.uri;
}

export function deletePhoto(uri: string | null | undefined): void {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Dosya zaten yoksa kayıt temizliği sürer.
  }
}

/** `data:image/jpeg;base64,…` — PDF'e gömmek için. Okunamazsa null (rapor fotoğrafsız çıkar). */
export async function photoDataUri(uri: string): Promise<string | null> {
  try {
    const base64 = await new File(uri).base64();
    return `data:image/jpeg;base64,${base64}`;
  } catch {
    return null;
  }
}
