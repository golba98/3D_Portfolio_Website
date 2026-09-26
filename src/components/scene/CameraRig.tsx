import { useEffect, useLayoutEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { easing } from 'maath';
import { MathUtils, PerspectiveCamera } from 'three';
import { EXPLORE } from '../../config/cameraPoses';
import { TIMINGS } from '../../config/timings';
import { useEntryDevice, type EntryDevice } from '../../hooks/useEntryDevice';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import {
  applyLook,
  blendLinear,
  boardFocusPose,
  copyCameraState,
  createCameraState,
  monitorFocusPose,
  orbitPose,
  phoneFocusPose,
  poseFor,
  setCameraState,
  type CameraState,
} from '../../lib/cameraMath';
import { debugFlags } from '../../lib/debugFlags';
import { clamp, easeInOutCubic, lerp } from '../../lib/math';
import { clampLook, look, nearestStop, resetLook, useLookStops, type LookStops } from '../../lib/touchLook';
import { useExperience } from '../../store/experience';
import { useSceneLayout } from '../../store/sceneLayout';
import { usePointerParallax } from './usePointerParallax';
import { useTouchLook } from './useTouchLook';

/** Flick momentum decays at this rate (per second). */
const FLING_DECAY = 4;

/** Pan offsets that centre the PC, the phone, the monitor and the board, from the measured model. */
function lookStops(aspect: number): LookStops | null {
  const { pcCaseCenter, board, screen, phoneScreen } = useSceneLayout.getState();
  if (!pcCaseCenter || !board || !screen || !phoneScreen) return null;
  const [tx] = poseFor('presentation', aspect).target;
  return {
    pc: pcCaseCenter[0] - tx,
    phone: phoneScreen.center[0] - tx,
    monitor: screen.center[0] - tx,
    board: board.center[0] - tx,
  };
}

/** The phone is small, so the view moves in on it as it slides over. */
const PHONE_STOP_ZOOM = 0.72;
/** How close (in metres of pan) the phone's zoom starts to apply. */
const PHONE_STOP_REACH = 0.22;

/** Where the camera ends up to hand over to the visitor's OS: in the monitor, or over the phone. */
function focusPose(entry: EntryDevice, aspect: number): CameraState | null {
  const { screen, phoneScreen } = useSceneLayout.getState();
  if (entry === 'phone') return phoneScreen ? phoneFocusPose(phoneScreen, aspect) : null;
  return screen ? monitorFocusPose(screen, aspect) : null;
}

/**
 * The board hangs higher than the desk and is wider than a portrait view, so
 * the camera rises and pulls back as it slides over to it. (The PC sits on
 * the desk and needs neither.) Returns how far up and how much further back.
 */
function boardFraming(aspect: number): { lift: number; zoom: number } {
  const { board } = useSceneLayout.getState();
  if (!board) return { lift: 0, zoom: 1 };
  const pose = poseFor('presentation', aspect);
  const [px, py, pz] = pose.position;
  const [tx, ty, tz] = pose.target;
  // The board is further back than the monitor, which counts towards the distance already.
  const distance = Math.hypot(px - tx, py - ty, pz - tz) + (tz - board.center[2]);
  const halfTan = Math.tan(MathUtils.degToRad(pose.fov) / 2);
  const fitWidth = (board.width * 1.15) / (2 * distance * halfTan * aspect);
  const fitHeight = (board.height * 1.3) / (2 * distance * halfTan);
  return { lift: board.center[1] - ty, zoom: Math.max(1, fitWidth, fitHeight) };
}

/** The presentation pose, moved wherever the visitor has slid or zoomed it. */
function lookedAtPose(aspect: number) {
  const stops = useLookStops.getState().stops;
  // Blend towards the board's framing as the pan approaches it.
  const towardsBoard = stops && stops.board > stops.monitor
    ? clamp((look.pan - stops.monitor) / (stops.board - stops.monitor), 0, 1)
    : 0;
  const atPhone = stops ? clamp(1 - Math.abs(look.pan - stops.phone) / PHONE_STOP_REACH, 0, 1) : 0;
  const board = boardFraming(aspect);
  return applyLook(
    poseFor('presentation', aspect),
    look.pan,
    look.zoom * lerp(1, board.zoom, towardsBoard) * lerp(1, PHONE_STOP_ZOOM, atPhone),
    board.lift * towardsBoard,
  );
}

interface Tween {
  from: CameraState;
  /** Evaluated every frame so the destination follows window resizes. */
  to: (aspect: number) => CameraState;
  delay: number;
  duration: number;
  elapsed: number;
  onDone: () => void;
}

/**
 * Owns the camera. Each experience phase maps to one behaviour:
 *   loading          hold the arrival view
 *   intro            approach the chair and settle at the desk
 *   exploring        damp towards the presentation pose + pointer parallax
 *   viewing-board    frame the writable whiteboard face
 *   entering-monitor dolly square-on to the centre screen
 *   desktop          hold the screen-filling pose
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const getThree = useThree((s) => s.get);
  const phase = useExperience((s) => s.phase);
  const reducedMotion = useReducedMotion();
  const pointer = usePointerParallax(!reducedMotion);
  useTouchLook(phase === 'exploring');
  // Phones fly onto the phone on the desk; everything else into the monitor.
  const entry = useEntryDevice();
  const entryRef = useRef(entry);
  useLayoutEffect(() => {
    entryRef.current = entry;
  }, [entry]);

  const aspectNow = (): number => {
    const { width, height } = getThree().size;
    return height > 0 ? width / height : 16 / 9;
  };

  const state = useRef<CameraState>(createCameraState(poseFor('introSide', aspectNow())));
  const goal = useRef<CameraState>(copyCameraState(state.current));
  const tween = useRef<Tween | null>(null);
  const heldPose = useRef(debugFlags.heldPose());
  const introElapsed = useRef(0);
  const previousPhase = useRef(phase);

  useEffect(() => {
    const { finishIntro, arriveAtMonitor, boardArrived } = useExperience.getState();
    const cut = (onDone: () => void, delay: number): Tween => ({
      from: copyCameraState(state.current),
      to: () => state.current,
      delay,
      duration: 0.001,
      elapsed: 0,
      onDone,
    });

    switch (phase) {
      case 'loading':
        resetLook();
        tween.current = null;
        setCameraState(state.current, poseFor('introSide', aspectNow()));
        break;

      case 'intro':
        resetLook();
        introElapsed.current = 0;
        if (reducedMotion) {
          setCameraState(state.current, poseFor('presentation', aspectNow()));
          useExperience.getState().setIntroProgress(1);
          tween.current = cut(finishIntro, TIMINGS.reducedMotionFade);
        } else {
          useExperience.getState().setIntroProgress(0);
          tween.current = null;
        }
        break;

      case 'viewing-board':
        tween.current = {
          from: copyCameraState(state.current),
          to: (aspect) => {
            const board = useSceneLayout.getState().board;
            return board ? boardFocusPose(board, aspect) : state.current;
          },
          delay: 0,
          duration: reducedMotion ? 0.001 : TIMINGS.boardMove,
          elapsed: 0,
          onDone: boardArrived,
        };
        break;

      case 'exploring':
        tween.current = previousPhase.current === 'viewing-board'
          ? {
              from: copyCameraState(state.current),
              to: (aspect) => createCameraState(lookedAtPose(aspect)),
              delay: 0,
              duration: reducedMotion ? 0.001 : TIMINGS.boardMove,
              elapsed: 0,
              onDone: () => undefined,
            }
          : null;
        break;

      case 'entering-monitor': {
        const focus = (aspect: number): CameraState => focusPose(entryRef.current, aspect) ?? state.current;
        if (reducedMotion) {
          setCameraState(state.current, focus(aspectNow()));
          tween.current = cut(arriveAtMonitor, 0);
        } else {
          tween.current = {
            from: copyCameraState(state.current),
            to: focus,
            delay: 0,
            duration: TIMINGS.enterMonitor,
            elapsed: 0,
            onDone: arriveAtMonitor,
          };
        }
        break;
      }

      default:
        // desktop / fallback are handled per frame.
        tween.current = null;
    }
    previousPhase.current = phase;
  }, [phase, reducedMotion]); // eslint-disable-line react-hooks/exhaustive-deps -- aspectNow reads live state

  useFrame((three, delta) => {
    const aspect = three.size.height > 0 ? three.size.width / three.size.height : 16 / 9;
    const current = state.current;
    const active = tween.current;
    const currentPhase = useExperience.getState().phase;

    const held = heldPose.current;
    if (held) {
      const screen = useSceneLayout.getState().screen;
      const phoneScreen = useSceneLayout.getState().phoneScreen;
      if (held === 'monitorFocus' && screen) setCameraState(current, monitorFocusPose(screen, aspect));
      else if (held === 'phoneFocus' && phoneScreen) setCameraState(current, phoneFocusPose(phoneScreen, aspect));
      else if (held === 'introSide' || held === 'presentation') setCameraState(current, poseFor(held, aspect));
    } else if (currentPhase === 'intro' && !reducedMotion) {
      introElapsed.current += delta;
      const progress = clamp((introElapsed.current - TIMINGS.introHold) / TIMINGS.introMove, 0, 1);
      useExperience.getState().setIntroProgress(progress);
      const segment = progress < 0.15
        ? ['introSide', 'introSide', 0]
        : progress < 0.45
          ? ['introSide', 'chairReach', (progress - 0.15) / 0.30]
          : progress < 0.72
            ? ['chairReach', 'chairPass', (progress - 0.45) / 0.27]
            : ['chairPass', 'presentation', (progress - 0.72) / 0.28];
      const [from, to, part] = segment as [
        'introSide' | 'chairReach' | 'chairPass' | 'presentation',
        'introSide' | 'chairReach' | 'chairPass' | 'presentation',
        number,
      ];
      blendLinear(createCameraState(poseFor(from, aspect)), createCameraState(poseFor(to, aspect)), easeInOutCubic(part), current);
      if (progress >= 1) useExperience.getState().finishIntro();
    } else if (active) {
      active.elapsed += delta;
      const progress = clamp((active.elapsed - active.delay) / active.duration, 0, 1);
      blendLinear(active.from, active.to(aspect), easeInOutCubic(progress), current);
      if (progress >= 1) {
        tween.current = null;
        active.onDone();
      }
    } else if (currentPhase === 'exploring') {
      const stops = lookStops(aspect);
      const lookUi = useLookStops.getState();
      if (stops && (!lookUi.stops || Math.abs(lookUi.stops.pc - stops.pc) + Math.abs(lookUi.stops.board - stops.board) > 1e-3)) {
        lookUi.setStops(stops);
      }
      // A flick keeps sliding after the finger lifts, and slows to a stop.
      if (!look.dragging && look.velocity !== 0) {
        look.pan += look.velocity * delta;
        look.velocity *= Math.exp(-FLING_DECAY * delta);
        if (Math.abs(look.velocity) < 0.01) look.velocity = 0;
      }
      clampLook(stops);
      if (stops) lookUi.setNearest(nearestStop(stops, look.pan));

      const { x, y } = pointer.current;
      orbitPose(lookedAtPose(aspect), x * EXPLORE.yawRange, y * EXPLORE.pitchRange + look.pitch, goal.current);
      // A finger drag tracks closely; everything else (mouse parallax, chip jumps) glides.
      const smooth = look.dragging ? EXPLORE.dragSmoothTime : EXPLORE.smoothTime;
      easing.damp3(current.position, goal.current.position, smooth, delta);
      easing.damp3(current.target, goal.current.target, smooth, delta);
      easing.damp(current, 'fov', goal.current.fov, smooth, delta);
      // Rights the camera after coming back up from the phone.
      easing.damp3(current.up, goal.current.up, smooth, delta);
      current.up.normalize();
    } else if (currentPhase === 'desktop') {
      const focus = focusPose(entryRef.current, aspect);
      if (focus) setCameraState(current, focus);
    } else if (currentPhase === 'loading') {
      setCameraState(current, poseFor('introSide', aspect));
    } else if (currentPhase === 'viewing-board') {
      const board = useSceneLayout.getState().board;
      if (board) setCameraState(current, boardFocusPose(board, aspect));
    }

    camera.position.copy(current.position);
    camera.up.copy(current.up);
    camera.lookAt(current.target);
    if (camera instanceof PerspectiveCamera && Math.abs(camera.fov - current.fov) > 1e-4) {
      camera.fov = current.fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
