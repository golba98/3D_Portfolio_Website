import { useCallback } from 'react';
import { SCREEN } from '../../config/scene';
import { useExperience } from '../../store/experience';
import { monitorLabelElement, useMonitorHover } from '../../store/monitorHover';
import styles from './MonitorLabel.module.css';

/** "Enter System" tag that floats above the centre monitor on hover. Positioned by MonitorInteraction. */
export function MonitorLabel() {
  const hovered = useMonitorHover((s) => s.hovered);
  const phase = useExperience((s) => s.phase);
  const register = useCallback((element: HTMLDivElement | null) => {
    monitorLabelElement.current = element;
  }, []);

  return (
    <div ref={register} className={styles.anchor} aria-hidden="true">
      <span className={styles.label} data-visible={hovered && phase === 'exploring'}>
        {SCREEN.hoverLabel}
      </span>
    </div>
  );
}
