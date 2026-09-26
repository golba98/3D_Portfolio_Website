/**
 * Dev-only switches for exercising edge cases from the URL, e.g. `/?fallback`.
 * They are compiled out of production builds.
 */
function hasFlag(name: string): boolean {
  if (!import.meta.env.DEV) return false;
  return new URLSearchParams(window.location.search).has(name);
}

function flagValue(name: string): string | null {
  if (!import.meta.env.DEV) return null;
  return new URLSearchParams(window.location.search).get(name);
}

export const debugFlags = {
  forceFallback: (): boolean => hasFlag('fallback'),
  /** `?pose=introSide|presentation|monitorFocus|phoneFocus` holds the camera there, for tuning config/cameraPoses.ts. */
  heldPose: (): string | null => flagValue('pose'),
};
