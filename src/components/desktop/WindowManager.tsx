import { AnimatePresence } from 'framer-motion';
import { useWindows } from '../../store/windows';
import { Window } from './Window';

export function WindowManager() {
  const windows = useWindows((s) => s.windows);
  return (
    <AnimatePresence>
      {windows.map((win) => (
        <Window key={win.id} win={win} />
      ))}
    </AnimatePresence>
  );
}
