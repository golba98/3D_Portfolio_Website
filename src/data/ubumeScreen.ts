import type { TerminalScreen } from '../types/content';

/** Ubume's startup screen, read out of the Ubume v0.1.0 source on 2026-09-13. */
export const ubumeStartup: TerminalScreen = {
  cols: 100,
  rows: 22,
  logoWidth: 45,
  logo: [
    '██╗   ██╗██████╗ ██╗   ██╗███╗   ███╗███████╗',
    '██║   ██║██╔══██╗██║   ██║████╗ ████║██╔════╝',
    '██║   ██║██████╔╝██║   ██║██╔████╔██║█████╗  ',
    '██║   ██║██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝  ',
    '╚██████╔╝██████╔╝╚██████╔╝██║ ╚═╝ ██║███████╗',
    ' ╚═════╝ ╚═════╝  ╚═════╝ ╚═╝     ╚═╝╚══════╝',
  ],
  logoTone: [1, 1, 2, 2, 3, 3],
  meta: ['Ubume v0.1.0', 'Workspace: Ubume', 'Provider: Local'],
  prompt: '❯ ',
  placeholder: 'Ask Ubume, run !shell, or use /command',
  footerLeft: 'Local / qwen/qwen3.8-27b',
  footerRight: 'Context: 0 / 131K',
};

/** Ubume really switches to this one-row logo between 48 and 72 columns. */
export const ubumeStartupCompact: TerminalScreen = {
  ...ubumeStartup,
  cols: 48,
  rows: 14,
  logo: ['✦ UBUME'],
  logoTone: [1],
  logoWidth: 7,
};
