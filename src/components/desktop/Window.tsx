import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { motion } from 'framer-motion';
import { getApp } from '../../apps/registry';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { MIN_WINDOW_SIZE, useWindows } from '../../store/windows';
import type { Bounds, DesktopWindow } from '../../types/windows';
import { Icon } from '../icons/Icon';
import { AppHost } from './AppHost';
import styles from './Window.module.css';

type Edge = 'e' | 's' | 'w' | 'se' | 'sw';
const EDGES: readonly Edge[] = ['e', 's', 'w', 'se', 'sw'];

interface WindowProps {
  win: DesktopWindow;
}

/** One application window: title bar, controls, drag, resize and focus handling. */
export function Window({ win }: WindowProps) {
  const app = getApp(win.appId);
  const focused = useWindows((s) => s.focusedId === win.id);
  const { focus, close, minimize, toggleMaximize, move, resize, open } = useWindows.getState();
  const setTitle = useCallback((title: string) => useWindows.getState().setTitle(win.id, title), [win.id]);
  const title = win.title ?? app.title;
  const kitty = app.chrome === 'kitty';
  const reducedMotion = useReducedMotion();
  const [interacting, setInteracting] = useState(false);
  const section = useRef<HTMLElement>(null);

  const maximized = win.mode === 'maximized';
  const minimized = win.mode === 'minimized';

  // Move keyboard focus into a window when it comes to the front.
  useEffect(() => {
    if (focused && !minimized && !section.current?.contains(document.activeElement)) {
      section.current?.focus({ preventScroll: true });
    }
  }, [focused, minimized]);

  const startDrag = (event: ReactPointerEvent<HTMLElement>): void => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('button')) return;
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    const start = { x: event.clientX, y: event.clientY };
    let origin = win.bounds;
    if (maximized) {
      // Pull a maximised window out from under the pointer, like GNOME.
      origin = { ...win.bounds, x: event.clientX - win.bounds.width / 2, y: 0 };
      toggleMaximize(win.id);
      move(win.id, origin.x, origin.y);
    }
    setInteracting(true);
    const onMove = (e: PointerEvent): void => move(win.id, origin.x + e.clientX - start.x, origin.y + e.clientY - start.y);
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

  const geometry = maximized
    ? { left: 0, top: 0, width: '100%', height: '100%' }
    : { left: win.bounds.x, top: win.bounds.y, width: win.bounds.width, height: win.bounds.height };

  const duration = reducedMotion ? 0 : 0.2;

  return (
    <motion.section
      ref={section}
      className={styles.window}
      data-focused={focused}
      data-chrome={app.chrome}
      data-maximized={maximized}
      data-interacting={interacting}
      aria-label={app.title}
      aria-hidden={minimized || undefined}
      inert={minimized}
      tabIndex={-1}
      style={{ ...geometry, zIndex: win.z }}
      initial={{ opacity: 0, scale: 0.94, y: 10 }}
      animate={minimized ? { opacity: 0, scale: 0.86, y: 120 } : { opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: duration * 0.8 } }}
      transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
      onPointerDownCapture={() => focus(win.id)}
      onFocusCapture={() => focus(win.id)}
    >
      <header className={styles.titlebar} onPointerDown={startDrag} onDoubleClick={() => toggleMaximize(win.id)}>
        <h2 className={styles.title}>
          {title}
        </h2>
        <div className={styles.controls}>
          <button type="button" className={styles.control} aria-label={`Minimise ${app.title}`} onClick={() => minimize(win.id)}>
            <Icon name="minimize" size={kitty ? 16 : 12} strokeWidth={kitty ? 1.6 : 2.4} />
          </button>
          <button
            type="button"
            className={styles.control}
            aria-label={maximized ? `Restore ${app.title}` : `Maximise ${app.title}`}
            onClick={() => toggleMaximize(win.id)}
          >
            <Icon name={maximized ? 'restore' : 'maximize'} size={kitty ? 16 : 12} strokeWidth={kitty ? 1.6 : 2.2} />
          </button>
          <button type="button" className={styles.control} aria-label={`Close ${app.title}`} onClick={() => close(win.id)}>
            <Icon name="close" size={kitty ? 16 : 12} strokeWidth={kitty ? 1.6 : 2.4} />
          </button>
        </div>
      </header>
      <div className={styles.content}>
        <AppHost key={win.openCount} appId={win.appId} arg={win.arg} openApp={open} setTitle={setTitle} />
      </div>
      {!maximized &&
        EDGES.map((edge) => (
          <div key={edge} className={styles.resize} data-edge={edge} onPointerDown={startResize(edge)} aria-hidden="true" />
        ))}
    </motion.section>
  );
}
