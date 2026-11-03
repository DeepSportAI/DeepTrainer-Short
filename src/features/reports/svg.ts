import type { BandTone } from '@/features/assessment/bands';

import { esc } from './html';
import { PDF } from './pdf-theme';

/**
 * PDF grafikleri — saf SVG dizeleri (kâğıda açık temayla). Tek ölçek kuralı: her işaret tek bir eksenle yerleşir,
 * etiketler grafiğin sınırı içinde kalır.
 */
export const TONE_COLOR: Record<BandTone, string> = { bad: PDF.level.weak, warn: PDF.level.medium, good: PDF.level.good };

/** Büyük form puanı halkası (0–100). */
export function ringSvg(score: number | null, size = 132): string {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const ratio = score === null ? 0 : Math.max(0, Math.min(1, score / 100));
  const color = score === null ? PDF.border : score >= 75 ? PDF.level.good : score >= 50 ? PDF.level.medium : PDF.level.weak;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${PDF.surface}" stroke-width="14"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round"
      stroke-dasharray="${c * ratio} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    <text x="50%" y="${size / 2 + 4}" text-anchor="middle" font-size="40" font-weight="800" fill="${PDF.ink}">${score ?? '—'}</text>
    <text x="50%" y="${size / 2 + 24}" text-anchor="middle" font-size="10" fill="${PDF.muted}">/ 100</text>
  </svg>`;
}

/** Radar: güncel (dolu, lacivert) ve önceki (kesik, gri). Değerler 0..1. */
export function radarSvg(labels: string[], current: (number | null)[], previous: (number | null)[] | null, size = 230): string {
  const pad = 52;
  const r = size / 2 - pad;
  const cx = size / 2;
  const cy = size / 2;
  const n = labels.length;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + Math.cos(a) * r * v, cy + Math.sin(a) * r * v];
  };
  const poly = (values: (number | null)[]) => values.map((v, i) => pt(i, v ?? 0).map((x) => x.toFixed(1)).join(',')).join(' ');
  const rings = [1 / 3, 2 / 3, 1].map((ring) => `<polygon points="${poly(labels.map(() => ring))}" fill="none" stroke="${PDF.border}" stroke-width="1"/>`).join('');
  const spokes = labels.map((_, i) => `<line x1="${cx}" y1="${cy}" x2="${pt(i, 1)[0]}" y2="${pt(i, 1)[1]}" stroke="${PDF.border}"/>`).join('');
  const names = labels
    .map((label, i) => {
      const [x, y] = pt(i, 1.28);
      return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="${PDF.ink}">${esc(label)}</text>`;
    })
    .join('');
  const prev = previous ? `<polygon points="${poly(previous)}" fill="none" stroke="${PDF.muted}" stroke-width="1.5" stroke-dasharray="5 4"/>` : '';
  const curr = `<polygon points="${poly(current)}" fill="${PDF.navy}" fill-opacity="0.18" stroke="${PDF.navy}" stroke-width="2.2" stroke-linejoin="round"/>`;
  const dots = current
    .map((v, i) => (v === null ? '' : `<circle cx="${pt(i, v)[0].toFixed(1)}" cy="${pt(i, v)[1].toFixed(1)}" r="3.5" fill="${PDF.navy}"/>`))
    .join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${rings}${spokes}${prev}${curr}${dots}${names}</svg>`;
}

export type SvgSegment = { from: number; width: number; tone: BandTone; label: string };

/** Tanita tarzı aralık çubuğu: renkli bantlar, değer imleci (üçgen + değer), önceki değer (boş daire), bant adları. */
export function scaleSvg(segments: SvgSegment[], marker: number, markerLabel: string, previous: number | null, width = 300): string {
  const h = 46;
  const barY = 20;
  const x = (ratio: number) => Math.max(6, Math.min(width - 6, ratio * width));
  const bands = segments
    .map((s, i) => {
      const bx = s.from * width + (i ? 1 : 0);
      const bw = Math.max(0, s.width * width - (i ? 1 : 0));
      return `<rect x="${bx.toFixed(1)}" y="${barY}" width="${bw.toFixed(1)}" height="9" fill="${TONE_COLOR[s.tone]}" opacity="0.88"/>
        <text x="${(s.from * width + (s.width * width) / 2).toFixed(1)}" y="${barY + 22}" text-anchor="middle" font-size="8.5" fill="${PDF.muted}">${esc(s.label)}</text>`;
    })
    .join('');
  const prev = previous === null ? '' : `<circle cx="${x(previous).toFixed(1)}" cy="${barY + 4.5}" r="4.5" fill="#ffffff" stroke="${PDF.muted}" stroke-width="1.8"/>`;
  const mx = x(marker);
  const labelX = Math.max(18, Math.min(width - 18, mx));
  return `<svg width="100%" viewBox="0 0 ${width} ${h}" preserveAspectRatio="none" style="overflow:visible">
    <rect x="0" y="${barY}" width="${width}" height="9" rx="4.5" fill="${PDF.surface}"/>${bands}${prev}
    <polygon points="${mx - 6},${barY - 8} ${mx + 6},${barY - 8} ${mx},${barY - 1}" fill="${PDF.ink}"/>
    <line x1="${mx}" y1="${barY - 1}" x2="${mx}" y2="${barY + 11}" stroke="${PDF.ink}" stroke-width="2"/>
    <text x="${labelX}" y="${barY - 11}" text-anchor="middle" font-size="9.5" font-weight="800" fill="${PDF.ink}">${esc(markerLabel)}</text>
  </svg>`;
}

/** Gelişim grafiği (Tanita "geçmiş"): noktalar, değer etiketleri, ilk ve son tarih. */
export function historySvg(points: { at: number; value: number; label: string }[], dates: [string, string], better: 'higher' | 'lower', width = 240, height = 92): string {
  if (points.length < 2) return '';
  const left = 14;
  const right = 14;
  const top = 18;
  const bottom = 18;
  const values = points.map((p) => p.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const t0 = points[0].at;
  const t1 = points[points.length - 1].at;
  const x = (t: number) => left + ((t - t0) / Math.max(t1 - t0, 1)) * (width - left - right);
  const y = (v: number) => top + (1 - (v - lo) / span) * (height - top - bottom);
  const last = points[points.length - 1].value;
  const first = points[0].value;
  const good = better === 'higher' ? last >= first : last <= first;
  const color = good ? PDF.level.good : PDF.level.weak;
  const line = points.map((p) => `${x(p.at).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const area = `${x(t0).toFixed(1)},${height - bottom} ${line} ${x(t1).toFixed(1)},${height - bottom}`;
  const marks = points
    .map(
      (p, i) =>
        `<circle cx="${x(p.at).toFixed(1)}" cy="${y(p.value).toFixed(1)}" r="${i === points.length - 1 ? 4 : 3}" fill="${i === points.length - 1 ? color : PDF.navy}"/>
         <text x="${x(p.at).toFixed(1)}" y="${(y(p.value) - 7).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="700" fill="${PDF.ink}">${esc(p.label)}</text>`,
    )
    .join('');
  return `<svg width="100%" viewBox="0 0 ${width} ${height}">
    <line x1="${left}" y1="${height - bottom}" x2="${width - right}" y2="${height - bottom}" stroke="${PDF.border}"/>
    <polygon points="${area}" fill="${color}" opacity="0.10"/>
    <polyline points="${line}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>${marks}
    <text x="${left}" y="${height - 4}" font-size="8.5" fill="${PDF.muted}">${esc(dates[0])}</text>
    <text x="${width - right}" y="${height - 4}" text-anchor="end" font-size="8.5" fill="${PDF.muted}">${esc(dates[1])}</text>
  </svg>`;
}

