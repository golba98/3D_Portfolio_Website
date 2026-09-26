import { DESKTOP_THEME } from '../../config/theme';
import { formatTime } from '../../lib/format';
import { roundRect, type Size } from './drawDesktopPreview';

export interface LockScreenLayout {
  /** The visitor's screen, in CSS pixels: the phone OS will fill it. */
  viewport: Size;
  /** The phone's display on that screen once the camera has flown down onto it (it overfills slightly). */
  plane: Size;
}

const lockDate = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

/**
 * Paints an iPhone lock screen for the phone lying on the desk: the iPhone 15
 * Pro wallpaper, the date and a big clock, and the home indicator,
 * inside the display's rounded corners and around its Dynamic Island.
 *
 * Like the monitor's preview it is drawn in the visitor's CSS pixels, so when
 * the camera arrives the wallpaper sits exactly where phone/PhoneShell's does
 * and the crossfade reads as the phone unlocking.
 */
export function drawPhoneLockScreen(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  wallpaper: HTMLImageElement | null,
  now: Date,
  layout: LockScreenLayout,
): void {
  const t = DESKTOP_THEME;
  const { viewport: vp, plane } = layout;
  const sx = width / plane.width;
  const sy = height / plane.height;
  const ox = (plane.width - vp.width) / 2;
  const oy = (plane.height - vp.height) / 2;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.setTransform(sx, 0, 0, sy, ox * sx, oy * sy);

  // The display's rounded corners (an iPhone 15 Pro's are about 14% of its width).
  ctx.save();
  roundRect(ctx, -ox, -oy, plane.width, plane.height, plane.width * 0.14);
  ctx.clip();

  ctx.fillStyle = t.wallpaperA;
  ctx.fillRect(-ox, -oy, plane.width, plane.height);
  if (wallpaper) {
    // PhoneShell.module.css: the wallpaper covers the viewport, centred.
    const scale = Math.max(vp.width / wallpaper.naturalWidth, vp.height / wallpaper.naturalHeight);
    const w = wallpaper.naturalWidth * scale;
    const h = wallpaper.naturalHeight * scale;
    ctx.drawImage(wallpaper, (vp.width - w) / 2, (vp.height - h) / 2, w, h);
  }

  // A soft shade at the top so the clock reads over the wallpaper.
  const shade = ctx.createLinearGradient(0, 0, 0, vp.height * 0.4);
  shade.addColorStop(0, 'rgba(0,0,0,0.45)');
  shade.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shade;
  ctx.fillRect(-ox, -oy, plane.width, vp.height * 0.4 + oy);

  const unit = vp.width / 100;
  ctx.fillStyle = t.fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `600 ${4.6 * unit}px ${t.fontSans}`;
  ctx.fillText(lockDate.format(now), vp.width / 2, vp.height * 0.13);
  ctx.font = `700 ${24 * unit}px ${t.fontSans}`;
  ctx.fillText(formatTime(now), vp.width / 2, vp.height * 0.13 + 25 * unit);

  ctx.globalAlpha = 0.7;
  ctx.font = `500 ${3.8 * unit}px ${t.fontSans}`;
  ctx.fillText('Tap to unlock', vp.width / 2, vp.height - 12 * unit);
  ctx.globalAlpha = 1;

  // Home indicator, as phone/PhoneShell.module.css draws it: 120 × 4, 10px off the bottom.
  ctx.globalAlpha = 0.85;
  roundRect(ctx, (vp.width - 120) / 2, vp.height - 12, 120, 4, 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Dynamic Island.
  ctx.fillStyle = '#000';
  const islandW = plane.width * 0.32;
  const islandH = plane.width * 0.094;
  roundRect(ctx, (vp.width - islandW) / 2, -oy + plane.width * 0.028, islandW, islandH, islandH / 2);
  ctx.fill();
  ctx.restore();

  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
