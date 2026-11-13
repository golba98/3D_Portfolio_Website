import { useEffect, useMemo, useRef } from 'react';
import { useCursor } from '@react-three/drei';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { CanvasTexture, DoubleSide, Matrix4, Quaternion, SRGBColorSpace, Vector3, type Mesh } from 'three';
import { SCREEN } from '../../config/scene';
import { boardPointAt } from '../../lib/boardPointer';
import { isTap } from '../../lib/touchLook';
import { BOARD_COLORS, useBoardDrawing, type BoardStroke } from '../../store/boardDrawing';
import { useExperience } from '../../store/experience';
import { pinLabel, useSceneHover } from '../../store/sceneHover';
import { useSceneLayout } from '../../store/sceneLayout';

const WIDTH = 1024;
const HEIGHT = 760;

function paint(ctx: CanvasRenderingContext2D, stroke: BoardStroke): void {
  ctx.save();
  ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
  ctx.strokeStyle = stroke.tool === 'eraser' ? '#000' : BOARD_COLORS[stroke.tool];
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = stroke.tool === 'eraser' ? 25 : 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const points of stroke.segments) {
    if (!points.length) continue;
    ctx.beginPath();
    points.forEach(([u, v], i) => {
      const x = u * WIDTH;
      const y = v * HEIGHT;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    if (points.length === 1) {
      const [u, v] = points[0] ?? [0, 0];
      ctx.arc(u * WIDTH, v * HEIGHT, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
    } else ctx.stroke();
  }
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
  const mesh = useRef<Mesh>(null);
  const { camera, gl } = useThree();
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
    const canvas = gl.domElement;
    const finish = (): void => {
      const id = pointer.current;
      pointer.current = null;
      useBoardDrawing.getState().end();
      if (id !== null && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    };
    if (phase !== 'viewing-board' || !boardReady) { finish(); return; }
    const move = (event: PointerEvent): void => {
      if (event.pointerId !== pointer.current) return;
      if (!(event.buttons & 1)) { finish(); return; }
      const coalesced = event.getCoalescedEvents?.() ?? [];
      for (const sample of coalesced.length ? coalesced : [event]) {
        // Native capture retargets events; hit testing excludes toolbar overlays.
        const at = document.elementFromPoint(sample.clientX, sample.clientY);
        const p = mesh.current && at === canvas
          ? boardPointAt(sample.clientX, sample.clientY, canvas.getBoundingClientRect(), camera, mesh.current)
          : null;
        useBoardDrawing.getState().extend(p);
      }
    };
    const end = (event: PointerEvent): void => {
      if (event.pointerId === pointer.current) finish();
    };
    const resize = (): void => { if (pointer.current !== null) useBoardDrawing.getState().extend(null); };
    const hidden = (): void => { if (document.hidden) finish(); };
    // Native listeners also receive release/cancel when there is no R3F intersection.
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    canvas.addEventListener('lostpointercapture', end);
    window.addEventListener('blur', finish);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', hidden);
    const unsubscribe = useBoardDrawing.subscribe((state, previous) => {
      if (pointer.current !== null && (!state.current || state.keyboardDrawing || state.tool !== previous.tool)) finish();
    });
    return () => {
      unsubscribe();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      canvas.removeEventListener('lostpointercapture', end);
      window.removeEventListener('blur', finish);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', hidden);
      finish();
    };
  }, [phase, boardReady, camera, gl]);

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

  const onDown = (event: ThreeEvent<PointerEvent>): void => {
    event.stopPropagation();
    if (phase !== 'viewing-board' || !boardReady || pointer.current !== null || event.button !== 0 || !event.isPrimary || !mesh.current) return;
    const canvas = gl.domElement;
    const p = boardPointAt(event.clientX, event.clientY, canvas.getBoundingClientRect(), camera, mesh.current);
    if (!p) return;
    useBoardDrawing.getState().begin(p);
    pointer.current = event.pointerId;
    canvas.setPointerCapture(event.pointerId);
  };

  return (
    <group position={placement.center} quaternion={placement.quaternion}>
      <mesh ref={mesh} onPointerOver={() => setHovered('board', true)} onPointerOut={() => setHovered('board', false)}
        onClick={onClick} onPointerDown={onDown}>
        <planeGeometry args={[board.width * 0.997, board.height * 0.997]} />
        <meshBasicMaterial map={drawing.texture} transparent depthWrite={false} side={DoubleSide} toneMapped={false} />
      </mesh>
      {phase === 'viewing-board' && boardReady && keyboardFocused && (
        <mesh position={[(keyboardCursor[0] - 0.5) * board.width * 0.997, (0.5 - keyboardCursor[1]) * board.height * 0.997, 0.004]}>
          <ringGeometry args={[0.005, 0.008, 20]} />
          <meshBasicMaterial color="#ff851b" side={DoubleSide} depthTest={false} />
        </mesh>
      )}
    </group>
  );
}
