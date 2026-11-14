import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getApp } from '../../apps/registry';
import { searchPortfolio } from '../../lib/portfolioSearch';
import { ProjectSearchResults } from '../shell/ProjectSearchResults';
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
  const windows = useWindows((s) => s.windows);
  const { open: openApp, setOverview } = useWindows.getState();
  useFocusTrap(panel, true);

  const { apps: results, projects } = searchPortfolio(query);

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
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
      }}
    >
      <div className={styles.search}>
        <Icon name="search" size={16} />
        <input
          type="search"
          value={query}
          placeholder="Search apps, projects or technologies"
          aria-label="Search apps and projects"
          autoFocus
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            const first = results[0];
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
              if (projects[0]) openApp('projects', projects[0].id);
              else if (first) openApp(first.id);
            }
          }}
        />
      </div>

      {!query.trim() && windows.length > 0 && (
        <section className={styles.running} aria-label="Open windows">
          <h2>Open windows</h2>
          <div>
            {windows.map((win) => (
              <button type="button" key={win.id} onClick={() => openApp(win.id)}>
                <AppIcon app={getApp(win.appId)} size={32} />
                <span>
                  {win.title ?? getApp(win.appId).title}
                  <small>{win.mode === 'minimized' ? 'Minimized · click to restore' : 'Click to switch'}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
      <ProjectSearchResults projects={projects} onOpen={(id) => openApp('projects', id)} />
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
      ) : projects.length === 0 ? (
        <p className={styles.empty} role="status">
          No apps or projects match “{query}”.
        </p>
      ) : null}
      <p className={styles.hint}>Super or Ctrl K opens Activities · Esc returns to the desktop</p>
    </motion.div>
  );
}
