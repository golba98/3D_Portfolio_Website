import { useLayoutEffect, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { isAppId } from '../../apps/registry';
import { PHONE_CONTAIN } from '../../config/cameraPoses';
import { TIMINGS } from '../../config/timings';
import { useDetectedDevice, useEntryDevice } from '../../hooks/useEntryDevice';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useSceneLayout } from '../../store/sceneLayout';
import { useWindows } from '../../store/windows';
import { usePhone } from '../phone/phoneStore';
import { PhoneShell } from '../phone/PhoneShell';
import { DesktopShell } from './DesktopShell';
import styles from './Desktop.module.css';

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
  useLayoutEffect(() => {
    function applyRoute() {
      const [base, shell, id, arg] = location.hash.split('/');
      if (base !== '#' || shell !== 'desktop') return;
      if (id && isAppId(id)) {
        let destination = arg ?? '';
        try {
          destination = decodeURIComponent(destination);
        } catch {
          /* Show the unavailable project notice. */
        }
        const open = entry === 'phone' ? usePhone.getState().open : useWindows.getState().open;
        open(id, id === 'projects' ? destination : undefined);
      } else {
        if (entry === 'phone') usePhone.getState().home();
        else
          useWindows.setState((state) => ({
            focusedId: null,
            overviewOpen: false,
            windows: state.windows.map((w) =>
              w.mode === 'minimized' ? w : { ...w, restoreMode: w.mode, mode: 'minimized' },
            ),
          }));
      }
    }
    applyRoute();
    window.addEventListener('hashchange', applyRoute);
    return () => window.removeEventListener('hashchange', applyRoute);
  }, [entry]);

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
          <PhoneShell />
        </div>
      ) : (
        <PhoneShell />
      )}
    </motion.div>
  );
}
