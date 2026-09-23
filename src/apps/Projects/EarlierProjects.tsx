import { earlierProjects } from '../../data/projects';
import ui from '../shared/ui.module.css';
import styles from './Projects.module.css';

export function EarlierProjects() {
  return (
    <section className={styles.detail} aria-labelledby="earlier-heading">
      <p className={ui.eyebrow}>From my CV</p>
      <h2 id="earlier-heading" className={ui.h1}>
        Earlier projects
      </h2>
      <ul className={`${ui.list} ${styles.earlier}`}>
        {earlierProjects.map((project) => (
          <li key={project.title}>
            <h3 className={ui.h3}>{project.title}</h3>
            <p className={`${ui.small} ${ui.muted}`}>{project.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
