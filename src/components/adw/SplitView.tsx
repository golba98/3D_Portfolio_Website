import type { CSSProperties, ReactNode, Ref } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { IconName } from '../icons/Icon';
import { useAppFrame, useBackHandler } from './frame';
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
  /** The back button's icon; a sidebar icon when "back" really means "show the sidebar". */
  backIcon?: IconName;
  sidebarHeader: PaneHeader;
  sidebar: ReactNode;
  sidebarLabel: string;
  contentHeader: PaneHeader;
  content: ReactNode;
  /** The content pane's scroller, so the parent can reset its scroll position. */
  contentRef?: Ref<HTMLDivElement>;
  sidebarWidth?: number;
  /**
   * The phone's back gesture returns from the content to the sidebar, as the
   * back button does. Off for apps whose content is the starting page (Files).
   */
  gestureBack?: boolean;
}

/** AdwNavigationSplitView: a sidebar and a content pane, each with its own header bar. */
export function SplitView({
  ref,
  collapsed,
  showContent,
  onBack,
  backLabel = 'Back',
  backIcon = 'back',
  sidebarHeader,
  sidebar,
  sidebarLabel,
  contentHeader,
  content,
  contentRef,
  sidebarWidth = 240,
  gestureBack = true,
}: SplitViewProps) {
  const showSidebar = !collapsed || !showContent;
  const showMain = !collapsed || showContent;
  const reducedMotion = useReducedMotion();
  const onPhone = useAppFrame()?.kind === 'mobile';
  useBackHandler(gestureBack && collapsed && showContent, onBack);

  // Collapsed, the panes slide like AdwNavigationView pages: content in from the right.
  const slide = collapsed && !reducedMotion ? 40 : 0;
  const enter = (from: number) => (slide ? { x: from, opacity: 0 } : { opacity: 0 });
  const transition = { duration: slide ? 0.22 : 0.12, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div ref={ref} className={styles.split} data-collapsed={collapsed} style={{ '--sidebar-width': `${sidebarWidth}px` } as CSSProperties}>
      <AnimatePresence initial={false}>
        {showSidebar && (
          <motion.div
            key="sidebar"
            className={styles.sidebarPane}
            initial={enter(-slide)}
            animate={{ x: 0, opacity: 1 }}
            transition={transition}
          >
            <HeaderBar variant="sidebar" trailing={collapsed} {...sidebarHeader} />
            <nav className={styles.sidebar} aria-label={sidebarLabel}>
              {sidebar}
            </nav>
          </motion.div>
        )}
        {showMain && (
          <motion.div
            key="content"
            className={styles.contentPane}
            initial={enter(slide)}
            animate={{ x: 0, opacity: 1 }}
            transition={transition}
          >
            <HeaderBar
              {...contentHeader}
              start={
                <>
                  {collapsed && (
                  <HeaderButton
                    icon={backIcon}
                    label={backLabel}
                    // iOS back buttons name the page they return to.
                    text={onPhone && backIcon === 'back' && typeof sidebarHeader.title === 'string' ? sidebarHeader.title : undefined}
                    onClick={onBack}
                  />
                )}
                  {contentHeader.start}
                </>
              }
            />
            <div ref={contentRef} className={styles.content}>
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
