import { Vector3 } from 'three';
import { DESKTOP_THEME } from '../../config/theme';
import { MONITOR_FOCUS } from '../../config/cameraPoses';
import { SCREEN } from '../../config/scene';
import { APPS } from '../../apps/registry';
import { monitorFocusPose, type CameraState } from '../../lib/cameraMath';
import { formatTopBarClock } from '../../lib/format';
import type { ScreenRect } from '../../types/scene';
import { ICON_PATHS } from '../icons/paths';

export interface PreviewImages {
  wallpaper: HTMLImageElement | null;
  /** One per entry in APPS, in the same order; null until loaded. */
  icons: readonly (HTMLImageElement | null)[];
}

/** A size in CSS pixels. */
export interface Size {
  width: number;
  height: number;
}

export interface PreviewLayout {
  /** The window the DOM desktop will fill. */
  viewport: Size;
  /** The preview plane's size on that window once the camera arrives (it overfills it slightly). */
  plane: Size;
}

/** Stand-in for tall windows that still get the floating desktop (a portrait tablet, say). */
const REFERENCE_VIEWPORT: Size = { width: 1920, height: 1080 };

/**
 * How big (in the window's CSS pixels) a display's preview plane is once the
 * camera has arrived at `pose`, square-on to it.
 */
export function planeOnScreen(viewport: Size, screen: ScreenRect, pose: CameraState): Size {
  const distance = pose.position.distanceTo(new Vector3(...screen.center)) - SCREEN.surfaceOffset;
  const pxPerMetre = viewport.height / (2 * distance * Math.tan((pose.fov * Math.PI) / 360));
  return {
    width: (screen.width - SCREEN.inset * 2) * pxPerMetre,
    height: (screen.height - SCREEN.inset * 2) * pxPerMetre,
  };
}

/**
 * Where the monitor's preview plane lands on the window at the end of the
 * camera move, from the same maths the camera uses (lib/cameraMath.ts#monitorFocusPose).
 */
export function previewLayout(viewport: Size, screen: ScreenRect): PreviewLayout {
  const vp = viewport.width / Math.max(viewport.height, 1) >= 1.2 ? viewport : REFERENCE_VIEWPORT;
  return { viewport: vp, plane: planeOnScreen(vp, screen, monitorFocusPose(screen, vp.width / vp.height)) };
}

/**
 * Paints the desktop (wallpaper, top bar, dock) for the monitor in the 3D
 * scene. Everything is drawn in the DOM desktop's CSS pixels, relative to the
 * window it will fill, so when the camera arrives the texture lines up with
 * the real desktop pixel for pixel and the crossfade shows no jump.
 */
export function drawDesktopPreview(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  images: PreviewImages,
  now: Date,
  layout: PreviewLayout,
): void {
  const t = DESKTOP_THEME;
  const { viewport: vp, plane } = layout;
  // CSS pixels → texture pixels, with the window's top-left corner as the origin.
  const sx = width / plane.width;
  const sy = height / plane.height;
  const ox = (plane.width - vp.width) / 2;
  const oy = (plane.height - vp.height) / 2;
  ctx.setTransform(sx, 0, 0, sy, ox * sx, oy * sy);

  ctx.fillStyle = t.wallpaperA;
  ctx.fillRect(-ox, -oy, plane.width, plane.height);
  const { wallpaper } = images;
  if (wallpaper) {
    // DesktopShell.module.css: the wallpaper is --cover-w wide, centred.
    const w = Math.max(vp.width, (vp.height * 16) / 9) / MONITOR_FOCUS.fill;
    const h = (wallpaper.naturalHeight / wallpaper.naturalWidth) * w;
    ctx.drawImage(wallpaper, (vp.width - w) / 2, (vp.height - h) / 2, w, h);
  }


  // Top bar (TopBar.module.css): 32px tall, 6px side padding, 13px bold text.
  const mid = 16;
  ctx.fillStyle = t.topbar;
  ctx.fillRect(-ox, -oy, plane.width, oy + 32);
  ctx.fillStyle = t.fg;
  // Workspace indicator: a 30px pill and an 8px dot, inside a button padded 10px.
  roundRect(ctx, 16, mid - 4, 30, 8, 4);
  ctx.fill();
  ctx.globalAlpha = 0.45;
  roundRect(ctx, 51, mid - 4, 8, 8, 4);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.textBaseline = 'middle';
  ctx.font = `700 13px ${t.fontSans}`;
  ctx.textAlign = 'left';
  ctx.fillText('Places', 83, mid);
  ctx.textAlign = 'center';
  ctx.fillText(formatTopBarClock(now), vp.width / 2, mid);

  // Status icons (StatusMenu.module.css): 16px, 8px apart, the last one 18px from the right edge.
  ctx.strokeStyle = t.fg;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  (['power', 'volume', 'network-wired'] as const).forEach((name, i) => {
    ctx.save();
    ctx.translate(vp.width - 18 - 16 - i * 24, mid - 8);
    ctx.scale(16 / 24, 16 / 24);
    ctx.lineWidth = 1.8;
    ctx.stroke(new Path2D(ICON_PATHS[name]));
    ctx.restore();
  });

  // Dock (Dock.module.css): 56px icons in 64px buttons, 8px gaps, 10px
  // padding, 1px border, 12px off the bottom; then a separator and "Show apps".
  const icon = 56;
  const cell = 64;
  const gap = 8;
  const pad = 11;
  const sepW = 9;
  const cells = APPS.length + 1;
  const dockW = pad * 2 + cells * cell + sepW + cells * gap;
  const dockH = cell + pad * 2;
  const dockX = (vp.width - dockW) / 2;
  const dockY = vp.height - dockH - 12;
  roundRect(ctx, dockX, dockY, dockW, dockH, 24);
  ctx.fillStyle = 'rgba(30,30,30,0.82)';
  ctx.fill();

  const inset = (cell - icon) / 2;
  APPS.forEach((_, i) => {
    const x = dockX + pad + i * (cell + gap) + inset;
    const y = dockY + pad + inset;
    const image = images.icons[i];
    if (image) {
      ctx.drawImage(image, x, y, icon, icon);
    } else {
      roundRect(ctx, x, y, icon, icon, 12);
      ctx.fillStyle = t.surface2;
      ctx.fill();
    }
  });

  const sepX = dockX + pad + APPS.length * (cell + gap) + 4;
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(sepX, dockY + dockH / 2 - 20, 1, 40);

  const gridX = sepX + 5 + gap + cell / 2;
  const gridY = dockY + dockH / 2;
  ctx.fillStyle = t.fg;
  for (let row = -1; row <= 1; row += 1) {
    for (let col = -1; col <= 1; col += 1) {
      ctx.beginPath();
      ctx.arc(gridX + col * 15, gridY + row * 15, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
