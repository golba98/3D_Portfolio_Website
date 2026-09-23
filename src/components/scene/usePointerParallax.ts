import { useEffect, useRef, type RefObject } from 'react';

export interface PointerOffset {
  /** -1 (left) … 1 (right) */
  x: number;
  /** -1 (bottom) … 1 (top) */
  y: number;
}

/**
 * Normalised pointer position over the window, for camera parallax. Listens on
 * the window so DOM overlays above the canvas don't interrupt it. Touch and
 * disabled states report the centre.
 */
export function usePointerParallax(enabled: boolean): RefObject<PointerOffset> {
  const offset = useRef<PointerOffset>({ x: 0, y: 0 });

  useEffect(() => {
    offset.current = { x: 0, y: 0 };
    if (!enabled || window.matchMedia('(pointer: coarse)').matches) return;

    const onMove = (event: PointerEvent): void => {
      if (event.pointerType !== 'mouse') return;
      offset.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -((event.clientY / window.innerHeight) * 2 - 1),
      };
    };
    const onLeave = (): void => {
      offset.current = { x: 0, y: 0 };
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [enabled]);

  return offset;
}
