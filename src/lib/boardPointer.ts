import { Raycaster, Vector2, type Camera, type Mesh } from 'three';
import type { BoardPoint } from '../store/boardDrawing';

/** Capture intersections can be stale. Always raycast from current CSS pixels. */
export function boardPointAt(clientX: number, clientY: number, rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>, camera: Camera, mesh: Mesh): BoardPoint | null {
  if (![clientX, clientY, rect.width, rect.height].every(Number.isFinite) || rect.width <= 0 || rect.height <= 0) return null;
  const x = (clientX - rect.left) / rect.width;
  const y = (clientY - rect.top) / rect.height;
  if (x < 0 || x > 1 || y < 0 || y > 1) return null;
  const ray = new Raycaster();
  camera.updateMatrixWorld();
  mesh.updateWorldMatrix(true, false);
  ray.setFromCamera(new Vector2(x * 2 - 1, 1 - y * 2), camera);
  const uv = ray.intersectObject(mesh, false)[0]?.uv;
  if (!uv || ![uv.x, uv.y].every(v => Number.isFinite(v) && v >= 0 && v <= 1)) return null;
  return [uv.x, 1 - uv.y];
}
