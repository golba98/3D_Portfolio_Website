import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import { LIGHTING } from '../../config/scene';
import { useSceneLayout } from '../../store/sceneLayout';
import type { DeviceTier } from '../../types/scene';

interface SceneLightingProps {
  tier: DeviceTier;
}

/**
 * Restrained studio lighting. Reflections come from a baked, local
 * Lightformer environment (no HDR download); shadows are baked once.
 */
export function SceneLighting({ tier }: SceneLightingProps) {
  const pcCase = useSceneLayout((s) => s.pcCaseCenter);
  const screen = useSceneLayout((s) => s.screen);
  const { hemisphere, key, rim, pcGlow, screenGlow, contactShadows } = LIGHTING;

  return (
    <>
      <hemisphereLight args={[hemisphere.sky, hemisphere.ground, hemisphere.intensity]} />
      <directionalLight position={key.position} intensity={key.intensity} color={key.color} />
      <directionalLight position={rim.position} intensity={rim.intensity} color={rim.color} />

      {pcCase && (
        <pointLight
          position={[pcCase[0] + pcGlow.offset[0], pcCase[1] + pcGlow.offset[1], pcCase[2] + pcGlow.offset[2]]}
          color={pcGlow.color}
          intensity={pcGlow.intensity}
          distance={pcGlow.distance}
          decay={2}
        />
      )}
      {screen && (
        <pointLight
          position={[
            screen.center[0] + screen.normal[0] * 0.3,
            screen.center[1] + screen.normal[1] * 0.3 - 0.12,
            screen.center[2] + screen.normal[2] * 0.3,
          ]}
          color={screenGlow.color}
          intensity={screenGlow.intensity}
          distance={screenGlow.distance}
          decay={2}
        />
      )}

      <Environment resolution={tier === 'high' ? 256 : 64} frames={1} environmentIntensity={LIGHTING.environmentIntensity}>
        <Lightformer form="rect" intensity={2.2} position={[0, 4, 1.5]} rotation-x={Math.PI / 2} scale={[7, 2.5, 1]} />
        <Lightformer form="rect" intensity={0.9} color="#9fb4ff" position={[-4.5, 1.4, 0]} rotation-y={Math.PI / 2} scale={[4, 1.2, 1]} />
        <Lightformer form="rect" intensity={1.3} position={[3.5, 1.2, 3.5]} rotation-y={-Math.PI / 4} scale={[3, 1.6, 1]} />
        <Lightformer form="ring" color="#ff3b3b" intensity={1.2} position={[-2, 0.6, 2]} scale={0.8} />
      </Environment>

      <ContactShadows
        position={[0, 0.0006, -0.3]}
        width={2.5}
        height={0.9}
        opacity={contactShadows.opacity}
        blur={contactShadows.blur}
        far={contactShadows.far}
        resolution={tier === 'high' ? contactShadows.resolution : 256}
        frames={1}
      />
    </>
  );
}
