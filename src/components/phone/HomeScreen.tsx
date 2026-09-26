import { useRef, type CSSProperties, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { getApp } from '../../apps/registry';
import { profile } from '../../data/profile';
import { useElementSize } from '../../hooks/useElementSize';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { AppId } from '../../types/apps';
import { Icon } from '../icons/Icon';
import { AppTile } from './AppTile';
import { DOCK_APPS, GRID_TILES, SEARCH_PILL, WIDGET_PROJECTS, originOf } from './homeLayout';
import { usePhone } from './phoneStore';
import styles from './HomeScreen.module.css';

/** Side margin of the icon grid (iOS's is about 5% of the width). */
const MARGIN = 20;
/** Gap between icons, as a fraction of the icon (iOS large icons: about a quarter). */
const GAP_RATIO = 0.25;

/**
 * Icon edge for `columns` icons across `width`, iOS large-icon proportions.
 * Every widget is a whole number of icon cells, so this sizes the page.
 */
function iconSize(width: number, columns: number, max: number): number {
  const usable = width - MARGIN * 2;
  return Math.floor(Math.min(max, usable / (columns + GAP_RATIO * (columns - 1))));
}

/**
 * The home screen, laid out like Jordan's own iPhone: a Me widget and four
 * icons, a wide Now building widget, bare wallpaper, the Search pill, and the
 * dock. No labels under anything, as on theirs.
 */
export function HomeScreen({ hidden }: { hidden: boolean }) {
  const open = usePhone((s) => s.open);
  const setOverlay = usePhone((s) => s.setOverlay);
  const reducedMotion = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  // The phone's own screen decides, not the window: on a computer the phone OS sits in a portrait frame.
  const size = useElementSize(root);
  const width = size.width || 390;
  const landscape = size.width > size.height && size.height > 0;
  const icon = landscape ? iconSize(width, 8, 58) : iconSize(width, 4, 84);

  const launch = (id: AppId, arg?: string) => (event: MouseEvent<HTMLElement>) => open(id, arg, originOf(event));
  const sizing = {
    '--icon': `${icon}px`,
    '--gap': `${Math.round(icon * GAP_RATIO)}px`,
    '--margin': `${MARGIN}px`,
    '--pill-width': `${SEARCH_PILL.width}px`,
    '--pill-height': `${SEARCH_PILL.height}px`,
    '--pill-gap': `${SEARCH_PILL.gap}px`,
  } as CSSProperties;

  return (
    <motion.main
      ref={root}
      className={styles.home}
      style={sizing}
      data-landscape={landscape || undefined}
      aria-label="Home"
      inert={hidden}
      initial={false}
      animate={hidden ? 'hidden' : 'shown'}
      variants={{
        shown: { opacity: 1, scale: 1, visibility: 'visible' },
        hidden: { opacity: 0, scale: reducedMotion ? 1 : 0.94, transitionEnd: { visibility: 'hidden' } },
      }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={styles.page}>
        <div className={styles.grid}>
          <button type="button" className={`${styles.widget} ${styles.me}`} aria-label={`${profile.name}: contact`} onClick={launch('contact')}>
            <span className={styles.avatar} aria-hidden="true">
              JV
            </span>
            <span className={styles.meName}>{profile.name}</span>
            <span className={styles.meRole}>CS student</span>
          </button>

          {GRID_TILES.map((tile) => {
            if (tile.kind === 'link') {
              return <AppTile key={tile.key} icon={tile.icon} title={tile.title} size={icon} href={tile.href} download={tile.download} />;
            }
            const app = getApp(tile.id);
            return <AppTile key={app.id} app={app} title={app.title} description={app.description} size={icon} onOpen={launch(app.id)} />;
          })}

          <section className={`${styles.widget} ${styles.building}`} aria-label="Now building">
            <button type="button" className={styles.prompt} onClick={launch('about')}>
              <span className={styles.promptMark} aria-hidden="true">
                JV
              </span>
              <span className={styles.promptText}>{profile.headline.join(' ')}</span>
            </button>
            <ul className={styles.projects}>
              {WIDGET_PROJECTS.map((project) => (
                <li key={project.id}>
                  <button type="button" className={styles.project} onClick={launch('projects', project.id)}>
                    <span className={styles.circle} aria-hidden="true">
                      <Icon name={project.icon} size={22} strokeWidth={1.9} />
                    </span>
                    <span className={styles.projectName}>{project.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <button type="button" className={styles.searchPill} onClick={() => setOverlay('search')}>
        <Icon name="search" size={14} strokeWidth={2.4} />
        Search
      </button>

      <nav className={styles.dock} aria-label="Dock">
        {DOCK_APPS.map((id) => {
          const app = getApp(id);
          return <AppTile key={id} app={app} title={app.title} description={app.description} size={icon} onOpen={launch(id)} />;
        })}
      </nav>
    </motion.main>
  );
}
