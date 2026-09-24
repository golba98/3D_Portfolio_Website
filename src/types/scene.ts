export type Vec3 = readonly [number, number, number];

/** The centre display, measured from the model in desk space. */
export interface ScreenRect {
  center: Vec3;
  /** Unit vector pointing out of the screen, towards the viewer. */
  normal: Vec3;
  /** Unit vector along the screen's vertical edge. */
  up: Vec3;
  width: number;
  height: number;
}

/** Drawable board face, measured from the GLB in desk space. */
export type BoardRect = ScreenRect;

export type DeviceTier = 'high' | 'low';
