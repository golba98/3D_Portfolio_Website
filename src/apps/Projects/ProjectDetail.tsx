import { useState } from 'react';
import { Icon } from '../../components/icons/Icon';
import type { Project } from '../../types/content';
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
    <article className={styles.detail} aria-labelledby={`project-${project.id}`}>
      <header>
        <div className={styles.meta}>
          <span className={styles.badge} data-active={project.active}>
            {project.year}
          </span>
        </div>
        <h2 id={`project-${project.id}`} className={ui.h1}>
          {project.title}
        </h2>
        <p className={ui.muted}>{project.role}</p>
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

      <p className={`${ui.prose} ${styles.summary}`}>{project.summary}</p>
      {project.note && <p className={`${ui.prose} ${ui.muted}`}>{project.note}</p>}

      <section className={ui.section} aria-labelledby={`how-${project.id}`}>
        <h3 id={`how-${project.id}`} className={ui.h2}>
          How it works
        </h3>
        <p className={ui.prose}>{project.proof}</p>
      </section>

      <section className={ui.section} aria-labelledby={`stack-${project.id}`}>
        <h3 id={`stack-${project.id}`} className={ui.h2}>
          Technologies
        </h3>
        <ul className={ui.chips}>
          {project.technologies.map((tech) => (
            <li key={tech} className={ui.chip}>
              {tech}
            </li>
          ))}
        </ul>
      </section>

      {project.npm && (
        <section className={ui.section} aria-labelledby={`npm-${project.id}`}>
          <h3 id={`npm-${project.id}`} className={ui.h2}>
            Install
          </h3>
          <div className={styles.install}>
            <code>{project.npm.install}</code>
            <button type="button" className={ui.button} onClick={() => void copyInstall(project.npm?.install ?? '')} aria-label="Copy install command">
              <Icon name={copied ? 'check' : 'copy'} />
              <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className={`${ui.small} ${ui.muted} ${styles.source}`}>
            {project.npm.name} v{project.npm.version} on the{' '}
            <a className={ui.link} href={project.npm.url} target="_blank" rel="noreferrer">
              npm registry
            </a>
            .
          </p>
        </section>
      )}

      <div className={ui.actions}>
        <a className={`${ui.button} ${ui.primary}`} href={project.github} target="_blank" rel="noreferrer">
          <Icon name="github" /> View source
        </a>
        {project.demo && (
          <a className={ui.button} href={project.demo} target="_blank" rel="noreferrer">
            <Icon name="external" /> Live demo
          </a>
        )}
      </div>

      {project.id === 'llm' && <ModelSection />}
    </article>
  );
}
