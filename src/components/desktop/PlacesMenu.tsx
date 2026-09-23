import { useId, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HOME, HOME_PATH } from '../../data/filesystem';
import { usePopover } from '../../hooks/usePopover';
import { useWindows } from '../../store/windows';
import { Icon } from '../icons/Icon';
import menu from './StatusMenu.module.css';
import styles from './TopBar.module.css';

const PLACES = [
  { label: 'Home', icon: 'home' as const, path: HOME_PATH },
  ...HOME.children
    .filter((node) => node.kind === 'dir')
    .map((node) => ({ label: node.name, icon: 'folder' as const, path: [...HOME_PATH, node.name] })),
];

/** The Places Status Indicator extension: jump straight to a folder in Files. */
export function PlacesMenu() {
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = usePopover(root);
  const menuId = useId();

  return (
    <div className={styles.places} ref={root}>
      <button
        type="button"
        className={styles.button}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        Places
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            id={menuId}
            className={`${menu.panel} ${styles.placesPanel}`}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.14 }}
          >
            {PLACES.map((place) => (
              <li key={place.label}>
                <button
                  type="button"
                  className={menu.item}
                  onClick={() => {
                    setOpen(false);
                    useWindows.getState().open('files', place.path.join('/'));
                  }}
                >
                  <Icon name={place.icon} /> {place.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
