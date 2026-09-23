import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useWindows } from '../../store/windows';
import styles from './FullscreenSupport.module.css';

const HINT_MS = 2500;

/**
 * Keeps the browser's fullscreen in step with the desktop's: a fullscreen
 * window takes the whole display, and leaving browser fullscreen (Esc, which
 * the browser handles itself) takes the window out of fullscreen too.
 */
export function FullscreenSupport() {
  const fullscreenId = useWindows((s) => s.windows.find((w) => w.mode === 'fullscreen')?.id ?? null);
  // The exit hint shows for a moment each time a window goes fullscreen.
  const [hint, setHint] = useState({ for: fullscreenId, expired: false });
  if (hint.for !== fullscreenId) setHint({ for: fullscreenId, expired: false });
  const showHint = fullscreenId !== null && !hint.expired;

  useEffect(() => {
    if (fullscreenId) {
      // Still inside the click or key press that asked for it, so the browser allows it.
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => undefined);
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    }
  }, [fullscreenId]);

  useEffect(() => {
    const onChange = (): void => {
      if (document.fullscreenElement) return;
      const { windows, toggleFullscreen } = useWindows.getState();
      windows.filter((w) => w.mode === 'fullscreen').forEach((w) => toggleFullscreen(w.id));
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      // Leaving the desktop (back to the 3D desk) leaves browser fullscreen too.
      if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    if (!fullscreenId) return;
    const timer = window.setTimeout(() => setHint((h) => ({ ...h, expired: true })), HINT_MS);
    return () => window.clearTimeout(timer);
  }, [fullscreenId]);

  return (
    <AnimatePresence>
      {showHint && (
        <motion.p
          key={fullscreenId}
          className={styles.hint}
          role="status"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          Press <kbd>F11</kbd> or <kbd>Esc</kbd> to exit full screen
        </motion.p>
      )}
    </AnimatePresence>
  );
}
