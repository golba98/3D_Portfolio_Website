import { lazy } from 'react';
import type { AppDefinition, AppId } from '../types/apps';

/**
 * Every desktop app. Components load lazily so the 3D landing (which reads
 * this list to paint the monitor's dock) never pulls in app code.
 */
export const APPS: readonly AppDefinition[] = [
  {
    id: 'about',
    title: 'About',
    description: 'Who I am, education and background',
    iconSrc: '/icons/apps/org.gnome.Contacts.svg',
    defaultSize: { width: 720, height: 560 },
    keywords: ['profile', 'bio', 'education', 'cv', 'resume', 'background', 'certifications'],
    component: lazy(() => import('./About/About')),
  },
  {
    id: 'projects',
    title: 'Projects',
    description: 'What I built, the model I trained, and public repos',
    iconSrc: '/icons/apps/org.gnome.Builder.svg',
    defaultSize: { width: 940, height: 640 },
    keywords: ['work', 'portfolio', 'github', 'repos', 'codexa', 'model', 'ubume', 'syncroedit'],
    component: lazy(() => import('./Projects/Projects')),
  },
  {
    id: 'terminal',
    title: 'Terminal',
    description: 'A simulated shell over this portfolio',
    iconSrc: '/icons/apps/kitty.svg',
    chrome: 'kitty',
    defaultSize: { width: 720, height: 460 },
    keywords: ['shell', 'bash', 'console', 'command', 'neofetch'],
    component: lazy(() => import('./Terminal/Terminal')),
  },
  {
    id: 'files',
    title: 'Files',
    description: 'Browse the portfolio as a file system',
    iconSrc: '/icons/apps/org.gnome.Nautilus.svg',
    defaultSize: { width: 820, height: 540 },
    keywords: ['nautilus', 'folders', 'documents', 'home'],
    component: lazy(() => import('./Files/Files')),
  },
  {
    id: 'system',
    title: 'System Info',
    description: 'The machine behind the desk',
    iconSrc: '/icons/apps/org.gnome.Settings.svg',
    defaultSize: { width: 620, height: 560 },
    keywords: ['hardware', 'specs', 'about this computer', 'fedora', 'pc'],
    component: lazy(() => import('./SystemInfo/SystemInfo')),
  },
  {
    id: 'contact',
    title: 'Contact',
    description: 'Email, GitHub and CV',
    iconSrc: '/icons/apps/org.gnome.Geary.svg',
    defaultSize: { width: 760, height: 540 },
    keywords: ['email', 'mail', 'github', 'cv', 'resume', 'location', 'hire'],
    component: lazy(() => import('./Contact/Contact')),
  },
];

const byId = new Map(APPS.map((app) => [app.id, app]));

export function getApp(id: AppId): AppDefinition {
  const app = byId.get(id);
  if (!app) throw new Error(`Unknown app: ${id}`);
  return app;
}

export function isAppId(value: string): value is AppId {
  return byId.has(value as AppId);
}
