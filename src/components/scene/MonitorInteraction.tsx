import { useMemo } from 'react';
import { useCursor } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Vector3 } from 'three';
import { SCREEN } from '../../config/scene';
import { useExperience } from '../../store/experience';
import { monitorLabelElement, useMonitorHover } from '../../store/monitorHover';
import { useSceneLayout } from '../../store/sceneLayout';
import { ScreenSurface } from './ScreenSurface';

const projected = new Vector3();

/** The centre monitor: preview surface, hover feedback, and the click that enters the desktop. */
export function MonitorInteraction() {
  const screen = useSceneLayout((s) => s.screen);
  const bounds = useSceneLayout((s) => s.monitorBounds);
  const phase = useExperience((s) => s.phase);
  const enterMonitor = useExperience((s) => s.enterMonitor);
  const hovered = useMonitorHover((s) => s.hovered);
  const setHovered = useMonitorHover((s) => s.setHovered);

  const interactive = phase === 'exploring';
  const highlighted = interactive && hovered;
  useCursor(highlighted);

  const hitArea = useMemo(() => {
    if (!bounds) return null;
    const size = bounds.max.map((max, i) => max - (bounds.min[i] ?? 0)) as [number, number, number];
    const center = bounds.max.map((max, i) => (max + (bounds.min[i] ?? 0)) / 2) as [number, number, number];
    return { size, center, labelAt: [center[0], bounds.max[1] + SCREEN.labelLift, center[2]] as [number, number, number] };
  }, [bounds]);

  // Pin the DOM label above the monitor.
  useFrame(({ camera, size }) => {
    const label = monitorLabelElement.current;
    if (!label || !hitArea) return;
    projected.set(...hitArea.labelAt).project(camera);
    const x = (projected.x * 0.5 + 0.5) * size.width;
    const y = (-projected.y * 0.5 + 0.5) * size.height;
    label.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
  });

  if (!screen || !hitArea) return null;

  const onOver = (event: ThreeEvent<PointerEvent>): void => {
    event.stopPropagation();
    setHovered(true);
  };
  const onOut = (): void => setHovered(false);
  const onClick = (event: ThreeEvent<MouseEvent>): void => {
    event.stopPropagation();
    if (!interactive) return;
    setHovered(false);
    enterMonitor();
  };

  const brightness =
    phase === 'entering-monitor' || phase === 'desktop'
      ? SCREEN.brightness.hover
      : highlighted
        ? SCREEN.brightness.hover
        : SCREEN.brightness.idle;

  return (
    <group>
      <ScreenSurface screen={screen} brightness={brightness} />
      <mesh position={hitArea.center} visible={false} onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
        <boxGeometry args={hitArea.size} />
      </mesh>
    </group>
  );
}
