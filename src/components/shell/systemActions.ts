import { profile } from '../../data/profile';
import { useExperience } from '../../store/experience';
import type { IconName } from '../icons/Icon';

export interface SystemAction {
  id: 'cv' | 'github' | 'email' | 'leave';
  icon: IconName;
  label: string;
  /** Link actions; the rest run `onSelect`. */
  href?: string;
  download?: boolean;
  onSelect?: () => void;
}

/**
 * What the system menu offers, on the desktop's top-bar menu and the phone's
 * Control Centre alike: the CV, GitHub, and the way back to the 3D desk (only
 * if the 3D desk can load).
 */
export function useSystemActions(): SystemAction[] {
  const sceneStatus = useExperience((s) => s.sceneStatus);
  const leaveDesktop = useExperience((s) => s.leaveDesktop);
  const actions: SystemAction[] = [
    { id: 'cv', icon: 'download', label: 'Download CV', href: profile.resumeUrl, download: true },
    { id: 'github', icon: 'github', label: 'GitHub', href: profile.github },
  ];
  if (sceneStatus !== 'failed') actions.push({ id: 'leave', icon: 'power', label: 'Back to the 3D desk', onSelect: leaveDesktop });
  return actions;
}
