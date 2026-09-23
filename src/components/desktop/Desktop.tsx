import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { isAppId } from '../../apps/registry';
import { TIMINGS } from '../../config/timings';
import { useIsCompact } from '../../hooks/useIsCompact';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useWindows } from '../../store/windows';
import type { AppId } from '../../types/apps';
import { DesktopShell } from './DesktopShell';
import { MobileShell } from './MobileShell';
import styles from './Desktop.module.css';

/** App named in the URL (#/desktop/<app>), if any. */
function appFromHash(): AppId | null {
  const segment = window.location.hash.replace(/^#\/desktop\/?/, '').split('/')[0] ?? '';
  return isAppId(segment) ? segment : null;
}

/** The portfolio OS. Crossfades in over the 3D monitor (or straight in from a deep link). */
export default function Desktop() {
  const compact = useIsCompact();
  const reducedMotion = useReducedMotion();
  const [initialApp] = useState(appFromHash);

  // A deep link (#/desktop/<app>) opens its app once the crossfade has
  // finished. Otherwise the desktop starts empty, like a fresh login.
  useEffect(() => {
    if (compact || !initialApp) return;
    const delay = reducedMotion ? 0 : TIMINGS.desktopCrossfade * 1000;
    const timer = window.setTimeout(() => useWindows.getState().open(initialApp), delay);
    return () => window.clearTimeout(timer);
  }, [compact, initialApp, reducedMotion]);

  return (
    <motion.div
      className={styles.desktop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? TIMINGS.reducedMotionFade : TIMINGS.desktopCrossfade, ease: 'easeOut' }}
    >
      {compact ? <MobileShell initialApp={initialApp} /> : <DesktopShell />}
    </motion.div>
  );
}
