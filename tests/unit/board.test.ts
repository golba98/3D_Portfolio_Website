import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry } from 'three';
import { boardPointAt } from '../../src/lib/boardPointer';
import { parseBoardStrokes, useBoardDrawing as board } from '../../src/store/boardDrawing';

beforeEach(() => {
  vi.stubGlobal('localStorage', { setItem: vi.fn() });
  board.setState({
    strokes: [],
    current: null,
    tool: 'black',
    keyboardCursor: [0.5, 0.5],
    keyboardDrawing: false,
    keyboardFocused: false,
    segmentBroken: false,
  });
});

describe('fresh board raycasting', () => {
  const camera = new PerspectiveCamera(90, 1, 0.1, 10);
  camera.position.z = 2;
  const mesh = new Mesh(new PlaneGeometry(2, 2), new MeshBasicMaterial());
  const rect = { left: 100, top: 50, width: 800, height: 800 };
  it('maps CSS pixels correctly, including all four near-edges', () => {
    const samples = [
      [500, 450, 0.5, 0.5],
      [301, 450, 0.0025, 0.5],
      [699, 450, 0.9975, 0.5],
      [500, 251, 0.5, 0.0025],
      [500, 649, 0.5, 0.9975],
    ] as const;
    for (const [x, y, u, v] of samples) {
      const point = boardPointAt(x, y, rect, camera, mesh)!;
      expect(point[0]).toBeCloseTo(u);
      expect(point[1]).toBeCloseTo(v);
    }
  });
  it('rejects outside rays rather than reusing capture UV or clamping', () => {
    const samples = [
      [299, 450],
      [701, 450],
      [500, 249],
      [500, 651],
      [NaN, 450],
    ] as const;
    for (const [x, y] of samples) {
      expect(boardPointAt(x, y, rect, camera, mesh)).toBeNull();
    }
  });
  it('uses updated bounds after resizing, independent of backing DPR', () => {
    expect(boardPointAt(300, 250, { ...rect, width: 400, height: 400 }, camera, mesh)).toEqual([0.5, 0.5]);
  });
});

it('breaks exit/re-entry without a bridge and undoes the complete gesture', () => {
  const drawing = board.getState();
  drawing.begin([0.5, 0.4]);
  drawing.extend([0.95, 0.8]);
  drawing.extend(null);
  drawing.extend([0.2, 0.2]);
  drawing.extend([0.3, 0.3]);
  drawing.end();
  expect(board.getState().strokes[0]?.segments).toEqual([
    [
      [0.5, 0.4],
      [0.95, 0.8],
    ],
    [
      [0.2, 0.2],
      [0.3, 0.3],
    ],
  ]);
  drawing.undo();
  expect(board.getState().strokes).toEqual([]);
});
it('keeps rapid presses, tools and keyboard gestures separate', () => {
  const drawing = board.getState();
  drawing.begin([0.1, 0.1]);
  drawing.begin([0.8, 0.8]);
  drawing.setTool('red');
  drawing.extend([0.9, 0.9]);
  expect(board.getState().strokes).toHaveLength(2);
  expect(board.getState().current).toBeNull();
  drawing.toggleKeyboardDrawing();
  drawing.moveKeyboard(0.1, 0);
  drawing.setKeyboardFocused(false);
  expect(board.getState().strokes[2]?.tool).toBe('red');
  expect(board.getState().keyboardDrawing).toBe(false);
  drawing.clear();
  expect(board.getState().strokes).toEqual([]);
});
it('migrates old drawings and splits malformed gaps rather than bridging them', () => {
  expect(
    parseBoardStrokes([
      {
        tool: 'blue',
        points: [
          [0.1, 0.2],
          [-1, 0.5],
          [0.8, 0.9],
        ],
      },
    ]),
  ).toEqual([{ tool: 'blue', segments: [[[0.1, 0.2]], [[0.8, 0.9]]] }]);
  expect(parseBoardStrokes([{ tool: 'invalid', points: [[0, 0]] }])).toEqual([]);
});
it('ignores late movement after release and persists segmented data', () => {
  const drawing = board.getState();
  drawing.begin([0.2, 0.2]);
  drawing.end();
  drawing.extend([1, 1]);
  expect(board.getState().strokes[0]?.segments).toEqual([[[0.2, 0.2]]]);
  expect(localStorage.setItem).toHaveBeenCalledWith('jordan-whiteboard-v2', expect.any(String));
});

it('preserves every sampled corner in long paths instead of repeatedly decimating them', () => {
  const drawing = board.getState();
  const points = Array.from({ length: 1200 }, (_, i) => [i / 1200, i % 2 ? 0.8 : 0.2] as const);
  drawing.begin(points[0]!);
  points.slice(1).forEach(drawing.extend);
  drawing.end();
  const segments = board.getState().strokes[0]!.segments;
  expect(segments).toHaveLength(3);
  const restored = segments.flatMap((segment, i) => (i ? segment.slice(1) : segment));
  expect(restored).toEqual(points);
});
