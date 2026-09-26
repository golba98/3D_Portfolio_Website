import { MathUtils, Spherical, Vector3 } from 'three';
import { CAMERA_POSES, MONITOR_FOCUS, PHONE_CONTAIN, PHONE_FOCUS, POSE_ASPECT_RANGE, type CameraPose, type PoseName } from '../config/cameraPoses';
import type { BoardRect, ScreenRect } from '../types/scene';
import { angleDelta, clamp, lerp } from './math';

/** Mutable camera state the rig animates. */
export interface CameraState {
  position: Vector3;
  target: Vector3;
  fov: number;
  /**
   * Which way is up on screen. World up (+Y) except when looking straight down
   * at the phone on the desk, where it is the phone's top edge.
   */
  up: Vector3;
}

const WORLD_UP: readonly [number, number, number] = [0, 1, 0];

export function createCameraState(pose: CameraPose): CameraState {
  return {
    position: new Vector3(...pose.position),
    target: new Vector3(...pose.target),
    fov: pose.fov,
    up: new Vector3(...(pose.up ?? WORLD_UP)),
  };
}

export function copyCameraState(from: CameraState): CameraState {
  return { position: from.position.clone(), target: from.target.clone(), fov: from.fov, up: from.up.clone() };
}

export function setCameraState(out: CameraState, pose: CameraPose | CameraState): void {
  if (pose.position instanceof Vector3) out.position.copy(pose.position);
  else out.position.set(...pose.position);
  if (pose.target instanceof Vector3) out.target.copy(pose.target);
  else out.target.set(...pose.target);
  if (pose.up instanceof Vector3) out.up.copy(pose.up);
  else out.up.set(...(pose.up ?? WORLD_UP));
  out.fov = pose.fov;
}

const lerp3 = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
  lerp(a[0] ?? 0, b[0] ?? 0, t),
  lerp(a[1] ?? 0, b[1] ?? 0, t),
  lerp(a[2] ?? 0, b[2] ?? 0, t),
];

/** A named pose for the current aspect ratio, blended between the narrow and wide sets. */
export function poseFor(name: PoseName, aspect: number): CameraPose {
  const [lo, hi] = POSE_ASPECT_RANGE;
  const t = clamp((aspect - lo) / (hi - lo), 0, 1);
  const narrow = CAMERA_POSES.narrow[name];
  const wide = CAMERA_POSES.wide[name];
  if (t === 1) return wide;
  if (t === 0) return narrow;
  return {
    position: lerp3(narrow.position, wide.position, t),
    target: lerp3(narrow.target, wide.target, t),
    fov: lerp(narrow.fov, wide.fov, t),
  };
}

/**
 * A pose slid sideways along the desk by `pan` metres, raised by `lift`, and
 * pulled back (or in) by `zoom`: the touch look-around from lib/touchLook.ts.
 */
export function applyLook(pose: CameraPose, pan: number, zoom: number, lift = 0): CameraPose {
  const [tx, ty, tz] = pose.target;
  const [px, py, pz] = pose.position;
  return {
    target: [tx + pan, ty + lift, tz],
    position: [tx + pan + (px - tx) * zoom, ty + lift + (py - ty) * zoom, tz + (pz - tz) * zoom],
    fov: pose.fov,
  };
}

export interface FocusLens {
  /** Vertical field of view, degrees. */
  fov: number;
  /**
   * cover: <1 means the display slightly overfills the viewport so no bezel shows.
   * contain: the share of the viewport the whole display takes.
   */
  fill: number;
  /** Fill the viewport with the display (default), or show all of it. */
  fit?: 'cover' | 'contain';
}

/**
 * Camera square-on to a display, upright to it, far enough back that the
 * display just covers the viewport at the given aspect ratio.
 */
export function screenFocusPose(screen: ScreenRect, aspect: number, lens: FocusLens): CameraState {
  const halfTan = Math.tan(MathUtils.degToRad(lens.fov) / 2);
  const fitHeight = screen.height / (2 * halfTan);
  const fitWidth = screen.width / (2 * halfTan * aspect);
  const distance = lens.fit === 'contain' ? Math.max(fitHeight, fitWidth) / lens.fill : Math.min(fitHeight, fitWidth) * lens.fill;
  const target = new Vector3(...screen.center);
  return {
    position: target.clone().addScaledVector(new Vector3(...screen.normal), distance),
    target,
    fov: lens.fov,
    up: new Vector3(...screen.up),
  };
}

