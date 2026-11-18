import type { AppId } from '../types/apps';

export function desktopHash(app?: AppId | null, arg?: string): string {
  if (!app) return '#/desktop';
  return app === 'projects' && arg ? `#/desktop/projects/${encodeURIComponent(arg)}` : `#/desktop/${app}`;
}

export function writeRoute(hash: string, replace = false): void {
  if (location.hash === hash) return;
  const url = location.pathname + location.search + hash;
  if (replace) history.replaceState(history.state, '', url);
  else history.pushState({ previousHash: location.hash }, '', url);
}
