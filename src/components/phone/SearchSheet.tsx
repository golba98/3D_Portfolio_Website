import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { APPS } from '../../apps/registry';
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

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return APPS;
    return APPS.filter((app) => [app.title, app.description, ...app.keywords].some((text) => text.toLowerCase().includes(q)));
  }, [query]);

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
        if (event.key === 'Escape') close();
      }}
    >
      <div className={styles.bar}>
        <label className={styles.field}>
          <Icon name="search" size={16} />
          <input
            type="search"
            value={query}
            placeholder="Search"
            aria-label="Search apps"
            enterKeyHint="go"
            autoFocus
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              const first = results[0];
              if (event.key === 'Enter' && first) {
                event.currentTarget.blur();
                open(first.id);
              }
            }}
          />
        </label>
        <button type="button" className={styles.cancel} onClick={close}>
          Cancel
        </button>
      </div>

      {results.length > 0 ? (
        <ul className={styles.results} aria-label="Apps">
          {results.map((app) => (
            <li key={app.id}>
              <button type="button" className={styles.result} onClick={(event) => open(app.id, undefined, originOf(event))}>
                <AppIcon app={app} size={40} />
                <span className={styles.text}>
                  <span className={styles.title}>{app.title}</span>
                  <span className={styles.description}>{app.description}</span>
                </span>
              </button>
            </li>
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
