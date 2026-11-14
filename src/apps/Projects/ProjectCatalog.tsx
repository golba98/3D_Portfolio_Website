import { Icon, type IconName } from '../../components/icons/Icon';
import { projectsSection } from '../../data/projects';
import { projectCategories, searchProjects } from '../../lib/projectSearch';
import type { ProjectCategory } from '../../types/content';
import ui from '../shared/ui.module.css';
import styles from './Projects.module.css';

const categoryIcons: Record<ProjectCategory, IconName> = {
  'Developer tools': 'terminal',
  'Web apps': 'file',
  Research: 'chip',
  Games: 'map-pin',
  Systems: 'folder-code',
};

export function ProjectMark({ category }: { category: ProjectCategory }) {
  return (
    <span className={styles.projectMark} data-category={category} aria-hidden="true">
      <Icon name={categoryIcons[category]} size={24} />
    </span>
  );
}

interface ProjectCatalogProps {
  query: string;
  category: ProjectCategory | undefined;
  onQuery: (query: string) => void;
  onCategory: (category: ProjectCategory | undefined) => void;
  onSelect: (id: string) => void;
  collapsed: boolean;
}

export function ProjectCatalog({ query, category, onQuery, onCategory, onSelect, collapsed }: ProjectCatalogProps) {
  const results = searchProjects(query, category);
  return (
    <section className={styles.catalog} aria-labelledby="project-catalog-title">
      <header>
        <p className={ui.eyebrow}>Jordan’s projects</p>
        <h2 className={ui.h1} id="project-catalog-title">
          Built to explore.
        </h2>
        <p className={ui.lede}>{projectsSection.lede}</p>
      </header>
      <label className={styles.searchField}>
        <Icon name="search" size={18} />
        <input
          type="search"
          aria-label="Search projects"
          placeholder="Search projects, skills or tools"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
        />
      </label>
      <div className={styles.filters} role="group" aria-label="Project categories">
        {[undefined, ...projectCategories].map((value) => (
          <button
            key={value ?? 'all'}
            type="button"
            aria-pressed={category === value}
            onClick={() => onCategory(value)}
          >
            {value ?? 'All'}
          </button>
        ))}
      </div>
      <p className={styles.resultCount} role="status">
        {results.length} {results.length === 1 ? 'project' : 'projects'}
      </p>
      <div className={styles.projectGrid}>
        {results.map((project) => (
          <button
            key={project.id}
            type="button"
            className={styles.projectCard}
            aria-label={collapsed ? project.title : `Explore ${project.title}`}
            onClick={() => onSelect(project.id)}
          >
            <span className={styles.cardTop}>
              <ProjectMark category={project.category} />
              <span>{project.category}</span>
              <Icon name="chevron" />
            </span>
            <strong className={styles.cardTitle}>{project.title}</strong>
            <span className={styles.cardDescription}>{project.role}</span>
            <span className={styles.cardStack}>{project.technologies.slice(0, 3).join(' · ')}</span>
          </button>
        ))}
      </div>
      {results.length === 0 && (
        <div className={styles.emptySearch}>
          <p>No projects match these filters.</p>
          <button
            type="button"
            className={ui.button}
            onClick={() => {
              onQuery('');
              onCategory(undefined);
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}
