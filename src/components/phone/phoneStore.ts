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

/*
  Browser history mirrors one level: home (#/desktop) or an app
  (#/desktop/<app>). Android's back gesture and the browser's Back button
  arrive as popstate and run the same `back()` as the on-screen gestures; if
  that leaves an app open (an in-app step, or a closed overlay), the app entry
  is pushed again so the next Back still has something to pop.
*/
let appEntryPushed = false;
let ignoreNextPop = false;

const appHash = (id: AppId): string => `#/desktop/${id}`;

function pushAppEntry(id: AppId): void {
  if (appEntryPushed) {
    window.history.replaceState(null, '', appHash(id));
  } else {
    window.history.pushState(null, '', appHash(id));
    appEntryPushed = true;
  }
}

function popAppEntry(): void {
  if (!appEntryPushed) return;
  ignoreNextPop = true;
  window.history.back();
}

export const usePhone = create<PhoneState>()((set, get) => ({
  running: [],
  active: null,
  overlay: 'none',

  open: (id, arg, origin) => {
    set((state) => {
      const existing = state.running.find((app) => app.id === id);
      const relaunch = existing && arg !== undefined && arg !== existing.arg;
      const base: RunningApp = existing && !relaunch ? existing : { id, arg, key: (existing?.key ?? 0) + 1 };
      if (relaunch) handlers.delete(id);
      const entry = origin ? { ...base, origin } : base;
      return {
        running: [...state.running.filter((app) => app.id !== id), entry],
        active: id,
        overlay: 'none',
      };
    });
    pushAppEntry(id);
  },

  home: () => {
    if (get().active === null && get().overlay === 'none') return;
    set({ active: null, overlay: 'none' });
    popAppEntry();
  },

  close: (id) => {
    handlers.delete(id);
    set((state) => ({
      running: state.running.filter((app) => app.id !== id),
      active: state.active === id ? null : state.active,
    }));
    if (get().active === null) popAppEntry();
  },

  setOverlay: (overlay) => set({ overlay }),

  setTitle: (id, title) =>
    set((state) => ({ running: state.running.map((app) => (app.id === id ? { ...app, title } : app)) })),

  registerBack: (id, handler) => {
    const list = handlers.get(id) ?? [];
    handlers.set(id, [...list, handler]);
    return () => {
      const current = handlers.get(id);
      if (current) handlers.set(id, current.filter((h) => h !== handler));
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
    appEntryPushed = false;
    ignoreNextPop = false;
    set({ running: [], active: null, overlay: 'none' });
  },
}));

/** Runs system Back (popstate) through the phone's own back logic. */
export function handleHistoryPop(): void {
  if (!appEntryPushed) return;
  appEntryPushed = false;
  if (ignoreNextPop) {
    ignoreNextPop = false;
    return;
  }
  const { back } = usePhone.getState();
  back();
  const { active } = usePhone.getState();
  if (active) pushAppEntry(active);
}

/**
 * A deep link (#/desktop/<app>) opens straight into the app; put home
 * underneath it so Back lands on the home screen rather than leaving the site.
 */
export function openFromDeepLink(id: AppId, arg?: string): void {
  window.history.replaceState(null, '', '#/desktop');
  usePhone.getState().open(id, arg);
}
