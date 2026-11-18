import { useEffect, useRef, type CSSProperties } from 'react';
import { MONITOR_FOCUS } from '../../config/cameraPoses';
import { useWindows } from '../../store/windows';
import { Dock } from './Dock';
import { FullscreenSupport } from './FullscreenSupport';
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

  useEffect(() => {
    window.addEventListener('resize', fitToViewport);
    return () => window.removeEventListener('resize', fitToViewport);
  }, [fitToViewport]);

  const previousApp = useRef(focusedId);
  useEffect(() => {
    if (!focusedId && previousApp.current) {
      document.querySelector<HTMLElement>(`[data-launch-app="${previousApp.current}"]`)?.focus({ preventScroll: true });
    }
    previousApp.current = focusedId;
  }, [focusedId]);

  useEffect(() => {
    let superAlone = false;
    const onDown = (event: KeyboardEvent): void => {
      superAlone = event.key === 'Meta' || event.key === 'OS';
      const state = useWindows.getState();
      if (
        event.defaultPrevented ||
        (event.target instanceof HTMLElement &&
          event.target.closest('input, textarea, [contenteditable=true], [role=textbox]'))
      )
        return;
      if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !state.overviewOpen) {
        event.preventDefault();
        setOverview(true);
        return;
      }
      const win = state.windows.find((w) => w.id === state.focusedId && w.mode !== 'minimized');
      if (!win) return;
      // Without browser fullscreen (refused, or not supported) Esc is the way out.
      if (event.key === 'Escape' && win.mode === 'fullscreen' && !document.fullscreenElement) {
        state.toggleFullscreen(win.id);
        return;
      }
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
        {!focusedId && (
          <a className={styles.shortcut} href="#/desktop/projects">
            <img src="/icons/apps/org.gnome.Builder.svg" width="38" height="38" alt="" />
            View projects
          </a>
        )}
        <WindowManager />
      </main>
      <Dock />
      <Overview />
      <FullscreenSupport />
    </div>
  );
}
