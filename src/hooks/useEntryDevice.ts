import { useExperience } from '../store/experience';
import type { EntryDevice } from '../types/experience';
import { useIsCompact } from './useIsCompact';

export type { EntryDevice };

/** The device made for this screen: the phone on phones, the monitor on everything else. */
export function useDetectedDevice(): EntryDevice {
  return useIsCompact() ? 'phone' : 'monitor';
}

/**
 * The device the visitor is going into: the one made for their screen,
 * unless they chose the other one anyway from its pop-up.
 */
export function useEntryDevice(): EntryDevice {
  const detected = useDetectedDevice();
  const override = useExperience((s) => s.entryOverride);
  return override ?? detected;
}
