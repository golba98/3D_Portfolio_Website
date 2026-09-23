import type { AppId } from './apps';

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type WindowMode = 'normal' | 'maximized' | 'minimized';

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
  z: number;
  /** Bumped when reopened with a new argument, to remount the app there. */
  openCount: number;
}
