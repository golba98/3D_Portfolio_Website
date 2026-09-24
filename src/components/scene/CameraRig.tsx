import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { easing } from 'maath';
import { PerspectiveCamera } from 'three';
import { EXPLORE } from '../../config/cameraPoses';
import { TIMINGS } from '../../config/timings';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import {
  blendLinear,
  boardFocusPose,
  copyCameraState,
  createCameraState,
  monitorFocusPose,
  orbitPose,
  poseFor,
  setCameraState,
  type CameraState,
} from '../../lib/cameraMath';
import { debugFlags } from '../../lib/debugFlags';
import { clamp, easeInOutCubic } from '../../lib/math';
import { useExperience } from '../../store/experience';
import { useSceneLayout } from '../../store/sceneLayout';
import { usePointerParallax } from './usePointerParallax';

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
        tween.current = null;
        setCameraState(state.current, poseFor('introSide', aspectNow()));
        break;

      case 'intro':
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
              to: (aspect) => createCameraState(poseFor('presentation', aspect)),
              delay: 0,
              duration: reducedMotion ? 0.001 : TIMINGS.boardMove,
              elapsed: 0,
              onDone: () => undefined,
            }
          : null;
        break;

      case 'entering-monitor': {
        const focus = (aspect: number): CameraState => {
          const screen = useSceneLayout.getState().screen;
          return screen ? monitorFocusPose(screen, aspect) : state.current;
        };
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
      if (held === 'monitorFocus' && screen) setCameraState(current, monitorFocusPose(screen, aspect));
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
      const { x, y } = pointer.current;
      orbitPose(poseFor('presentation', aspect), x * EXPLORE.yawRange, y * EXPLORE.pitchRange, goal.current);
      const smooth = EXPLORE.smoothTime;
      easing.damp3(current.position, goal.current.position, smooth, delta);
      easing.damp3(current.target, goal.current.target, smooth, delta);
      easing.damp(current, 'fov', goal.current.fov, smooth, delta);
    } else if (currentPhase === 'desktop') {
      const screen = useSceneLayout.getState().screen;
      if (screen) setCameraState(current, monitorFocusPose(screen, aspect));
    } else if (currentPhase === 'loading') {
      setCameraState(current, poseFor('introSide', aspect));
    } else if (currentPhase === 'viewing-board') {
      const board = useSceneLayout.getState().board;
      if (board) setCameraState(current, boardFocusPose(board, aspect));
    }

    camera.position.copy(current.position);
    camera.lookAt(current.target);
    if (camera instanceof PerspectiveCamera && Math.abs(camera.fov - current.fov) > 1e-4) {
      camera.fov = current.fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
