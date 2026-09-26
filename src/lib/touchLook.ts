import { create } from 'zustand';
import { clamp } from './math';

/**
 * Touch look-around for the 3D desk. Phones can't hover, and a portrait
 * screen can't show the PC, the monitors and the board at once, so a finger
 * slides the camera along the desk and a pinch zooms. The camera rig reads
 * this every frame, so it is a plain mutable object rather than React state.
 */
export interface LookState {
  /** Metres along the desk (desk-space X) from the presentation pose; + is towards the board. */
  pan: number;
  /** Multiplier on the camera's distance from what it looks at. */
  zoom: number;
  /** Extra camera tilt, in degrees. */
  pitch: number;
  /** Pan speed left over from a flick, in metres per second. */
  velocity: number;
  /** A finger is down and moving the camera. */
  dragging: boolean;
  /** The current (or last) touch moved far enough to be a drag rather than a tap. */
  dragged: boolean;
}

export const LOOK_LIMITS = {
  zoom: [0.75, 1.8] as const,
  pitch: 6,
  /** How far past the PC and the board the pan may go, in metres. */
  overscroll: 0.1,
};

export const look: LookState = { pan: 0, zoom: 1, pitch: 0, velocity: 0, dragging: false, dragged: false };

export type LookStop = 'pc' | 'phone' | 'monitor' | 'board';

/** Pan offsets that put each part of the setup in the middle of the view. */
export type LookStops = Record<LookStop, number>;

interface LookStopsState {
  stops: LookStops | null;
  /** The part of the setup the camera is currently closest to. */
  nearest: LookStop;
  /** Has the visitor dragged the view yet? Hides the "drag to look around" hint. */
  hintSeen: boolean;
  setStops: (stops: LookStops) => void;
  setNearest: (nearest: LookStop) => void;
  goTo: (stop: LookStop) => void;
  markHintSeen: () => void;
}

const HINT_KEY = 'look-hint-seen';

function readHintSeen(): boolean {
  try {
    return window.localStorage.getItem(HINT_KEY) === '1';
  } catch {
    return false;
  }
}

export const useLookStops = create<LookStopsState>()((set, get) => ({
  stops: null,
  nearest: 'monitor',
  hintSeen: readHintSeen(),
  setStops: (stops) => set({ stops }),
  setNearest: (nearest) => {
    if (get().nearest !== nearest) set({ nearest });
  },
  goTo: (stop) => {
    const { stops } = get();
    if (!stops) return;
    look.pan = stops[stop];
    look.zoom = 1;
    look.pitch = 0;
    look.velocity = 0;
    set({ nearest: stop });
  },
  markHintSeen: () => {
    if (get().hintSeen) return;
    set({ hintSeen: true });
    try {
      window.localStorage.setItem(HINT_KEY, '1');
    } catch {
      // Storage can be unavailable (private mode); the hint just shows again next visit.
    }
  },
}));

/** The pan range: from just past the PC to just past the board. */
export function panRange(stops: LookStops): [number, number] {
  return [stops.pc - LOOK_LIMITS.overscroll, stops.board + LOOK_LIMITS.overscroll];
}

export function clampLook(stops: LookStops | null): void {
  if (stops) {
    const [lo, hi] = panRange(stops);
    const clamped = clamp(look.pan, lo, hi);
    if (clamped !== look.pan) look.velocity = 0;
    look.pan = clamped;
  }
  look.zoom = clamp(look.zoom, LOOK_LIMITS.zoom[0], LOOK_LIMITS.zoom[1]);
  look.pitch = clamp(look.pitch, -LOOK_LIMITS.pitch, LOOK_LIMITS.pitch);
}

export function nearestStop(stops: LookStops, pan: number): LookStop {
  const entries = Object.entries(stops) as [LookStop, number][];
  return entries.reduce((best, entry) => (Math.abs(entry[1] - pan) < Math.abs(best[1] - pan) ? entry : best))[0];
}

/** A click on the scene counts only if it wasn't the end of a drag. `delta` is R3F's pointer travel in px. */
export function isTap(delta: number): boolean {
  return delta <= 10 && !look.dragged;
}

/** Back to the presentation view, e.g. when the intro plays again. */
export function resetLook(): void {
  Object.assign(look, { pan: 0, zoom: 1, pitch: 0, velocity: 0, dragging: false, dragged: false });
  useLookStops.getState().setNearest('monitor');
}
