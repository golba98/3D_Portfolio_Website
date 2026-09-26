import { useEffect, useRef, type CSSProperties, type KeyboardEvent } from 'react';
import { BOARD_COLORS, useBoardDrawing, type BoardTool } from '../../store/boardDrawing';
import { useExperience } from '../../store/experience';
import { Icon } from '../icons/Icon';
import styles from './BoardToolbar.module.css';

const MARKERS: Exclude<BoardTool, 'eraser'>[] = ['black', 'red', 'blue', 'green'];

export function BoardToolbar() {
  const phase = useExperience((s) => s.phase);
  const boardReady = useExperience((s) => s.boardReady);
  const closeBoard = useExperience((s) => s.closeBoard);
  const tool = useBoardDrawing((s) => s.tool);
  const strokes = useBoardDrawing((s) => s.strokes.length);
  const keyboardDrawing = useBoardDrawing((s) => s.keyboardDrawing);
  const setTool = useBoardDrawing((s) => s.setTool);
  const keyboardArea = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase === 'viewing-board' && boardReady) keyboardArea.current?.focus();
  }, [phase, boardReady]);

  if (phase !== 'viewing-board') return null;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const step = event.shiftKey ? 0.04 : 0.012;
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
    };
    if (event.key in delta) {
      event.preventDefault();
      const [x, y] = delta[event.key] ?? [0, 0];
      useBoardDrawing.getState().moveKeyboard(x, y);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      useBoardDrawing.getState().toggleKeyboardDrawing();
    }
  };

  return (
    <div className={styles.boardUi}>
      <div className={styles.top}>
        <span className={styles.title}>Your scratchpad</span>
        <button type="button" className={styles.close} onClick={closeBoard}>
          Back to desk <Icon name="close" size={14} strokeWidth={2.2} />
        </button>
      </div>
      <div className={styles.bottom}>
        <div className={styles.toolbar} role="toolbar" aria-label="Whiteboard drawing tools">
          {MARKERS.map((marker) => (
            <button key={marker} type="button" className={styles.marker} style={{ '--marker-color': BOARD_COLORS[marker] } as CSSProperties}
              aria-label={`${marker} marker`} aria-pressed={tool === marker} disabled={!boardReady} onClick={() => setTool(marker)}>
              <span className={styles.swatch} />
              <span className={styles.markerName}>{marker}</span>
            </button>
          ))}
          <span className={styles.divider} aria-hidden="true" />
          <button type="button" aria-pressed={tool === 'eraser'} disabled={!boardReady} onClick={() => setTool('eraser')}>Eraser</button>
          <button type="button" disabled={!boardReady || strokes === 0} onClick={() => useBoardDrawing.getState().undo()}>Undo</button>
          <button type="button" disabled={!boardReady || strokes === 0} onClick={() => useBoardDrawing.getState().clear()}>Clear</button>
        </div>
        <div ref={keyboardArea} tabIndex={boardReady ? 0 : -1} className={styles.keyboardArea}
          aria-label="Whiteboard keyboard drawing. Arrow keys move the cursor; Enter starts or stops drawing; Shift and arrow keys move farther."
          onFocus={() => useBoardDrawing.getState().setKeyboardFocused(true)}
          onBlur={() => useBoardDrawing.getState().setKeyboardFocused(false)}
          onKeyDown={onKeyDown}>
          {keyboardDrawing ? 'Drawing · Enter to finish' : 'Draw with mouse, touch, pen or arrow keys · Enter to draw'}
        </div>
      </div>
    </div>
  );
}
