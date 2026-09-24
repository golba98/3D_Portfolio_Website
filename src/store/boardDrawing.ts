import { create } from 'zustand';
import { clamp } from '../lib/math';

export type BoardTool = 'black' | 'red' | 'blue' | 'green' | 'eraser';
export type BoardPoint = readonly [number, number];
export interface BoardStroke {
  tool: BoardTool;
  points: BoardPoint[];
}

export const BOARD_COLORS: Record<Exclude<BoardTool, 'eraser'>, string> = {
  black: '#202026',
  red: '#c33745',
  blue: '#2e51b8',
  green: '#198655',
};

const KEY = 'jordan-whiteboard-v1';
const TOOLS: BoardTool[] = ['black', 'red', 'blue', 'green', 'eraser'];

function readSaved(): BoardStroke[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (!Array.isArray(value)) return [];
    return value.slice(-200).flatMap((entry: unknown) => {
      if (!entry || typeof entry !== 'object') return [];
      const stroke = entry as { tool?: unknown; points?: unknown };
      if (!TOOLS.includes(stroke.tool as BoardTool) || !Array.isArray(stroke.points)) return [];
      const points = stroke.points.slice(0, 500).filter((point: unknown): point is BoardPoint =>
        Array.isArray(point) && point.length === 2 && point.every((v) =>
          typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1));
      return points.length ? [{ tool: stroke.tool as BoardTool, points }] : [];
    });
  } catch {
    return [];
  }
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
  extend: (point: BoardPoint) => void;
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
  begin: (point) => set({ current: { tool: get().tool, points: [point] } }),
  extend: (point) => {
    const current = get().current;
    if (!current) return;
    const last = current.points.at(-1);
    if (last && Math.hypot(point[0] - last[0], point[1] - last[1]) < 0.001) return;
    let points = [...current.points, point];
    if (points.length > 500) points = points.filter((_, i) => i % 2 === 0 || i === points.length - 1);
    set({ current: { ...current, points } });
  },
  end: () => {
    const { current, strokes } = get();
    if (!current) return;
    const next = [...strokes, current].slice(-200);
    set({ current: null, strokes: next, keyboardDrawing: false });
    save(next);
  },
  undo: () => {
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
  setKeyboardFocused: (keyboardFocused) => set({ keyboardFocused }),
}));
