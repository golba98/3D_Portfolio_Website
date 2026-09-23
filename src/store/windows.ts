import { create } from 'zustand';
import { getApp } from '../apps/registry';
import { clamp } from '../lib/math';
import type { AppId } from '../types/apps';
import type { Bounds, DesktopWindow } from '../types/windows';

/** Space the top bar and dock take from the window area, in CSS pixels. */
export const WORKSPACE_INSETS = { top: 32, bottom: 104, side: 12 } as const;
/** Windows can't be dragged so far that their title bar becomes unreachable. */
const MIN_VISIBLE = 96;
export const MIN_WINDOW_SIZE = { width: 360, height: 260 } as const;
const CASCADE_STEP = 28;

interface WindowsState {
  windows: DesktopWindow[];
  focusedId: AppId | null;
  topZ: number;
  overviewOpen: boolean;

  /** Open an app, or bring its existing window forward. One window per app. */
  open: (appId: AppId, arg?: string) => void;
  close: (id: AppId) => void;
  focus: (id: AppId) => void;
  minimize: (id: AppId) => void;
  toggleMaximize: (id: AppId) => void;
  move: (id: AppId, x: number, y: number) => void;
  resize: (id: AppId, bounds: Bounds) => void;
  setTitle: (id: AppId, title: string) => void;
  setOverview: (open: boolean) => void;
  /** Keep every window reachable after the browser window shrinks. */
  fitToViewport: () => void;
  reset: () => void;
}

export function workspaceSize(): { width: number; height: number } {
  return {
    width: window.innerWidth,
    height: window.innerHeight - WORKSPACE_INSETS.top - WORKSPACE_INSETS.bottom,
  };
}

function initialBounds(appId: AppId, index: number): Bounds {
  const area = workspaceSize();
  const { defaultSize } = getApp(appId);
  const width = Math.min(defaultSize.width, area.width - WORKSPACE_INSETS.side * 2);
  const height = Math.min(defaultSize.height, area.height - 16);
  const cascade = (index % 6) * CASCADE_STEP;
  const x = clamp((area.width - width) / 2 - 60 + cascade, WORKSPACE_INSETS.side, area.width - width - WORKSPACE_INSETS.side);
  const y = clamp((area.height - height) / 2 - 20 + cascade, 8, Math.max(8, area.height - height));
  return { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) };
}

function clampPosition(bounds: Bounds): Pick<Bounds, 'x' | 'y'> {
  const area = workspaceSize();
  return {
    x: clamp(bounds.x, MIN_VISIBLE - bounds.width, area.width - MIN_VISIBLE),
    y: clamp(bounds.y, 0, Math.max(0, area.height - 40)),
  };
}

export const useWindows = create<WindowsState>()((set, get) => {
  const update = (id: AppId, patch: (w: DesktopWindow) => Partial<DesktopWindow>): void =>
    set((state) => ({ windows: state.windows.map((w) => (w.id === id ? { ...w, ...patch(w) } : w)) }));

  const raise = (id: AppId): void => {
    const z = get().topZ + 1;
    update(id, () => ({ z }));
    set({ topZ: z, focusedId: id });
  };

  /** The frontmost window that isn't minimised. */
  const nextFocus = (windows: DesktopWindow[], except: AppId): AppId | null =>
    windows
      .filter((w) => w.id !== except && w.mode !== 'minimized')
      .sort((a, b) => b.z - a.z)[0]?.id ?? null;

  return {
    windows: [],
    focusedId: null,
    topZ: 1,
    overviewOpen: false,

    open: (appId, arg) => {
      const existing = get().windows.find((w) => w.id === appId);
      if (existing) {
        update(appId, (w) => ({
          mode: w.mode === 'minimized' ? (w.restoreMode ?? 'normal') : w.mode,
          arg: arg ?? w.arg,
          // A new argument (e.g. a different project) remounts the app at that item.
          openCount: arg !== undefined && arg !== w.arg ? w.openCount + 1 : w.openCount,
        }));
      } else {
        const index = get().windows.length;
        const win: DesktopWindow = {
          id: appId,
          appId,
          arg,
          bounds: initialBounds(appId, index),
          mode: 'normal',
          z: get().topZ + 1,
          openCount: 0,
        };
        set((state) => ({ windows: [...state.windows, win], topZ: state.topZ + 1 }));
      }
      raise(appId);
      set({ overviewOpen: false });
    },

    close: (id) =>
      set((state) => {
        const windows = state.windows.filter((w) => w.id !== id);
        return { windows, focusedId: state.focusedId === id ? nextFocus(windows, id) : state.focusedId };
      }),

    focus: (id) => {
      if (get().focusedId === id) return;
      raise(id);
    },

    minimize: (id) => {
      update(id, (w) => ({ mode: 'minimized', restoreMode: w.mode === 'minimized' ? w.restoreMode : w.mode }));
      set((state) => ({ focusedId: state.focusedId === id ? nextFocus(state.windows, id) : state.focusedId }));
    },

    toggleMaximize: (id) => {
      update(id, (w) => ({ mode: w.mode === 'maximized' ? 'normal' : 'maximized' }));
      raise(id);
    },

    move: (id, x, y) => update(id, (w) => ({ bounds: { ...w.bounds, ...clampPosition({ ...w.bounds, x, y }) } })),

    resize: (id, bounds) => {
      const area = workspaceSize();
      update(id, () => ({
        bounds: {
          x: bounds.x,
          y: Math.max(0, bounds.y),
          width: clamp(bounds.width, MIN_WINDOW_SIZE.width, area.width),
          height: clamp(bounds.height, MIN_WINDOW_SIZE.height, area.height),
        },
      }));
    },

    setTitle: (id, title) => {
      if (get().windows.find((w) => w.id === id)?.title !== title) update(id, () => ({ title }));
    },

    setOverview: (open) => set({ overviewOpen: open }),

    fitToViewport: () => {
      const area = workspaceSize();
      set((state) => ({
        windows: state.windows.map((w) => {
          const width = Math.min(w.bounds.width, area.width - WORKSPACE_INSETS.side * 2);
          const height = Math.min(w.bounds.height, area.height - 8);
          return { ...w, bounds: { ...w.bounds, width, height, ...clampPosition({ ...w.bounds, width, height }) } };
        }),
      }));
    },

    reset: () => set({ windows: [], focusedId: null, overviewOpen: false }),
  };
});
