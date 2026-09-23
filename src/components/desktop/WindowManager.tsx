import { AnimatePresence, motion } from 'framer-motion';
import { useWindows } from '../../store/windows';
import type { SnapTarget } from '../../types/windows';
import { Window } from './Window';
import styles from './WindowManager.module.css';

/** Where each snap target puts a window, as a fraction of the workspace. */
const SNAP_GEOMETRY: Record<SnapTarget, { left: string; width: string }> = {
  maximized: { left: '0%', width: '100%' },
  'tiled-left': { left: '0%', width: '50%' },
  'tiled-right': { left: '50%', width: '50%' },
};

/** The preview sits a little inside the area it stands for. */
const INSET = 6;

export function WindowManager() {
  const windows = useWindows((s) => s.windows);
  const snapPreview = useWindows((s) => s.snapPreview);
  return (
    <>
      {/* GNOME's tile preview: where the dragged window will land if released now. */}
      <AnimatePresence>
        {snapPreview && (
          <motion.div
            className={styles.snapPreview}
            aria-hidden="true"
            style={{
              left: `calc(${SNAP_GEOMETRY[snapPreview].left} + ${INSET}px)`,
              width: `calc(${SNAP_GEOMETRY[snapPreview].width} - ${INSET * 2}px)`,
            }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {windows.map((win) => (
          <Window key={win.id} win={win} />
        ))}
      </AnimatePresence>
    </>
  );
}
