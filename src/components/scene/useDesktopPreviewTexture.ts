import { useEffect, useMemo, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { SCREEN } from '../../config/scene';
import { APPS } from '../../apps/registry';
import { useDeviceTier } from '../../hooks/useDeviceTier';
import { useViewportSize } from '../../hooks/useViewportSize';
import { loadImage } from '../../lib/images';
import { clamp } from '../../lib/math';
import { onEveryMinute } from '../../lib/minuteTicker';
import type { ScreenRect } from '../../types/scene';
import { drawDesktopPreview, previewLayout, type PreviewImages } from './drawDesktopPreview';

const WALLPAPER_URL = '/wallpaper.webp';

/**
 * Canvas texture of the desktop preview. It is as many pixels wide as the
 * screen will be on the display when the camera arrives, so it never looks
 * softer than the DOM desktop that replaces it. Rebuilt when the window is
 * resized; redrawn when fonts/images arrive and as each minute starts, for the clock.
 */
export function useDesktopPreviewTexture(screen: ScreenRect): CanvasTexture {
  const tier = useDeviceTier();
  const maxTextureSize = useThree((s) => s.gl.capabilities.maxTextureSize);
  const viewport = useViewportSize();
  const [images, setImages] = useState<PreviewImages>(() => ({ wallpaper: null, icons: APPS.map(() => null) }));

  useEffect(() => {
    let cancelled = false;
    const assets = [loadImage(WALLPAPER_URL), ...APPS.map((app) => loadImage(app.iconSrc))];
    void Promise.all([Promise.allSettled(assets), document.fonts.ready.catch(() => undefined)]).then(
      ([[wallpaper, ...icons]]) => {
        if (cancelled) return;
        setImages({
          wallpaper: wallpaper?.status === 'fulfilled' ? wallpaper.value : null,
          icons: icons.map((result) => (result.status === 'fulfilled' ? result.value : null)),
        });
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const layout = useMemo(() => previewLayout(viewport, screen), [viewport, screen]);

  // A GPU texture can't change size in place, so a new size means a new texture.
  const texture = useMemo(() => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const maxWidth = Math.min(maxTextureSize, SCREEN.texture.maxWidth[tier]);
    const width = Math.round(clamp(layout.plane.width * dpr, SCREEN.texture.minWidth, maxWidth));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = Math.round((width * layout.plane.height) / layout.plane.width);
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [layout, maxTextureSize, tier]);

  useEffect(() => () => texture.dispose(), [texture]);

  useEffect(() => {
    const canvas = texture.image as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const redraw = (): void => {
      drawDesktopPreview(ctx, canvas.width, canvas.height, images, new Date(), layout);
      texture.needsUpdate = true;
    };
    redraw();
    // Redraw as each minute starts, so the painted clock matches the real one.
    return onEveryMinute(redraw);
  }, [texture, images, layout]);

  return texture;
}
