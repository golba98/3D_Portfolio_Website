import { create } from 'zustand';

/**
 * Hover state of the centre monitor, shared between the 3D hit area and the
 * DOM label. The label's screen position is written straight to the element
 * each frame (see MonitorInteraction) rather than through React state.
 */
interface MonitorHoverState {
  hovered: boolean;
  setHovered: (hovered: boolean) => void;
}

export const useMonitorHover = create<MonitorHoverState>()((set) => ({
  hovered: false,
  setHovered: (hovered) => set({ hovered }),
}));

/** The DOM label element, registered by MonitorLabel. */
export const monitorLabelElement: { current: HTMLElement | null } = { current: null };
