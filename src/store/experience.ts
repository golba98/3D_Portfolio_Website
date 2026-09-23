import { create } from 'zustand';
import type { ExperiencePhase, SceneStatus } from '../types/experience';

/** Every legal phase change. Anything not listed here is ignored. */
const TRANSITIONS: Readonly<Record<ExperiencePhase, readonly ExperiencePhase[]>> = {
  loading: ['intro', 'desktop', 'fallback'],
  intro: ['exploring', 'entering-monitor', 'desktop', 'fallback'],
  exploring: ['entering-monitor', 'desktop', 'fallback'],
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

  /** The 3D model finished loading; start the intro (or drop into exploring). */
  sceneReady: () => void;
  /** WebGL or the model failed. The desktop stays reachable. */
  sceneFailed: (reason: string) => void;
  finishIntro: () => void;
  skipIntro: () => void;
  enterMonitor: () => void;
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
      if (get().phase === 'intro') go('exploring', { introSkipped: true });
    },
    enterMonitor: () => go('entering-monitor'),
    arriveAtMonitor: () => {
      if (get().phase === 'entering-monitor') go('desktop');
    },
    enterDesktopDirectly: () => go('desktop'),
    leaveDesktop: () => {
      const { sceneStatus } = get();
      if (sceneStatus === 'failed') go('fallback');
      else if (sceneStatus === 'ready') go('exploring');
      else go('loading');
    },
  };
});
