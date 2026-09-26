import { Matrix4, Quaternion, Vector3 } from 'three';
import { SCREEN } from '../../config/scene';
import type { ScreenRect } from '../../types/scene';

/**
 * Where a preview plane sits over a display: a hair in front of the panel,
 * turned to the display's own axes (its +Y along the display's up).
 */
export function surfacePlacement(screen: ScreenRect): { position: Vector3; quaternion: Quaternion } {
  const normal = new Vector3(...screen.normal);
  const up = new Vector3(...screen.up);
  const right = new Vector3().crossVectors(up, normal).normalize();
  return {
    position: new Vector3(...screen.center).addScaledVector(normal, SCREEN.surfaceOffset),
    quaternion: new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(right, up, normal)),
  };
}
