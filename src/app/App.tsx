import { lazy, Suspense, useEffect, useState } from 'react';
import { useExperience } from '../store/experience';
import { isWebGLAvailable } from '../lib/webgl';
import { debugFlags } from '../lib/debugFlags';
import { SkipLink } from '../components/ui/SkipLink';
import { Fallback } from '../components/ui/Fallback';
import { useHashSync } from './useHashSync';

// Both experiences are split out so a #/desktop deep link never downloads
// three.js, and the 3D landing never waits on desktop app code.
const World = lazy(() => import('../components/scene/World'));
const loadDesktop = () => import('../components/desktop/Desktop');
const Desktop = lazy(loadDesktop);

export function App() {
  const phase = useExperience((s) => s.phase);
  const sceneFailed = useExperience((s) => s.sceneFailed);
  useHashSync();

  // Decided once, before anything 3D is downloaded.
  const [webglProblem] = useState<string | null>(() => {
    if (debugFlags.forceFallback()) return 'Fallback forced with ?fallback (dev only).';
    return isWebGLAvailable() ? null : 'This browser or device does not support WebGL.';
  });

  // The world mounts on first need and then stays mounted (paused while the
  // desktop is open) so returning to it is instant.
  const [worldMounted, setWorldMounted] = useState(false);
  const worldWanted = phase !== 'desktop' && phase !== 'fallback';
  if (worldWanted && !worldMounted && !webglProblem) setWorldMounted(true);

  useEffect(() => {
    if (worldWanted && webglProblem) sceneFailed(webglProblem);
  }, [worldWanted, webglProblem, sceneFailed]);

  // Fetch the desktop while the visitor looks around, so it's ready to paint
  // the moment the camera reaches the monitor instead of popping in late.
  useEffect(() => {
    if (phase === 'exploring') void loadDesktop();
  }, [phase]);

  return (
    <>
      {phase !== 'desktop' && phase !== 'fallback' && <SkipLink />}
      {worldMounted && phase !== 'fallback' && (
        <Suspense fallback={null}>
          <World />
        </Suspense>
      )}
      {phase === 'fallback' && <Fallback />}
      {phase === 'desktop' && (
        <Suspense fallback={null}>
          <Desktop />
        </Suspense>
      )}
    </>
  );
}
