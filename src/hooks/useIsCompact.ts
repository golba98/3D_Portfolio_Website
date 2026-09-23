import { COMPACT_QUERY } from '../config/layout';
import { useMediaQuery } from './useMediaQuery';

/** Small screens get the single-app mobile shell and a lighter 3D scene. */
export function useIsCompact(): boolean {
  return useMediaQuery(COMPACT_QUERY);
}
