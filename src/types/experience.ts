/**
 * The high-level stages of the site. Exactly one is active at a time and all
 * movement between them goes through the experience store.
 *
 *   loading → intro → exploring → entering-monitor → desktop
 *                                         ↑                │
 *                                         └──── leave ─────┘
 *
 * `fallback` replaces the 3D stages when WebGL or the model is unavailable.
 */
export type ExperiencePhase =
  | 'loading'
  | 'intro'
  | 'exploring'
  | 'entering-monitor'
  | 'desktop'
  | 'fallback';

export type SceneStatus = 'idle' | 'loading' | 'ready' | 'failed';
