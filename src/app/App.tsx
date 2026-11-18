import { lazy, Suspense, useEffect, useState } from 'react';
import { useExperience } from '../store/experience';
import { isWebGLAvailable } from '../lib/webgl';
import { debugFlags } from '../lib/debugFlags';
import { ErrorBoundary } from './ErrorBoundary';
import { RoomEntry } from '../components/ui/RoomEntry';
import { profile } from '../data/profile';
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

  const worldWanted = phase !== 'desktop' && phase !== 'fallback';
  const [worldMounted, setWorldMounted] = useState<boolean | null>(null);
  if (worldWanted && worldMounted === null) setWorldMounted(!debugFlags.forceFallback() && isWebGLAvailable());
  useEffect(() => {
    if (worldWanted && worldMounted === false) sceneFailed('WebGL is unavailable on this device.');
  }, [worldWanted, worldMounted, sceneFailed]);

  // Fetch the desktop while the visitor looks around, so it's ready to paint
  // the moment the camera reaches the monitor instead of popping in late.
  useEffect(() => {
    if (phase === 'exploring') void loadDesktop().catch(() => undefined);
  }, [phase]);

  return (
    <>
      {phase !== 'desktop' && phase !== 'fallback' && <SkipLink />}
      {worldWanted && <RoomEntry />}
      {worldWanted && !worldMounted && (
        <p className="shell-status" role="status">
          Loading the desk…
        </p>
      )}
      {worldMounted && phase !== 'fallback' && (
        <ErrorBoundary fallback={<Fallback />} onError={() => sceneFailed('The room could not be loaded.')}>
          <Suspense
            fallback={
              <p className="shell-status" role="status">
                Loading the desk…
              </p>
            }
          >
            <World />
          </Suspense>
        </ErrorBoundary>
      )}
      {phase === 'fallback' && <Fallback />}
      {phase === 'desktop' && (
        <ErrorBoundary
          fallback={
            <main className="shell-status">
              <h1>The desktop couldn’t open</h1>
              <button onClick={() => location.reload()}>Retry desktop</button>
              <a href={profile.github}>Open GitHub</a>
            </main>
          }
        >
          <Suspense
            fallback={
              <p className="shell-status" role="status">
                Opening portfolio…
              </p>
            }
          >
            <Desktop />
          </Suspense>
        </ErrorBoundary>
      )}
    </>
  );
}
