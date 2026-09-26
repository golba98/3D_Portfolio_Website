import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { Icon, type IconName } from '../icons/Icon';
import { useAppFrame, type WindowFrame } from './frame';
import styles from './HeaderBar.module.css';

interface HeaderBarProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Widgets packed at the start (left). */
  start?: ReactNode;
  /** Widgets packed at the end (right), before the window controls. */
  end?: ReactNode;
  /** Sidebar header bars take the sidebar's colour. */
  variant?: 'default' | 'sidebar';
  /** Last header bar in the window: in a floating window it gets the close button. */
  trailing?: boolean;
}

/** AdwHeaderBar: the app's title bar, drag handle and toolbar in one. */
export function HeaderBar({ title, subtitle, start, end, variant = 'default', trailing = true }: HeaderBarProps) {
  const frame = useAppFrame();
  const win = frame?.kind === 'window' ? frame : null;
  const mobile = frame?.kind === 'mobile' ? frame : null;

  const onDoubleClick = (event: MouseEvent<HTMLElement>): void => {
    if ((event.target as HTMLElement).closest('button, a, input')) return;
    win?.toggleMaximize();
  };

  return (
    <header
      className={styles.headerbar}
      data-variant={variant}
      data-backdrop={win ? !win.focused : undefined}
      // On the phone shell it becomes an iOS navigation bar (HeaderBar.module.css).
      data-platform={mobile ? 'ios' : undefined}
      onPointerDown={win?.startDrag}
      onDoubleClick={win ? onDoubleClick : undefined}
      onContextMenu={win?.openMenu}
    >
      <div className={styles.start}>
        {start}
      </div>
      {title !== undefined && (
        <div className={styles.title}>
          <span className={styles.titleText}>{title}</span>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
      )}
      <div className={styles.end}>
        {end}
        {win && trailing && <WindowControls frame={win} />}
      </div>
    </header>
  );
}

/** Maximise (or leave fullscreen) and close, as with button-layout 'appmenu:maximize,close'. */
function WindowControls({ frame }: { frame: WindowFrame }) {
  const fullscreen = frame.mode === 'fullscreen';
  const restorable = frame.mode === 'maximized' || frame.mode === 'tiled-left' || frame.mode === 'tiled-right';
  const [label, icon]: [string, IconName] = fullscreen
    ? ['Leave fullscreen', 'unfullscreen']
    : restorable
      ? ['Restore', 'restore']
      : ['Maximise', 'maximize'];
  return (
    <>
      <button
        type="button"
        className={styles.control}
        aria-label={`${label} ${frame.appTitle}`}
        title={label}
        onClick={fullscreen ? frame.toggleFullscreen : frame.toggleMaximize}
      >
        <Icon name={icon} size={12} strokeWidth={2.4} />
      </button>
      <button type="button" className={styles.control} aria-label={`Close ${frame.appTitle}`} title="Close" onClick={frame.close}>
        <Icon name="close" size={14} strokeWidth={2.2} />
      </button>
    </>
  );
}

interface HeaderButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  /** Accessible name; icon-only buttons show it as a tooltip too. */
  label: string;
  /** Visible text after the icon. */
  text?: string;
  suggested?: boolean;
}

/** A flat header-bar button (icon, or icon + text); `suggested` fills it with the accent. */
export function HeaderButton({ icon, label, text, suggested, className, ...rest }: HeaderButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.button} ${className ?? ''}`}
      data-suggested={suggested || undefined}
      aria-label={text ? undefined : label}
      title={text ? undefined : label}
      {...rest}
    >
      <Icon name={icon} size={16} strokeWidth={2} />
      {text && <span>{text}</span>}
    </button>
  );
}

interface HeaderLinkProps {
  icon: IconName;
  label: string;
  text?: string;
  href: string;
  download?: boolean;
  suggested?: boolean;
}

/** HeaderButton for navigation: opens a link or downloads a file. */
export function HeaderLink({ icon, label, text, href, download, suggested }: HeaderLinkProps) {
  const external = !download && /^https?:/.test(href);
  return (
    <a
      className={styles.button}
      data-suggested={suggested || undefined}
      href={href}
      download={download || undefined}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      aria-label={text ? undefined : label}
      title={text ? undefined : label}
    >
      <Icon name={icon} size={16} strokeWidth={2} />
      {text && <span>{text}</span>}
    </a>
  );
}
