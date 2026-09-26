import type { MouseEvent } from 'react';
import type { AppDefinition } from '../../types/apps';
import { AppIcon } from '../desktop/AppIcon';
import { Icon, type IconName } from '../icons/Icon';
import styles from './AppTile.module.css';

type TileArt = { app: AppDefinition } | { icon: IconName };

type AppTileProps = TileArt & {
  /** Accessible name (there's no visible label, as on Jordan's iPhone). */
  title: string;
  description?: string;
  /** Tile edge in CSS pixels. */
  size: number;
} & ({ onOpen: (event: MouseEvent<HTMLElement>) => void } | { href: string; download?: boolean });

/**
 * An iOS dark-mode home screen icon: a rounded-square tile of dark glass with
 * the app's colour artwork (or a web clip's glyph) on it, no label.
 */
export function AppTile(props: AppTileProps) {
  const { title, description, size } = props;
  const art =
    'app' in props ? (
      <AppIcon app={props.app} size={Math.round(size * 0.64)} />
    ) : (
      <Icon name={props.icon} size={Math.round(size * 0.5)} strokeWidth={1.7} />
    );
  const tile = (
    <span className={styles.tile} style={{ width: size, height: size }}>
      {art}
    </span>
  );

  if ('href' in props) {
    const external = !props.download && /^https?:/.test(props.href);
    return (
      <a
        className={styles.button}
        href={props.href}
        download={props.download || undefined}
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer' : undefined}
        aria-label={title}
        title={title}
      >
        {tile}
      </a>
    );
  }
  return (
    <button type="button" className={styles.button} aria-label={title} aria-description={description} title={title} onClick={props.onOpen}>
      {tile}
    </button>
  );
}
