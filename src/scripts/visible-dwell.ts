/**
 * Run a callback once the page has been visible for a given time in total.
 * Time in a background tab or a prerendered page doesn't count.
 *
 * Used to send page views only for visits someone actually looked at:
 * crawlers that load a page and move on within seconds are not counted.
 */
export function whenVisibleFor(ms: number, callback: () => void): void {
  let remaining = ms;
  let startedAt = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const done = () => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    callback();
  };

  const start = () => {
    startedAt = Date.now();
    timer = setTimeout(done, remaining);
  };

  const pause = () => {
    clearTimeout(timer);
    timer = undefined;
    remaining -= Date.now() - startedAt;
  };

  function onVisibilityChange() {
    if (document.visibilityState === 'visible') {
      if (!timer) start();
    } else if (timer) {
      pause();
    }
  }

  document.addEventListener('visibilitychange', onVisibilityChange);
  if (document.visibilityState === 'visible') start();
}
