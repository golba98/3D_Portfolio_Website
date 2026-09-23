import { background, backgroundSection, certifications, education, interests, leadership, workHistory } from '../../data/background';
import { profile } from '../../data/profile';
import { Icon } from '../../components/icons/Icon';
import type { AppProps } from '../../types/apps';
import ui from '../shared/ui.module.css';
import styles from './About.module.css';

export default function About({ openApp }: AppProps) {
  return (
    <article className={`${ui.page} ${ui.narrow}`}>
      <header className={styles.header}>
        <span className={styles.avatar} aria-hidden="true">
          JV
        </span>
        <div>
          <h1 className={ui.h1}>{profile.name}</h1>
          <p className={ui.muted}>
            {profile.role} · {profile.location}
          </p>
        </div>
      </header>

      <p className={styles.headline}>
        {profile.headline.map((line) => (
          <span key={line}>{line} </span>
        ))}
      </p>
      <p className={ui.lede}>{profile.lede}</p>

      <div className={ui.actions}>
        <button type="button" className={`${ui.button} ${ui.primary}`} onClick={() => openApp('projects')}>
          <Icon name="folder-code" /> See my projects
        </button>
        <a className={ui.button} href={profile.resumeUrl} download>
          <Icon name="download" /> Download CV
        </a>
        <button type="button" className={ui.button} onClick={() => openApp('contact')}>
          <Icon name="mail" /> Contact
        </button>
      </div>

      <section className={ui.section} aria-labelledby="about-background">
        <p className={ui.eyebrow}>{backgroundSection.eyebrow}</p>
        <h2 id="about-background" className={ui.h2}>
          {backgroundSection.heading}
        </h2>
        <ol className={styles.timeline}>
          {background.map((entry) => (
            <li key={entry.title}>
              <h3 className={ui.h3}>{entry.title}</h3>
              <p className={`${ui.muted} ${ui.small}`}>{entry.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={ui.section} aria-labelledby="about-education">
        <h2 id="about-education" className={ui.h2}>
          Education
        </h2>
        <div className={ui.card}>
          <h3 className={ui.h3}>
            {education.institution} — {education.degree}
          </h3>
          <p className={`${ui.muted} ${ui.small}`}>{education.mode}</p>
          <p className={`${ui.small} ${styles.spaced}`}>{education.note}</p>
        </div>
      </section>

      <section className={ui.section} aria-labelledby="about-work">
        <h2 id="about-work" className={ui.h2}>
          Work experience
        </h2>
        <ul className={ui.list}>
          {workHistory.map((job) => (
            <li key={job.title}>
              <div className={ui.row}>
                <h3 className={ui.h3}>{job.title}</h3>
                <span className={`${ui.muted} ${ui.small}`}>{job.period}</span>
              </div>
              <ul className={styles.points}>
                {job.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section className={ui.section} aria-labelledby="about-certs">
        <h2 id="about-certs" className={ui.h2}>
          Certifications
        </h2>
        <ul className={ui.list}>
          {certifications.map((cert) => (
            <li key={cert.title}>
              <h3 className={ui.h3}>{cert.title}</h3>
              <p className={`${ui.muted} ${ui.small}`}>{cert.issuer}</p>
              {cert.note && <p className={`${ui.small} ${styles.spaced}`}>{cert.note}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className={ui.section} aria-labelledby="about-leadership">
        <h2 id="about-leadership" className={ui.h2}>
          Leadership &amp; involvement
        </h2>
        <ul className={ui.list}>
          {leadership.map((entry) => (
            <li key={entry.title}>
              <h3 className={ui.h3}>{entry.title}</h3>
              <p className={`${ui.muted} ${ui.small}`}>{entry.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={ui.section} aria-labelledby="about-interests">
        <h2 id="about-interests" className={ui.h2}>
          Skills and interests
        </h2>
        <ul className={ui.chips}>
          {interests.map((interest) => (
            <li key={interest} className={ui.chip}>
              {interest}
            </li>
          ))}
        </ul>
      </section>

      <section className={ui.section} aria-labelledby="about-cv">
        <h2 id="about-cv" className={ui.h2}>
          From my CV
        </h2>
        <p className={`${ui.prose} ${ui.muted}`}>{profile.cvSummary}</p>
      </section>
    </article>
  );
}
