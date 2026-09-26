import { useEffect, useState } from 'react';
import { useNow } from '../../hooks/useNow';
import { useSwipe } from '../../hooks/useSwipe';
import { formatTime } from '../../lib/format';
import { Icon } from '../icons/Icon';
import { usePhone } from './phoneStore';
import styles from './StatusBar.module.css';

interface BatteryManagerLike extends EventTarget {
  level: number;
}

/**
 * The visitor's real battery level (0–100), where the browser tells us
 * (Chrome on Android does; Safari doesn't). Null means unknown: the icon then
 * shows full with no number, rather than a made-up one.
 */
function useBatteryLevel(): number | null {
  const [level, setLevel] = useState<number | null>(null);
  useEffect(() => {
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManagerLike> };
    if (!nav.getBattery) return;
    let battery: BatteryManagerLike | null = null;
    const update = (): void => {
      if (battery) setLevel(Math.round(battery.level * 100));
    };
    void nav
      .getBattery()
      .then((b) => {
        battery = b;
        update();
        b.addEventListener('levelchange', update);
      })
      .catch(() => undefined);
    return () => battery?.removeEventListener('levelchange', update);
  }, []);
  return level;
}

/**
 * The iPhone status bar, as on Jordan's phone: the time on the left, the
 * Dynamic Island's gap in the middle, Wi-Fi and battery on the right. Tap it,
 * or pull it down, for Control Centre.
 */
export function StatusBar() {
  const now = useNow();
  const appOpen = usePhone((s) => s.active !== null);
  const controlsOpen = usePhone((s) => s.overlay === 'quick');
  const setOverlay = usePhone((s) => s.setOverlay);
  const battery = useBatteryLevel();
  const pull = useSwipe({
    axis: 'y',
    onEnd: (offset, velocity) => {
      if (offset > 24 || velocity > 0.3) setOverlay('quick');
    },
  });

  return (
    <header className={styles.bar} data-app-open={appOpen} {...pull}>
      <button
        type="button"
        className={styles.button}
        aria-label="Control Centre"
        aria-expanded={controlsOpen}
        onClick={() => setOverlay(controlsOpen ? 'none' : 'quick')}
      >
        <time className={styles.clock} dateTime={now.toISOString()}>
          {formatTime(now)}
        </time>
        <span className={styles.island} aria-hidden="true" />
        <span className={styles.indicators}>
          <Icon name="wifi" size={17} strokeWidth={2.2} />
          <span className={styles.battery} data-level={battery !== null} aria-hidden="true">
            {battery !== null ? <span className={styles.level}>{battery}</span> : <span className={styles.charge} />}
          </span>
        </span>
      </button>
    </header>
  );
}
