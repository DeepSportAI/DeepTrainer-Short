import { PDF } from './pdf-theme';

/**
 * PDF sayfa kabuğu ve küçük HTML yardımcıları. Rapor HTML'den basılır (expo-print; web'de tarayıcının yazdırma
 * penceresi). Sayfa A4 (595 × 842 pt); yazı tipi sistemin sans-serif'i — Barlow gömülü değil, kâğıtta okunurluk yeter.
 */
export const A4 = { width: 595, height: 842 } as const;

export function esc(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Satır sonlarını koruyarak kaçış (antrenör notları). */
export function escMultiline(value: string): string {
  return esc(value).replace(/\n/g, '<br/>');
}

export function shell({ title, lang, body, css = '' }: { title: string; lang: string; body: string; css?: string }): string {
  return `<!DOCTYPE html>
<html lang="${esc(lang)}">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<style>
  @page { size: A4; margin: 28px 30px; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: ${PDF.ink}; font-size: 11px; line-height: 1.45; background: ${PDF.page}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  h1 { font-size: 22px; margin: 0; letter-spacing: -0.3px; }
  h2 { font-size: 13px; margin: 18px 0 8px; text-transform: none; color: ${PDF.navy}; }
  h3 { font-size: 12px; margin: 0 0 4px; }
  .muted { color: ${PDF.muted}; }
  .band { display: flex; justify-content: space-between; align-items: center; background: ${PDF.navy}; color: #fff; border-radius: 14px; padding: 14px 16px; }
  .band .brand { font-weight: 800; font-size: 15px; letter-spacing: 0.2px; }
  .band .brand span { background: ${PDF.volt}; color: ${PDF.voltInk}; border-radius: 6px; padding: 1px 6px; margin-left: 6px; font-size: 11px; }
  .band .meta { text-align: right; font-size: 10px; opacity: 0.85; }
  .card { border: 1px solid ${PDF.border}; border-radius: 12px; padding: 10px 12px; margin-top: 10px; page-break-inside: avoid; }
  .grid { display: flex; gap: 8px; }
  .grid > * { flex: 1; }
  .stat { background: ${PDF.surface}; border-radius: 10px; padding: 8px 10px; }
  .stat .label { font-size: 9.5px; color: ${PDF.muted}; font-weight: 600; }
  .stat .value { font-size: 16px; font-weight: 800; }
  .volt { background: ${PDF.volt}; color: ${PDF.voltInk}; border-radius: 12px; padding: 10px 12px; margin-top: 10px; page-break-inside: avoid; }
  .volt .label { font-size: 10px; font-weight: 600; opacity: 0.75; }
  .volt .value { font-size: 17px; font-weight: 800; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 9.5px; color: ${PDF.muted}; font-weight: 600; padding: 4px 6px; border-bottom: 1px solid ${PDF.border}; }
  td { padding: 6px; border-bottom: 1px solid ${PDF.border}; vertical-align: top; }
  tr { page-break-inside: avoid; }
  .ok { color: ${PDF.success}; font-weight: 700; }
  .warn { color: ${PDF.warning}; font-weight: 700; }
  .pill { display: inline-block; border-radius: 999px; padding: 1px 8px; font-size: 9.5px; font-weight: 700; background: ${PDF.surface}; border: 1px solid ${PDF.border}; margin: 1px 2px 1px 0; }
  .level { display: flex; align-items: center; gap: 8px; }
  .bars { display: flex; gap: 3px; }
  .bars i { display: block; width: 26px; height: 7px; border-radius: 4px; background: ${PDF.border}; }
  .photos { display: flex; gap: 10px; margin-top: 8px; }
  .photos img { width: 48%; max-height: 300px; object-fit: cover; border-radius: 10px; border: 1px solid ${PDF.border}; }
  .day { page-break-inside: avoid; margin-top: 10px; }
  .section-tag { font-size: 9px; font-weight: 700; color: ${PDF.navy}; background: ${PDF.background}; border-radius: 6px; padding: 1px 6px; }
  .footer { margin-top: 22px; padding-top: 8px; border-top: 1px solid ${PDF.border}; font-size: 9px; color: ${PDF.muted}; }
${css}
</style>
</head>
<body>
${body}
</body>
</html>`;
}

/** Üç kademeli çubuk: zayıf 1, orta 2, iyi 3 dolu parça; renk seviyeden. */
export function levelBars(level: 'weak' | 'medium' | 'good' | null): string {
  const filled = level === 'weak' ? 1 : level === 'medium' ? 2 : level === 'good' ? 3 : 0;
  const color = level ? PDF.level[level] : PDF.border;
  return `<span class="bars">${[0, 1, 2]
    .map((index) => `<i style="background:${index < filled ? color : PDF.border}"></i>`)
    .join('')}</span>`;
}

/** Nabız eğrisi (SVG) — örnekler [saniye, bpm]; bitiş anı kesik çizgiyle. */
export function heartRateSvg(samples: [number, number][], endAt: number | null): string {
  if (samples.length < 2) return '';
  const width = 520;
  const height = 90;
  const maxT = samples[samples.length - 1][0] || 1;
  const values = samples.map(([, bpm]) => bpm);
  const min = Math.min(...values) - 5;
  const max = Math.max(...values) + 5;
  const x = (t: number) => (t / maxT) * width;
  const y = (bpm: number) => height - ((bpm - min) / (max - min || 1)) * height;
  const line = samples.map(([t, bpm]) => `${x(t).toFixed(1)},${y(bpm).toFixed(1)}`).join(' ');
  const marker =
    endAt !== null && endAt <= maxT
      ? `<line x1="${x(endAt).toFixed(1)}" y1="0" x2="${x(endAt).toFixed(1)}" y2="${height}" stroke="${PDF.muted}" stroke-dasharray="4 4" stroke-width="1"/>`
      : '';
  return `<svg width="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="margin-top:6px">${marker}<polyline points="${line}" fill="none" stroke="${PDF.level.weak}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}
