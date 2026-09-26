import { create } from 'zustand';
import { Vector3, type Camera } from 'three';
import type { Vec3 } from '../types/scene';

/** The parts of the setup that float a label over themselves on hover. */
export type HoverTarget = 'monitor' | 'phone' | 'board';

/**
 * Which part of the setup the pointer is over, shared between the 3D hit areas
 * and the DOM labels (ui/SceneLabels.tsx). The labels' screen positions are
 * written straight to their elements each frame (pinLabel) rather than
 * through React state.
 */
interface SceneHoverState {
  hovered: HoverTarget | null;
  setHovered: (target: HoverTarget, hovered: boolean) => void;
}

export const useSceneHover = create<SceneHoverState>()((set, get) => ({
  hovered: null,
  setHovered: (target, hovered) => {
    // Leaving one part only clears the hover if the pointer hasn't already moved onto another.
    if (hovered) set({ hovered: target });
    else if (get().hovered === target) set({ hovered: null });
  },
}));

/** The DOM label elements, registered by SceneLabels. */
export const labelElements: Record<HoverTarget, { current: HTMLElement | null }> = {
  monitor: { current: null },
  phone: { current: null },
  board: { current: null },
};

const projected = new Vector3();

/** Pins a label's bottom centre to a desk-space point, as seen by `camera`. */
export function pinLabel(target: HoverTarget, point: Vec3, camera: Camera, size: { width: number; height: number }): void {
  const label = labelElements[target].current;
  if (!label) return;
  projected.set(...point).project(camera);
  const x = (projected.x * 0.5 + 0.5) * size.width;
  const y = (-projected.y * 0.5 + 0.5) * size.height;
  label.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
}
