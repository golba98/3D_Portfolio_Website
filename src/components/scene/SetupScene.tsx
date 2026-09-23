import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { RENDER } from '../../config/scene';
import { useExperience } from '../../store/experience';
import type { DeviceTier } from '../../types/scene';
import { CameraRig } from './CameraRig';
import { MonitorInteraction } from './MonitorInteraction';
import { SceneLighting } from './SceneLighting';
import { SetupModel } from './SetupModel';

interface SetupSceneProps {
  tier: DeviceTier;
}

/** Everything inside the Canvas. Mounted under Suspense, so effects run once the model is in. */
export function SetupScene({ tier }: SetupSceneProps) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  // Compile shaders before revealing the scene so the intro doesn't stutter.
  useEffect(() => {
    let cancelled = false;
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) useExperience.getState().sceneReady();
      });
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera]);

  useEffect(() => {
    const canvas = gl.domElement;
    const onLost = (event: Event): void => {
      event.preventDefault();
      useExperience.getState().sceneFailed('The graphics context was lost.');
    };
    canvas.addEventListener('webglcontextlost', onLost);
    return () => canvas.removeEventListener('webglcontextlost', onLost);
  }, [gl]);

  return (
    <>
      <color attach="background" args={[RENDER.background]} />
      <CameraRig />
      <SceneLighting tier={tier} />
      <SetupModel />
      <MonitorInteraction />
    </>
  );
}
