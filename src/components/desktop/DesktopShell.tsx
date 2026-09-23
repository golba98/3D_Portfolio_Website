import { useEffect, type CSSProperties } from 'react';
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

  // Mirror the focused app into the URL so a refresh or shared link reopens it.
  useEffect(() => {
    const hash = focusedId ? `#/desktop/${focusedId}` : '#/desktop';
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash);
  }, [focusedId]);

  useEffect(() => {
    window.addEventListener('resize', fitToViewport);
    return () => window.removeEventListener('resize', fitToViewport);
  }, [fitToViewport]);

  // GNOME's keyboard: Super alone toggles the overview, Super+arrows maximise
  // and tile the focused window, F11 makes it fullscreen.
  useEffect(() => {
    let superAlone = false;
    const onDown = (event: KeyboardEvent): void => {
      superAlone = event.key === 'Meta' || event.key === 'OS';
      const state = useWindows.getState();
      const win = state.windows.find((w) => w.id === state.focusedId && w.mode !== 'minimized');
      if (!win) return;
      if (event.key === 'F11') {
        event.preventDefault();
        state.toggleFullscreen(win.id);
        return;
      }
      // Without browser fullscreen (refused, or not supported) Esc is the way out.
      if (event.key === 'Escape' && win.mode === 'fullscreen' && !document.fullscreenElement) {
        state.toggleFullscreen(win.id);
        return;
      }
      if (!event.metaKey || win.mode === 'fullscreen') return;
      const floating = win.mode === 'normal';
      const actions: Record<string, () => void> = {
        ArrowUp: () => state.snap(win.id, 'maximized'),
        ArrowDown: () => (floating ? state.minimize(win.id) : state.restore(win.id)),
        ArrowLeft: () => (win.mode === 'tiled-right' ? state.restore(win.id) : state.snap(win.id, 'tiled-left')),
        ArrowRight: () => (win.mode === 'tiled-left' ? state.restore(win.id) : state.snap(win.id, 'tiled-right')),
      };
      const action = actions[event.key];
      if (action) {
        event.preventDefault();
        action();
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
        <WindowManager />
      </main>
      <Dock />
      <Overview />
      <FullscreenSupport />
    </div>
  );
}
