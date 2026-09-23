import { profile } from '../../data/profile';
import { useExperience } from '../../store/experience';
import styles from './Fallback.module.css';

/** Shown when WebGL or the model is unavailable. The portfolio stays one click away. */
export function Fallback() {
  const reason = useExperience((s) => s.fallbackReason);
  const enterDesktopDirectly = useExperience((s) => s.enterDesktopDirectly);

  return (
    <main className={styles.fallback}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>
          {profile.role} · {profile.location}
        </p>
        <h1 className={styles.name}>{profile.name}</h1>
        <p className={styles.headline}>{profile.headline.join(' ')}</p>
        <p className={styles.notice} role="status">
          The 3D desk couldn't be shown{reason ? `: ${reason}` : '.'} Everything in the portfolio is still available.
        </p>
        <button type="button" className={styles.enter} onClick={enterDesktopDirectly} autoFocus>
          Open portfolio
        </button>
      </div>
    </main>
  );
}
