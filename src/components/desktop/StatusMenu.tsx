import { useId, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { profile } from '../../data/profile';
import { usePopover } from '../../hooks/usePopover';
import { Icon } from '../icons/Icon';
import { useSystemActions } from '../shell/systemActions';
import styles from './StatusMenu.module.css';

/** GNOME-style quick settings: identity, CV download, and the way back to the 3D desk. */
export function StatusMenu() {
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = usePopover(root);
  const actions = useSystemActions();
  const menuId = useId();

  return (
    <div className={styles.root} ref={root}>
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="System menu"
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="network-wired" size={16} />
        <Icon name="volume" size={16} />
        <Icon name="power" size={16} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={menuId}
            className={styles.panel}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.14 }}
          >
            <div className={styles.identity}>
              <span className={styles.avatar} aria-hidden="true">
                JV
              </span>
              <div>
                <p className={styles.name}>{profile.name}</p>
                <p className={styles.sub}>{profile.role}</p>
              </div>
            </div>
            <ul className={styles.items}>
              {actions.map((action) => (
                <li key={action.id}>
                  {action.href ? (
                    <a
                      className={styles.item}
                      href={action.href}
                      download={action.download || undefined}
                      target={action.download ? undefined : '_blank'}
                      rel={action.download ? undefined : 'noreferrer'}
                    >
                      <Icon name={action.icon} /> {action.label}
                    </a>
                  ) : (
                    <button
                      type="button"
                      className={styles.item}
                      onClick={() => {
                        setOpen(false);
                        action.onSelect?.();
                      }}
                    >
                      <Icon name={action.icon} /> {action.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
