/**
 * Desktop colours for canvas drawing (the in-scene monitor preview). These
 * mirror the --desk-* tokens in styles/tokens.css; the preview must look like
 * the DOM desktop it crossfades into.
 */
export const DESKTOP_THEME = {
  wallpaperA: '#000000',
  wallpaperB: '#0a0a0a',
  topbar: '#000000',
  surface: '#242428',
  surface2: '#2e2e33',
  fg: '#f4f4f5',
  fgMuted: '#a1a1aa',
  accent: '#62a0ea',
  fontSans: "'Inter Variable', 'Adwaita Sans', system-ui, sans-serif",
} as const;
