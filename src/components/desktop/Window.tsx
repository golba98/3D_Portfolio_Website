import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { motion } from 'framer-motion';
import { getApp } from '../../apps/registry';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { MIN_WINDOW_SIZE, WORKSPACE_INSETS, useWindows } from '../../store/windows';
import type { Bounds, DesktopWindow, SnapTarget } from '../../types/windows';
import { AppFrameContext, type WindowFrame } from '../adw/frame';
import { Icon } from '../icons/Icon';
import { AppHost } from './AppHost';
import { WindowMenu } from './WindowMenu';
import styles from './Window.module.css';

type Edge = 'e' | 's' | 'w' | 'se' | 'sw';
const EDGES: readonly Edge[] = ['e', 's', 'w', 'se', 'sw'];

/** How far the pointer must travel before a maximised or tiled window comes loose. */
const PULL_OUT_DISTANCE = 8;
/** How close to a screen edge the pointer must be to snap. */
const SNAP_EDGE = 4;

/** Where a window dragged to this pointer position would snap to, like GNOME's edge tiling. */
function snapTargetAt(x: number, y: number): SnapTarget | null {
  if (y <= WORKSPACE_INSETS.top + SNAP_EDGE) return 'maximized';
  if (x <= SNAP_EDGE) return 'tiled-left';
  if (x >= window.innerWidth - 1 - SNAP_EDGE) return 'tiled-right';
  return null;
}

interface WindowProps {
  win: DesktopWindow;
}

/**
 * One application window: frame, drag, resize and focus handling. Like
 * libadwaita, apps draw their own header bars (which drag the window and hold
 * its close button); only the terminal gets a separate kitty title strip.
 */
