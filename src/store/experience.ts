import { create } from 'zustand';
import type { EntryDevice, ExperiencePhase, SceneStatus } from '../types/experience';

/** Every legal phase change. Anything not listed here is ignored. */
const TRANSITIONS: Readonly<Record<ExperiencePhase, readonly ExperiencePhase[]>> = {
  loading: ['intro', 'desktop', 'fallback'],
  intro: ['exploring', 'entering-monitor', 'desktop', 'fallback'],
  exploring: ['viewing-board', 'entering-monitor', 'desktop', 'fallback'],
  'viewing-board': ['exploring', 'desktop', 'fallback'],
  'entering-monitor': ['desktop', 'exploring', 'fallback'],
  desktop: ['loading', 'exploring', 'fallback'],
  fallback: ['desktop'],
};

export function canTransition(from: ExperiencePhase, to: ExperiencePhase): boolean {
  return TRANSITIONS[from].includes(to);
}

interface ExperienceState {
  phase: ExperiencePhase;
  sceneStatus: SceneStatus;
  fallbackReason: string | null;
  /** True once the visitor has asked to skip the intro, so the camera can cut. */
  introSkipped: boolean;
  introProgress: number;
  boardReady: boolean;
  /** The visitor chose the other device's version anyway; cleared when they leave it. */
  entryOverride: EntryDevice | null;
  /** The other device they tapped, while its "made for …" pop-up is up. */
  devicePrompt: EntryDevice | null;

  /** The 3D model finished loading; start the intro (or drop into exploring). */
  sceneReady: () => void;
  /** WebGL or the model failed. The desktop stays reachable. */
  sceneFailed: (reason: string) => void;
  finishIntro: () => void;
  skipIntro: () => void;
  setIntroProgress: (progress: number) => void;
  openBoard: () => void;
  boardArrived: () => void;
  closeBoard: () => void;
  enterMonitor: () => void;
  /** Tapped the device that isn't made for this screen: ask first. */
  askToEnter: (device: EntryDevice) => void;
  dismissPrompt: () => void;
  /** Go into a device from its pop-up; `anyway` when it isn't the one made for this screen. */
  enterDevice: (device: EntryDevice, anyway: boolean) => void;
  /** Camera reached the screen-filling pose. */
  arriveAtMonitor: () => void;
  /** Bypass the 3D world (skip link, fallback button, #/desktop deep link). */
  enterDesktopDirectly: () => void;
  /** Leave the desktop and return to the 3D setup. */
  leaveDesktop: () => void;
}

function initialPhase(): ExperiencePhase {
  if (typeof window === 'undefined') return 'loading';
  return window.location.hash.startsWith('#/desktop') ? 'desktop' : 'loading';
}

export const useExperience = create<ExperienceState>()((set, get) => {
  const go = (to: ExperiencePhase, patch: Partial<ExperienceState> = {}): void => {
    const from = get().phase;
    if (from === to || !canTransition(from, to)) return;
    set({ phase: to, ...patch });
  };

  return {
    phase: initialPhase(),
    sceneStatus: 'idle',
    fallbackReason: null,
    introSkipped: false,
    introProgress: 0,
    boardReady: false,
    entryOverride: null,
    devicePrompt: null,

    sceneReady: () => {
      set({ sceneStatus: 'ready' });
      go('intro');
    },
    sceneFailed: (reason) => {
      set({ sceneStatus: 'failed', fallbackReason: reason });
      // A visitor already on the desktop keeps working; they only see the
      // fallback if they try to go back to the 3D world.
      if (get().phase !== 'desktop') go('fallback');
    },
    // Animation callbacks only count if we're still in the phase that started them.
    finishIntro: () => {
      if (get().phase === 'intro') go('exploring');
    },
    skipIntro: () => {
      if (get().phase === 'intro') go('exploring', { introSkipped: true, introProgress: 1 });
    },
    setIntroProgress: (progress) => {
      if (get().phase === 'intro') set({ introProgress: progress });
    },
    openBoard: () => go('viewing-board', { boardReady: false }),
    boardArrived: () => {
      if (get().phase === 'viewing-board') set({ boardReady: true });
    },
    closeBoard: () => go('exploring', { boardReady: false }),
    enterMonitor: () => go('entering-monitor'),
    askToEnter: (device) => {
      if (get().phase === 'exploring') set({ devicePrompt: device });
    },
    dismissPrompt: () => set({ devicePrompt: null }),
    enterDevice: (device, anyway) => {
      set({ devicePrompt: null, entryOverride: anyway ? device : null });
      go('entering-monitor');
    },
    arriveAtMonitor: () => {
      if (get().phase === 'entering-monitor') go('desktop');
    },
    enterDesktopDirectly: () => go('desktop'),
    leaveDesktop: () => {
      // Next time, the device made for this screen is the default again.
      set({ entryOverride: null });
      const { sceneStatus } = get();
      if (sceneStatus === 'failed') go('fallback');
      else if (sceneStatus === 'ready') go('exploring');
      else go('loading');
    },
  };
});
