import { background, backgroundSection, certifications, education, interests, leadership, workHistory } from '../../data/background';
import { profile } from '../../data/profile';
import { HeaderBar, HeaderLink } from '../../components/adw/HeaderBar';
import { ToolbarView } from '../../components/adw/ToolbarView';
import type { AppProps } from '../../types/apps';
import { ActionRow } from '../shared/ActionRow';
import ui from '../shared/ui.module.css';
import styles from './About.module.css';

/** Laid out like a contact card in GNOME Contacts. */
export default function About({ openApp }: AppProps) {
  return (
    <ToolbarView top={<HeaderBar title="About" end={<HeaderLink icon="download" label="Download CV" href={profile.resumeUrl} download />} />}>
      <article className={`${ui.page} ${ui.narrow}`}>
        <header className={ui.hero}>
          <span className={styles.avatar} aria-hidden="true">
            JV
          </span>
          <h1 className={ui.h1}>{profile.name}</h1>
          <p className={ui.muted}>
            {profile.role} · {profile.location}
          </p>
        </header>

        <div className={`${ui.card} ${styles.intro}`}>
          <p className={styles.headline}>{profile.headline.join(' ')}</p>
          <p className={ui.lede}>{profile.lede}</p>
        </div>

        <ul className={`${ui.list} ${ui.section}`} aria-label="Go to">
          <ActionRow icon="folder-code" title="Projects" subtitle="What I've built, and the model I trained" onActivate={() => openApp('projects')} />
          <ActionRow icon="mail" title="Contact" subtitle={profile.email} onActivate={() => openApp('contact')} />
        </ul>

        <section className={ui.section} aria-labelledby="about-background">
          <h2 id="about-background" className={ui.groupTitle}>
            {backgroundSection.heading}
          </h2>
          <ul className={ui.list}>
            {background.map((entry) => (
              <ActionRow key={entry.title} title={entry.title} subtitle={entry.detail} />
            ))}
          </ul>
        </section>

        <section className={ui.section} aria-labelledby="about-education">
          <h2 id="about-education" className={ui.groupTitle}>
            Education
          </h2>
          <ul className={ui.list}>
            <ActionRow icon="graduation" title={`${education.institution} — ${education.degree}`} subtitle={education.mode}>
              <span className={ui.rowSubtitle}>{education.note}</span>
            </ActionRow>
          </ul>
        </section>

        <section className={ui.section} aria-labelledby="about-work">
          <h2 id="about-work" className={ui.groupTitle}>
            Work Experience
          </h2>
          <ul className={ui.list}>
            {workHistory.map((job) => (
              <ActionRow key={job.title} title={job.title} subtitle={job.period}>
                <ul className={styles.points}>
                  {job.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </ActionRow>
            ))}
          </ul>
        </section>

        <section className={ui.section} aria-labelledby="about-certs">
          <h2 id="about-certs" className={ui.groupTitle}>
            Certifications
          </h2>
          <ul className={ui.list}>
            {certifications.map((cert) => (
              <ActionRow key={cert.title} title={cert.title} subtitle={cert.issuer}>
                {cert.note && <span className={ui.rowSubtitle}>{cert.note}</span>}
              </ActionRow>
            ))}
          </ul>
        </section>

        <section className={ui.section} aria-labelledby="about-leadership">
          <h2 id="about-leadership" className={ui.groupTitle}>
            Leadership &amp; Involvement
          </h2>
          <ul className={ui.list}>
            {leadership.map((entry) => (
              <ActionRow key={entry.title} title={entry.title} subtitle={entry.detail} />
            ))}
          </ul>
        </section>

        <section className={ui.section} aria-labelledby="about-interests">
          <h2 id="about-interests" className={ui.groupTitle}>
            Skills &amp; Interests
          </h2>
          <ul className={`${ui.chips} ${ui.card}`}>
            {interests.map((interest) => (
              <li key={interest} className={ui.chip}>
                {interest}
              </li>
            ))}
          </ul>
        </section>

        <section className={ui.section} aria-labelledby="about-cv">
          <h2 id="about-cv" className={ui.groupTitle}>
            From My CV
          </h2>
          <p className={`${ui.card} ${ui.prose}`}>{profile.cvSummary}</p>
        </section>
      </article>
    </ToolbarView>
  );
}
