import { useEffect, useRef, type RefObject } from 'react';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import type { Mesh } from 'three';
import type { ExperiencePhase } from '../../types/experience';
import { boardPointAt } from '../../lib/boardPointer';
import { useBoardDrawing } from '../../store/boardDrawing';

/** Tracks one captured pointer and separates gaps from drawable samples. */
export function useBoardPointer(mesh: RefObject<Mesh | null>, phase: ExperiencePhase, boardReady: boolean) {
  const pointer = useRef<number | null>(null);
  const { camera, gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    const finish = (): void => {
      const id = pointer.current;
      pointer.current = null;
      useBoardDrawing.getState().end();
      if (id !== null && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    };
    if (phase !== 'viewing-board' || !boardReady) {
      finish();
      return;
    }
    const move = (event: PointerEvent): void => {
      if (event.pointerId !== pointer.current) return;
      if (!(event.buttons & 1)) {
        finish();
        return;
      }
      const coalesced = event.getCoalescedEvents?.() ?? [];
      for (const sample of coalesced.length ? coalesced : [event]) {
        // Native capture retargets events; hit testing excludes toolbar overlays.
        const at = document.elementFromPoint(sample.clientX, sample.clientY);
        const point =
          mesh.current && at === canvas
            ? boardPointAt(sample.clientX, sample.clientY, canvas.getBoundingClientRect(), camera, mesh.current)
            : null;
        useBoardDrawing.getState().extend(point);
      }
    };
    const end = (event: PointerEvent): void => {
      if (event.pointerId === pointer.current) finish();
    };
    const resize = (): void => {
      if (pointer.current !== null) useBoardDrawing.getState().extend(null);
    };
    const hidden = (): void => {
      if (document.hidden) finish();
    };
    // Native listeners also receive release/cancel when there is no R3F intersection.
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    canvas.addEventListener('lostpointercapture', end);
    window.addEventListener('blur', finish);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', hidden);
    const unsubscribe = useBoardDrawing.subscribe((state, previous) => {
      if (pointer.current !== null && (!state.current || state.keyboardDrawing || state.tool !== previous.tool))
        finish();
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
  }, [phase, boardReady, camera, gl, mesh]);

  const onDown = (event: ThreeEvent<PointerEvent>): void => {
    event.stopPropagation();
    if (
      phase !== 'viewing-board' ||
      !boardReady ||
      pointer.current !== null ||
      event.button !== 0 ||
      !event.isPrimary ||
      !mesh.current
    )
      return;
    const canvas = gl.domElement;
    const point = boardPointAt(event.clientX, event.clientY, canvas.getBoundingClientRect(), camera, mesh.current);
    if (!point) return;
    useBoardDrawing.getState().begin(point);
    pointer.current = event.pointerId;
    canvas.setPointerCapture(event.pointerId);
  };

  return onDown;
}
