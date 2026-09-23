import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { APPS } from '../../apps/registry';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useWindows } from '../../store/windows';
import { Icon } from '../icons/Icon';
import { AppIcon } from './AppIcon';
import styles from './Overview.module.css';

/** Activities overview: search and launch apps. */
export function Overview() {
  const open = useWindows((s) => s.overviewOpen);
  return <AnimatePresence>{open && <OverviewPanel />}</AnimatePresence>;
}

function OverviewPanel() {
  const [query, setQuery] = useState('');
  const panel = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { open: openApp, setOverview } = useWindows.getState();
  useFocusTrap(panel, true);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return APPS;
    return APPS.filter((app) =>
      [app.title, app.description, ...app.keywords].some((text) => text.toLowerCase().includes(q)),
    );
  }, [query]);

  const close = (): void => setOverview(false);

  return (
    <motion.div
      ref={panel}
      className={styles.overview}
      role="dialog"
      aria-modal="true"
      aria-label="Activities"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.16 }}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') close();
      }}
    >
      <div className={styles.search}>
        <Icon name="search" size={16} />
        <input
          type="search"
          value={query}
          placeholder="Type to search"
          aria-label="Search apps"
          autoFocus
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            const first = results[0];
            if (event.key === 'Enter' && first) openApp(first.id);
          }}
        />
      </div>

      {results.length > 0 ? (
        <ul className={styles.grid} aria-label="Apps">
          {results.map((app, index) => (
            <motion.li
              key={app.id}
              initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reducedMotion ? 0 : index * 0.02, duration: 0.18 }}
            >
              <button
                type="button"
                className={styles.app}
                aria-description={app.description}
                title={app.description}
                onClick={() => openApp(app.id)}
              >
                <AppIcon app={app} size={96} />
                <span className={styles.title}>{app.title}</span>
              </button>
            </motion.li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty} role="status">
          No apps match “{query}”.
        </p>
      )}
    </motion.div>
  );
}
