import { useEffect, useState } from 'react';

/** Current time, refreshed on the minute boundary (plus every `intervalMs` as a safety net). */
export function useNow(intervalMs = 15_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = (): void => setNow(new Date());
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
