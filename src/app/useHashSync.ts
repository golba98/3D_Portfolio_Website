import { useEffect } from 'react';
import { useExperience } from '../store/experience';

/**
 * Mirrors the desktop phase into the URL (`#/desktop`) so refreshes and shared
 * links land on the portfolio directly, and the browser Back button leaves it.
 */
export function useHashSync(): void {
  const phase = useExperience((s) => s.phase);

  useEffect(() => {
    const onDesktop = window.location.hash.startsWith('#/desktop');
    if (phase === 'desktop' && !onDesktop) {
      window.history.pushState(null, '', '#/desktop');
    } else if (phase !== 'desktop' && phase !== 'fallback' && onDesktop) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [phase]);

  useEffect(() => {
    const onHashChange = (): void => {
      const { phase: current, enterDesktopDirectly, leaveDesktop } = useExperience.getState();
      const wantsDesktop = window.location.hash.startsWith('#/desktop');
      if (wantsDesktop && current !== 'desktop') enterDesktopDirectly();
      else if (!wantsDesktop && current === 'desktop') leaveDesktop();
    };
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('popstate', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('popstate', onHashChange);
    };
  }, []);
}
