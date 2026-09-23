import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { easing } from 'maath';
import { PerspectiveCamera } from 'three';
import { EXPLORE } from '../../config/cameraPoses';
import { TIMINGS } from '../../config/timings';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import {
  blendLinear,
  blendOrbit,
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
  path: 'orbit' | 'linear';
  delay: number;
  duration: number;
  elapsed: number;
  onDone: () => void;
}

/**
 * Owns the camera. Each experience phase maps to one behaviour:
 *   loading          hold the side view
 *   intro            orbit from the side view to the presentation pose
 *   exploring        damp towards the presentation pose + pointer parallax
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

  useEffect(() => {
    const { finishIntro, arriveAtMonitor } = useExperience.getState();
    const cut = (onDone: () => void, delay: number): Tween => ({
      from: copyCameraState(state.current),
      to: () => state.current,
      path: 'linear',
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
        if (reducedMotion) {
          setCameraState(state.current, poseFor('presentation', aspectNow()));
          tween.current = cut(finishIntro, TIMINGS.reducedMotionFade);
        } else {
          tween.current = {
            from: copyCameraState(state.current),
            to: (aspect) => createCameraState(poseFor('presentation', aspect)),
            path: 'orbit',
            delay: TIMINGS.introFade * 0.5 + TIMINGS.introHold,
            duration: TIMINGS.introMove,
            elapsed: 0,
            onDone: finishIntro,
          };
        }
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
            path: 'linear',
            delay: 0,
            duration: TIMINGS.enterMonitor,
            elapsed: 0,
            onDone: arriveAtMonitor,
          };
        }
        break;
      }

      default:
        // exploring / desktop / fallback are handled per frame.
        tween.current = null;
    }
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
    } else if (active) {
      active.elapsed += delta;
      const progress = clamp((active.elapsed - active.delay) / active.duration, 0, 1);
      const blend = active.path === 'orbit' ? blendOrbit : blendLinear;
      blend(active.from, active.to(aspect), easeInOutCubic(progress), current);
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
