import { useRef, useState } from 'react';
import { findProject, projects, projectsSection } from '../../data/projects';
import { useElementWidth } from '../../hooks/useElementWidth';
import { Icon } from '../../components/icons/Icon';
import type { AppProps } from '../../types/apps';
import ui from '../shared/ui.module.css';
import { EarlierProjects } from './EarlierProjects';
import { ProjectDetail } from './ProjectDetail';
import { Repositories } from './Repositories';
import styles from './Projects.module.css';

/** What the detail pane shows: a project id, or one of the two list views. */
type Selection = string | 'earlier' | 'repos';

const SPLIT_MIN_WIDTH = 640;

function initialSelection(arg?: string): Selection | null {
  if (arg === 'earlier' || arg === 'repos') return arg;
  if (arg && findProject(arg)) return arg;
  return null;
}

export default function Projects({ arg }: AppProps) {
  const root = useRef<HTMLDivElement>(null);
  const width = useElementWidth(root);
  const split = width === 0 || width >= SPLIT_MIN_WIDTH;
  const [selection, setSelection] = useState<Selection | null>(() => initialSelection(arg));
  const detailRef = useRef<HTMLDivElement>(null);

  // Side-by-side, something is always selected; stacked, "nothing" means the list.
  const shown: Selection | null = selection ?? (split ? (projects[0]?.id ?? null) : null);

  const select = (next: Selection): void => {
    setSelection(next);
    detailRef.current?.scrollTo({ top: 0 });
  };

  const renderDetail = (value: Selection) => {
    if (value === 'earlier') return <EarlierProjects />;
    if (value === 'repos') return <Repositories />;
    const project = findProject(value);
    return project ? <ProjectDetail project={project} compact={width > 0 && width < 560} /> : null;
  };

  const list = (
    <nav className={styles.sidebar} aria-label="Projects">
      <p className={styles.sidebarLabel}>{projectsSection.heading}</p>
      <ul>
        {projects.map((project) => (
          <li key={project.id}>
            <button
              type="button"
              className={styles.navItem}
              aria-current={shown === project.id ? 'page' : undefined}
              onClick={() => select(project.id)}
            >
              <span className={styles.navTitle}>{project.title}</span>
              <span className={styles.navSub}>{project.role}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className={styles.sidebarLabel}>More</p>
      <ul>
        <li>
          <button type="button" className={styles.navItem} aria-current={shown === 'repos' ? 'page' : undefined} onClick={() => select('repos')}>
            <span className={styles.navTitle}>All repositories</span>
            <span className={styles.navSub}>Public code on GitHub</span>
          </button>
        </li>
        <li>
          <button type="button" className={styles.navItem} aria-current={shown === 'earlier' ? 'page' : undefined} onClick={() => select('earlier')}>
            <span className={styles.navTitle}>Earlier projects</span>
            <span className={styles.navSub}>From my CV</span>
          </button>
        </li>
      </ul>
    </nav>
  );

  return (
    <div ref={root} className={styles.projects} data-split={split}>
      {split ? (
        <>
          {list}
          <div ref={detailRef} className={styles.detailPane}>
            {shown && renderDetail(shown)}
          </div>
        </>
      ) : shown ? (
        <div ref={detailRef} className={styles.detailPane}>
          <button type="button" className={`${ui.button} ${styles.backButton}`} onClick={() => setSelection(null)}>
            <Icon name="back" /> All projects
          </button>
          {renderDetail(shown)}
        </div>
      ) : (
        <div className={styles.stackedList}>
          <header className={styles.stackedHeader}>
            <p className={ui.eyebrow}>{projectsSection.eyebrow}</p>
            <h1 className={ui.h1}>{projectsSection.heading}</h1>
            <p className={ui.lede}>{projectsSection.lede}</p>
          </header>
          {list}
        </div>
      )}
    </div>
  );
}
