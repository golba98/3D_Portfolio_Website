import { desktopHash } from '../../app/desktopRoute';
import { codexa } from '../../data/model';
import { Icon } from '../../components/icons/Icon';
import { useClipboard } from '../../hooks/useClipboard';
import type { Project } from '../../types/content';
import { ActionRow } from '../shared/ActionRow';
import ui from '../shared/ui.module.css';
import { ProjectMark } from './ProjectCatalog';
import { ModelSection } from './ModelSection';
import { UbumeScreen } from './UbumeScreen';
import styles from './Projects.module.css';

interface ProjectDetailProps {
  project: Project;
  compact: boolean;
}

export function ProjectDetail({ project, compact }: ProjectDetailProps) {
  const { copied, copy, feedback } = useClipboard();
  const share = useClipboard();
  const downloadable = project.featured?.evidenceUrl.startsWith('/');
  const url = new URL(desktopHash('projects', project.id), location.href).href;

  return (
    <article className={`${ui.page} ${ui.narrow}`} aria-labelledby={`project-${project.id}`}>
      <header className={styles.detailHeader}>
        {!project.featured && <ProjectMark category={project.category} />}
        <p className={ui.eyebrow}>{project.category}</p>
        <h2 tabIndex={-1} id={`project-${project.id}`} className={ui.h1}>
          {project.title}
        </h2>
        <p className={`${styles.meta} ${ui.muted}`}>{project.role}</p>
      </header>

      <p className={styles.detailSummary}>{project.summary}</p>
      <div className={styles.detailActions}>
        {project.github && (
          <a
            className={`${ui.button} ${ui.primary} ${styles.sourceAction}`}
            href={project.github}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="github" size={18} /> Explore the code <Icon name="external" size={14} />
          </a>
        )}
        <button className={ui.button} onClick={() => void share.copy(url)}>
          <Icon name="copy" size={16} />
          Copy project link
        </button>
      </div>
      <span role="status">{share.feedback}</span>
      {share.failed && (
        <input aria-label="Project link" readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
      )}
      {project.image && (
        <figure className={ui.figure}>
          <img
            src={project.image.src}
            alt={project.image.alt}
            width={project.image.width}
            height={project.image.height}
            loading="lazy"
            decoding="async"
            style={{ maxWidth: project.image.width, display: 'block', marginInline: 'auto' }}
            onError={(event) => {
              event.currentTarget.closest('figure')!.hidden = true;
            }}
          />
          <figcaption>
            {project.image.caption}{' '}
            <a className={ui.link} href={project.image.src} target="_blank" rel="noreferrer">
              View full size ↗
            </a>
          </figcaption>
        </figure>
      )}
      {project.featured && (
        <section className={ui.section}>
          <h3 className={ui.groupTitle}>My contribution</h3>
          <p className={ui.prose}>{project.featured.contribution}</p>
        </section>
      )}
      <section className={ui.section} aria-labelledby={`features-${project.id}`}>
        <h3 id={`features-${project.id}`} className={ui.groupTitle}>
          What you can do
        </h3>
        <ul className={styles.highlights}>
          {project.highlights.map((highlight) => (
            <li key={highlight}>
              <Icon name="check" size={18} />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      </section>

      {project.startupScreen && (
        <UbumeScreen
          screen={compact ? project.startupScreen.compact : project.startupScreen.full}
          compact={compact}
          caption={project.startupScreen.caption}
        />
      )}

      <section className={ui.section} aria-labelledby={`how-${project.id}`}>
        <h3 id={`how-${project.id}`} className={ui.groupTitle}>
          Under the hood
        </h3>
        <p className={`${ui.card} ${ui.prose}`}>{project.proof}</p>
      </section>

      {project.featured && (
        <section className={ui.section}>
          <h3 className={ui.groupTitle}>Result</h3>
          <p className={ui.prose}>{project.featured.outcome}</p>
          <a
            className={ui.link}
            href={project.featured.evidenceUrl}
            download={downloadable || undefined}
            target={downloadable ? undefined : '_blank'}
            rel="noreferrer"
          >
            {project.featured.evidenceLabel}
            {downloadable ? ' ↓' : ' ↗'}
          </a>
        </section>
      )}
      <section className={ui.section} aria-labelledby={`stack-${project.id}`}>
        <h3 id={`stack-${project.id}`} className={ui.groupTitle}>
          Technologies
        </h3>
        <ul className={`${ui.chips} ${ui.card}`}>
          {project.technologies.map((tech) => (
            <li key={tech} className={ui.chip}>
              {tech}
            </li>
          ))}
        </ul>
      </section>

      {project.npm && (
        <section className={ui.section} aria-labelledby={`npm-${project.id}`}>
          <h3 id={`npm-${project.id}`} className={ui.groupTitle}>
            Install
          </h3>
          <ul className={ui.list}>
            <ActionRow
              title={<code className={styles.install}>{project.npm.install}</code>}
              subtitle={
                <>
                  {project.npm.name} v{project.npm.version} on the{' '}
                  <a className={ui.link} href={project.npm.url} target="_blank" rel="noreferrer">
                    npm registry
                  </a>
                </>
              }
              suffix={
                <button
                  type="button"
                  className={`${ui.button} ${ui.flat}`}
                  onClick={() => void copy(project.npm?.install ?? '')}
                  aria-label="Copy install command"
                  title="Copy"
                >
                  <Icon name={copied ? 'check' : 'copy'} size={16} strokeWidth={2} />
                  <span className={styles.copyFeedback} aria-live="polite">
                    {feedback}
                  </span>
                </button>
              }
            />
          </ul>
        </section>
      )}

      {(project.github || project.demo) && (
        <section className={ui.section} aria-label="Links">
          <ul className={ui.list}>
            {project.github && (
              <ActionRow
                icon="github"
                title="View Source"
                subtitle={project.github.replace(/^https:\/\//, '')}
                href={project.github}
              />
            )}
            {project.demo && (
              <ActionRow
                icon="external"
                title={`Open ${project.title}`}
                subtitle={project.demo.replace(/^https:\/\//, '')}
                href={project.demo}
              />
            )}
          </ul>
        </section>
      )}

      {project.id === codexa.projectId && <ModelSection />}
      {project.note && (
        <aside className={styles.projectNote} aria-label="Project context">
          <h3 className={ui.groupTitle}>Scope & context</h3>
          <p className={ui.prose}>{project.note}</p>
        </aside>
      )}
    </article>
  );
}