export function Window({ win }: WindowProps) {
  const app = getApp(win.appId);
  const focused = useWindows((s) => s.focusedId === win.id);
  const { focus, close, minimize, toggleMaximize, toggleFullscreen, tile, restore, snap, setSnapPreview, move, resize, open } =
    useWindows.getState();
  const setTitle = useCallback((title: string) => useWindows.getState().setTitle(win.id, title), [win.id]);
  const title = win.title ?? app.title;
  const kitty = app.chrome === 'kitty';
  const reducedMotion = useReducedMotion();
  const [interacting, setInteracting] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const section = useRef<HTMLElement>(null);

  const { mode } = win;
  const minimized = mode === 'minimized';
  const fullscreen = mode === 'fullscreen';
  /** Maximised, tiled or fullscreen: square corners, no resize edges. */
  const docked = mode !== 'normal' && !minimized;
  const restorable = mode === 'maximized' || mode === 'tiled-left' || mode === 'tiled-right';

  // Move keyboard focus into a window when it comes to the front.
  useEffect(() => {
    if (focused && !minimized && !section.current?.contains(document.activeElement)) {
      section.current?.focus({ preventScroll: true });
    }
  }, [focused, minimized]);

  const startDrag = (event: ReactPointerEvent<HTMLElement>): void => {
    if (event.button !== 0 || fullscreen || (event.target as HTMLElement).closest('button, a, input')) return;
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    const start = { x: event.clientX, y: event.clientY };
    let origin = win.bounds;
    // A maximised or tiled window stays put until the pointer really moves.
    let loose = mode === 'normal';
    setInteracting(true);

    const onMove = (e: PointerEvent): void => {
      if (!loose) {
        if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < PULL_OUT_DISTANCE) return;
        // Pull the window out from under the pointer, keeping the grab point
        // at the same fraction of its width, like GNOME.
        const rect = section.current?.getBoundingClientRect();
        const fraction = rect ? (start.x - rect.left) / rect.width : 0.5;
        origin = { ...win.bounds, x: start.x - fraction * win.bounds.width, y: 0 };
        restore(win.id);
        loose = true;
      }
      move(win.id, origin.x + e.clientX - start.x, origin.y + e.clientY - start.y);
      setSnapPreview(snapTargetAt(e.clientX, e.clientY));
    };
    const onUp = (e: PointerEvent): void => {
      setInteracting(false);
      if (loose) {
        const target = snapTargetAt(e.clientX, e.clientY);
        if (target) snap(win.id, target);
      }
      setSnapPreview(null);
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', onUp);
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onUp);
  };

  const openMenu = (event: ReactMouseEvent<HTMLElement>): void => {
    if ((event.target as HTMLElement).closest('input, textarea')) return;
    event.preventDefault();
    focus(win.id);
    setMenu({ x: event.clientX, y: event.clientY });
  };

  const frame: WindowFrame = {
    kind: 'window',
    focused,
    mode,
    appTitle: app.title,
    startDrag,
    toggleMaximize: () => (restorable ? restore(win.id) : toggleMaximize(win.id)),
    toggleFullscreen: () => toggleFullscreen(win.id),
    openMenu,
    close: () => close(win.id),
  };

  const startResize = (edge: Edge) => (event: ReactPointerEvent<HTMLElement>): void => {
    if (event.button !== 0) return;
    event.stopPropagation();
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    const start = { x: event.clientX, y: event.clientY };
    const origin = win.bounds;
    setInteracting(true);
    const onMove = (e: PointerEvent): void => {
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const next: Bounds = { ...origin };
      if (edge.includes('e')) next.width = origin.width + dx;
      if (edge.includes('s')) next.height = origin.height + dy;
      if (edge.includes('w')) {
        const width = Math.max(MIN_WINDOW_SIZE.width, origin.width - dx);
        next.x = origin.x + origin.width - width;
        next.width = width;
      }
      resize(win.id, next);
    };
    const onUp = (): void => {
      setInteracting(false);
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', onUp);
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onUp);
  };

  const geometry =
    mode === 'maximized'
      ? { left: 0, top: 0, width: '100%', height: '100%' }
      : mode === 'tiled-left'
        ? { left: 0, top: 0, width: '50%', height: '100%' }
        : mode === 'tiled-right'
          ? { left: '50%', top: 0, width: '50%', height: '100%' }
          : fullscreen
            ? { left: 0, top: 'calc(-1 * var(--topbar-height))', width: '100%', height: 'calc(100% + var(--topbar-height))' }
            : { left: win.bounds.x, top: win.bounds.y, width: win.bounds.width, height: win.bounds.height };

  const duration = reducedMotion ? 0 : 0.2;

  return (
    <motion.section
      ref={section}
      className={styles.window}
      data-focused={focused}
      data-chrome={app.chrome}
      data-mode={mode}
      data-interacting={interacting}
      aria-label={app.title}
      aria-hidden={minimized || undefined}
      inert={minimized}
      tabIndex={-1}
      // Fullscreen sits above the top bar (1000) and the dock (900).
      style={{ ...geometry, zIndex: fullscreen ? 2000 : win.z }}
      initial={{ opacity: 0, scale: 0.94, y: 10 }}
      animate={minimized ? { opacity: 0, scale: 0.86, y: 120 } : { opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: duration * 0.8 } }}
      transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
      onPointerDownCapture={() => focus(win.id)}
      onFocusCapture={() => focus(win.id)}
    >
      {kitty && !fullscreen && (
        <header
          className={styles.titlebar}
          onPointerDown={startDrag}
          onDoubleClick={(e) => !(e.target as HTMLElement).closest('button') && toggleMaximize(win.id)}
          onContextMenu={openMenu}
        >
          <h2 className={styles.title}>{title}</h2>
          <button
            type="button"
            className={styles.control}
            aria-label={restorable ? `Restore ${app.title}` : `Maximise ${app.title}`}
            title={restorable ? 'Restore' : 'Maximise'}
            onClick={() => (restorable ? restore(win.id) : toggleMaximize(win.id))}
          >
            <Icon name={restorable ? 'restore' : 'maximize'} size={15} strokeWidth={1.6} />
          </button>
          <button type="button" className={styles.control} aria-label={`Close ${app.title}`} title="Close" onClick={() => close(win.id)}>
            <Icon name="close" size={16} strokeWidth={1.6} />
          </button>
        </header>
      )}
      <div className={styles.content} data-chrome={app.chrome ?? 'adwaita'}>
        <AppFrameContext.Provider value={frame}>
          <AppHost key={win.openCount} appId={win.appId} arg={win.arg} openApp={open} setTitle={setTitle} />
        </AppFrameContext.Provider>
      </div>
      {!docked &&
        EDGES.map((edge) => (
          <div key={edge} className={styles.resize} data-edge={edge} onPointerDown={startResize(edge)} aria-hidden="true" />
        ))}
      {menu && (
        <WindowMenu
          x={menu.x}
          y={menu.y}
          mode={mode}
          onDismiss={() => setMenu(null)}
          actions={{
            maximize: () => (restorable ? restore(win.id) : toggleMaximize(win.id)),
            tileLeft: () => tile(win.id, 'left'),
            tileRight: () => tile(win.id, 'right'),
            fullscreen: () => toggleFullscreen(win.id),
            minimize: () => minimize(win.id),
            close: () => close(win.id),
          }}
        />
      )}
    </motion.section>
  );
}
