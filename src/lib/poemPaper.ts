import { MathUtils, Vector3 } from 'three';
import { POEM_PAPER } from '../config/scene';
import type { SceneBounds, Vec3 } from '../types/scene';
import type { CameraPose } from '../config/cameraPoses';

/** Near the front, entirely supported by the lower slab. */
export function paperPosition(shelf: SceneBounds): Vec3 {
  return [
    shelf.min[0] + (shelf.max[0] - shelf.min[0]) * 0.62,
    shelf.max[1] + POEM_PAPER.surfaceOffset,
    shelf.max[2] - POEM_PAPER.height / 2 - 0.015,
  ];
}

/** Look down onto the sheet without passing through the upper shelf. */
export function shelfFocusPose(shelf: SceneBounds, aspect: number): CameraPose {
  const [x, y, z] = paperPosition(shelf);
  const distance = Math.max(0.72, 0.32 / Math.max(aspect, 0.1));
  return {
    position: [x, y + distance * 0.46, z + distance],
    target: [x, y, z],
    fov: 40,
  };
}

/** Reader pixels and mesh use identical dimensions so the text follows the page. */
export function paperReadSize(width: number, height: number): { width: number; height: number } {
  const paperWidth = Math.max(1, Math.min(620, width - 36, (height - 110) * 0.9));
  return { width: paperWidth, height: Math.max(1, Math.min(paperWidth / (POEM_PAPER.width / POEM_PAPER.height), height - 110)) };
}

export function paperWorldSize(width: number, height: number, fov: number) {
  const pixels = paperReadSize(width, height);
  const worldPerPixel = 2 * POEM_PAPER.readDistance * Math.tan(MathUtils.degToRad(fov) / 2) / height;
  return new Vector3(pixels.width * worldPerPixel / POEM_PAPER.width, pixels.height * worldPerPixel / POEM_PAPER.height, 1);
}
