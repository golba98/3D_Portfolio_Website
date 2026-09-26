import { useEffect, useState } from 'react';
import { onEveryMinute } from '../lib/minuteTicker';

/** The current time, updated the moment each minute starts (the clocks only show minutes). */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => onEveryMinute(() => setNow(new Date())), []);
  return now;
}
