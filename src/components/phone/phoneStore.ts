import { desktopHash, writeRoute } from '../../app/desktopRoute';
import { create } from 'zustand';
import type { AppId } from '../../types/apps';

export interface RunningApp {
  id: AppId;
  arg?: string;
  /** Bumped when the app is relaunched at a new argument, so it remounts there. */
  key: number;
  /** What the app last asked its title to be (the terminal shows its directory). */
  title?: string;
  /** Where it was launched from; it grows out of there and shrinks back into it. */
  origin?: LaunchOrigin;
}

/** A point as fractions of the viewport (0–1). */
export interface LaunchOrigin {
  x: number;
  y: number;
}

export type PhoneOverlay = 'none' | 'quick' | 'switcher' | 'search';

type BackHandler = () => void;

interface PhoneState {
  /** Open apps, least recently used first. They stay mounted, so they keep their state. */
  running: RunningApp[];
  active: AppId | null;
  overlay: PhoneOverlay;

  open: (id: AppId, arg?: string, origin?: LaunchOrigin) => void;
  /** Back to the home screen; running apps stay running. */
  home: () => void;
  close: (id: AppId) => void;
  setOverlay: (overlay: PhoneOverlay) => void;
  setTitle: (id: AppId, title: string) => void;
  /**
   * In-app back steps (a project's detail back to the list, a folder back to
   * its parent). The most recently registered runs first. Returns an unregister.
   */
  registerBack: (id: AppId, handler: BackHandler) => () => void;
  /** One step back: overlay, then the active app's own pages, then home. */
  back: () => void;
  reset: () => void;
}

const handlers = new Map<AppId, BackHandler[]>();

export const usePhone = create<PhoneState>()((set, get) => ({
  running: [],
  active: null,
  overlay: 'none',

  open: (id, arg, origin) => {
    set((state) => {
      const existing = state.running.find((app) => app.id === id);
      const relaunch = existing && arg !== undefined && id !== 'projects';
      const base: RunningApp = existing && !relaunch ? existing : { id, arg, key: (existing?.key ?? 0) + 1 };
      if (relaunch) handlers.delete(id);
      const entry = { ...base, arg: arg ?? base.arg, origin: origin ?? base.origin };
      return {
        running: [...state.running.filter((app) => app.id !== id), entry],
        active: id,
        overlay: 'none',
      };
    });
    writeRoute(desktopHash(id, get().running.find((app) => app.id === id)?.arg));
  },

  home: () => {
    if (get().active === null && get().overlay === 'none') return;
    set({ active: null, overlay: 'none' });
    writeRoute(desktopHash());
  },

  close: (id) => {
    handlers.delete(id);
    set((state) => ({
      running: state.running.filter((app) => app.id !== id),
      active: state.active === id ? null : state.active,
    }));
    if (get().active === null) writeRoute(desktopHash(), true);
  },

  setOverlay: (overlay) => set({ overlay }),

  setTitle: (id, title) =>
    set((state) => ({ running: state.running.map((app) => (app.id === id ? { ...app, title } : app)) })),

  registerBack: (id, handler) => {
    const list = handlers.get(id) ?? [];
    handlers.set(id, [...list, handler]);
    return () => {
      const current = handlers.get(id);
      if (current)
        handlers.set(
          id,
          current.filter((h) => h !== handler),
        );
    };
  },

  back: () => {
    const { overlay, active } = get();
    if (overlay !== 'none') {
      set({ overlay: 'none' });
      return;
    }
    if (!active) return;
    const step = handlers.get(active)?.at(-1);
    if (step) step();
    else get().home();
  },

  reset: () => {
    handlers.clear();
    set({ running: [], active: null, overlay: 'none' });
  },
}));
