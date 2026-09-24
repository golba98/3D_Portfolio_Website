/** All experience timings, in seconds. */
export const TIMINGS = {
  /** Fade from black once the model is ready. */
  introFade: 1.1,
  /** Pause while the opening fade reveals the setup. */
  introHold: 0.45,
  /** Approach, move the chair, and settle at the desk. */
  introMove: 4.8,
  /** Move into and out of the board drawing view. */
  boardMove: 0.9,
  /** Presentation → screen-filling pose. */
  enterMonitor: 1.8,
  /** Final crossfade from the 3D screen to the DOM desktop. */
  desktopCrossfade: 0.45,
  /** With prefers-reduced-motion the camera cuts; only a short fade remains. */
  reducedMotionFade: 0.3,
} as const;
