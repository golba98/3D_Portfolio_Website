import { useId, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { profile } from '../../data/profile';
import { usePopover } from '../../hooks/usePopover';
import { useExperience } from '../../store/experience';
import { Icon } from '../icons/Icon';
import styles from './StatusMenu.module.css';

/** GNOME-style quick settings: identity, CV download, and the way back to the 3D desk. */
export function StatusMenu() {
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = usePopover(root);
  const sceneStatus = useExperience((s) => s.sceneStatus);
  const leaveDesktop = useExperience((s) => s.leaveDesktop);
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
              <li>
                <a className={styles.item} href={profile.resumeUrl} download>
                  <Icon name="download" /> Download CV
                </a>
              </li>
              <li>
                <a className={styles.item} href={profile.github} target="_blank" rel="noreferrer">
                  <Icon name="github" /> GitHub
                </a>
              </li>
              {sceneStatus !== 'failed' && (
                <li>
                  <button
                    type="button"
                    className={styles.item}
                    onClick={() => {
                      setOpen(false);
                      leaveDesktop();
                    }}
                  >
                    <Icon name="power" /> Back to the 3D desk
                  </button>
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
