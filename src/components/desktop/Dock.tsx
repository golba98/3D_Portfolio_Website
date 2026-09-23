import { APPS } from '../../apps/registry';
import { useWindows } from '../../store/windows';
import type { AppId } from '../../types/apps';
import { AppIcon } from './AppIcon';
import styles from './Dock.module.css';

/** Also used by the 3D monitor preview so the two docks line up. */
export const DOCK_ICON_SIZE = 56;

/** Always-visible app dock. Clicking the focused app minimises it, like most docks. */
export function Dock() {
  const windows = useWindows((s) => s.windows);
  const focusedId = useWindows((s) => s.focusedId);
  const overviewOpen = useWindows((s) => s.overviewOpen);
  const { open, minimize, setOverview } = useWindows.getState();

  const onActivate = (id: AppId): void => {
    const win = windows.find((w) => w.id === id);
    if (win && focusedId === id && win.mode !== 'minimized') minimize(id);
    else open(id);
  };

  return (
    <nav className={styles.dock} aria-label="Dock">
      <ul className={styles.list}>
        {APPS.map((app) => {
          const running = windows.some((w) => w.id === app.id);
          return (
            <li key={app.id}>
              <button
                type="button"
                className={styles.item}
                data-running={running}
                aria-label={running ? `${app.title} (open)` : app.title}
                title={app.title}
                onClick={() => onActivate(app.id)}
              >
                <AppIcon app={app} size={DOCK_ICON_SIZE} />
              </button>
            </li>
          );
        })}
        <li className={styles.separator} aria-hidden="true" />
        <li>
          <button
            type="button"
            className={styles.item}
            aria-label="Show apps"
            aria-pressed={overviewOpen}
            title="Show apps"
            onClick={() => setOverview(!overviewOpen)}
          >
            <span className={styles.showApps} aria-hidden="true">
              {Array.from({ length: 9 }, (_, i) => (
                <span key={i} />
              ))}
            </span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
