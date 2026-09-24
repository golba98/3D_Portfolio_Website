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
    introSide: { position: [0.25, 1.22, 3.55], target: [0.28, 0.35, 0.18], fov: 58 },
    chairReach: { position: [0.12, 0.82, 2.45], target: [0.18, 0.13, 0.78], fov: 59 },
    chairPass: { position: [0.48, 0.69, 1.85], target: [0.25, 0.34, -0.24], fov: 60 },
    presentation: { position: [0.27, 0.78, 2.42], target: [0.16, 0.30, -0.30], fov: 60 },
  },
};

/**
 * Poses blend from `narrow` to `wide` as the aspect ratio (width / height)
 * goes from the first value to the second, so every window shape is framed.
 */
export const POSE_ASPECT_RANGE: readonly [narrow: number, wide: number] = [0.6, 1.75];

export const EXPLORE = {
  /** Max orbit around the presentation target from the pointer, in degrees. */
  yawRange: 7,
  pitchRange: 3.5,
  /** Seconds to settle when following the pointer. */
  smoothTime: 0.55,
} as const;

export const MONITOR_FOCUS = {
  /** Narrow lens at the screen = little perspective distortion. */
  fov: 22,
  /** <1 means the screen slightly overfills the viewport so no bezel is visible. */
  fill: 0.985,
} as const;
