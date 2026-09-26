import type { Vec3 } from '../types/scene';

/**
 * Named camera poses in desk space (see config/scene.ts). `monitorFocus` is
 * not listed: it is computed from the centre screen's real size and the
 * viewport aspect so the display always fills the window exactly.
 */
export interface CameraPose {
  position: Vec3;
  target: Vec3;
  /** Vertical field of view in degrees. */
  fov: number;
  /** Which way is up on screen; world up (+Y) if left out. */
  up?: Vec3;
}

export type PoseName = 'introSide' | 'chairReach' | 'chairPass' | 'presentation';

interface PoseSet {
  /** Landscape windows (16:9 and wider). */
  wide: Record<PoseName, CameraPose>;
  /** Phone-portrait windows: higher and further back, centred on the main monitor. */
  narrow: Record<PoseName, CameraPose>;
}

export const CAMERA_POSES: PoseSet = {
  wide: {
    introSide: { position: [0.38, 1.02, 3.65], target: [0.45, 0.36, 0.1], fov: 44 },
    chairReach: { position: [0.16, 0.65, 2.33], target: [0.18, 0.12, 0.73], fov: 45 },
    chairPass: { position: [0.75, 0.55, 1.83], target: [0.45, 0.30, -0.18], fov: 50 },
    presentation: { position: [0.62, 0.60, 2.2], target: [0.55, 0.40, -0.34], fov: 52 },
  },
  narrow: {
    introSide: { position: [0.24, 1.18, 2.95], target: [0.24, 0.24, 0.10], fov: 56 },
    chairReach: { position: [0.12, 0.82, 2.45], target: [0.18, 0.13, 0.78], fov: 59 },
    chairPass: { position: [0.42, 0.82, 1.80], target: [0.22, 0.28, -0.22], fov: 58 },
    presentation: { position: [0.22, 0.98, 1.72], target: [0.20, 0.20, -0.20], fov: 56 },
  },
};

/**
 * Poses blend from `narrow` to `wide` as the aspect ratio (width / height)
 * goes from the first value to the second, so every window shape is framed.
 */
export const POSE_ASPECT_RANGE: readonly [narrow: number, wide: number] = [0.45, 1.75];

export const EXPLORE = {
  /** Max orbit around the presentation target from the pointer, in degrees. */
  yawRange: 7,
  pitchRange: 3.5,
  /** Seconds to settle when following the pointer. */
  smoothTime: 0.55,
  /** Seconds to settle while a finger drags the view (lib/touchLook.ts). */
  dragSmoothTime: 0.1,
} as const;

export const MONITOR_FOCUS = {
  /** Narrow lens at the screen = little perspective distortion. */
  fov: 22,
  /** <1 means the screen slightly overfills the viewport so no bezel is visible. */
  fill: 0.985,
} as const;

/**
 * Phones fly down onto the phone lying on the desk until its display covers
 * the real screen. Its display is nearly a phone's shape, so little is cropped.
 */
export const PHONE_FOCUS = {
  fov: 30,
  fill: 0.985,
} as const;

/**
 * A wide window can't be covered by a portrait phone screen, so there (the
 * visitor chose the phone anyway) the camera stops with the whole screen in
 * view, this tall a share of the window, and the phone OS opens in a frame
 * the same size (desktop/Desktop.module.css).
 */
export const PHONE_CONTAIN = {
  /** Wider than this (width / height), the phone is shown whole rather than filling the window. */
  minAspect: 0.75,
  /** Share of the window's height the phone's screen takes. Keep in sync with --phone-frame-height. */
  fill: 0.9,
} as const;
