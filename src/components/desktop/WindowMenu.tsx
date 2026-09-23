import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { WindowMode } from '../../types/windows';
import { Icon, type IconName } from '../icons/Icon';
import styles from './WindowMenu.module.css';

interface WindowMenuActions {
  maximize: () => void;
  tileLeft: () => void;
  tileRight: () => void;
  fullscreen: () => void;
  minimize: () => void;
  close: () => void;
}

interface WindowMenuProps {
  /** Pointer position, in viewport pixels. */
  x: number;
  y: number;
  mode: WindowMode;
  actions: WindowMenuActions;
  onDismiss: () => void;
}

/** GNOME Shell's window menu, from right-clicking a title bar. */
export function WindowMenu({ x, y, mode, actions, onDismiss }: WindowMenuProps) {
  const root = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });
  const restorable = mode === 'maximized' || mode === 'tiled-left' || mode === 'tiled-right';

  // Keep the menu on screen.
  useLayoutEffect(() => {
    const menu = root.current;
    if (!menu) return;
    const { width, height } = menu.getBoundingClientRect();
    setPosition({ x: Math.min(x, window.innerWidth - width - 8), y: Math.min(y, window.innerHeight - height - 8) });
    menu.querySelector('button')?.focus();
  }, [x, y]);

  useEffect(() => {
    const onPointer = (event: PointerEvent): void => {
      if (!root.current?.contains(event.target as Node)) onDismiss();
    };
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onDismiss();
      }
    };
    document.addEventListener('pointerdown', onPointer, true);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('blur', onDismiss);
    return () => {
      document.removeEventListener('pointerdown', onPointer, true);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('blur', onDismiss);
    };
  }, [onDismiss]);

  const items: ReadonlyArray<{ label: string; icon: IconName; run: () => void; shortcut?: string; checked?: boolean } | 'separator'> = [
    { label: restorable ? 'Restore' : 'Maximise', icon: restorable ? 'restore' : 'maximize', run: actions.maximize, shortcut: 'Super+↑' },
    { label: 'Tile Left', icon: 'tile-left', run: actions.tileLeft, shortcut: 'Super+←', checked: mode === 'tiled-left' },
    { label: 'Tile Right', icon: 'tile-right', run: actions.tileRight, shortcut: 'Super+→', checked: mode === 'tiled-right' },
    { label: mode === 'fullscreen' ? 'Leave Fullscreen' : 'Fullscreen', icon: mode === 'fullscreen' ? 'unfullscreen' : 'fullscreen', run: actions.fullscreen, shortcut: 'F11' },
    'separator',
    { label: 'Minimise', icon: 'minimize', run: actions.minimize, shortcut: 'Super+↓' },
    { label: 'Close', icon: 'close', run: actions.close },
  ];

  return createPortal(
    <div ref={root} className={styles.menu} role="menu" aria-label="Window menu" style={{ left: position.x, top: position.y }}>
      {items.map((item, i) =>
        item === 'separator' ? (
          <div key={`sep-${i}`} className={styles.separator} role="separator" />
        ) : (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            className={styles.item}
            aria-current={item.checked || undefined}
            onClick={() => {
              onDismiss();
              item.run();
            }}
          >
            <Icon name={item.icon} size={16} strokeWidth={1.8} />
            <span className={styles.label}>{item.label}</span>
            {item.shortcut && <kbd className={styles.shortcut}>{item.shortcut}</kbd>}
          </button>
        ),
      )}
    </div>,
    document.body,
  );
}
