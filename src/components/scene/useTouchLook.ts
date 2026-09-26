import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { MathUtils, PerspectiveCamera } from 'three';
import { poseFor } from '../../lib/cameraMath';
import { clamp } from '../../lib/math';
import { clampLook, look, useLookStops } from '../../lib/touchLook';

/** Movement before a touch counts as a drag rather than a tap. */
const DRAG_SLOP = 8;
/** Degrees of tilt per pixel of vertical drag. */
const PITCH_PER_PX = 0.04;
/** A finger that stopped this long before lifting leaves no fling behind. */
const FLING_WINDOW_MS = 80;
/** Fastest fling, in metres per second. */
const MAX_FLING = 4;
/** Shortest time step for measuring speed; closer events would make it spike. */
const MIN_SAMPLE_MS = 16;

interface Pointer {
  x: number;
  y: number;
}

interface Gesture {
  pan: number;
  zoom: number;
  pitch: number;
  /** Midpoint of the fingers when the gesture (re)started. */
  x: number;
  y: number;
  /** Finger spread, for pinching. */
  spread: number;
}

const midpoint = (points: Pointer[]): Pointer => ({
  x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
  y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
});

const spreadOf = (points: Pointer[]): number => {
  const [a, b] = points;
  return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
};

/**
 * Touch controls for the 3D desk while exploring: one finger slides the
 * camera along the desk (and tilts it a little), two fingers pinch to zoom.
 * The desk follows the finger, like a map. Mouse input is left to the pointer
 * parallax.
 */
export function useTouchLook(active: boolean): void {
  const gl = useThree((s) => s.gl);
  const getThree = useThree((s) => s.get);

  useEffect(() => {
    if (!active) return;
    const element = gl.domElement;
    const pointers = new Map<number, Pointer>();
    let gesture: Gesture | null = null;
    let sample = { t: 0, pan: 0 };
    let velocity = 0;
    /** Two fingers were down at some point: a pinch ends where it is, without a fling. */
    let pinched = false;

    /** Metres of desk under one CSS pixel, at the distance the camera is looking. */
    const metresPerPixel = (): number => {
      const { camera, size } = getThree();
      const fov = camera instanceof PerspectiveCamera ? camera.fov : 50;
      const pose = poseFor('presentation', size.width / Math.max(size.height, 1));
      const [px, py, pz] = pose.position;
      const [tx, ty, tz] = pose.target;
      const distance = Math.hypot(px - tx, py - ty, pz - tz) * look.zoom;
      return (2 * distance * Math.tan(MathUtils.degToRad(fov) / 2)) / Math.max(size.height, 1);
    };

    const begin = (): void => {
      const points = [...pointers.values()];
      const mid = midpoint(points);
      gesture = { pan: look.pan, zoom: look.zoom, pitch: look.pitch, x: mid.x, y: mid.y, spread: spreadOf(points) };
    };

    const onDown = (event: PointerEvent): void => {
      if (event.pointerType === 'mouse') {
        look.dragged = false;
        return;
      }
      if (pointers.size === 0) {
        look.dragged = false;
        look.velocity = 0;
        velocity = 0;
        pinched = false;
      }
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size > 1) pinched = true;
      sample = { t: event.timeStamp, pan: look.pan };
      begin();
    };

    const onMove = (event: PointerEvent): void => {
      if (!pointers.has(event.pointerId) || !gesture) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const points = [...pointers.values()];
      const mid = midpoint(points);
      const dx = mid.x - gesture.x;
      const dy = mid.y - gesture.y;

      if (!look.dragging) {
        if (Math.hypot(dx, dy) < DRAG_SLOP && points.length < 2) return;
        look.dragging = true;
        look.dragged = true;
        useLookStops.getState().markHintSeen();
      }

      // The desk follows the finger: dragging right slides the camera left.
      look.pan = gesture.pan - dx * metresPerPixel();
      look.pitch = gesture.pitch - dy * PITCH_PER_PX;
      if (points.length >= 2 && gesture.spread > 0) {
        look.zoom = (gesture.zoom * gesture.spread) / Math.max(spreadOf(points), 1);
      }
      clampLook(useLookStops.getState().stops);

      const dt = event.timeStamp - sample.t;
      if (dt >= MIN_SAMPLE_MS) {
        // Smoothed over the last few samples, so one jittery event doesn't decide the fling.
        const instant = ((look.pan - sample.pan) / dt) * 1000;
        velocity = clamp(velocity * 0.3 + instant * 0.7, -MAX_FLING, MAX_FLING);
        sample = { t: event.timeStamp, pan: look.pan };
      }
    };

    const onUp = (event: PointerEvent): void => {
      if (!pointers.delete(event.pointerId)) return;
      if (pointers.size > 0) {
        // One finger of a pinch lifted: carry on panning with the other.
        begin();
        return;
      }
      gesture = null;
      if (look.dragging) {
        const stopped = event.timeStamp - sample.t > FLING_WINDOW_MS;
        look.velocity = pinched || stopped ? 0 : velocity;
      }
      look.dragging = false;
    };

    element.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      element.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      look.dragging = false;
    };
  }, [active, gl, getThree]);
}
