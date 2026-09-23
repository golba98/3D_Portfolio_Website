import type { ReactNode } from 'react';
import { Icon, type IconName } from '../../components/icons/Icon';
import ui from './ui.module.css';

interface ActionRowProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Symbolic icon before the text. */
  icon?: IconName;
  /** Widgets or dim text after the text. */
  suffix?: ReactNode;
  /** Extra content under the subtitle (bullet points and the like). */
  children?: ReactNode;
  /** Makes the whole row a button, with a chevron. */
  onActivate?: () => void;
  /** Makes the whole row a link, with an external-link or download glyph. */
  href?: string;
  download?: boolean;
}

/** AdwActionRow, as an item of a boxed list (`ui.list`). */
export function ActionRow({ title, subtitle, icon, suffix, children, onActivate, href, download }: ActionRowProps) {
  const body = (
    <>
      {icon && (
        <span className={ui.rowIcon}>
          <Icon name={icon} size={16} strokeWidth={2} />
        </span>
      )}
      <span className={ui.rowText}>
        <span className={ui.rowTitle}>{title}</span>
        {subtitle && <span className={ui.rowSubtitle}>{subtitle}</span>}
        {children}
      </span>
      {suffix && <span className={ui.rowSuffix}>{suffix}</span>}
    </>
  );

  if (href) {
    const external = !download && /^https?:/.test(href);
    return (
      <li>
        <a
          className={ui.actionRow}
          data-activatable=""
          href={href}
          download={download || undefined}
          target={external ? '_blank' : undefined}
          rel={external ? 'noreferrer' : undefined}
        >
          {body}
          <span className={ui.rowSuffix}>
            <Icon name={download ? 'download' : 'external'} size={16} strokeWidth={2} />
          </span>
        </a>
      </li>
    );
  }

  if (onActivate) {
    return (
      <li>
        <button type="button" className={ui.actionRow} data-activatable="" onClick={onActivate}>
          {body}
          <span className={ui.rowSuffix}>
            <Icon name="chevron" size={16} strokeWidth={2} />
          </span>
        </button>
      </li>
    );
  }

  return <li className={ui.actionRow}>{body}</li>;
}
