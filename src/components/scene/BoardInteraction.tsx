import { useMemo, useRef } from 'react';
import { useCursor } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { DoubleSide, Matrix4, Quaternion, Vector3, type Mesh } from 'three';
import { SCREEN } from '../../config/scene';
import { isTap } from '../../lib/touchLook';
import { useBoardDrawing } from '../../store/boardDrawing';
import { useExperience } from '../../store/experience';
import { pinLabel, useSceneHover } from '../../store/sceneHover';
import { useSceneLayout } from '../../store/sceneLayout';
import { useBoardPointer } from './useBoardPointer';
import { useBoardTexture } from './useBoardTexture';

/** A canvas texture projects visitors' strokes onto the measured board surface. */
export function BoardInteraction() {
  const board = useSceneLayout((s) => s.board);
  const phase = useExperience((s) => s.phase);
  const boardReady = useExperience((s) => s.boardReady);
  const openBoard = useExperience((s) => s.openBoard);
  const keyboardCursor = useBoardDrawing((s) => s.keyboardCursor);
  const keyboardFocused = useBoardDrawing((s) => s.keyboardFocused);
  const hovered = useSceneHover((s) => s.hovered === 'board');
  const setHovered = useSceneHover((s) => s.setHovered);
  const mesh = useRef<Mesh>(null);
  useCursor(hovered && phase === 'exploring');

  const texture = useBoardTexture();
  const onDown = useBoardPointer(mesh, phase, boardReady);

  const placement = useMemo(() => {
    if (!board) return null;
    const normal = new Vector3(...board.normal).normalize();
    const up = new Vector3(...board.up).normalize();
    const right = up.clone().cross(normal).normalize();
    const quaternion = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(right, up, normal));
    const center = new Vector3(...board.center).addScaledVector(normal, 0.004);
    // The "Want to draw?" label sits just above the board's top edge.
    const labelAt = new Vector3(...board.center).addScaledVector(up, board.height / 2 + SCREEN.labelLift);
    return { center, quaternion, labelAt: [labelAt.x, labelAt.y, labelAt.z] as const };
  }, [board]);

  useFrame(({ camera, size }) => {
    if (placement) pinLabel('board', [...placement.labelAt], camera, size);
  });

  if (!board || !placement) return null;

  // Exploring, a tap opens the board; on click, so a drag across it slides the view instead.
  const onClick = (event: ThreeEvent<MouseEvent>): void => {
    event.stopPropagation();
    if (phase !== 'exploring' || !isTap(event.delta)) return;
    setHovered('board', false);
    openBoard();
  };

  return (
    <group position={placement.center} quaternion={placement.quaternion}>
      <mesh
        ref={mesh}
        onPointerOver={() => setHovered('board', true)}
        onPointerOut={() => setHovered('board', false)}
        onClick={onClick}
        onPointerDown={onDown}
      >
        <planeGeometry args={[board.width * 0.997, board.height * 0.997]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} side={DoubleSide} toneMapped={false} />
      </mesh>
      {phase === 'viewing-board' && boardReady && keyboardFocused && (
        <mesh
          position={[
            (keyboardCursor[0] - 0.5) * board.width * 0.997,
            (0.5 - keyboardCursor[1]) * board.height * 0.997,
            0.004,
          ]}
        >
          <ringGeometry args={[0.005, 0.008, 20]} />
          <meshBasicMaterial color="#ff851b" side={DoubleSide} depthTest={false} />
        </mesh>
      )}
    </group>
  );
}
