import { useEffect, useMemo, useRef, useState } from 'react';
import { useCursor } from '@react-three/drei';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { DoubleSide, Euler, Group, PerspectiveCamera, PlaneGeometry, Quaternion, Vector3 } from 'three';
import { POEM_PAPER } from '../../config/scene';
import { TIMINGS } from '../../config/timings';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { clamp, easeInOutCubic, lerp } from '../../lib/math';
import { paperPosition, paperWorldSize } from '../../lib/poemPaper';
import { isTap } from '../../lib/touchLook';
import { useExperience } from '../../store/experience';
import { useSceneLayout } from '../../store/sceneLayout';
import { usePoemTextures } from './usePoemTextures';

const FLAT_ROTATION = new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, -0.025));
const UNIT_SCALE = new Vector3(1, 1, 1);

/** Only the lower slab reveals the note; the note needs a second, separate click. */
export function ShelfInteraction() {
  const canvas = useThree((s) => s.gl.domElement);
  const shelf = useSceneLayout((s) => s.bottomShelf);
  const phase = useExperience((s) => s.phase);
  const discovered = useExperience((s) => s.poemDiscovered);
  const shelfReady = useExperience((s) => s.shelfReady);
  const poemReady = useExperience((s) => s.poemReady);
  const prompt = useExperience((s) => s.devicePrompt);
  const [hovered, setHovered] = useState(false);
  const canInspect = phase === 'exploring' && !prompt;
  const canRead = phase === 'viewing-shelf' && shelfReady;
  useCursor(hovered && (canInspect || canRead));
  const paper = useRef<Group>(null);
  const progress = useRef(0);
  const tween = useRef({ from: 0, to: 0, elapsed: 0 });
  const reducedMotion = useReducedMotion();
  const textures = usePoemTextures();
  const gestureBlocked = useRef(false);

  // Room navigation is paused in the shelf view. Still distinguish a tap
  // from a drag or pinch, including when one of the two fingers stays still.
  useEffect(() => {
    if (phase !== 'viewing-shelf') return;
    const pointers = new Map<number, { x: number; y: number }>();
    gestureBlocked.current = false;
    const down = (event: PointerEvent) => {
      if (pointers.size === 0) gestureBlocked.current = false;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size > 1) gestureBlocked.current = true;
    };
    const move = (event: PointerEvent) => {
      const start = pointers.get(event.pointerId);
      if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) gestureBlocked.current = true;
    };
    const up = (event: PointerEvent) => { pointers.delete(event.pointerId); };
    const cancel = (event: PointerEvent) => { gestureBlocked.current = true; up(event); };
    canvas.addEventListener('pointerdown', down, true);
    window.addEventListener('pointermove', move, true);
    window.addEventListener('pointerup', up, true);
    window.addEventListener('pointercancel', cancel, true);
    return () => {
      canvas.removeEventListener('pointerdown', down, true);
      window.removeEventListener('pointermove', move, true);
      window.removeEventListener('pointerup', up, true);
      window.removeEventListener('pointercancel', cancel, true);
    };
  }, [canvas, phase]);

  const geometry = useMemo(() => {
    const geometry = new PlaneGeometry(POEM_PAPER.width, POEM_PAPER.height, 24, 32);
    const positions = geometry.getAttribute('position');
    for (let i = 0; i < positions.count; i++) {
      const x = Math.abs(positions.getX(i)) / (POEM_PAPER.width / 2);
      const y = Math.abs(positions.getY(i)) / (POEM_PAPER.height / 2);
      // Flat writing area with softly lifted corners and a fine curled edge.
      const edge = Math.max(0, (x - 0.82) / 0.18);
      positions.setZ(i, edge * edge * 0.002 + Math.pow(x * y, 8) * 0.003);
    }
    geometry.computeVertexNormals();
    return geometry;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => {
    tween.current = { from: progress.current, to: phase === 'viewing-poem' ? 1 : 0, elapsed: 0 };
  }, [phase]);

  const placement = useMemo(() => {
    if (!shelf) return null;
    return {
      position: new Vector3(...paperPosition(shelf)),
      center: shelf.min.map((min, i) => (min + shelf.max[i]!) / 2) as [number, number, number],
      size: shelf.min.map((min, i) => shelf.max[i]! - min + (i === 1 ? 0.025 : 0)) as [number, number, number],
      readPosition: new Vector3(),
    };
  }, [shelf]);

  useFrame(({ camera, size }, delta) => {
    if (!paper.current || !placement) return;
    const active = tween.current;
    active.elapsed += delta;
    const t = reducedMotion ? 1 : clamp(active.elapsed / TIMINGS.poemMove, 0, 1);
    progress.current = lerp(active.from, active.to, easeInOutCubic(t));
    const p = progress.current;
    placement.readPosition.set(0, 0, -POEM_PAPER.readDistance).applyQuaternion(camera.quaternion).add(camera.position);
    paper.current.position.lerpVectors(placement.position, placement.readPosition, p);
    paper.current.quaternion.slerpQuaternions(FLAT_ROTATION, camera.quaternion, p);
    const scale = paperWorldSize(size.width, size.height, camera instanceof PerspectiveCamera ? camera.fov : 40);
    paper.current.scale.lerpVectors(UNIT_SCALE, scale, p);
    if (t === 1 && active.to === 1 && !useExperience.getState().poemReady) {
      useExperience.getState().poemArrived();
    }
  });

  if (!placement) return null;

  const onShelfClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (!canInspect || !isTap(event.delta)) return;
    setHovered(false);
    useExperience.getState().inspectShelf();
  };
  const onPageClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (!isTap(event.delta) || (phase === 'viewing-shelf' && gestureBlocked.current)) return;
    setHovered(false);
    if (canRead) useExperience.getState().openPoem();
    else if (canInspect) useExperience.getState().inspectShelf();
  };

  return (
    <>
      {canInspect && (
        <mesh position={placement.center} visible={false} onClick={onShelfClick}
          onPointerOver={(event) => { event.stopPropagation(); setHovered(true); }} onPointerOut={() => setHovered(false)}>
          <boxGeometry args={placement.size} />
        </mesh>
      )}
      <group ref={paper} visible={discovered}>
        <mesh geometry={geometry} onClick={onPageClick}
          onPointerOver={(event) => { event.stopPropagation(); setHovered(true); }} onPointerOut={() => setHovered(false)}>
          <meshBasicMaterial map={poemReady && phase === 'viewing-poem' ? textures.blank : textures.written}
            side={DoubleSide} toneMapped={false} />
        </mesh>
        {/* A second layer gives the lifted sheet a visible, fine paper edge. */}
        <mesh geometry={geometry} position-z={-0.0004}>
          <meshBasicMaterial map={textures.blank} side={DoubleSide} toneMapped={false} />
        </mesh>
      </group>
    </>
  );
}
