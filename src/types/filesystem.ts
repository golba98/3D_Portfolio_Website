import type { AppId } from './apps';

export interface FsFile {
  kind: 'file';
  name: string;
  /** Plain-text contents (what `cat` prints and Files previews). */
  content: string;
  /** Opening the file launches an app instead of previewing text. */
  opens?: { app: AppId; arg?: string };
  /** Opening the file follows a real link (e.g. the CV PDF). */
  href?: string;
  /** Binary files can't be printed. */
  binary?: boolean;
}

export interface FsDir {
  kind: 'dir';
  name: string;
  children: readonly FsNode[];
}

export type FsNode = FsFile | FsDir;

/** Absolute path as segments from `/`, e.g. ['home', 'jordan', 'Projects']. */
export type FsPath = readonly string[];
