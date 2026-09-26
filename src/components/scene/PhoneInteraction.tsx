import { useMemo, useState } from 'react';
import { useCursor } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Vector3 } from 'three';
import { SCREEN } from '../../config/scene';
import { useEntryDevice } from '../../hooks/useEntryDevice';
import { isTap } from '../../lib/touchLook';
import { useExperience } from '../../store/experience';
import { monitorLabelElement } from '../../store/monitorHover';
import { useSceneLayout } from '../../store/sceneLayout';
import { PhoneSurface } from './PhoneSurface';

const projected = new Vector3();
/** The phone is small; its tap target is at least this big (m) so a fingertip can find it. */
const MIN_HIT_SIZE = 0.12;

/**
 * The phone on the desk: its live lock screen, and the tap that flies the
 * camera down onto it. On phones that's the way in, with a "tap the phone"
 * cue; on other screens tapping it first asks (ui/DevicePrompt.tsx).
 */
export function PhoneInteraction() {
  const screen = useSceneLayout((s) => s.phoneScreen);
  const bounds = useSceneLayout((s) => s.phoneBounds);
  const phase = useExperience((s) => s.phase);
  const enterMonitor = useExperience((s) => s.enterMonitor);
  const askToEnter = useExperience((s) => s.askToEnter);
  const entersHere = useEntryDevice() === 'phone';
  const [hovered, setHovered] = useState(false);
  useCursor(hovered && phase === 'exploring');

  const hitArea = useMemo(() => {
    if (!bounds) return null;
    const size = bounds.max.map((max, i) => Math.max(max - (bounds.min[i] ?? 0), MIN_HIT_SIZE)) as [number, number, number];
    const center = bounds.max.map((max, i) => (max + (bounds.min[i] ?? 0)) / 2) as [number, number, number];
    return { size, center, labelAt: [center[0], bounds.max[1] + SCREEN.labelLift * 4, bounds.min[2]] as [number, number, number] };
  }, [bounds]);

  // Pin the DOM cue just above the phone's top edge.
  useFrame(({ camera, size }) => {
    const label = monitorLabelElement.current;
    if (!label || !hitArea || !entersHere) return;
    projected.set(...hitArea.labelAt).project(camera);
    const x = (projected.x * 0.5 + 0.5) * size.width;
    const y = (-projected.y * 0.5 + 0.5) * size.height;
    label.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
  });

  if (!screen || !hitArea) return null;

  const onClick = (event: ThreeEvent<MouseEvent>): void => {
    event.stopPropagation();
    if (phase !== 'exploring' || !isTap(event.delta)) return;
    if (entersHere) enterMonitor();
    else askToEnter('phone');
  };

  return (
    <group>
      {/* Always the live lock screen, so the phone never shows a frozen time. */}
      <PhoneSurface screen={screen} />
      <mesh
        position={hitArea.center}
        visible={false}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={hitArea.size} />
      </mesh>
    </group>
  );
}
