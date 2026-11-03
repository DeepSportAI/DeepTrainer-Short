import { useEffect, useState } from 'react';

function readClock(): number {
  return Date.now();
}

/** Şimdiki zaman, dakikada bir tazelenir (hedef durumu, "3 gün önce" gibi metinler gün içinde eskimesin). */
export function useNow(refreshMs = 60_000): number {
  const [now, setNow] = useState(readClock);
  useEffect(() => {
    const id = setInterval(() => setNow(readClock()), refreshMs);
    return () => clearInterval(id);
  }, [refreshMs]);
  return now;
}
