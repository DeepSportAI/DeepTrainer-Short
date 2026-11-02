/**
 * CSS yan-etki importları için tip bildirimi (`import '@/global.css'`).
 * Uniwind/Tailwind giriş dosyası ve CSS modülleri TypeScript'e böyle tanıtılır.
 */
declare module '*.css';
declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}
