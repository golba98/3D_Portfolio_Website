import { useEffect, useState, type RefObject } from 'react';

/** Open state for a top-bar menu: closes on a pointer press outside `root` or on Escape. */
export function usePopover(root: RefObject<HTMLElement | null>): [boolean, (open: boolean | ((open: boolean) => boolean)) => void] {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent): void => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, root]);

  return [open, setOpen];
}
