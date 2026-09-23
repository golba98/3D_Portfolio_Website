import { useState } from 'react';
import { place, profile } from '../../data/profile';
import { lesotho, marker, outline, provinces, viewBox } from '../../data/zaMap';
import { Icon } from '../../components/icons/Icon';
import type { AppProps } from '../../types/apps';
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
    <article className={`${ui.page} ${styles.layout}`}>
      <div className={styles.details}>
        <h1 className={ui.h1}>Get in touch.</h1>
        <p className={ui.lede}>
          {profile.role} · {profile.location}
        </p>

        <ul className={`${ui.list} ${styles.channels}`}>
          <li>
            <Icon name="mail" size={18} />
            <div className={styles.channel}>
              <span className={`${ui.muted} ${ui.small}`}>Email</span>
              <a className={ui.link} href={`mailto:${profile.email}`}>
                {profile.email}
              </a>
            </div>
            <button type="button" className={ui.button} onClick={() => void copyEmail()} aria-label="Copy email address">
              <Icon name={copied ? 'check' : 'copy'} />
              <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </li>
          <li>
            <Icon name="github" size={18} />
            <div className={styles.channel}>
              <span className={`${ui.muted} ${ui.small}`}>GitHub</span>
              <a className={ui.link} href={profile.github} target="_blank" rel="noreferrer">
                @{profile.githubUsername}
              </a>
            </div>
          </li>
          <li>
            <Icon name="file" size={18} />
            <div className={styles.channel}>
              <span className={`${ui.muted} ${ui.small}`}>CV</span>
              <a className={ui.link} href={profile.resumeUrl} download>
                Resume.pdf
              </a>
            </div>
          </li>
        </ul>

        <div className={ui.actions}>
          <a className={`${ui.button} ${ui.primary}`} href={`mailto:${profile.email}`}>
            <Icon name="mail" /> Send an email
          </a>
          <a className={ui.button} href={profile.resumeUrl} download>
            <Icon name="download" /> Download CV
          </a>
        </div>
      </div>

      <figure className={styles.map}>
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
    </article>
  );
}
