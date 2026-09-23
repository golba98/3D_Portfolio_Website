import type { ComponentType, LazyExoticComponent } from 'react';

export type AppId = 'about' | 'projects' | 'terminal' | 'files' | 'system' | 'contact';

/** Props every app window receives. */
export interface AppProps {
  /** Optional deep-link argument, e.g. a project id for Projects. */
  arg?: string;
  /** Ask the window manager to open another app. */
  openApp: (id: AppId, arg?: string) => void;
  /** Replace the window's title (the terminal shows its working directory there). */
  setTitle?: (title: string) => void;
}

export interface AppDefinition {
  id: AppId;
  title: string;
  /** One line for the launcher search results. */
  description: string;
  /** Full-colour app icon under public/icons/apps (also drawn into the 3D monitor preview). */
  iconSrc: string;
  /** Window decoration style. Default is GNOME's; the terminal gets kitty's. */
  chrome?: 'kitty';
  /** Preferred window size in CSS pixels. */
  defaultSize: { width: number; height: number };
  /** Words the launcher search also matches. */
  keywords: readonly string[];
  component: LazyExoticComponent<ComponentType<AppProps>>;
}
