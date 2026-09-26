import { useEffect, useMemo, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { phoneFocusPose, phoneShownWhole } from '../../lib/cameraMath';
import { clamp } from '../../lib/math';
import { onEveryMinute } from '../../lib/minuteTicker';
import type { ScreenRect } from '../../types/scene';
import { planeOnScreen, type Size } from './drawDesktopPreview';
import { drawPhoneLockScreen } from './drawPhoneLockScreen';
import { loadImage, readViewport } from './useDesktopPreviewTexture';

/** Apple's iPhone 15 Pro Black Titanium wallpaper, Lock Screen variant. */
const WALLPAPER_URL = '/wallpaper-iphone-lock.webp';
const RESIZE_DEBOUNCE_MS = 250;
/** Texture width bounds; the phone's display is small until the camera arrives. */
const MIN_WIDTH = 512;
const MAX_WIDTH = 1536;

/**
 * Canvas texture of the phone's lock screen, sized to the display's on-screen
 * pixels once the camera has flown down onto it. Redrawn as each minute
 * starts, for the clock, and rebuilt when the window is resized.
 */
export function usePhoneLockTexture(screen: ScreenRect): CanvasTexture {
  const maxTextureSize = useThree((s) => s.gl.capabilities.maxTextureSize);
  const [viewport, setViewport] = useState<Size>(readViewport);
  const [wallpaper, setWallpaper] = useState<HTMLImageElement | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    void Promise.all([loadImage(WALLPAPER_URL), document.fonts.ready])
      .then(([image]) => {
        if (!cancelled) setWallpaper(image);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const layout = useMemo(() => {
    const aspect = viewport.width / Math.max(viewport.height, 1);
    const plane = planeOnScreen(viewport, screen, phoneFocusPose(screen, aspect));
    // Shown whole in a wide window, the lock screen is laid out for the phone-sized frame, not the window.
    return { viewport: phoneShownWhole(aspect) ? plane : viewport, plane };
  }, [viewport, screen]);

  const texture = useMemo(() => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(clamp(layout.plane.width * dpr, MIN_WIDTH, Math.min(MAX_WIDTH, maxTextureSize)));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = Math.round((width * layout.plane.height) / layout.plane.width);
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [layout, maxTextureSize]);

  useEffect(() => () => texture.dispose(), [texture]);

  useEffect(() => {
    const canvas = texture.image as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const redraw = (): void => {
      drawPhoneLockScreen(ctx, canvas.width, canvas.height, wallpaper, new Date(), layout);
      texture.needsUpdate = true;
    };
    redraw();
    // Redraw as each minute starts, so the painted clock matches the real one.
    return onEveryMinute(redraw);
  }, [texture, wallpaper, layout]);

  return texture;
}
