import { useState } from 'react';
import { place, profile } from '../../data/profile';
import { lesotho, marker, outline, provinces, viewBox } from '../../data/zaMap';
import { HeaderBar, HeaderLink } from '../../components/adw/HeaderBar';
import { ToolbarView } from '../../components/adw/ToolbarView';
import { Icon } from '../../components/icons/Icon';
import type { AppProps } from '../../types/apps';
import { ActionRow } from '../shared/ActionRow';
import ui from '../shared/ui.module.css';
import styles from './Contact.module.css';

export default function Contact(_props: AppProps) {
  const [copied, setCopied] = useState(false);

  const copyEmail = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked (permissions / insecure context); the mailto link still works.
    }
  };

  return (
    <ToolbarView
      top={<HeaderBar title="Contact" end={<HeaderLink icon="mail" label="Send Email" text="Send Email" href={`mailto:${profile.email}`} suggested />} />}
    >
      <article className={`${ui.page} ${ui.narrow}`}>
        <section aria-labelledby="contact-channels">
          <h2 id="contact-channels" className={ui.groupTitle}>
            Get in Touch
          </h2>
          <p className={ui.groupDescription}>
            {profile.role} · {profile.location}
          </p>
          <ul className={ui.list}>
            <ActionRow
              icon="mail"
              title={
                <a className={ui.link} href={`mailto:${profile.email}`}>
                  <EmailAddress address={profile.email} />
                </a>
              }
              subtitle="Email"
              suffix={
                <button type="button" className={`${ui.button} ${ui.flat}`} onClick={() => void copyEmail()} aria-label="Copy email address" title="Copy">
                  <Icon name={copied ? 'check' : 'copy'} size={16} strokeWidth={2} />
                  <span className="visually-hidden" aria-live="polite">
                    {copied ? 'Copied' : ''}
                  </span>
                </button>
              }
            />
            <ActionRow icon="github" title={`@${profile.githubUsername}`} subtitle="GitHub" href={profile.github} />
            <ActionRow icon="file" title="Resume.pdf" subtitle="CV" href={profile.resumeUrl} download />
          </ul>
        </section>

        <section className={ui.section} aria-labelledby="contact-location">
          <h2 id="contact-location" className={ui.groupTitle}>
            Location
          </h2>
          <figure className={`${ui.card} ${styles.map}`}>
            <svg viewBox={viewBox} role="img" aria-label="Map of South Africa divided into its nine provinces, with the Eastern Cape filled">
              {provinces.map((province) => (
                <path key={province.name} className={province.name === 'Eastern Cape' ? styles.home : styles.province} d={province.d} />
              ))}
              <path className={styles.outline} d={outline} />
              <path className={styles.outline} d={lesotho} />
              <circle className={styles.marker} cx={marker.x} cy={marker.y} r="7" />
            </svg>
            <figcaption>
              <strong>{place.heading}</strong>
              <span>
                {place.caption}. {place.note}
              </span>
            </figcaption>
          </figure>
        </section>
      </article>
    </ToolbarView>
  );
}

/**
 * An email address that only ever wraps after the "@" (row text otherwise
 * breaks anywhere, which left "gmail.co" / "m" on a phone).
 */
function EmailAddress({ address }: { address: string }) {
  const at = address.indexOf('@');
  if (at < 0) return <span className={ui.nowrap}>{address}</span>;
  return (
    <>
      <span className={ui.nowrap}>{address.slice(0, at + 1)}</span>
      <wbr />
      <span className={ui.nowrap}>{address.slice(at + 1)}</span>
    </>
  );
}
