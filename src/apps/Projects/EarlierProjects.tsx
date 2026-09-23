import { earlierProjects } from '../../data/projects';
import { ActionRow } from '../shared/ActionRow';
import ui from '../shared/ui.module.css';

export function EarlierProjects() {
  return (
    <section className={`${ui.page} ${ui.narrow}`} aria-labelledby="earlier-heading">
      <h2 id="earlier-heading" className={ui.groupTitle}>
        From My CV
      </h2>
      <ul className={ui.list}>
        {earlierProjects.map((project) => (
          <ActionRow key={project.title} title={project.title} subtitle={project.description} />
        ))}
      </ul>
    </section>
  );
}
