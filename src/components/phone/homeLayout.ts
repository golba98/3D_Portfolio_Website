import type { MouseEvent } from 'react';
import { profile } from '../../data/profile';
import type { AppId } from '../../types/apps';
import type { IconName } from '../icons/Icon';
import type { LaunchOrigin } from './phoneStore';

/*
  The phone's home screen mirrors Jordan's real iPhone: a 2×2 widget with a
  2×2 block of icons beside it, a wide widget underneath, the Search pill, and
  a dock of four.
*/

/** The dock, left to right. */
export const DOCK_APPS: readonly AppId[] = ['projects', 'terminal', 'files', 'contact'];

/** A home-screen icon: an app, or a web clip that opens a link. */
export type HomeTile =
  | { kind: 'app'; id: AppId }
  | { kind: 'link'; key: string; title: string; icon: IconName; href: string; download?: boolean };

/** The 2×2 block of icons beside the Me widget. */
export const GRID_TILES: readonly HomeTile[] = [
  { kind: 'app', id: 'about' },
  { kind: 'app', id: 'system' },
  { kind: 'link', key: 'github', title: 'GitHub', icon: 'github', href: profile.github },
  { kind: 'link', key: 'cv', title: 'CV', icon: 'file', href: profile.resumeUrl, download: true },
];

/** The Now building widget's buttons: a project id (data/projects.ts), short name and glyph. */
export const WIDGET_PROJECTS: ReadonlyArray<{ id: string; name: string; icon: IconName }> = [
  { id: 'syncroedit', name: 'SyncroEdit', icon: 'file' },
  { id: 'ubume', name: 'Ubume', icon: 'terminal' },
  { id: 'llm', name: 'Codexa', icon: 'chip' },
  { id: 'movies', name: 'Movies', icon: 'film' },
];

/** The Search pill above the dock. */
export const SEARCH_PILL = { width: 104, height: 32, gap: 12 } as const;

/**
 * The centre of whatever was tapped, as a fraction of the phone's screen: the
 * point the app grows out of. Measured against the shell rather than the
 * window, which differ when the phone OS is framed on a computer.
 */
export function originOf(event: MouseEvent<HTMLElement>): LaunchOrigin {
  const rect = event.currentTarget.getBoundingClientRect();
  const screen = event.currentTarget.closest('[data-phone-shell]')?.getBoundingClientRect() ?? new DOMRect(0, 0, window.innerWidth, window.innerHeight);
  return {
    x: (rect.left + rect.width / 2 - screen.left) / screen.width,
    y: (rect.top + rect.height / 2 - screen.top) / screen.height,
  };
}
