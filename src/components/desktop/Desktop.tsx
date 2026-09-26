import { useEffect, useState, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { isAppId } from '../../apps/registry';
import { PHONE_CONTAIN } from '../../config/cameraPoses';
import { TIMINGS } from '../../config/timings';
import { useDetectedDevice, useEntryDevice } from '../../hooks/useEntryDevice';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useSceneLayout } from '../../store/sceneLayout';
import { useWindows } from '../../store/windows';
import type { AppId } from '../../types/apps';
import { PhoneShell } from '../phone/PhoneShell';
import { DesktopShell } from './DesktopShell';
import styles from './Desktop.module.css';

/** App named in the URL (#/desktop/<app>), if any. */
function appFromHash(): AppId | null {
  const segment = window.location.hash.replace(/^#\/desktop\/?/, '').split('/')[0] ?? '';
  return isAppId(segment) ? segment : null;
}

/** iPhone 15 Pro display, width / height, for when the model hasn't been measured (a deep link). */
const FALLBACK_PHONE_ASPECT = 393 / 852;

/**
 * The portfolio OS the visitor went into: the phone OS through the phone, the
 * GNOME desktop through the monitor. Crossfades in over the 3D device (or
 * straight in from a deep link).
 */
export default function Desktop() {
  const entry = useEntryDevice();
  const detected = useDetectedDevice();
  const phoneScreen = useSceneLayout((s) => s.phoneScreen);
  const reducedMotion = useReducedMotion();
  const [initialApp] = useState(appFromHash);

  // A deep link (#/desktop/<app>) opens its app once the crossfade has
  // finished. Otherwise the desktop starts empty, like a fresh login.
  useEffect(() => {
    if (entry === 'phone' || !initialApp) return;
    const delay = reducedMotion ? 0 : TIMINGS.desktopCrossfade * 1000;
    const timer = window.setTimeout(() => useWindows.getState().open(initialApp), delay);
    return () => window.clearTimeout(timer);
  }, [entry, initialApp, reducedMotion]);

  // The phone on a computer (chosen anyway): a phone-sized screen where the 3D phone's was.
  const framed = entry === 'phone' && detected === 'monitor';
  const frameVars = {
    '--phone-aspect': phoneScreen ? phoneScreen.width / phoneScreen.height : FALLBACK_PHONE_ASPECT,
    '--phone-frame-height': `${PHONE_CONTAIN.fill * 100}vh`,
  } as CSSProperties;

  return (
    <motion.div
      className={styles.desktop}
      data-framed={framed || undefined}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? TIMINGS.reducedMotionFade : TIMINGS.desktopCrossfade, ease: 'easeOut' }}
    >
      {entry === 'monitor' ? (
        <DesktopShell />
      ) : framed ? (
        <div className={styles.phoneFrame} style={frameVars}>
          <PhoneShell initialApp={initialApp} />
        </div>
      ) : (
        <PhoneShell initialApp={initialApp} />
      )}
    </motion.div>
  );
}
