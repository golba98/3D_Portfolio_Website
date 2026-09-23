import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { APPS } from '../../apps/registry';
import { WORKSPACE_INSETS, useWindows } from '../../store/windows';
import type { AppId } from '../../types/apps';
import type { DesktopWindow } from '../../types/windows';
import { AppIcon } from './AppIcon';
import styles from './Dock.module.css';

/** Also used by the 3D monitor preview so the two docks line up. */
export const DOCK_ICON_SIZE = 56;

/** Rough dock width (Dock.module.css): cells, separator, padding. Only used to decide whether a window overlaps it. */
const DOCK_WIDTH = (APPS.length + 1) * (64 + 8) + 9 + 22;

/** Does this window cover the dock's spot at the bottom of the screen? */
function coversDock(win: DesktopWindow): boolean {
  if (win.mode === 'minimized') return false;
  if (win.mode !== 'normal') return true;
  const { x, y, width, height } = win.bounds;
  const dockLeft = (window.innerWidth - DOCK_WIDTH) / 2;
  const reachesDown = WORKSPACE_INSETS.top + y + height > window.innerHeight - WORKSPACE_INSETS.bottom;
  return reachesDown && x < dockLeft + DOCK_WIDTH && x + width > dockLeft;
}

/**
 * The app dock (Dash to Dock). Clicking the focused app minimises it. It
 * slides away when a window needs its space (intellihide) and comes back when
 * the pointer touches the bottom edge.
 */
export function Dock() {
  const windows = useWindows((s) => s.windows);
  const focusedId = useWindows((s) => s.focusedId);
  const overviewOpen = useWindows((s) => s.overviewOpen);
  const { open, minimize, setOverview } = useWindows.getState();
  const [revealed, setRevealed] = useState(false);
  const dock = useRef<HTMLElement>(null);
  const zone = useRef<HTMLDivElement>(null);
  // Hide again once the pointer leaves both the dock and the reveal zone around it.
  const onLeave = (event: ReactPointerEvent<HTMLElement>): void => {
    const next = event.relatedTarget as Node | null;
    if (next instanceof Node && (dock.current?.contains(next) || zone.current?.contains(next))) return;
    setRevealed(false);
  };
  const covered = windows.some(coversDock);
  const fullscreen = windows.some((w) => w.mode === 'fullscreen');
  const hidden = covered && !revealed && !overviewOpen;

  const onActivate = (id: AppId): void => {
    const win = windows.find((w) => w.id === id);
    if (win && focusedId === id && win.mode !== 'minimized') minimize(id);
    else open(id);
  };

  return (
    <>
      {covered && !fullscreen && (
        <div
          ref={zone}
          className={styles.hotZone}
          data-revealed={revealed}
          onPointerEnter={() => setRevealed(true)}
          onPointerLeave={onLeave}
          aria-hidden="true"
        />
      )}
      <nav ref={dock} className={styles.dock} aria-label="Dock" data-hidden={hidden} onPointerLeave={onLeave}>
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
                  onClick={() => onActivate(app.id)}
                >
                  <AppIcon app={app} size={DOCK_ICON_SIZE} />
                  <span className={styles.label} aria-hidden="true">
                    {app.title}
                  </span>
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
              onClick={() => setOverview(!overviewOpen)}
            >
              <span className={styles.showApps} aria-hidden="true">
                {Array.from({ length: 9 }, (_, i) => (
                  <span key={i} />
                ))}
              </span>
              <span className={styles.label} aria-hidden="true">
                Show Apps
              </span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
