import type { CSSProperties, ReactNode, Ref } from 'react';
import { HeaderBar, HeaderButton } from './HeaderBar';
import styles from './SplitView.module.css';

interface PaneHeader {
  title?: ReactNode;
  subtitle?: ReactNode;
  start?: ReactNode;
  end?: ReactNode;
}

interface SplitViewProps {
  /** Measured by the parent (it usually needs the width too). */
  ref?: Ref<HTMLDivElement>;
  /** One pane at a time, for narrow windows. */
  collapsed: boolean;
  /** When collapsed: show the content pane rather than the sidebar. */
  showContent: boolean;
  /** When collapsed: go from the content back to the sidebar. */
  onBack: () => void;
  backLabel?: string;
  sidebarHeader: PaneHeader;
  sidebar: ReactNode;
  sidebarLabel: string;
  contentHeader: PaneHeader;
  content: ReactNode;
  /** The content pane's scroller, so the parent can reset its scroll position. */
  contentRef?: Ref<HTMLDivElement>;
  sidebarWidth?: number;
}

/** AdwNavigationSplitView: a sidebar and a content pane, each with its own header bar. */
export function SplitView({
  ref,
  collapsed,
  showContent,
  onBack,
  backLabel = 'Back',
  sidebarHeader,
  sidebar,
  sidebarLabel,
  contentHeader,
  content,
  contentRef,
  sidebarWidth = 240,
}: SplitViewProps) {
  const showSidebar = !collapsed || !showContent;
  const showMain = !collapsed || showContent;

  return (
    <div ref={ref} className={styles.split} data-collapsed={collapsed} style={{ '--sidebar-width': `${sidebarWidth}px` } as CSSProperties}>
      {showSidebar && (
        <div className={styles.sidebarPane}>
          <HeaderBar variant="sidebar" trailing={collapsed} {...sidebarHeader} />
          <nav className={styles.sidebar} aria-label={sidebarLabel}>
            {sidebar}
          </nav>
        </div>
      )}
      {showMain && (
        <div className={styles.contentPane}>
          <HeaderBar
            leading={false}
            {...contentHeader}
            start={
              <>
                {collapsed && <HeaderButton icon="back" label={backLabel} onClick={onBack} />}
                {contentHeader.start}
              </>
            }
          />
          <div ref={contentRef} className={styles.content}>
            {content}
          </div>
        </div>
      )}
    </div>
  );
}
