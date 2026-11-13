import { useEffect, useRef, useState } from 'react';

const COPIED_DURATION_MS = 1800;

/** Copy feedback shared by the email and installation command buttons. */
export function useClipboard() {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      window.clearTimeout(timer.current);
      setCopied(true);
      timer.current = window.setTimeout(() => setCopied(false), COPIED_DURATION_MS);
    } catch {
      // Clipboard access can be blocked; the original text remains available.
    }
  };

  return { copied, copy };
}
