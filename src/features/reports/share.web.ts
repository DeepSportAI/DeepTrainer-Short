/**
 * Web: tarayıcının yazdırma penceresi ("PDF olarak kaydet"). expo-print web'de yalnız açık sayfayı basıyor; rapor gizli
 * bir çerçeveye yazılıp oradan basılır (açılır pencere engelleyicisine takılmaz).
 */
export async function sharePdf(html: string, _fileName: string, _dialogTitle: string): Promise<void> {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  Object.assign(frame.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
  document.body.appendChild(frame);
  const doc = frame.contentWindow?.document;
  if (!doc) {
    frame.remove();
    throw new Error('print-unavailable');
  }
  doc.open();
  doc.write(html);
  doc.close();
  await new Promise((resolve) => setTimeout(resolve, 350));
  frame.contentWindow?.focus();
  frame.contentWindow?.print();
  setTimeout(() => frame.remove(), 60_000);
}

export function fileSafe(value: string): string {
  const map: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', İ: 'I', ö: 'o', ş: 's', ü: 'u', Ç: 'C', Ğ: 'G', Ö: 'O', Ş: 'S', Ü: 'U' };
  return value
    .replace(/[çğıİöşüÇĞÖŞÜ]/g, (char) => map[char] ?? char)
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
