import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { POEM } from '../../data/poem';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { paperReadSize } from '../../lib/poemPaper';
import { useExperience } from '../../store/experience';
import styles from './PoemOverlay.module.css';

const viewport = () => ({ width: window.innerWidth, height: window.innerHeight });

export function PoemOverlay() {
  const phase = useExperience((s) => s.phase);
  const ready = useExperience((s) => s.poemReady);
  const shelfReady = useExperience((s) => s.shelfReady);
  const active = phase === 'viewing-shelf' || phase === 'viewing-poem';
  const reading = phase === 'viewing-poem';
  const container = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const read = useRef<HTMLButtonElement>(null);
  const [size, setSize] = useState(viewport);
  useFocusTrap(container, active);

  useEffect(() => {
    const resize = () => setSize(viewport());
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    if (active) close.current?.focus({ preventScroll: true });
  }, [active, reading]);
  useEffect(() => {
    if (phase === 'viewing-shelf' && shelfReady) read.current?.focus({ preventScroll: true });
  }, [phase, shelfReady]);

  if (!active) return null;
  const dimensions = paperReadSize(size.width, size.height);
  const paperStyle = {
    width: dimensions.width,
    height: dimensions.height,
    '--poem-font-size': `${Math.max(20, Math.min(26, dimensions.width * 0.041))}px`,
  } as CSSProperties;

  return (
    <div ref={container} className={styles.overlay} role="dialog" aria-modal="true"
      aria-label={reading ? 'Handwritten poem' : 'A note on the bottom shelf'}
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        if (reading) useExperience.getState().closePoem();
        else useExperience.getState().leaveShelf();
      }}>
      <button ref={close} type="button" className={styles.close} onClick={() => {
        if (reading) useExperience.getState().closePoem();
        else useExperience.getState().leaveShelf();
      }}>
        {reading ? 'Close' : 'Back to room'} <span aria-hidden="true">↩</span>
      </button>
      {!reading && (
        <>
          <p className={styles.hint} role="status">{shelfReady ? 'A page, waiting to be read.' : 'Something on the shelf…'}</p>
          <button ref={read} type="button" className={styles.read} disabled={!shelfReady}
            onClick={() => useExperience.getState().openPoem()}>Read note</button>
        </>
      )}
      {reading && ready && (
        <div className={styles.paper} style={paperStyle}>
          <div className={styles.poem} tabIndex={0} role="document" aria-label="Poem">
            {POEM}
          </div>
        </div>
      )}
    </div>
  );
}
