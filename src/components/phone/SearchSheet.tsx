import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { searchPortfolio } from '../../lib/portfolioSearch';
import { ProjectSearchResults } from '../shell/ProjectSearchResults';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { AppIcon } from '../desktop/AppIcon';
import { Icon } from '../icons/Icon';
import { originOf } from './homeLayout';
import { usePhone } from './phoneStore';
import styles from './SearchSheet.module.css';

/** iPhone-style search, opened from the Search pill above the dock. Matches like the desktop's Activities search. */
export function SearchSheet() {
  const [query, setQuery] = useState('');
  const sheet = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const open = usePhone((s) => s.open);
  const setOverlay = usePhone((s) => s.setOverlay);
  useFocusTrap(sheet, true);

  const { apps: results, projects } = searchPortfolio(query);

  const close = (): void => setOverlay('none');

  return (
    <motion.div
      ref={sheet}
      className={styles.sheet}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      initial={{ opacity: 0, y: reducedMotion ? 0 : 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reducedMotion ? 0 : 24 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
      }}
    >
      <div className={styles.bar}>
        <label className={styles.field}>
          <Icon name="search" size={16} />
          <input
            type="search"
            value={query}
            placeholder="Apps, projects, skills"
            aria-label="Search apps and projects"
            enterKeyHint="go"
            autoFocus
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              const first = results[0];
              if (event.key === 'Enter' && !event.nativeEvent.isComposing && (projects[0] || first)) {
                event.currentTarget.blur();
                if (projects[0]) open('projects', projects[0].id);
                else if (first) open(first.id);
              }
            }}
          />
        </label>
        <button type="button" className={styles.cancel} onClick={close}>
          Cancel
        </button>
      </div>

      <div className={styles.scrollResults}>
        <ProjectSearchResults projects={projects} onOpen={(id) => open('projects', id)} />
        {results.length > 0 ? (
          <ul className={styles.results} aria-label="Apps">
            {results.map((app) => (
              <li key={app.id}>
                <button
                  type="button"
                  className={styles.result}
                  onClick={(event) => open(app.id, undefined, originOf(event))}
                >
                  <AppIcon app={app} size={40} />
                  <span className={styles.text}>
                    <span className={styles.title}>{app.title}</span>
                    <span className={styles.description}>{app.description}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : projects.length === 0 ? (
          <p className={styles.empty} role="status">
            No apps or projects match “{query}”.
          </p>
        ) : null}
      </div>
    </motion.div>
  );
}
