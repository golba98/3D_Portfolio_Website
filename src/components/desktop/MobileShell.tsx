import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { APPS, getApp } from '../../apps/registry';
import { profile } from '../../data/profile';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { AppId } from '../../types/apps';
import { Icon } from '../icons/Icon';
import { AppHost } from './AppHost';
import { AppIcon } from './AppIcon';
import { TopBar } from './TopBar';
import styles from './MobileShell.module.css';

interface MobileShellProps {
  initialApp: AppId | null;
}

interface ActiveApp {
  id: AppId;
  arg?: string;
  /** Bumped on each open so the app remounts at a new argument. */
  key: number;
}

/**
 * Small screens: a home screen of apps, and one full-screen app at a time.
 * Floating windows don't work at phone widths, so the metaphor adapts.
 */
export function MobileShell({ initialApp }: MobileShellProps) {
  const [active, setActive] = useState<ActiveApp | null>(initialApp ? { id: initialApp, key: 0 } : null);
  const reducedMotion = useReducedMotion();
  const heading = useRef<HTMLHeadingElement>(null);

  const openApp = (id: AppId, arg?: string): void => setActive((prev) => ({ id, arg, key: (prev?.key ?? 0) + 1 }));
  const goHome = (): void => setActive(null);

  useEffect(() => {
    const hash = active ? `#/desktop/${active.id}` : '#/desktop';
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash);
    if (active) heading.current?.focus({ preventScroll: true });
  }, [active]);

  const slide = reducedMotion ? 0 : 24;

  return (
    <div className={styles.shell}>
      <TopBar leftLabel={active ? 'Home' : 'Apps'} onLeft={goHome} />
      <AnimatePresence mode="wait" initial={false}>
        {active ? (
          <motion.section
            key={`app-${active.id}-${active.key}`}
            className={styles.app}
            aria-labelledby="mobile-app-title"
            initial={{ opacity: 0, x: slide }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: slide }}
            transition={{ duration: 0.18 }}
          >
            <header className={styles.appBar}>
              <button type="button" className={styles.back} onClick={goHome} aria-label="Back to home">
                <Icon name="back" size={18} />
              </button>
              <h2 id="mobile-app-title" className={styles.appTitle} ref={heading} tabIndex={-1}>
                {getApp(active.id).title}
              </h2>
            </header>
            <div className={styles.appBody}>
              <AppHost appId={active.id} arg={active.arg} openApp={openApp} />
            </div>
          </motion.section>
        ) : (
          <motion.main
            key="home"
            className={styles.home}
            initial={{ opacity: 0, x: -slide }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -slide }}
            transition={{ duration: 0.18 }}
          >
            <div className={styles.intro}>
              <h1 className={styles.name}>{profile.name}</h1>
              <p className={styles.role}>
                {profile.role} · {profile.location}
              </p>
              <p className={styles.headline}>{profile.headline.join(' ')}</p>
            </div>
            <ul className={styles.grid} aria-label="Apps">
              {APPS.map((app) => (
                <li key={app.id}>
                  <button type="button" className={styles.tile} onClick={() => openApp(app.id)}>
                    <AppIcon app={app} size={60} />
                    <span className={styles.tileLabel}>{app.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}
