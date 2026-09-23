import { DESKTOP_THEME } from '../../config/theme';
import { APPS } from '../../apps/registry';
import { formatTopBarClock } from '../../lib/format';

export interface PreviewImages {
  wallpaper: HTMLImageElement | null;
  /** One per entry in APPS, in the same order; null until loaded. */
  icons: readonly (HTMLImageElement | null)[];
}

/**
 * Paints a lightweight stand-in of the desktop (wallpaper, top bar, dock) for
 * the monitor in the 3D scene. It only needs to read correctly from across
 * the room; the real DOM desktop takes over once the camera arrives.
 */
export function drawDesktopPreview(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  images: PreviewImages,
  now: Date,
): void {
  const t = DESKTOP_THEME;
  // Scale from a 1280-wide reference layout so proportions match the DOM desktop.
  const s = width / 1280;
  // DOM pixels → reference pixels, for a desktop viewed in a ~1920px-wide window.
  const d = s * (1280 / 1920);

  ctx.fillStyle = t.wallpaperA;
  ctx.fillRect(0, 0, width, height);
  const { wallpaper } = images;
  if (wallpaper) {
    // background-size: cover, like the DOM desktop.
    const scale = Math.max(width / wallpaper.naturalWidth, height / wallpaper.naturalHeight);
    const w = wallpaper.naturalWidth * scale;
    const h = wallpaper.naturalHeight * scale;
    ctx.drawImage(wallpaper, (width - w) / 2, (height - h) / 2, w, h);
  }

  // Top bar: workspace indicator, Places, clock, status icons.
  const barH = 26 * s;
  const mid = barH / 2;
  ctx.fillStyle = t.topbar;
  ctx.fillRect(0, 0, width, barH);
  ctx.fillStyle = t.fg;
  roundRect(ctx, 16 * d, mid - 4 * d, 30 * d, 8 * d, 4 * d);
  ctx.fill();
  ctx.globalAlpha = 0.45;
  roundRect(ctx, 51 * d, mid - 4 * d, 8 * d, 8 * d, 4 * d);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${12 * s}px ${t.fontSans}`;
  ctx.textAlign = 'left';
  ctx.fillText('Places', 83 * d, mid);
  ctx.textAlign = 'center';
  ctx.fillText(formatTopBarClock(now).replace('  ', ' '), width / 2, mid);
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.arc(width - (24 + i * 24) * d, mid, 4 * d, 0, Math.PI * 2);
    ctx.fill();
  }

  // Greeting, like the desktop's welcome text
  ctx.fillStyle = 'rgba(244,244,245,0.92)';
  ctx.textAlign = 'left';
  ctx.font = `700 ${46 * s}px ${t.fontSans}`;
  ctx.fillText('Jordan Vorster', 72 * s, height * 0.4);
  ctx.fillStyle = 'rgba(161,161,170,0.95)';
  ctx.font = `400 ${18 * s}px ${t.fontSans}`;
  ctx.fillText('Computer Science student · Eastern Cape, South Africa', 74 * s, height * 0.4 + 44 * s);

  // Dock: the same geometry as Dock.module.css (56px icons in 64px buttons,
  // 8px gaps, 10px padding), then a separator and the "Show apps" dots.
  const icon = 56 * d;
  const cell = 64 * d;
  const gap = 8 * d;
  const pad = 10 * d;
  const sepW = 9 * d;
  const cells = APPS.length + 1;
  const dockW = pad * 2 + cells * cell + sepW + cells * gap;
  const dockH = cell + pad * 2;
  const dockX = (width - dockW) / 2;
  const dockY = height - dockH - 12 * d;
  roundRect(ctx, dockX, dockY, dockW, dockH, 24 * d);
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
      roundRect(ctx, x, y, icon, icon, 12 * d);
      ctx.fillStyle = t.surface2;
      ctx.fill();
    }
  });

  const sepX = dockX + pad + APPS.length * (cell + gap) + 4 * d;
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(sepX, dockY + dockH / 2 - 20 * d, 1 * d, 40 * d);

  const gridX = sepX + 5 * d + gap + cell / 2;
  const gridY = dockY + dockH / 2;
  ctx.fillStyle = t.fg;
  for (let row = -1; row <= 1; row += 1) {
    for (let col = -1; col <= 1; col += 1) {
      ctx.beginPath();
      ctx.arc(gridX + col * 15 * d, gridY + row * 15 * d, 4 * d, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
