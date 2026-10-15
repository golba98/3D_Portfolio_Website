import { useEffect, useMemo, useRef } from 'react';
import { useCursor } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { CanvasTexture, DoubleSide, Matrix4, Quaternion, SRGBColorSpace, Vector3 } from 'three';
import { SCREEN } from '../../config/scene';
import { clamp } from '../../lib/math';
import { isTap } from '../../lib/touchLook';
import { BOARD_COLORS, useBoardDrawing, type BoardPoint, type BoardStroke } from '../../store/boardDrawing';
import { useExperience } from '../../store/experience';
import { pinLabel, useSceneHover } from '../../store/sceneHover';
import { useSceneLayout } from '../../store/sceneLayout';

const WIDTH = 1024;
const HEIGHT = 760;
type CaptureTarget = Pick<Element, 'setPointerCapture' | 'hasPointerCapture' | 'releasePointerCapture'>;

function paint(ctx: CanvasRenderingContext2D, stroke: BoardStroke): void {
  if (!stroke.points.length) return;
  ctx.save();
  ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
  ctx.strokeStyle = stroke.tool === 'eraser' ? '#000' : BOARD_COLORS[stroke.tool];
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = stroke.tool === 'eraser' ? 25 : 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  stroke.points.forEach(([u, v], i) => {
    const x = u * WIDTH;
    const y = v * HEIGHT;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  if (stroke.points.length === 1) {
    const [u, v] = stroke.points[0] ?? [0, 0];
    ctx.arc(u * WIDTH, v * HEIGHT, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
  } else ctx.stroke();
  ctx.restore();
}

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
  const pointer = useRef<number | null>(null);
  useCursor(hovered && phase === 'exploring');

  const drawing = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return { canvas, texture };
  }, []);

  useEffect(() => {
    const redraw = (): void => {
      const ctx = drawing.canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      const { strokes, current } = useBoardDrawing.getState();
      strokes.forEach((stroke) => paint(ctx, stroke));
      if (current) paint(ctx, current);
      drawing.texture.needsUpdate = true;
    };
    redraw();
    const unsubscribe = useBoardDrawing.subscribe(redraw);
    return () => {
      unsubscribe();
      drawing.texture.dispose();
    };
  }, [drawing]);

  useEffect(() => {
    if (phase !== 'viewing-board') {
      pointer.current = null;
      useBoardDrawing.getState().end();
    }
  }, [phase]);

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

  const point = (event: ThreeEvent<PointerEvent>): BoardPoint | null =>
    event.uv ? [clamp(event.uv.x, 0, 1), clamp(1 - event.uv.y, 0, 1)] : null;

  // Exploring, a tap opens the board; on click, so a drag across it slides the view instead.
  const onClick = (event: ThreeEvent<MouseEvent>): void => {
    event.stopPropagation();
    if (phase !== 'exploring' || !isTap(event.delta)) return;
    setHovered('board', false);
    openBoard();
  };

  const onDown = (event: ThreeEvent<PointerEvent>): void => {
    event.stopPropagation();
    if (phase !== 'viewing-board' || !boardReady || pointer.current !== null) return;
    const p = point(event);
    if (!p) return;
    pointer.current = event.pointerId;
    // R3F replaces the DOM target with its own capture proxy at runtime.
    (event.target as unknown as CaptureTarget).setPointerCapture(event.pointerId);
    useBoardDrawing.getState().begin(p);
  };
  const onMove = (event: ThreeEvent<PointerEvent>): void => {
    if (event.pointerId !== pointer.current) return;
    event.stopPropagation();
    const p = point(event);
    if (p) useBoardDrawing.getState().extend(p);
  };
  const onEnd = (event: ThreeEvent<PointerEvent>): void => {
    if (event.pointerId !== pointer.current) return;
    event.stopPropagation();
    pointer.current = null;
    useBoardDrawing.getState().end();
    const target = event.target as unknown as CaptureTarget;
    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <group position={placement.center} quaternion={placement.quaternion}>
      <mesh onPointerOver={() => setHovered('board', true)} onPointerOut={() => setHovered('board', false)}
        onClick={onClick} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onEnd} onPointerCancel={onEnd}>
        <planeGeometry args={[board.width * 0.997, board.height * 0.997]} />
        <meshBasicMaterial map={drawing.texture} transparent depthWrite={false} side={DoubleSide} toneMapped={false} />
      </mesh>
      {phase === 'viewing-board' && boardReady && keyboardFocused && (
        <mesh position={[(keyboardCursor[0] - 0.5) * board.width, (0.5 - keyboardCursor[1]) * board.height, 0.004]}>
          <ringGeometry args={[0.005, 0.008, 20]} />
          <meshBasicMaterial color="#ff851b" side={DoubleSide} depthTest={false} />
        </mesh>
      )}
    </group>
  );
}
