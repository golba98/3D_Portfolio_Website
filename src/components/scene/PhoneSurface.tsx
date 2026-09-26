import { useMemo } from 'react';
import { SCREEN } from '../../config/scene';
import type { ScreenRect } from '../../types/scene';
import { surfacePlacement } from './surfacePlacement';
import { usePhoneLockTexture } from './usePhoneLockTexture';

/** The lock screen, on a plane laid over the phone's display (see ScreenSurface for the monitor's). */
export function PhoneSurface({ screen }: { screen: ScreenRect }) {
  const texture = usePhoneLockTexture(screen);
  const { position, quaternion } = useMemo(() => surfacePlacement(screen), [screen]);

  return (
    <mesh position={position} quaternion={quaternion} renderOrder={1}>
      <planeGeometry args={[screen.width - SCREEN.inset * 2, screen.height - SCREEN.inset * 2]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  );
}
