import { useLayoutEffect, useMemo, useRef, type PointerEvent } from 'react';

interface SwipeOptions {
  axis: 'x' | 'y';
  /** The finger moved; `offset` is its distance along the axis from where it went down. */
  onMove?: (offset: number) => void;
  /** The finger lifted after a swipe along the axis. `velocity` is in px/ms along the axis. */
  onEnd: (offset: number, velocity: number) => void;
  /** The gesture was abandoned (it went the other way, or the browser took it over). */
  onCancel?: () => void;
}

interface SwipeHandlers {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
}

/** Movement before a gesture commits to an axis. */
const SLOP = 8;

interface Track {
  id: number;
  x: number;
  y: number;
  locked: boolean;
  last: { t: number; v: number };
  velocity: number;
}

/**
 * A one-axis touch swipe: locks to its axis after a few pixels, abandons if
 * the finger goes the other way (so vertical scrolling still works under a
 * horizontal swipe), and reports offset and release velocity.
 */
export function useSwipe(options: SwipeOptions): SwipeHandlers {
  const latest = useRef(options);
  useLayoutEffect(() => {
    latest.current = options;
  });
  const track = useRef<Track | null>(null);

  return useMemo(() => {
    const along = (event: PointerEvent<HTMLElement>, start: Track): number =>
      latest.current.axis === 'x' ? event.clientX - start.x : event.clientY - start.y;
    const across = (event: PointerEvent<HTMLElement>, start: Track): number =>
      latest.current.axis === 'x' ? event.clientY - start.y : event.clientX - start.x;

    const cancel = (): void => {
      if (track.current?.locked) latest.current.onCancel?.();
      track.current = null;
    };

    return {
      onPointerDown: (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        track.current = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          locked: false,
          last: { t: event.timeStamp, v: 0 },
          velocity: 0,
        };
      },
      onPointerMove: (event) => {
        const start = track.current;
        if (!start || start.id !== event.pointerId) return;
        const offset = along(event, start);
        if (!start.locked) {
          if (Math.abs(across(event, start)) > SLOP && Math.abs(across(event, start)) > Math.abs(offset)) {
            track.current = null;
            return;
          }
          if (Math.abs(offset) < SLOP) return;
          start.locked = true;
          event.currentTarget.setPointerCapture(event.pointerId);
        }
        const dt = event.timeStamp - start.last.t;
        if (dt > 0) start.velocity = (offset - start.last.v) / dt;
        start.last = { t: event.timeStamp, v: offset };
        latest.current.onMove?.(offset);
      },
      onPointerUp: (event) => {
        const start = track.current;
        track.current = null;
        if (!start || start.id !== event.pointerId || !start.locked) return;
        // A finger that stopped before lifting has no fling left in it.
        const velocity = event.timeStamp - start.last.t > 80 ? 0 : start.velocity;
        latest.current.onEnd(along(event, start), velocity);
      },
      onPointerCancel: cancel,
    };
  }, []);
}
