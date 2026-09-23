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

export type PoseName = 'introSide' | 'presentation';

interface PoseSet {
  /** Landscape windows (16:9 and wider). */
  wide: Record<PoseName, CameraPose>;
  /** Phone-portrait windows: higher and further back, centred on the main monitor. */
  narrow: Record<PoseName, CameraPose>;
}

export const CAMERA_POSES: PoseSet = {
  wide: {
    introSide: { position: [-2.75, 0.62, 1.35], target: [-0.35, 0.18, -0.4], fov: 30 },
    presentation: { position: [0.3, 0.8, 2.08], target: [0.02, 0.2, -0.42], fov: 34 },
  },
  narrow: {
    introSide: { position: [-2.9, 1.5, 2.3], target: [-0.3, 0.15, -0.35], fov: 46 },
    presentation: { position: [-0.02, 1.75, 2.6], target: [0.0, 0.12, -0.3], fov: 48 },
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
