import { useEffect } from 'react';
import { profile } from '../../data/profile';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useExperience } from '../../store/experience';
import styles from './WorldOverlay.module.css';
import { BoardToolbar } from './BoardToolbar';
import { DevicePrompt } from './DevicePrompt';
import { TouchNav } from './TouchNav';

/**
 * DOM layer over the 3D scene. Visually it's just the desk (the centre monitor
 * is the way in); the heading is for screen readers, and keyboard users have
 * the skip link.
 */
export function WorldOverlay() {
  const phase = useExperience((s) => s.phase);
  const skipIntro = useExperience((s) => s.skipIntro);
  const openBoard = useExperience((s) => s.openBoard);
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
      <h1 className="visually-hidden">
        {profile.name} — {profile.role}, {profile.location}
      </h1>

      <button
        type="button"
        className={styles.skip}
        data-visible={phase === 'intro'}
        tabIndex={phase === 'intro' ? 0 : -1}
        onClick={skipIntro}
      >
        Skip intro {!touch && <kbd>Esc</kbd>}
      </button>

      {/* Pointers open the board by clicking it (its "Want to draw?" label is the cue);
          this is the keyboard's way in, shown only while focused. */}
      {phase === 'exploring' && (
        <button type="button" className={styles.draw} onClick={openBoard}>
          Draw on board <span aria-hidden="true">↗</span>
        </button>
      )}
      {touch && <TouchNav visible={phase === 'exploring'} />}
      <BoardToolbar />
      <DevicePrompt />
    </div>
  );
}
