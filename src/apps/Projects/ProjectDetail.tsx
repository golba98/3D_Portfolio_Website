import { useState } from 'react';
import { Icon } from '../../components/icons/Icon';
import type { Project } from '../../types/content';
import { ActionRow } from '../shared/ActionRow';
import ui from '../shared/ui.module.css';
import { ModelSection } from './ModelSection';
import { UbumeScreen } from './UbumeScreen';
import styles from './Projects.module.css';

interface ProjectDetailProps {
  project: Project;
  compact: boolean;
}

export function ProjectDetail({ project, compact }: ProjectDetailProps) {
  const [copied, setCopied] = useState(false);

  const copyInstall = async (command: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable; the command is still selectable text.
    }
  };

  return (
    <article className={`${ui.page} ${ui.narrow}`} aria-labelledby={`project-${project.id}`}>
      <header>
        <h2 id={`project-${project.id}`} className={ui.h1}>
          {project.title}
        </h2>
        <p className={styles.meta}>
          <span className={ui.muted}>{project.role}</span>
          <span className={styles.badge} data-active={project.active}>
            {project.year}
          </span>
        </p>
      </header>

      {project.image && (
        <figure className={ui.figure}>
          <img
            src={project.image.src}
            alt={project.image.alt}
            width={project.image.width}
            height={project.image.height}
            loading="lazy"
            decoding="async"
          />
          <figcaption>{project.image.caption}</figcaption>
        </figure>
      )}
      {project.startupScreen && (
        <UbumeScreen
          screen={compact ? project.startupScreen.compact : project.startupScreen.full}
          compact={compact}
          caption={project.startupScreen.caption}
        />
      )}

      <div className={`${ui.card} ${styles.summary}`}>
        <p className={ui.prose}>{project.summary}</p>
        {project.note && <p className={`${ui.prose} ${ui.muted}`}>{project.note}</p>}
      </div>

      <section className={ui.section} aria-labelledby={`how-${project.id}`}>
        <h3 id={`how-${project.id}`} className={ui.groupTitle}>
          How It Works
        </h3>
        <p className={`${ui.card} ${ui.prose}`}>{project.proof}</p>
      </section>

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
                  onClick={() => void copyInstall(project.npm?.install ?? '')}
                  aria-label="Copy install command"
                  title="Copy"
                >
                  <Icon name={copied ? 'check' : 'copy'} size={16} strokeWidth={2} />
                  <span className="visually-hidden" aria-live="polite">
                    {copied ? 'Copied' : ''}
                  </span>
                </button>
              }
            />
          </ul>
        </section>
      )}

      <section className={ui.section} aria-label="Links">
        <ul className={ui.list}>
          <ActionRow icon="github" title="View Source" subtitle={project.github.replace(/^https:\/\//, '')} href={project.github} />
          {project.demo && <ActionRow icon="external" title="Live Demo" subtitle={project.demo.replace(/^https:\/\//, '')} href={project.demo} />}
        </ul>
      </section>

      {project.id === 'llm' && <ModelSection />}
    </article>
  );
}