/** Hedef gidişatı: beklenen çizgi + "yolunda koridoru", ölçümler, hedef dairesi, bugün çizgisi. */
export function goalSvg(input: {
  startAt: number;
  deadline: number;
  startValue: number;
  target: number;
  points: { at: number; value: number }[];
  now: number;
  color: string;
  targetLabel: string;
}, width = 250, height = 84): string {
  const { startAt, deadline, startValue, target, points, now, color } = input;
  const left = 6;
  // Hedef etiketi ("12 tekrar") hedef noktasının sağında; yeri etiketin boyuna göre.
  const right = Math.max(30, 14 + input.targetLabel.length * 5.6);
  const top = 10;
  const bottom = 10;
  const t1 = Math.max(deadline, points[points.length - 1]?.at ?? deadline);
  const vals = [startValue, target, ...points.map((p) => p.value)];
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const pad = (hi - lo || 1) * 0.18;
  const x = (t: number) => left + ((t - startAt) / Math.max(t1 - startAt, 1)) * (width - left - right);
  const y = (v: number) => top + (1 - (v - (lo - pad)) / (hi - lo + 2 * pad)) * (height - top - bottom);
  const tol = Math.abs(target - startValue) * 0.1;
  const dir = target >= startValue ? 1 : -1;
  const corridor = `${x(startAt)},${y(startValue)} ${x(deadline)},${y(target)} ${x(deadline)},${y(target - dir * tol)} ${x(startAt)},${y(startValue - dir * tol)}`;
  const line = points.map((p) => `${x(p.at).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const dots = points.map((p, i) => `<circle cx="${x(p.at).toFixed(1)}" cy="${y(p.value).toFixed(1)}" r="${i === points.length - 1 ? 4 : 3}" fill="${color}"/>`).join('');
  const today = now > startAt && now < t1 ? `<line x1="${x(now)}" y1="${top - 4}" x2="${x(now)}" y2="${height - bottom}" stroke="${PDF.navy}" stroke-width="1" opacity="0.45"/>` : '';
  return `<svg width="100%" viewBox="0 0 ${width} ${height}">
    <polygon points="${corridor}" fill="${PDF.level.good}" opacity="0.14"/>
    <line x1="${x(startAt)}" y1="${y(startValue)}" x2="${x(deadline)}" y2="${y(target)}" stroke="${PDF.muted}" stroke-width="1.4" stroke-dasharray="5 4"/>
    ${today}
    <polyline points="${line}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round"/>${dots}
    <circle cx="${x(deadline)}" cy="${y(target)}" r="5.5" fill="#ffffff" stroke="${PDF.ink}" stroke-width="1.8"/>
    <text x="${x(deadline) + 9}" y="${y(target) + 3.5}" font-size="9.5" font-weight="800" fill="${PDF.ink}">${esc(input.targetLabel)}</text>
  </svg>`;
}

export type BodyRegion = 'neck' | 'shoulders' | 'upperBack' | 'core' | 'lowerBack' | 'hips' | 'knees' | 'ankles' | 'cardio';

/**
 * Vücut haritası (önden, sade): bulgu görülen bölgeler turuncu nokta, tanışmada ağrı bildirilen bölgeler kırmızı
 * halka. Sırt bölgeleri (üst sırt, bel) gövdenin üzerinde işaretlenir.
 */
export function bodyMapSvg(findings: Set<BodyRegion>, pain: Set<BodyRegion>, width = 150): string {
  const h = width * 1.9;
  const s = width / 150;
  const fill = '#e6eaf3';
  const P: Record<BodyRegion, [number, number]> = {
    neck: [75, 50],
    shoulders: [75, 64],
    upperBack: [75, 82],
    cardio: [62, 92],
    core: [75, 112],
    lowerBack: [75, 128],
    hips: [75, 146],
    knees: [75, 205],
    ankles: [75, 262],
  };
  const pair = (region: BodyRegion, dx: number) => {
    const [cx, cy] = P[region];
    return dx === 0 ? [[cx, cy]] : [[cx - dx, cy], [cx + dx, cy]];
  };
  const spread: Partial<Record<BodyRegion, number>> = { shoulders: 30, hips: 16, knees: 15, ankles: 15 };
  const marks = (set: Set<BodyRegion>, kind: 'finding' | 'pain') =>
    [...set]
      .flatMap((region) => pair(region, spread[region] ?? 0))
      .map(([cx, cy]) =>
        kind === 'finding'
          ? `<circle cx="${cx * s}" cy="${cy * s}" r="${7 * s}" fill="${PDF.level.hard}" opacity="0.9"/>`
          : `<circle cx="${cx * s}" cy="${cy * s}" r="${11 * s}" fill="none" stroke="${PDF.level.weak}" stroke-width="${2.4 * s}"/>`,
      )
      .join('');
  const body = `
    <circle cx="${75 * s}" cy="${26 * s}" r="${17 * s}" fill="${fill}"/>
    <rect x="${68 * s}" y="${42 * s}" width="${14 * s}" height="${12 * s}" rx="${4 * s}" fill="${fill}"/>
    <rect x="${43 * s}" y="${55 * s}" width="${64 * s}" height="${98 * s}" rx="${22 * s}" fill="${fill}"/>
    <rect x="${24 * s}" y="${60 * s}" width="${16 * s}" height="${84 * s}" rx="${8 * s}" fill="${fill}" transform="rotate(8 ${32 * s} ${60 * s})"/>
    <rect x="${110 * s}" y="${60 * s}" width="${16 * s}" height="${84 * s}" rx="${8 * s}" fill="${fill}" transform="rotate(-8 ${118 * s} ${60 * s})"/>
    <rect x="${50 * s}" y="${148 * s}" width="${22 * s}" height="${126 * s}" rx="${10 * s}" fill="${fill}"/>
    <rect x="${78 * s}" y="${148 * s}" width="${22 * s}" height="${126 * s}" rx="${10 * s}" fill="${fill}"/>`;
  return `<svg width="${width}" height="${h}" viewBox="0 0 ${width} ${h}">${body}${marks(findings, 'finding')}${marks(pain, 'pain')}</svg>`;
}
