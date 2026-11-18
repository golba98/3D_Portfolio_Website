import { useEffect, useRef, useState } from 'react';

export function useClipboard() {
  const [feedback, setFeedback] = useState('');
  const timer = useRef(0);
  const attempt = useRef(0);
  useEffect(
    () => () => {
      attempt.current++;
      window.clearTimeout(timer.current);
    },
    [],
  );

  async function copy(text: string) {
    const current = ++attempt.current;
    window.clearTimeout(timer.current);
    let result = 'Copied';
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      result = 'Copy unavailable. Select the text to copy it.';
    }
    if (attempt.current !== current) return;
    setFeedback(result);
    if (result === 'Copied') timer.current = window.setTimeout(() => setFeedback(''), 1800);
  }
  return { copied: feedback === 'Copied', failed: Boolean(feedback && feedback !== 'Copied'), feedback, copy };
}
