import { useState } from 'react';
import { formatPath, getNode, HOME, HOME_PATH, isSamePath } from '../../data/filesystem';
import { Icon, type IconName } from '../../components/icons/Icon';
import type { AppProps } from '../../types/apps';
import type { FsFile, FsNode, FsPath } from '../../types/filesystem';
import styles from './Files.module.css';

const PLACES: ReadonlyArray<{ label: string; path: FsPath; icon: IconName }> = [
  { label: 'Home', path: HOME_PATH, icon: 'home' },
  ...HOME.children
    .filter((child) => child.kind === 'dir')
    .map((child) => ({ label: child.name, path: [...HOME_PATH, child.name], icon: 'folder' as IconName })),
];

function iconFor(node: FsNode): IconName {
  if (node.kind === 'dir') return 'folder';
  if (node.opens) return node.opens.app === 'projects' ? 'folder-code' : 'file';
  return 'file';
}

/** Files deep links arrive as "home/jordan/Projects". */
function initialPath(arg?: string): FsPath {
  if (!arg) return HOME_PATH;
  const path = arg.split('/').filter(Boolean);
  return getNode(path)?.kind === 'dir' ? path : HOME_PATH;
}

export default function Files({ arg, openApp }: AppProps) {
  const [path, setPath] = useState<FsPath>(() => initialPath(arg));
  const [back, setBack] = useState<FsPath[]>([]);
  const [forward, setForward] = useState<FsPath[]>([]);
  const [preview, setPreview] = useState<FsFile | null>(null);

  const node = getNode(path);
  const children = node?.kind === 'dir' ? node.children : [];

  const navigate = (next: FsPath): void => {
    if (isSamePath(next, path)) return;
    setBack((b) => [...b, path]);
    setForward([]);
    setPath(next);
    setPreview(null);
  };

  const goBack = (): void => {
    const previous = back[back.length - 1];
    if (!previous) return;
    setBack(back.slice(0, -1));
    setForward((f) => [path, ...f]);
    setPath(previous);
    setPreview(null);
  };

  const goForward = (): void => {
    const next = forward[0];
    if (!next) return;
    setForward(forward.slice(1));
    setBack((b) => [...b, path]);
    setPath(next);
    setPreview(null);
  };

  const activate = (child: FsNode): void => {
    if (child.kind === 'dir') navigate([...path, child.name]);
    else if (child.opens) openApp(child.opens.app, child.opens.arg);
    else setPreview(child);
  };

  // Breadcrumbs start at Home; anything above it isn't interesting here.
  const crumbs = path.slice(HOME_PATH.length - 1).map((name, i) => ({
    name: i === 0 ? 'Home' : name,
    path: path.slice(0, HOME_PATH.length + i),
  }));

  return (
    <div className={styles.files}>
      <nav className={styles.sidebar} aria-label="Places">
        <ul>
          {PLACES.map((place) => (
            <li key={place.label}>
              <button
                type="button"
                className={styles.place}
                aria-current={isSamePath(place.path, path) ? 'location' : undefined}
                onClick={() => navigate(place.path)}
              >
                <Icon name={place.icon} /> {place.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.main}>
        <div className={styles.toolbar}>
          <button type="button" className={styles.navButton} onClick={goBack} disabled={back.length === 0} aria-label="Back">
            <Icon name="back" />
          </button>
          <button type="button" className={styles.navButton} onClick={goForward} disabled={forward.length === 0} aria-label="Forward">
            <Icon name="chevron" />
          </button>
          <nav className={styles.crumbs} aria-label={`Location: ${formatPath(path)}`}>
            {crumbs.map((crumb, i) => (
              <span key={crumb.path.join('/')} className={styles.crumbWrap}>
                {i > 0 && <span className={styles.crumbSep} aria-hidden="true">/</span>}
                <button
                  type="button"
                  className={styles.crumb}
                  aria-current={i === crumbs.length - 1 ? 'location' : undefined}
                  onClick={() => navigate(crumb.path)}
                >
                  {crumb.name}
                </button>
              </span>
            ))}
          </nav>
        </div>

        <div className={styles.body} data-preview={preview !== null}>
          <ul className={styles.grid} aria-label={`Contents of ${formatPath(path)}`}>
            {children.map((child) => {
              const label = child.kind === 'dir' ? `${child.name}, folder` : child.name;
              const content = (
                <>
                  <span className={styles.itemIcon} data-kind={child.kind}>
                    <Icon name={iconFor(child)} size={30} strokeWidth={1.5} />
                  </span>
                  <span className={styles.itemName}>{child.name}</span>
                </>
              );
              return (
                <li key={child.name}>
                  {child.kind === 'file' && child.href && !child.opens ? (
                    <a className={styles.item} href={child.href} target="_blank" rel="noreferrer" aria-label={`${child.name} (opens in a new tab)`}>
                      {content}
                    </a>
                  ) : (
                    <button
                      type="button"
                      className={styles.item}
                      aria-label={label}
                      aria-pressed={preview === child ? true : undefined}
                      onClick={() => activate(child)}
                    >
                      {content}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          {preview && (
            <aside className={styles.preview} aria-label={`Preview of ${preview.name}`}>
              <header className={styles.previewHeader}>
                <h3>{preview.name}</h3>
                <button type="button" className={styles.navButton} onClick={() => setPreview(null)} aria-label="Close preview">
                  <Icon name="close" />
                </button>
              </header>
              <pre className={styles.previewText}>{preview.content}</pre>
            </aside>
          )}
        </div>

        <p className={styles.status}>
          {children.length} {children.length === 1 ? 'item' : 'items'}
        </p>
      </div>
    </div>
  );
}
