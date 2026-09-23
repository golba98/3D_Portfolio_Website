import { useProgress } from '@react-three/drei';
import { TIMINGS } from '../../config/timings';
import { useExperience } from '../../store/experience';
import styles from './LoadingScreen.module.css';

/** Black cover while the model streams in; fading it out is the intro's fade from black. */
export function LoadingScreen() {
  const phase = useExperience((s) => s.phase);
  const { progress } = useProgress();
  const visible = phase === 'loading';
  const percent = Math.round(progress);

  return (
    <div
      className={styles.cover}
      data-visible={visible}
      style={{ transitionDuration: `${TIMINGS.introFade}s` }}
      aria-hidden={!visible}
    >
      <div className={styles.inner} role="status" aria-live="polite">
        <p className={styles.text}>loading setup…</p>
        <div
          className={styles.track}
          role="progressbar"
          aria-label="Loading the 3D desk"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div className={styles.bar} style={{ transform: `scaleX(${progress / 100})` }} />
        </div>
      </div>
    </div>
  );
}
