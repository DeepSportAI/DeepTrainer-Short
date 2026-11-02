import { useEffect, useState } from 'react';

/**
 * Değeri geciktirir. Aramada her tuşta istek atmamak için kullanılıyor: kullanıcı
 * duraklayınca sorgu gider. Web de aynı süreyi (300 ms) kullanıyor.
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
