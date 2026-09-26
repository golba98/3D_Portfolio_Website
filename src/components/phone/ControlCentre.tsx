import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { profile } from '../../data/profile';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useSwipe } from '../../hooks/useSwipe';
import { Icon } from '../icons/Icon';
import { useSystemActions, type SystemAction } from '../shell/systemActions';
import { usePhone } from './phoneStore';
import styles from './ControlCentre.module.css';

/** Control Centre labels are a word or two; the full name stays the accessible one. */
const SHORT_LABELS: Record<SystemAction['id'], string> = {
  cv: 'CV',
  github: 'GitHub',
  email: 'Email',
  leave: '3D desk',
};

/**
 * iOS Control Centre, pulled down from the status bar: a me card and round
 * buttons for the CV, GitHub, email and the way back to the 3D desk. Push it
 * back up, tap outside it, or press Escape to close it.
 */
export function ControlCentre() {
  const reducedMotion = useReducedMotion();
  const setOverlay = usePhone((s) => s.setOverlay);
  const actions = useSystemActions();
  const panel = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState(0);
  useFocusTrap(panel, true);

  const close = (): void => setOverlay('none');
  const swipe = useSwipe({
    axis: 'y',
    onMove: (offset) => setDrag(Math.min(0, offset)),
    onEnd: (offset, velocity) => {
      setDrag(0);
      if (offset < -48 || velocity < -0.4) close();
    },
    onCancel: () => setDrag(0),
  });

  const buttons: SystemAction[] = [
    ...actions.filter((a) => a.id !== 'leave'),
    { id: 'email', icon: 'mail', label: 'Email', href: `mailto:${profile.email}` },
    ...actions.filter((a) => a.id === 'leave'),
  ];

  return (
    <motion.div
      className={styles.backdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.22 }}
      {...swipe}
      onPointerDown={(event) => {
        swipe.onPointerDown(event);
        if (event.target === event.currentTarget) close();
      }}
    >
      <motion.div
        ref={panel}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Control Centre"
        initial={{ y: reducedMotion ? 0 : -24, scale: reducedMotion ? 1 : 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: reducedMotion ? 0 : -24, scale: reducedMotion ? 1 : 0.96 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        style={drag ? { translate: `0 ${drag}px` } : undefined}
        onKeyDown={(event) => {
          if (event.key === 'Escape') close();
        }}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className={`${styles.module} ${styles.buttons}`}>
          {buttons.map((button) => {
            const accent = button.id === 'leave';
            const body = (
              <>
                <span className={styles.round} data-accent={accent || undefined}>
                  <Icon name={button.icon} size={22} strokeWidth={2} />
                </span>
                <span className={styles.label} aria-hidden="true">
                  {SHORT_LABELS[button.id]}
                </span>
              </>
            );
            return button.href ? (
              <a
                key={button.id}
                className={styles.button}
                aria-label={button.label}
                href={button.href}
                download={button.download || undefined}
                target={/^https?:/.test(button.href) ? '_blank' : undefined}
                rel={/^https?:/.test(button.href) ? 'noreferrer' : undefined}
              >
                {body}
              </a>
            ) : (
              <button
                key={button.id}
                type="button"
                className={styles.button}
                aria-label={button.label}
                onClick={() => {
                  close();
                  button.onSelect?.();
                }}
              >
                {body}
              </button>
            );
          })}
        </div>

        <div className={`${styles.module} ${styles.me}`}>
          <span className={styles.avatar} aria-hidden="true">
            JV
          </span>
          <p className={styles.name}>{profile.name}</p>
          <p className={styles.sub}>{profile.role}</p>
          <p className={styles.sub}>{profile.location}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
