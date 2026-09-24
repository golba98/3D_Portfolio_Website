import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { ErrorBoundary } from '../../app/ErrorBoundary';
import { poseFor } from '../../lib/cameraMath';
import { RENDER } from '../../config/scene';
import { useDeviceTier } from '../../hooks/useDeviceTier';
import { useExperience } from '../../store/experience';
import { LoadingScreen } from '../ui/LoadingScreen';
import { MonitorLabel } from '../ui/MonitorLabel';
import { WorldOverlay } from '../ui/WorldOverlay';
import { SetupScene } from './SetupScene';
import styles from './World.module.css';

/** The 3D landing: canvas plus its DOM overlays. Paused (not unmounted) while the desktop is open. */
export default function World() {
  const phase = useExperience((s) => s.phase);
  const sceneFailed = useExperience((s) => s.sceneFailed);
  const tier = useDeviceTier();
  const [dprMin, dprMax] = RENDER.dpr[tier];
  const [dpr, setDpr] = useState(dprMax);
  const paused = phase === 'desktop';
  // Flying into the monitor ends on a frame that stays frozen behind the
  // desktop's crossfade, so render it at the display's full resolution,
  // whatever the tier cap or the performance monitor says. It stays that way
  // while paused: resizing the buffer would blank the frozen frame.
  const canvasDpr: number | [number, number] =
    phase === 'entering-monitor' || paused ? Math.min(window.devicePixelRatio || 1, 2) : [dprMin, Math.min(dpr, dprMax)];
  const initialPose = poseFor('introSide', window.innerWidth / Math.max(window.innerHeight, 1));

  return (
    <div className={styles.world} data-phase={phase} aria-hidden={paused || undefined} inert={paused}>
      <ErrorBoundary fallback={null} onError={() => sceneFailed('The 3D model failed to load.')}>
        <Canvas
          className={styles.canvas}
          dpr={canvasDpr}
          frameloop={paused ? 'never' : 'always'}
          camera={{ fov: initialPose.fov, near: RENDER.near, far: RENDER.far, position: [...initialPose.position] }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.toneMappingExposure = RENDER.toneMappingExposure;
          }}
          aria-label="3D model of Jordan's desk, chair and drawable whiteboard"
          role="img"
        >
          <PerformanceMonitor onDecline={() => setDpr(dprMin)} onIncline={() => setDpr(dprMax)} flipflops={3} />
          <Suspense fallback={null}>
            <SetupScene tier={tier} />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
      <MonitorLabel />
      <LoadingScreen />
      <WorldOverlay />
    </div>
  );
}
