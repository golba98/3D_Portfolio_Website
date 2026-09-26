import { useEffect, useState } from 'react';
import { knownHardware } from '../../data/hardware';
import { useDetectedDevice } from '../../hooks/useEntryDevice';
import { useLookStops, type LookStop } from '../../lib/touchLook';
import styles from './TouchNav.module.css';

const STOPS: ReadonlyArray<{ id: LookStop; label: string }> = [
  { id: 'pc', label: 'PC' },
  { id: 'phone', label: 'Phone' },
  { id: 'monitor', label: 'Monitor' },
  { id: 'board', label: 'Board' },
];

/** How long the "drag to look around" hint waits for a first drag before fading on its own. */
const HINT_MS = 6000;

/**
 * Touch screens' way around the desk: jump buttons for the PC, the monitor
 * and the board, a one-time drag hint, and a caption for the PC. Dragging and
 * pinching the scene itself is handled by scene/useTouchLook.ts.
 */
export function TouchNav({ visible }: { visible: boolean }) {
  const nearest = useLookStops((s) => s.nearest);
  const ready = useLookStops((s) => s.stops !== null);
  const hintSeen = useLookStops((s) => s.hintSeen);
  const goTo = useLookStops((s) => s.goTo);
  // Only this screen's own way in: the phone on phones, the monitor elsewhere.
  const hidden: LookStop = useDetectedDevice() === 'phone' ? 'monitor' : 'phone';
  const [hintExpired, setHintExpired] = useState(false);

  useEffect(() => {
    if (!visible || hintSeen) return;
    const timer = window.setTimeout(() => setHintExpired(true), HINT_MS);
    return () => window.clearTimeout(timer);
  }, [visible, hintSeen]);

  const specs = knownHardware().map((spec) => (spec.label === 'GPU memory' ? `${spec.value} GPU` : spec.value));

  return (
    <div className={styles.nav}>
      <p className={styles.hint} data-visible={visible && !hintSeen && !hintExpired} aria-hidden="true">
        <span className={styles.hintArrows}>⟵</span> Drag to look around <span className={styles.hintArrows}>⟶</span>
      </p>
      <p className={styles.caption} data-visible={visible && nearest === 'pc'}>
        <strong>My PC</strong> · {specs.join(' · ')}
      </p>
      <div
        className={styles.chips}
        role="group"
        aria-label="Look at"
        data-visible={visible && ready}
      >
        {STOPS.filter((stop) => stop.id !== hidden).map((stop) => (
          <button
            key={stop.id}
            type="button"
            className={styles.chip}
            aria-pressed={nearest === stop.id}
            tabIndex={visible ? 0 : -1}
            onClick={() => goTo(stop.id)}
          >
            {stop.label}
          </button>
        ))}
      </div>
    </div>
  );
}
