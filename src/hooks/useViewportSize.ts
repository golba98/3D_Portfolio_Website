import { useEffect, useState } from 'react';

const RESIZE_DEBOUNCE_MS = 250;

const readViewport = () => ({ width: window.innerWidth, height: window.innerHeight });

/** Debounced CSS viewport dimensions for rebuilding screen preview textures. */
export function useViewportSize() {
  const [viewport, setViewport] = useState(readViewport);

  useEffect(() => {
    let timer = 0;
    const onResize = (): void => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setViewport(readViewport()), RESIZE_DEBOUNCE_MS);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return viewport;
}
