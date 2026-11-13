import { create } from 'zustand';
import { clamp } from '../lib/math';

export type BoardTool = 'black' | 'red' | 'blue' | 'green' | 'eraser';
export type BoardPoint = readonly [number, number];
export interface BoardStroke {
  tool: BoardTool;
  segments: BoardPoint[][];
}

export const BOARD_COLORS: Record<Exclude<BoardTool, 'eraser'>, string> = {
  black: '#202026',
  red: '#c33745',
  blue: '#2e51b8',
  green: '#198655',
};

const KEY = 'jordan-whiteboard-v2';
const TOOLS: BoardTool[] = ['black', 'red', 'blue', 'green', 'eraser'];
export const validBoardPoint = (point: unknown): point is BoardPoint =>
  Array.isArray(point) && point.length === 2 && point.every(v =>
    typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1);

export function parseBoardStrokes(value: unknown): BoardStroke[] {
  if (!Array.isArray(value)) return [];
  return value.slice(-200).flatMap((entry: unknown) => {
    if (!entry || typeof entry !== 'object') return [];
    const stroke = entry as { tool?: unknown; points?: unknown; segments?: unknown };
    if (!TOOLS.includes(stroke.tool as BoardTool)) return [];
    const input = Array.isArray(stroke.segments) ? stroke.segments : [stroke.points];
    const segments: BoardPoint[][] = [];
    for (const candidate of input.slice(0, 500)) {
      if (!Array.isArray(candidate)) continue;
      let segment: BoardPoint[] = [];
      for (const point of candidate.slice(0, 500)) {
        if (validBoardPoint(point)) segment.push(point);
        else { if (segment.length) segments.push(segment); segment = []; }
      }
      if (segment.length) segments.push(segment);
    }
    return segments.length ? [{ tool: stroke.tool as BoardTool, segments }] : [];
  });
}

function readSaved(): BoardStroke[] {
  try {
    return parseBoardStrokes(JSON.parse(localStorage.getItem(KEY) ?? localStorage.getItem('jordan-whiteboard-v1') ?? '[]'));
  } catch { return []; }
}

function save(strokes: BoardStroke[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(strokes));
  } catch {
    // Storage may be blocked or full; the current drawing still works.
  }
}

interface BoardDrawingState {
  strokes: BoardStroke[];
  current: BoardStroke | null;
  tool: BoardTool;
  keyboardCursor: BoardPoint;
  keyboardDrawing: boolean;
  keyboardFocused: boolean;
  setTool: (tool: BoardTool) => void;
  begin: (point: BoardPoint) => void;
  extend: (point: BoardPoint | null) => void;
  segmentBroken: boolean;
  end: () => void;
  undo: () => void;
  clear: () => void;
  moveKeyboard: (x: number, y: number) => void;
  toggleKeyboardDrawing: () => void;
  setKeyboardFocused: (focused: boolean) => void;
}

export const useBoardDrawing = create<BoardDrawingState>()((set, get) => ({
  strokes: readSaved(),
  current: null,
  tool: 'black',
  keyboardCursor: [0.5, 0.5],
  keyboardDrawing: false,
  keyboardFocused: false,
  setTool: (tool) => {
    if (get().current) get().end();
    set({ tool, keyboardDrawing: false });
  },
  segmentBroken: false,
  begin: (point) => {
    if (!validBoardPoint(point)) return;
    get().end();
    set({ current: { tool: get().tool, segments: [[point]] }, segmentBroken: false, keyboardDrawing: false });
  },
  extend: (point) => {
    const { current, segmentBroken } = get();
    if (!current) return;
    if (!validBoardPoint(point)) { set({ segmentBroken: true }); return; }
    const segments = [...current.segments];
    if (segmentBroken) {
      if (segments.length >= 500) { get().end(); return; }
      segments.push([point]);
    } else {
      const points = [...(segments.at(-1) ?? [])];
      const last = points.at(-1);
      if (last && Math.hypot(point[0] - last[0], point[1] - last[1]) < 0.001) return;
      if (points.length >= 500 && last) {
        // Chunk long paths without repeatedly decimating old curves into diagonals.
        if (segments.length >= 500) { get().end(); return; }
        segments.push([last, point]);
      } else {
        points.push(point);
        segments[segments.length - 1] = points;
      }
    }
    set({ current: { ...current, segments }, segmentBroken: false });
  },
  end: () => {
    const { current, strokes } = get();
    if (!current) return;
    const next = [...strokes, current].slice(-200);
    set({ current: null, strokes: next, keyboardDrawing: false });
    save(next);
  },
  undo: () => {
    get().end();
    const next = get().strokes.slice(0, -1);
    set({ current: null, strokes: next, keyboardDrawing: false });
    save(next);
  },
  clear: () => {
    set({ current: null, strokes: [], keyboardDrawing: false });
    save([]);
  },
  moveKeyboard: (x, y) => {
    const [cx, cy] = get().keyboardCursor;
    const point: BoardPoint = [clamp(cx + x, 0, 1), clamp(cy + y, 0, 1)];
    set({ keyboardCursor: point });
    if (get().keyboardDrawing) get().extend(point);
  },
  toggleKeyboardDrawing: () => {
    if (get().keyboardDrawing) {
      get().end();
      set({ keyboardDrawing: false });
    } else {
      get().begin(get().keyboardCursor);
      set({ keyboardDrawing: true });
    }
  },
  setKeyboardFocused: (keyboardFocused) => {
    if (!keyboardFocused && get().keyboardDrawing) get().end();
    set({ keyboardFocused });
  },
}));
