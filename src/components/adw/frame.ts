import { createContext, useContext, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import type { WindowMode } from '../../types/windows';

/** A floating desktop window: header bars drag it and carry its close button. */
export interface WindowFrame {
  kind: 'window';
  focused: boolean;
  mode: WindowMode;
  appTitle: string;
  startDrag: (event: ReactPointerEvent<HTMLElement>) => void;
  toggleMaximize: () => void;
  toggleFullscreen: () => void;
  /** GNOME's window menu, on right-clicking a title bar. */
  openMenu: (event: ReactMouseEvent<HTMLElement>) => void;
  close: () => void;
}

/** The phone shell's full-screen app: the leading header bar gets a way home. */
export interface MobileFrame {
  kind: 'mobile';
  appTitle: string;
  goHome: () => void;
}

export type AppFrame = WindowFrame | MobileFrame;

/**
 * Whatever hosts an app. Like libadwaita, apps draw their own header bars;
 * this is how those header bars reach the window (or phone shell) around them.
 */
export const AppFrameContext = createContext<AppFrame | null>(null);

export const useAppFrame = (): AppFrame | null => useContext(AppFrameContext);
