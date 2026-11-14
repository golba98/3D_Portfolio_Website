import type { Project } from '../../types/content';
import { Icon } from '../icons/Icon';
import styles from './ProjectSearchResults.module.css';

export function ProjectSearchResults({
  projects,
  onOpen,
}: {
  projects: readonly Project[];
  onOpen: (id: string) => void;
}) {
  if (!projects.length) return null;
  return (
    <section className={styles.section} aria-label="Project results">
      <h2 className={styles.heading}>Projects</h2>
      <ul className={styles.results}>
        {projects.map((project) => (
          <li key={project.id}>
            <button type="button" className={styles.result} onClick={() => onOpen(project.id)}>
              <span className={styles.icon}>
                <Icon name="folder-code" size={24} />
              </span>
              <span className={styles.text}>
                <strong>{project.title}</strong>
                <span>{project.role}</span>
              </span>
              <Icon name="chevron" size={16} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
