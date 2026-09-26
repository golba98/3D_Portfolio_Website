import { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useDetectedDevice } from '../../hooks/useEntryDevice';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useExperience } from '../../store/experience';
import type { EntryDevice } from '../../types/experience';
import styles from './DevicePrompt.module.css';

const COPY: Record<EntryDevice, { title: string; body: string; instead: string }> = {
  monitor: {
    title: 'Made for desktop',
    body: "The monitor runs the desktop version of this site, built for big screens. It's 16:9, so on a phone it won't fit well.",
    instead: 'Use the phone',
  },
  phone: {
    title: 'Made for phones',
    body: 'The phone runs the mobile version of this site, built for phones. On a computer it opens in a phone-sized screen.',
    instead: 'Use the monitor',
  },
};

/**
 * Asks before going into the device that isn't made for this screen (the
 * monitor on a phone, the phone on a computer): suggests the right one, but
 * lets the visitor open the other anyway.
 */
export function DevicePrompt() {
  const device = useExperience((s) => s.devicePrompt);
  return <AnimatePresence>{device && <Prompt key={device} device={device} />}</AnimatePresence>;
}

function Prompt({ device }: { device: EntryDevice }) {
  const detected = useDetectedDevice();
  const enterDevice = useExperience((s) => s.enterDevice);
  const dismissPrompt = useExperience((s) => s.dismissPrompt);
  const reducedMotion = useReducedMotion();
  const card = useRef<HTMLDivElement>(null);
  useFocusTrap(card, true);
  const copy = COPY[device];

  return (
    <motion.div
      className={styles.backdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.18 }}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) dismissPrompt();
      }}
    >
      <motion.div
        ref={card}
        className={styles.card}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="device-prompt-title"
        aria-describedby="device-prompt-body"
        initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.96 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            dismissPrompt();
          }
        }}
      >
        <h2 id="device-prompt-title" className={styles.title}>
          {copy.title}
        </h2>
        <p id="device-prompt-body" className={styles.body}>
          {copy.body}
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} autoFocus onClick={() => enterDevice(detected, false)}>
            {copy.instead}
          </button>
          <button type="button" className={styles.secondary} onClick={() => enterDevice(device, true)}>
            Open anyway
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
