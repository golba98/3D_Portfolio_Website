import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { getApp } from '../../apps/registry';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useSwipe } from '../../hooks/useSwipe';
import { AppIcon } from '../desktop/AppIcon';
import { Icon } from '../icons/Icon';
import { originOf } from './homeLayout';
import { usePhone, type RunningApp } from './phoneStore';
import styles from './AppSwitcher.module.css';

/**
 * The iPhone app switcher: every open app as a card, most recent on the
 * right. Tap a card to go back to it, flick it up to close it, tap the
 * background to go back to whatever was on screen.
 */
export function AppSwitcher() {
  const running = usePhone((s) => s.running);
  const open = usePhone((s) => s.open);
  const setOverlay = usePhone((s) => s.setOverlay);
  const reducedMotion = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLUListElement>(null);
  useFocusTrap(root, true);

  // Start at the most recent app, as iOS does.
  useEffect(() => {
    const list = strip.current;
    if (list) list.scrollLeft = list.scrollWidth;
  }, []);

  const close = (): void => setOverlay('none');

  return (
    <motion.div
      ref={root}
      className={styles.switcher}
      role="dialog"
      aria-modal="true"
      aria-label="Open apps"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(event) => {
        if (event.target === event.currentTarget || event.target === strip.current) close();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') close();
      }}
    >
      {running.length > 0 ? (
        <motion.ul
          ref={strip}
          className={styles.cards}
          initial={{ scale: reducedMotion ? 1 : 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {running.map((app) => (
            <Card key={app.id} app={app} onOpen={(event) => open(app.id, undefined, originOf(event))} />
          ))}
        </motion.ul>
      ) : (
        <p className={styles.empty}>No open apps</p>
      )}
    </motion.div>
  );
}

/** One open app: tap to switch to it, flick it up (or ×) to close it. */
function Card({ app, onOpen }: { app: RunningApp; onOpen: (event: MouseEvent<HTMLElement>) => void }) {
  const close = usePhone((s) => s.close);
  const [lift, setLift] = useState(0);
  const def = getApp(app.id);
  const chrome = def.chrome ?? 'adwaita';
  const swipe = useSwipe({
    axis: 'y',
    onMove: (offset) => setLift(Math.min(0, offset)),
    onEnd: (offset, velocity) => {
      if (offset < -90 || velocity < -0.5) close(app.id);
      else setLift(0);
    },
    onCancel: () => setLift(0),
  });

  return (
    <li
      className={styles.card}
      style={lift ? { transform: `translateY(${lift}px)`, opacity: Math.max(0.2, 1 + lift / 300) } : undefined}
      {...swipe}
    >
      <div className={styles.cardLabel}>
        <AppIcon app={def} size={24} />
        <span>{def.title}</span>
        <button type="button" className={styles.cardClose} aria-label={`Close ${def.title}`} onClick={() => close(app.id)}>
          <Icon name="close" size={14} strokeWidth={2.2} />
        </button>
      </div>
      <button type="button" className={styles.cardBody} data-chrome={chrome} aria-label={`Switch to ${def.title}`} onClick={onOpen}>
        <span className={styles.cardHeader} data-chrome={chrome}>
          {app.title ?? def.title}
        </span>
        <span className={styles.cardPreview} data-chrome={chrome}>
          <AppIcon app={def} size={72} />
        </span>
      </button>
    </li>
  );
}
