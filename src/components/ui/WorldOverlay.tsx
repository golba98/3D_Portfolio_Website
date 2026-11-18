import { useEffect } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useExperience } from '../../store/experience';
import styles from './WorldOverlay.module.css';
import { BoardToolbar } from './BoardToolbar';
import { DevicePrompt } from './DevicePrompt';
import { TouchNav } from './TouchNav';
import { PoemOverlay } from './PoemOverlay';

export function WorldOverlay() {
  const phase = useExperience((s) => s.phase);
  const skipIntro = useExperience((s) => s.skipIntro);
  const closeBoard = useExperience((s) => s.closeBoard);
  const touch = useMediaQuery('(pointer: coarse)');
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      if (phase === 'intro') skipIntro();
      if (phase === 'viewing-board') closeBoard();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, skipIntro, closeBoard]);

  return (
    <div className={styles.overlay} data-phase={phase}>
      <button
        type="button"
        className={styles.skip}
        data-visible={phase === 'intro'}
        tabIndex={phase === 'intro' ? 0 : -1}
        onClick={skipIntro}
      >
        Skip intro {!touch && <kbd>Esc</kbd>}
      </button>

      {touch && <TouchNav visible={phase === 'exploring'} />}
      <BoardToolbar />
      <DevicePrompt />
      <PoemOverlay />
    </div>
  );
}
