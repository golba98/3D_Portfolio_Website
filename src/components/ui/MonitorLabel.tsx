import { useCallback } from 'react';
import { SCREEN } from '../../config/scene';
import { useEntryDevice } from '../../hooks/useEntryDevice';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useLookStops } from '../../lib/touchLook';
import { useExperience } from '../../store/experience';
import { monitorLabelElement, useMonitorHover } from '../../store/monitorHover';
import styles from './MonitorLabel.module.css';

/**
 * "Enter System" tag that floats above the centre monitor. Positioned by
 * MonitorInteraction. Pointers get it on hover; touch screens can't hover, so
 * there it stays up as a "tap here" cue.
 */
export function MonitorLabel() {
  const hovered = useMonitorHover((s) => s.hovered);
  const phase = useExperience((s) => s.phase);
  const touch = useMediaQuery('(pointer: coarse)');
  // Phones go in through the phone, everything else through the monitor (see useEntryDevice).
  const entry = useEntryDevice();
  // Slid over to something else, the way in (and its cue) is off to the side.
  const facingEntry = useLookStops((s) => s.nearest === entry);
  const register = useCallback((element: HTMLDivElement | null) => {
    monitorLabelElement.current = element;
  }, []);

  return (
    <div ref={register} className={styles.anchor} aria-hidden="true">
      <span className={styles.label} data-visible={(hovered || (touch && facingEntry)) && phase === 'exploring'} data-touch={touch}>
        {entry === 'phone' ? SCREEN.phoneTapLabel : touch ? SCREEN.tapLabel : SCREEN.hoverLabel}
      </span>
    </div>
  );
}
