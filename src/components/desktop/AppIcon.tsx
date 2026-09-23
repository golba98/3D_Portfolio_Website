import type { AppDefinition } from '../../types/apps';
import styles from './AppIcon.module.css';

interface AppIconProps {
  app: AppDefinition;
  size?: number;
}

/** The app's full-colour icon, as used in the dock, overview and mobile home screen. */
export function AppIcon({ app, size = 44 }: AppIconProps) {
  return <img className={styles.icon} src={app.iconSrc} width={size} height={size} alt="" draggable={false} aria-hidden="true" />;
}
