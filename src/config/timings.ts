/** All experience timings, in seconds. */
export const TIMINGS = {
  /** Fade from black once the model is ready. */
  introFade: 1.1,
  /** Pause on the side view before the camera starts moving. */
  introHold: 0.7,
  /** Side view → presentation. */
  introMove: 3.4,
  /** Presentation → screen-filling pose. */
  enterMonitor: 1.8,
  /** Final crossfade from the 3D screen to the DOM desktop. */
  desktopCrossfade: 0.45,
  /** With prefers-reduced-motion the camera cuts; only a short fade remains. */
  reducedMotionFade: 0.3,
} as const;
