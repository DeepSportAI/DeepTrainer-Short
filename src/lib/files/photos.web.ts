/**
 * Web: seçici fotoğrafı veri adresi (`data:` / `blob:`) olarak verir; kayıt onu tutar. `blob:` adresi sayfa
 * yenilenince ölür, bu yüzden veri adresine çevrilir.
 */
async function toDataUri(uri: string): Promise<string> {
  if (uri.startsWith('data:')) return uri;
  const blob = await (await fetch(uri)).blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function persistPhoto(sourceUri: string, _name: string): Promise<string> {
  return toDataUri(sourceUri);
}

export function deletePhoto(_uri: string | null | undefined): void {}

export async function photoDataUri(uri: string): Promise<string | null> {
  try {
    return await toDataUri(uri);
  } catch {
    return null;
  }
}
