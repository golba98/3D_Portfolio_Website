import { create } from 'zustand';
import type { ScreenRect, Vec3 } from '../types/scene';

/**
 * Geometry measured from the loaded model, shared between the model, the
 * camera rig and the interaction layer. Written once by SetupModel.
 */
interface SceneLayoutState {
  screen: ScreenRect | null;
  /** Desk-space position of the PC case, for the red accent light. */
  pcCaseCenter: Vec3 | null;
  /** Desk-space bounds of the centre monitor (hit area + hover label). */
  monitorBounds: { min: Vec3; max: Vec3 } | null;
  setLayout: (layout: Omit<SceneLayoutState, 'setLayout'>) => void;
}

export const useSceneLayout = create<SceneLayoutState>()((set) => ({
  screen: null,
  pcCaseCenter: null,
  monitorBounds: null,
  setLayout: (layout) => set(layout),
}));
