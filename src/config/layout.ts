/** Below this width the floating-window desktop becomes the phone shell. */
export const COMPACT_MAX_WIDTH = 767;
/** Phones held sideways are wider than that, but too short for floating windows. */
const PHONE_LANDSCAPE_MAX_HEIGHT = 500;
export const COMPACT_QUERY = `(max-width: ${COMPACT_MAX_WIDTH}px), (pointer: coarse) and (max-height: ${PHONE_LANDSCAPE_MAX_HEIGHT}px)`;
