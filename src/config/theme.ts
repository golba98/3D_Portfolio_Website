/**
 * Desktop colours for canvas drawing (the in-scene monitor preview). These
 * mirror the --desk-* tokens in styles/tokens.css; the preview must look like
 * the DOM desktop it crossfades into.
 */
export const DESKTOP_THEME = {
  wallpaperA: '#000000',
  wallpaperB: '#0a0a0a',
  topbar: '#000000',
  surface: '#222226',
  surface2: '#2e2e32',
  fg: '#ffffff',
  fgMuted: 'rgba(255,255,255,0.55)',
  accent: '#7bdff4',
  fontSans: "'Adwaita Sans', 'Inter Variable', system-ui, sans-serif",
} as const;
