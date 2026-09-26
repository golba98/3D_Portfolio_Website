/**
 * The high-level stages of the site. Exactly one is active at a time and all
 * movement between them goes through the experience store.
 *
 *   loading → intro → exploring → entering-monitor → desktop
 *                        │  ↑
 *                        ↓  │
 *                    viewing-board
 *
 * `fallback` replaces the 3D stages when WebGL or the model is unavailable.
 */
export type ExperiencePhase =
  | 'loading'
  | 'intro'
  | 'exploring'
  | 'viewing-board'
  | 'entering-monitor'
  | 'desktop'
  | 'fallback';

export type SceneStatus = 'idle' | 'loading' | 'ready' | 'failed';

/**
 * The device on the desk a visitor goes into: the phone (phone OS) or the
 * monitor (GNOME desktop). Each screen size has its own; the other one can
 * still be chosen, with a warning (see ui/DevicePrompt.tsx).
 */
export type EntryDevice = 'phone' | 'monitor';
