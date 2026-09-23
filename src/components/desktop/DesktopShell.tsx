import { useEffect, type CSSProperties } from 'react';
import { MONITOR_FOCUS } from '../../config/cameraPoses';
import { profile } from '../../data/profile';
import { useWindows } from '../../store/windows';
import { Dock } from './Dock';
import { Overview } from './Overview';
import { TopBar } from './TopBar';
import { WindowManager } from './WindowManager';
import styles from './DesktopShell.module.css';

/** Floating-window desktop for larger screens. */
export function DesktopShell() {
  const overviewOpen = useWindows((s) => s.overviewOpen);
  const setOverview = useWindows((s) => s.setOverview);
  const focusedId = useWindows((s) => s.focusedId);
  const fitToViewport = useWindows((s) => s.fitToViewport);

  // Mirror the focused app into the URL so a refresh or shared link reopens it.
  useEffect(() => {
    const hash = focusedId ? `#/desktop/${focusedId}` : '#/desktop';
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash);
  }, [focusedId]);

  useEffect(() => {
    window.addEventListener('resize', fitToViewport);
    return () => window.removeEventListener('resize', fitToViewport);
  }, [fitToViewport]);

  // The Super key on its own toggles the overview, like GNOME.
  useEffect(() => {
    let superAlone = false;
    const onDown = (event: KeyboardEvent): void => {
      superAlone = event.key === 'Meta' || event.key === 'OS';
    };
    const onUp = (event: KeyboardEvent): void => {
      if ((event.key === 'Meta' || event.key === 'OS') && superAlone) {
        setOverview(!useWindows.getState().overviewOpen);
      }
      superAlone = false;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [setOverview]);

  return (
    <div className={styles.shell} style={{ '--screen-fill': MONITOR_FOCUS.fill } as CSSProperties}>
      <TopBar leftLabel="Activities" leftPressed={overviewOpen} onLeft={() => setOverview(!overviewOpen)} workspaces />
      <main className={styles.workspace} aria-label="Desktop">
        <div className={styles.welcome} aria-hidden="true">
          <p className={styles.welcomeName}>{profile.name}</p>
          <p className={styles.welcomeRole}>
            {profile.role} · {profile.location}
          </p>
        </div>
        <WindowManager />
      </main>
      <Dock />
      <Overview />
    </div>
  );
}
