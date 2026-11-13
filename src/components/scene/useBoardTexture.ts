import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { BOARD_COLORS, useBoardDrawing, type BoardStroke } from '../../store/boardDrawing';

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

/** Owns the scratchpad texture, redraw subscription and disposal. */
export function useBoardTexture() {
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

  return drawing.texture;
}
