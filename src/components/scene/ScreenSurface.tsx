import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import type { MeshBasicMaterial } from 'three';
import { SCREEN } from '../../config/scene';
import type { ScreenRect } from '../../types/scene';
import { surfacePlacement } from './surfacePlacement';
import { useDesktopPreviewTexture } from './useDesktopPreviewTexture';

interface ScreenSurfaceProps {
  screen: ScreenRect;
  /** 0…1 target brightness; damped so hover feels soft. */
  brightness: number;
}

/**
 * The desktop preview, on a plane fitted over the physical panel. (The
 * exported screen mesh has no UVs, so it can't carry a texture itself.)
 */
export function ScreenSurface({ screen, brightness }: ScreenSurfaceProps) {
  const texture = useDesktopPreviewTexture(screen);
  const material = useRef<MeshBasicMaterial>(null);
  const level = useRef({ value: brightness });

  const { position, quaternion } = useMemo(() => surfacePlacement(screen), [screen]);

  useFrame((_, delta) => {
    easing.damp(level.current, 'value', brightness, 0.18, delta);
    material.current?.color.setScalar(level.current.value);
  });

  return (
    <mesh position={position} quaternion={quaternion} renderOrder={1}>
      <planeGeometry args={[screen.width - SCREEN.inset * 2, screen.height - SCREEN.inset * 2]} />
      <meshBasicMaterial ref={material} map={texture} toneMapped={false} />
    </mesh>
  );
}
