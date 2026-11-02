import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { A4 } from './html';

/**
 * HTML → PDF → paylaşım sayfası (WhatsApp, e-posta, Dosyalar). Dosya adı okunur: "Irem-Yilmaz-analiz-2026-11-02.pdf".
 * Sporcuya rapor böyle gider; uygulama içinden mesaj gönderilmez.
 */
export async function sharePdf(html: string, fileName: string, dialogTitle: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html, width: A4.width, height: A4.height });
  const target = new File(Paths.cache, `${fileName}.pdf`);
  if (target.exists) target.delete();
  new File(uri).moveSync(target);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(target.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle });
  } else {
    await Print.printAsync({ uri: target.uri });
  }
}

/** Dosya adına uygun parça: Türkçe harfler sadeleşir, boşluk tire olur. */
export function fileSafe(value: string): string {
  const map: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', İ: 'I', ö: 'o', ş: 's', ü: 'u', Ç: 'C', Ğ: 'G', Ö: 'O', Ş: 'S', Ü: 'U' };
  return value
    .replace(/[çğıİöşüÇĞÖŞÜ]/g, (char) => map[char] ?? char)
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
