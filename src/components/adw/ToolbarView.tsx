import type { ReactNode, Ref } from 'react';
import styles from './ToolbarView.module.css';

interface ToolbarViewProps {
  /** Usually a HeaderBar. */
  top: ReactNode;
  children: ReactNode;
  /** The scroller under the header bar. */
  bodyRef?: Ref<HTMLDivElement>;
}

/** AdwToolbarView: a header bar that stays put over scrolling content. */
export function ToolbarView({ top, children, bodyRef }: ToolbarViewProps) {
  return (
    <div className={styles.view}>
      {top}
      <div ref={bodyRef} className={styles.body}>
        {children}
      </div>
    </div>
  );
}
