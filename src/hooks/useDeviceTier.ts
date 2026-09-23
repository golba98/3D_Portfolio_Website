import { useMemo } from 'react';
import type { DeviceTier } from '../types/scene';
import { useIsCompact } from './useIsCompact';

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

/**
 * Rough GPU budget guess. "low" drops the DPR ceiling and lowers the
 * environment and contact-shadow resolutions.
 */
export function useDeviceTier(): DeviceTier {
  const compact = useIsCompact();
  return useMemo(() => {
    const nav = navigator as NavigatorWithMemory;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const fewCores = (nav.hardwareConcurrency ?? 8) <= 4;
    const lowMemory = (nav.deviceMemory ?? 8) <= 4;
    return compact || (coarse && (fewCores || lowMemory)) || (fewCores && lowMemory) ? 'low' : 'high';
  }, [compact]);
}
