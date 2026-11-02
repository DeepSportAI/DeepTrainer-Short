/**
 * PDF raporunun renkleri — kâğıda HEP açık temayla basılır. Değerler `src/global.css` AÇIK bloğunun gerçekte basılan
 * hex'leridir (yorumlardaki değerler); uygulamada renk değerinin görüldüğü tek dosya budur. Token bloğu değişirse
 * burası da aynı değerlerle güncellenir.
 */
export const PDF = {
  page: '#ffffff',
  background: '#ecf0f9',
  ink: '#0d1528',
  muted: '#525b6f',
  border: '#d7dce7',
  surface: '#f2f4fa',
  volt: '#d3fa3c',
  voltInk: '#131809',
  navy: '#16295f',
  success: '#107c5a',
  warning: '#bb731b',
  level: { weak: '#de3b3d', medium: '#e6b731', good: '#1a9951', hard: '#ea7d2e' },
} as const;
