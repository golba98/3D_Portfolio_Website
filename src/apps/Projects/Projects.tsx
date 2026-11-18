import { useLayoutEffect, useRef, useState } from 'react';
import { findProject, projects, projectsSection } from '../../data/projects';
import { HeaderLink } from '../../components/adw/HeaderBar';
import { SplitView } from '../../components/adw/SplitView';
import { useElementWidth } from '../../hooks/useElementWidth';
import type { AppProps } from '../../types/apps';
import { EarlierProjects } from './EarlierProjects';
import type { ProjectCategory } from '../../types/content';
import { ProjectCatalog } from './ProjectCatalog';
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
export default function Projects({ arg, openApp }: AppProps) {
  const root = useRef<HTMLDivElement>(null);
  const width = useElementWidth(root);
  const collapsed = width > 0 && width < SPLIT_MIN_WIDTH;
  const selection = initialSelection(arg);
  const contentRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ProjectCategory>();

  // Start with the gallery; an explicit launch argument opens a project directly.
  const shown = selection;
  const project = shown ? findProject(shown) : undefined;

  const lastProject = useRef<string | null>(null);
  const catalogTop = useRef(0);
  const sidebarRef = useRef<HTMLElement>(null);
  const sidebarCatalog = collapsed ? sidebarRef : contentRef;
  useLayoutEffect(() => {
    if (shown) {
      lastProject.current = shown;
      contentRef.current?.scrollTo(0, 0);
      contentRef.current?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    } else if (lastProject.current) {
      sidebarCatalog.current?.scrollTo(0, catalogTop.current);
      const card = root.current?.querySelector<HTMLElement>(`[data-project-id="${CSS.escape(lastProject.current)}"]`);
      (card ?? root.current?.querySelector('input'))?.focus({ preventScroll: true });
      lastProject.current = null;
    }
  }, [shown, sidebarCatalog]);
  const select = (next: Selection): void => {
    if (!shown) catalogTop.current = sidebarCatalog.current?.scrollTop ?? 0;
    openApp('projects', next);
  };
  const browse = (): void => {
    if (history.state?.previousHash === '#/desktop/projects' && shown) history.back();
    else openApp('projects', '');
  };

  const renderDetail = (value: Selection) => {
    if (value === 'earlier') return <EarlierProjects />;
    if (value === 'repos') return <Repositories />;
    const found = findProject(value);
    return found ? <ProjectDetail key={found.id} project={found} compact={width > 0 && width < 760} /> : null;
  };

  const navRow = (id: Selection, title: string, subtitle: string) => (
    <li key={id}>
      <button
        type="button"
        className={styles.navItem}
        aria-current={shown === id ? 'page' : undefined}
        onClick={() => select(id)}
      >
        <span className={styles.navTitle}>{title}</span>
        <span className={styles.navSub}>{subtitle}</span>
      </button>
    </li>
  );

  const catalog = (
    <ProjectCatalog
      unavailable={Boolean(arg && !selection)}
      query={query}
      category={category}
      onQuery={setQuery}
      onCategory={setCategory}
      onSelect={select}
      collapsed={collapsed}
    />
  );

  const sidebar = (
    <>
      {collapsed ? (
        catalog
      ) : (
        <>
          <button
            type="button"
            className={styles.browseButton}
            aria-current={shown === null ? 'page' : undefined}
            onClick={browse}
          >
            Browse projects <span>{projects.length}</span>
          </button>
          <p className={styles.sidebarLabel}>{projectsSection.heading}</p>
          <ul>{projects.map((p) => navRow(p.id, p.title, p.role))}</ul>
        </>
      )}
      <p className={styles.sidebarLabel}>More</p>
      <ul>
        {navRow('repos', 'All Repositories', 'Public code on GitHub')}
        {navRow('earlier', 'Earlier Projects', 'Previous versions and CV work')}
      </ul>
    </>
  );

  return (
    <SplitView
      ref={root}
      collapsed={collapsed}
      showContent={selection !== null}
      onBack={browse}
      backLabel="All projects"
      sidebarLabel="Projects"
      sidebarWidth={260}
      sidebarHeader={{ title: 'Projects' }}
      sidebarRef={sidebarRef}
      sidebar={sidebar}
      contentHeader={{
        title: shown ? titleFor(shown) : 'Explore the work',
        end: project?.github ? (
          <HeaderLink icon="github" label="View source on GitHub" href={project.github} />
        ) : undefined,
      }}
      content={shown ? renderDetail(shown) : catalog}
      contentRef={contentRef}
    />
  );
}
