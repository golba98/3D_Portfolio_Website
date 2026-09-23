import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import { Matrix4, Quaternion, Vector3, type MeshBasicMaterial } from 'three';
import { SCREEN } from '../../config/scene';
import type { ScreenRect } from '../../types/scene';
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
  const texture = useDesktopPreviewTexture();
  const material = useRef<MeshBasicMaterial>(null);
  const level = useRef({ value: brightness });

  const { position, quaternion } = useMemo(() => {
    const normal = new Vector3(...screen.normal);
    const up = new Vector3(...screen.up);
    const right = new Vector3().crossVectors(up, normal).normalize();
    return {
      position: new Vector3(...screen.center).addScaledVector(normal, SCREEN.surfaceOffset),
      quaternion: new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(right, up, normal)),
    };
  }, [screen]);

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
