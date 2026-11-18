import { useEffect } from 'react';
import { useExperience } from '../store/experience';
import { writeRoute } from './desktopRoute';

export function useHashSync(): void {
  useEffect(() => {
    const onDesktop = () => /^#\/desktop(?:\/|$)/.test(location.hash);
    const unsubscribe = useExperience.subscribe(({ phase }, previous) => {
      if (phase === previous.phase) return;
      if (phase === 'desktop' && !onDesktop()) writeRoute('#/desktop');
      if (previous.phase === 'desktop' && phase !== 'desktop' && onDesktop()) writeRoute('');
    });
    function followLocation() {
      const state = useExperience.getState();
      if (onDesktop() && state.phase !== 'desktop') state.enterDesktopDirectly();
      if (!onDesktop() && state.phase === 'desktop') state.leaveDesktop();
    }
    window.addEventListener('hashchange', followLocation);
    followLocation();
    return () => {
      unsubscribe();
      window.removeEventListener('hashchange', followLocation);
    };
  }, []);
}
