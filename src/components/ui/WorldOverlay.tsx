import { useEffect } from 'react';
import { profile } from '../../data/profile';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useExperience } from '../../store/experience';
import styles from './WorldOverlay.module.css';

/** DOM controls over the 3D scene: identity, skip-intro, and an accessible way into the desktop. */
export function WorldOverlay() {
  const phase = useExperience((s) => s.phase);
  const skipIntro = useExperience((s) => s.skipIntro);
  const enterMonitor = useExperience((s) => s.enterMonitor);
  const touch = useMediaQuery('(pointer: coarse)');

  useEffect(() => {
    if (phase !== 'intro') return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') skipIntro();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, skipIntro]);

  const showIdentity = phase === 'intro' || phase === 'exploring';

  return (
    <div className={styles.overlay} data-phase={phase}>
      <header className={styles.identity} data-visible={showIdentity}>
        <h1 className={styles.name}>{profile.name}</h1>
        <p className={styles.role}>
          {profile.role} · {profile.location}
        </p>
      </header>

      <button
        type="button"
        className={styles.skip}
        data-visible={phase === 'intro'}
        tabIndex={phase === 'intro' ? 0 : -1}
        onClick={skipIntro}
      >
        Skip intro {!touch && <kbd>Esc</kbd>}
      </button>

      <div className={styles.enter} data-visible={phase === 'exploring'}>
        <button type="button" className={styles.enterButton} tabIndex={phase === 'exploring' ? 0 : -1} onClick={enterMonitor}>
          Enter system
        </button>
        <p className={styles.hint}>or {touch ? 'tap' : 'click'} the centre monitor</p>
      </div>
    </div>
  );
}
