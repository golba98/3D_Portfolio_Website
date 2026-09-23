import { useExperience } from '../../store/experience';
import styles from './SkipLink.module.css';

/** Keyboard-first escape hatch past the 3D world, visible when focused. */
export function SkipLink() {
  const enterDesktopDirectly = useExperience((s) => s.enterDesktopDirectly);
  return (
    <a
      className={styles.skip}
      href="#/desktop"
      onClick={(event) => {
        event.preventDefault();
        enterDesktopDirectly();
      }}
    >
      Skip to portfolio
    </a>
  );
}
