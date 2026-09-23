import { useRef, useState } from 'react';
import { findProject, projects, projectsSection } from '../../data/projects';
import { HeaderLink } from '../../components/adw/HeaderBar';
import { SplitView } from '../../components/adw/SplitView';
import { useElementWidth } from '../../hooks/useElementWidth';
import type { AppProps } from '../../types/apps';
import { EarlierProjects } from './EarlierProjects';
import { ProjectDetail } from './ProjectDetail';
import { Repositories } from './Repositories';
import styles from './Projects.module.css';

/** What the content pane shows: a project id, or one of the two list views. */
type Selection = string | 'earlier' | 'repos';

const SPLIT_MIN_WIDTH = 640;

function initialSelection(arg?: string): Selection | null {
  if (arg === 'earlier' || arg === 'repos') return arg;
  if (arg && findProject(arg)) return arg;
  return null;
}

function titleFor(selection: Selection): string {
  if (selection === 'earlier') return 'Earlier Projects';
  if (selection === 'repos') return 'All Repositories';
  return findProject(selection)?.title ?? '';
}

/** A navigation split view, like GNOME Builder's or Settings'. */
export default function Projects({ arg }: AppProps) {
  const root = useRef<HTMLDivElement>(null);
  const width = useElementWidth(root);
  const collapsed = width > 0 && width < SPLIT_MIN_WIDTH;
  const [selection, setSelection] = useState<Selection | null>(() => initialSelection(arg));
  const contentRef = useRef<HTMLDivElement>(null);

  // Side by side, something is always selected; collapsed, "nothing" means the list.
  const shown: Selection | null = selection ?? (collapsed ? null : (projects[0]?.id ?? null));
  const project = shown ? findProject(shown) : undefined;

  const select = (next: Selection): void => {
    setSelection(next);
    contentRef.current?.scrollTo({ top: 0 });
  };

  const renderDetail = (value: Selection) => {
    if (value === 'earlier') return <EarlierProjects />;
    if (value === 'repos') return <Repositories />;
    const found = findProject(value);
    return found ? <ProjectDetail project={found} compact={width > 0 && width < 760} /> : null;
  };

  const navRow = (id: Selection, title: string, subtitle: string) => (
    <li key={id}>
      <button type="button" className={styles.navItem} aria-current={shown === id ? 'page' : undefined} onClick={() => select(id)}>
        <span className={styles.navTitle}>{title}</span>
        <span className={styles.navSub}>{subtitle}</span>
      </button>
    </li>
  );

  const sidebar = (
    <>
      <p className={styles.sidebarLabel}>{projectsSection.heading}</p>
      <ul>{projects.map((p) => navRow(p.id, p.title, p.role))}</ul>
      <p className={styles.sidebarLabel}>More</p>
      <ul>
        {navRow('repos', 'All Repositories', 'Public code on GitHub')}
        {navRow('earlier', 'Earlier Projects', 'From my CV')}
      </ul>
    </>
  );

  return (
    <SplitView
      ref={root}
      collapsed={collapsed}
      showContent={selection !== null}
      onBack={() => setSelection(null)}
      backLabel="All projects"
      sidebarLabel="Projects"
      sidebarWidth={260}
      sidebarHeader={{ title: 'Projects' }}
      sidebar={sidebar}
      contentHeader={{
        title: shown ? titleFor(shown) : '',
        end: project ? <HeaderLink icon="github" label="View source on GitHub" href={project.github} /> : undefined,
      }}
      content={shown && renderDetail(shown)}
      contentRef={contentRef}
    />
  );
}
