/**
 * Portfolio content model. All text lives in src/data/ and is migrated from the
 * previous site (src/content.js) and CV (public/Resume.pdf). UI components only
 * render these shapes; they never hardcode portfolio copy.
 */

export interface Profile {
  name: string;
  /** Full name as printed on the CV. */
  legalName: string;
  role: string;
  location: string;
  education: string;
  email: string;
  github: string;
  githubUsername: string;
  resumeUrl: string;
  /** The hero headline, one entry per line. */
  headline: readonly string[];
  lede: string;
  /** Profile summary from the CV. */
  cvSummary: string;
  /** Short line from the previous site's Toolkit section. */
  toolkitLede: string;
}

export interface NpmPackage {
  name: string;
  version: string;
  url: string;
  install: string;
}

export interface TerminalScreen {
  cols: number;
  rows: number;
  logoWidth: number;
  logo: readonly string[];
  /** 1 = primary, 2 = secondary, 3 = shadow; one per logo row. */
  logoTone: readonly (1 | 2 | 3)[];
  meta: readonly string[];
  prompt: string;
  placeholder: string;
  footerLeft: string;
  footerRight: string;
}

export interface ProjectImage {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
}

export interface Project {
  id: string;
  title: string;
  /** Date range, e.g. "Dec 2025 — Current". Stands in for status. */
  year: string;
  role: string;
  summary: string;
  note?: string;
  /** Technical details that back up the summary. */
  proof: string;
  technologies: readonly string[];
  github: string;
  demo?: string;
  image?: ProjectImage;
  npm?: NpmPackage;
  /** Recreated terminal screen shown instead of a screenshot. */
  startupScreen?: { full: TerminalScreen; compact: TerminalScreen; caption: string };
  /** True for projects still being worked on ("— Current"). */
  active: boolean;
}

/** Older projects listed only on the CV, without repos. */
export interface EarlierProject {
  title: string;
  description: string;
}

export interface SkillGroup {
  label: string;
  items: readonly string[];
}

export interface BackgroundEntry {
  title: string;
  detail: string;
}

export interface WorkEntry {
  title: string;
  period: string;
  points: readonly string[];
}

export interface LeadershipEntry {
  title: string;
  detail: string;
}

export interface Certification {
  title: string;
  issuer: string;
  note?: string;
}

export interface Repo {
  name: string;
  description: string;
  url: string;
  /** Filled in from the GitHub API when it is reachable. */
  language?: string | null;
  stars?: number;
  updatedAt?: string;
}

export interface ModelSpecRow {
  label: string;
  value: string;
}

export interface LossPoint {
  step: number;
  loss: number;
  ppl: number;
}

export interface ModelCounter {
  value: number;
  display: string;
  unit: string;
  label: string;
}

export interface LanguageModel {
  projectId: string;
  title: string;
  heading: string;
  lede: string;
  spec: readonly ModelSpecRow[];
  specSource: string;
  loss: readonly LossPoint[];
  lossCaption: string;
  lossAriaLabel: string;
  counters: readonly ModelCounter[];
  caveatLabel: string;
  caveat: string;
}
