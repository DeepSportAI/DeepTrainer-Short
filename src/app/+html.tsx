import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Web kök belgesi. Native'de yazı tipleri `app.json` → `expo-font` ile pakete girer; web'de aynı aileler (Barlow,
 * Barlow Semi Condensed — `global.css` `@theme`) Google Fonts'tan yüklenir.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,700&family=Barlow+Semi+Condensed:wght@600;700;800&display=swap"
        />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
