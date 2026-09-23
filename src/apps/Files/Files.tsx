import { useRef, useState } from 'react';
import { formatPath, getNode, HOME, HOME_PATH, isSamePath } from '../../data/filesystem';
import { HeaderButton } from '../../components/adw/HeaderBar';
import { SplitView } from '../../components/adw/SplitView';
import { Icon, type IconName } from '../../components/icons/Icon';
import { useElementWidth } from '../../hooks/useElementWidth';
import type { AppProps } from '../../types/apps';
import type { FsFile, FsNode, FsPath } from '../../types/filesystem';
import styles from './Files.module.css';

const PLACES: ReadonlyArray<{ label: string; path: FsPath; icon: IconName }> = [
  { label: 'Home', path: HOME_PATH, icon: 'home' },
  ...HOME.children
    .filter((child) => child.kind === 'dir')
    .map((child) => ({ label: child.name, path: [...HOME_PATH, child.name], icon: 'folder' as IconName })),
];

/** Below this window width the sidebar hides behind a back button. */
const SPLIT_MIN_WIDTH = 560;

/** Adwaita's full-colour icons, like Nautilus's grid view. */
function iconFor(node: FsNode): string {
  if (node.kind === 'dir') return '/icons/files/folder.svg';
  return node.binary ? '/icons/files/x-office-document.svg' : '/icons/files/text-x-generic.svg';
}

/** Files deep links arrive as "home/jordan/Projects". */
function initialPath(arg?: string): FsPath {
  if (!arg) return HOME_PATH;
  const path = arg.split('/').filter(Boolean);
  return getNode(path)?.kind === 'dir' ? path : HOME_PATH;
}

/** Laid out like GNOME Files (Nautilus). */
export default function Files({ arg, openApp }: AppProps) {
  const root = useRef<HTMLDivElement>(null);
  const width = useElementWidth(root);
  const collapsed = width > 0 && width < SPLIT_MIN_WIDTH;
  const [showPlaces, setShowPlaces] = useState(false);
  const [path, setPath] = useState<FsPath>(() => initialPath(arg));
  const [back, setBack] = useState<FsPath[]>([]);
  const [forward, setForward] = useState<FsPath[]>([]);
  const [preview, setPreview] = useState<FsFile | null>(null);

  const node = getNode(path);
  const children = node?.kind === 'dir' ? node.children : [];

  const navigate = (next: FsPath): void => {
    setShowPlaces(false);
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

  const pathBar = (
    <nav className={styles.pathBar} aria-label={`Location: ${formatPath(path)}`}>
      {crumbs.map((crumb, i) => (
        <span key={crumb.path.join('/')} className={styles.crumbWrap}>
          {i > 0 && (
            <span className={styles.crumbSep} aria-hidden="true">
              /
            </span>
          )}
          <button
            type="button"
            className={styles.crumb}
            aria-current={i === crumbs.length - 1 ? 'location' : undefined}
            onClick={() => navigate(crumb.path)}
          >
            {i === 0 && <Icon name="home" size={14} strokeWidth={2} />}
            {crumb.name}
          </button>
        </span>
      ))}
    </nav>
  );

  const places = (
    <ul className={styles.places}>
      {PLACES.map((place) => (
        <li key={place.label}>
          <button
            type="button"
            className={styles.place}
            aria-current={isSamePath(place.path, path) ? 'location' : undefined}
            onClick={() => navigate(place.path)}
          >
            <Icon name={place.icon} size={16} strokeWidth={2} /> {place.label}
          </button>
        </li>
      ))}
    </ul>
  );

  const view = (
    <div className={styles.body} data-preview={preview !== null}>
      <ul className={styles.grid} aria-label={`Contents of ${formatPath(path)}`}>
        {children.map((child) => {
          const label = child.kind === 'dir' ? `${child.name}, folder` : child.name;
          const content = (
            <>
              <img className={styles.itemIcon} src={iconFor(child)} alt="" width={64} height={64} draggable={false} />
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
            <HeaderButton icon="close" label="Close preview" onClick={() => setPreview(null)} />
          </header>
          <pre className={styles.previewText}>{preview.content}</pre>
        </aside>
      )}
    </div>
  );

  return (
    <SplitView
      ref={root}
      collapsed={collapsed}
      showContent={!showPlaces}
      onBack={() => setShowPlaces(true)}
      backLabel="Show places"
      sidebarLabel="Places"
      sidebarWidth={200}
      sidebarHeader={{ title: 'Files' }}
      sidebar={places}
      contentHeader={{
        title: pathBar,
        start: (
          <>
            <HeaderButton icon="back" label="Back" onClick={goBack} disabled={back.length === 0} />
            <HeaderButton icon="chevron" label="Forward" onClick={goForward} disabled={forward.length === 0} />
          </>
        ),
      }}
      content={view}
    />
  );
}