/** Into the centre monitor (desktop visitors). */
export const monitorFocusPose = (screen: ScreenRect, aspect: number): CameraState =>
  screenFocusPose(screen, aspect, MONITOR_FOCUS);

/** A wide window only shows the phone whole; see PHONE_CONTAIN. */
export const phoneShownWhole = (aspect: number): boolean => aspect > PHONE_CONTAIN.minAspect;

/** Straight down onto the phone lying on the desk: filling a phone's screen, or whole in a wide window. */
export const phoneFocusPose = (screen: ScreenRect, aspect: number): CameraState =>
  screenFocusPose(
    screen,
    aspect,
    phoneShownWhole(aspect) ? { fov: PHONE_FOCUS.fov, fill: PHONE_CONTAIN.fill, fit: 'contain' } : PHONE_FOCUS,
  );

/** Frame the entire writable face with breathing room for the drawing toolbar. */
export function boardFocusPose(board: BoardRect, aspect: number): CameraState {
  const fov = lerp(40, 32, clamp((aspect - 0.6) / (1.75 - 0.6), 0, 1));
  const halfTan = Math.tan(MathUtils.degToRad(fov) / 2);
  const distance = Math.max(board.height / (2 * halfTan), board.width / (2 * halfTan * aspect)) * 1.3;
  const target = new Vector3(...board.center);
  return {
    position: target.clone().addScaledVector(new Vector3(...board.normal), distance),
    target,
    fov,
    up: new Vector3(...WORLD_UP),
  };
}

const sphericalA = new Spherical();
const sphericalB = new Spherical();
const offset = new Vector3();

/** A pose orbited around its own target by small yaw/pitch angles (degrees). */
export function orbitPose(pose: CameraPose, yawDeg: number, pitchDeg: number, out: CameraState): CameraState {
  out.target.set(...pose.target);
  offset.set(...pose.position).sub(out.target);
  sphericalA.setFromVector3(offset);
  sphericalA.theta += MathUtils.degToRad(yawDeg);
  sphericalA.phi = MathUtils.clamp(sphericalA.phi - MathUtils.degToRad(pitchDeg), 0.2, Math.PI / 2 - 0.02);
  out.position.setFromSpherical(sphericalA).add(out.target);
  out.fov = pose.fov;
  out.up.set(...WORLD_UP);
  return out;
}

/** Straight-line blend: used for the dolly into the screen. */
export function blendLinear(from: CameraState, to: CameraState, k: number, out: CameraState): void {
  out.position.lerpVectors(from.position, to.position, k);
  out.target.lerpVectors(from.target, to.target, k);
  out.fov = lerp(from.fov, to.fov, k);
  blendUp(from.up, to.up, k, out.up);
}

/** Tilts the camera's up vector from one to the other (they are never opposite here). */
function blendUp(from: Vector3, to: Vector3, k: number, out: Vector3): void {
  out.lerpVectors(from, to, k);
  if (out.lengthSq() < 1e-6) out.copy(to);
  out.normalize();
}

/** Sweeping blend around the moving target: used for the cinematic intro. */
export function blendOrbit(from: CameraState, to: CameraState, k: number, out: CameraState): void {
  out.target.lerpVectors(from.target, to.target, k);
  sphericalA.setFromVector3(offset.copy(from.position).sub(from.target));
  sphericalB.setFromVector3(offset.copy(to.position).sub(to.target));
  const radius = lerp(sphericalA.radius, sphericalB.radius, k);
  const phi = lerp(sphericalA.phi, sphericalB.phi, k);
  const theta = sphericalA.theta + angleDelta(sphericalA.theta, sphericalB.theta) * k;
  out.position.setFromSpherical(sphericalA.set(radius, phi, theta)).add(out.target);
  out.fov = lerp(from.fov, to.fov, k);
  blendUp(from.up, to.up, k, out.up);
}
