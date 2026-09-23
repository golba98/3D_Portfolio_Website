import type { AppId } from './apps';

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type WindowMode = 'normal' | 'maximized' | 'tiled-left' | 'tiled-right' | 'fullscreen' | 'minimized';

/** Where a dragged window will land if released now (GNOME's tile preview). */
export type SnapTarget = 'maximized' | 'tiled-left' | 'tiled-right';

export interface DesktopWindow {
  /** One window per app, so the app id doubles as the window id. */
  id: AppId;
  appId: AppId;
  arg?: string;
  /** Title set by the app itself; falls back to the app's name. */
  title?: string;
  /** Position/size in the normal (not maximised) state, relative to the workspace. */
  bounds: Bounds;
  mode: WindowMode;
  /** Mode to return to when un-minimising. */
  restoreMode?: Exclude<WindowMode, 'minimized'>;
  /** Mode to return to when leaving fullscreen. */
  preFullscreenMode?: Exclude<WindowMode, 'minimized' | 'fullscreen'>;
  z: number;
  /** Bumped when reopened with a new argument, to remount the app there. */
  openCount: number;
}
