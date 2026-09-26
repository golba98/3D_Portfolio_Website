import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
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

/** The phone shell's full-screen app: the leading header bar gets a way back. */
export interface MobileFrame {
  kind: 'mobile';
  appTitle: string;
  /** One step back: the app's own previous page, else the home screen. */
  back: () => void;
  /** Adds an in-app back step (edge swipe, Android Back); returns its removal. */
  registerBack: (handler: () => void) => () => void;
}

export type AppFrame = WindowFrame | MobileFrame;

/**
 * Whatever hosts an app. Like libadwaita, apps draw their own header bars;
 * this is how those header bars reach the window (or phone shell) around them.
 */
export const AppFrameContext = createContext<AppFrame | null>(null);

export const useAppFrame = (): AppFrame | null => useContext(AppFrameContext);

/**
 * While `active`, the phone's back gesture runs `handler` instead of going
 * home. Does nothing in a floating window.
 */
export function useBackHandler(active: boolean, handler: () => void): void {
  const frame = useAppFrame();
  const register = frame?.kind === 'mobile' ? frame.registerBack : undefined;
  const latest = useRef(handler);
  useLayoutEffect(() => {
    latest.current = handler;
  });
  useEffect(() => {
    if (!active || !register) return;
    return register(() => latest.current());
  }, [active, register]);
}
