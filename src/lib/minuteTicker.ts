/** A little past the boundary, so the new minute has definitely started. */
const SLACK_MS = 20;

/**
 * Calls `onTick` at the start of every minute, so clocks change when the
 * real clock does rather than up to a poll interval late. Also ticks as soon
 * as the tab becomes visible again, since background tabs' timers are
 * throttled. Returns a function that stops it.
 */
export function onEveryMinute(onTick: () => void): () => void {
  let timer = 0;
  const schedule = (): void => {
    const now = Date.now();
    timer = window.setTimeout(() => {
      onTick();
      schedule();
    }, 60_000 - (now % 60_000) + SLACK_MS);
  };
  const onVisible = (): void => {
    if (document.visibilityState !== 'visible') return;
    window.clearTimeout(timer);
    onTick();
    schedule();
  };
  schedule();
  document.addEventListener('visibilitychange', onVisible);
  return () => {
    window.clearTimeout(timer);
    document.removeEventListener('visibilitychange', onVisible);
  };
}
