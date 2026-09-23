/**
 * Everything tunable about the 3D world. Scene components read from here;
 * they should not contain their own magic numbers.
 *
 * Coordinates are in "desk space": metres, Y up, the origin at the centre of
 * the desk top, the visitor's chair towards +Z. SetupModel computes the offset
 * from the model's own bounding box at load time, so a re-export from Blender
 * that moves things around still lands in the same place.
 */

export const MODEL_URL = '/models/pc-setup.glb';

/** Node names exported from Blender that the site depends on (checked by `npm run model:check`). */
export const MODEL_NODES = {
  desk: 'Desk',
  pcCase: 'PC_Case',
  monitorLeft: 'Monitor_Left',
  monitorCenter: 'Monitor_Center',
  centerScreen: 'Monitor_Center_Screen',
  monitorRight: 'Monitor_Right',
  keyboard: 'Keyboard',
  mouse: 'Mouse',
} as const;

/**
 * The PC's red LED materials. They skip tone mapping so ACES doesn't shift
 * them towards orange; they are light sources, so clamping to pure red is the look we want.
 */
export const LED_MATERIALS = /^(PC3_LED_Red|PC3_Fan_Diffuser|PC3_TopFan_Blades|PC5_Pump_Ring_\d+|PC7_ROG_Outline)$/;

export const MODEL_PLACEMENT = {
  /** The Blender export is already in metres. */
  scale: 1,
  /** This node's top-centre becomes the desk-space origin. */
  anchorNode: MODEL_NODES.desk,
} as const;

export const RENDER = {
  /** Device-pixel-ratio clamps. Nobody needs a 3× render of a dark desk. */
  dpr: {
    high: [1, 1.75] as [number, number],
    low: [1, 1.25] as [number, number],
  },
  /** Matches --world-bg. */
  background: '#050506',
  toneMappingExposure: 1.05,
  /**
   * Opacity of the PC's glass. It is drawn as plain transparency rather than
   * glTF transmission: three.js samples the transmission pass through a
   * smoothing filter, which blurs everything inside the case.
   */
  glassOpacity: 0.04,
  near: 0.05,
  far: 40,
} as const;

export const LIGHTING = {
  hemisphere: { sky: '#c9d4ff', ground: '#16110f', intensity: 0.35 },
  key: { position: [2.2, 3.2, 2.6] as const, intensity: 1.9, color: '#ffffff' },
  rim: { position: [-2.6, 1.6, -2.2] as const, intensity: 1.1, color: '#9fb4ff' },
  /** The PC's red lighting spilling onto the desk. Placed relative to the case. */
  pcGlow: { offset: [0.15, -0.18, 0.32] as const, intensity: 1.4, distance: 1.3, color: '#ff2b2b' },
  /** Soft glow from the centre screen onto the keyboard area. */
  screenGlow: { intensity: 0.5, distance: 1.1, color: '#7fa7e6' },
  environmentIntensity: 0.6,
  contactShadows: { opacity: 0.55, blur: 2.4, far: 0.6, resolution: 512 },
} as const;

export const SCREEN = {
  /** Resolution of the in-scene desktop preview texture (16:9, like the panel). */
  textureSize: [1280, 720] as [number, number],
  /** How far in front of the physical panel the preview plane floats. */
  surfaceOffset: 0.0012,
  /** Shrinks the plane slightly so it never pokes through the bezel. */
  inset: 0.002,
  brightness: { idle: 0.78, hover: 1 },
  /** Label shown above the monitor on hover, and its height above the monitor's top (m). */
  hoverLabel: 'Enter System',
  labelLift: 0.012,
} as const;
