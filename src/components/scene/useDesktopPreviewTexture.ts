import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { SCREEN } from '../../config/scene';
import { APPS } from '../../apps/registry';
import { drawDesktopPreview, type PreviewImages } from './drawDesktopPreview';

const WALLPAPER_URL = '/wallpaper.webp';

/** Canvas texture of the desktop preview, redrawn when fonts/images arrive and each minute for the clock. */
export function useDesktopPreviewTexture(): CanvasTexture {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    [canvas.width, canvas.height] = SCREEN.textureSize;
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, []);

  useEffect(() => {
    const canvas = texture.image as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const images: PreviewImages = { wallpaper: null, icons: APPS.map(() => null) };
    let cancelled = false;

    const redraw = (): void => {
      if (cancelled) return;
      drawDesktopPreview(ctx, canvas.width, canvas.height, images, new Date());
      texture.needsUpdate = true;
    };

    const load = (src: string): Promise<HTMLImageElement> => {
      const image = new Image();
      image.decoding = 'async';
      image.src = src;
      return image.decode().then(() => image);
    };

    redraw();
    void Promise.allSettled([load(WALLPAPER_URL), ...APPS.map((app) => load(app.iconSrc)), document.fonts.ready]).then(
      ([wallpaper, ...rest]) => {
        images.wallpaper = wallpaper?.status === 'fulfilled' ? wallpaper.value : null;
        images.icons = APPS.map((_, i) => {
          const result = rest[i];
          return result?.status === 'fulfilled' ? (result.value as HTMLImageElement) : null;
        });
        redraw();
      },
    );
    const clock = window.setInterval(redraw, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(clock);
    };
  }, [texture]);

  useEffect(() => () => texture.dispose(), [texture]);

  return texture;
}
