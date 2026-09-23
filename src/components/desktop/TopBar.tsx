import { useNow } from '../../hooks/useNow';
import { formatTopBarClock } from '../../lib/format';
import { PlacesMenu } from './PlacesMenu';
import { StatusMenu } from './StatusMenu';
import styles from './TopBar.module.css';

interface TopBarProps {
  /** Accessible name and action of the left-hand button ("Activities" on desktop, "Home" on mobile). */
  leftLabel: string;
  leftPressed?: boolean;
  onLeft: () => void;
  /** Desktop layout: GNOME's workspace indicator instead of a text button, plus the Places menu. */
  workspaces?: boolean;
}

export function TopBar({ leftLabel, leftPressed, onLeft, workspaces }: TopBarProps) {
  const now = useNow();
  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        {workspaces ? (
          <>
            <button type="button" className={styles.workspaces} aria-label={leftLabel} aria-pressed={leftPressed} onClick={onLeft}>
              <span className={styles.activeWorkspace} aria-hidden="true" />
              <span className={styles.workspace} aria-hidden="true" />
            </button>
            <PlacesMenu />
          </>
        ) : (
          <button type="button" className={styles.button} aria-pressed={leftPressed} onClick={onLeft}>
            {leftLabel}
          </button>
        )}
      </div>
      <time className={styles.clock} dateTime={now.toISOString()}>
        {formatTopBarClock(now)}
      </time>
      <StatusMenu />
    </header>
  );
}
