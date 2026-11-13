import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry } from 'three';
import { boardPointAt } from '../../src/lib/boardPointer';
import { parseBoardStrokes, useBoardDrawing as board } from '../../src/store/boardDrawing';

beforeEach(() => {
  vi.stubGlobal('localStorage', { setItem: vi.fn() });
  board.setState({ strokes: [], current: null, tool: 'black', keyboardDrawing: false, segmentBroken: false });
});

describe('fresh board raycasting', () => {
  const camera = new PerspectiveCamera(90, 1, 0.1, 10);
  camera.position.z = 2;
  const mesh = new Mesh(new PlaneGeometry(2, 2), new MeshBasicMaterial());
  const rect = { left: 100, top: 50, width: 800, height: 800 };
  it('maps CSS pixels correctly, including all four near-edges', () => {
    for (const [x, y, u, v] of [[500,450,.5,.5],[301,450,.0025,.5],[699,450,.9975,.5],[500,251,.5,.0025],[500,649,.5,.9975]]) {
      const point = boardPointAt(x!, y!, rect, camera, mesh)!;
      expect(point[0]).toBeCloseTo(u!); expect(point[1]).toBeCloseTo(v!);
    }
  });
  it('rejects outside rays rather than reusing capture UV or clamping', () => {
    for (const [x,y] of [[299,450],[701,450],[500,249],[500,651],[NaN,450]])
      expect(boardPointAt(x!, y!, rect, camera, mesh)).toBeNull();
  });
  it('uses updated bounds after resizing, independent of backing DPR', () => {
    expect(boardPointAt(300,250,{...rect,width:400,height:400},camera,mesh)).toEqual([.5,.5]);
  });
});

it('breaks exit/re-entry without a bridge and undoes the complete gesture', () => {
  const s = board.getState();
  s.begin([.5,.4]); s.extend([.95,.8]); s.extend(null); s.extend([.2,.2]); s.extend([.3,.3]); s.end();
  expect(board.getState().strokes[0]?.segments).toEqual([[[.5,.4],[.95,.8]],[[.2,.2],[.3,.3]]]);
  s.undo(); expect(board.getState().strokes).toEqual([]);
});
it('keeps rapid presses, tools and keyboard gestures separate', () => {
  const s=board.getState(); s.begin([.1,.1]); s.begin([.8,.8]); s.setTool('red'); s.extend([.9,.9]);
  expect(board.getState().strokes).toHaveLength(2);
  expect(board.getState().current).toBeNull();
  s.toggleKeyboardDrawing(); s.moveKeyboard(.1,0); s.setKeyboardFocused(false);
  expect(board.getState().strokes[2]?.tool).toBe('red');
  expect(board.getState().keyboardDrawing).toBe(false);
  s.clear(); expect(board.getState().strokes).toEqual([]);
});
it('migrates old drawings and splits malformed gaps rather than bridging them', () => {
  expect(parseBoardStrokes([{tool:'blue',points:[[.1,.2],[-1,.5],[.8,.9]]}])).toEqual([{tool:'blue',segments:[[[.1,.2]],[[.8,.9]]]}]);
  expect(parseBoardStrokes([{tool:'invalid',points:[[0,0]]}])).toEqual([]);
});
it('ignores late movement after release and persists segmented data', () => {
  const s=board.getState(); s.begin([.2,.2]); s.end(); s.extend([1,1]);
  expect(board.getState().strokes[0]?.segments).toEqual([[[.2,.2]]]);
  expect(localStorage.setItem).toHaveBeenCalledWith('jordan-whiteboard-v2', expect.any(String));
});

it('preserves every sampled corner in long paths instead of repeatedly decimating them', () => {
  const s=board.getState();
  const points=Array.from({length:1200},(_,i)=>[i/1200, i%2 ? .8 : .2] as const);
  s.begin(points[0]!); points.slice(1).forEach(s.extend); s.end();
  const segments=board.getState().strokes[0]!.segments;
  expect(segments).toHaveLength(3);
  const restored=segments.flatMap((segment,i)=>i ? segment.slice(1) : segment);
  expect(restored).toEqual(points);
});
