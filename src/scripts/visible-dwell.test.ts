import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { whenVisibleFor } from './visible-dwell';

let visibility: DocumentVisibilityState = 'visible';

function setVisibility(state: DocumentVisibilityState) {
  visibility = state;
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  vi.useFakeTimers();
  visibility = 'visible';
  Object.defineProperty(document, 'visibilityState', { get: () => visibility, configurable: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('whenVisibleFor', () => {
  it('runs after the page has been visible for the given time', () => {
    const callback = vi.fn();
    whenVisibleFor(5000, callback);

    vi.advanceTimersByTime(4999);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledOnce();
  });

  it('does not run when the visitor leaves before the time is up', () => {
    const callback = vi.fn();
    whenVisibleFor(5000, callback);

    vi.advanceTimersByTime(2000);
    setVisibility('hidden');
    vi.advanceTimersByTime(60_000);

    expect(callback).not.toHaveBeenCalled();
  });

  it('counts only visible time across tab switches', () => {
    const callback = vi.fn();
    whenVisibleFor(5000, callback);

    vi.advanceTimersByTime(3000);
    setVisibility('hidden');
    vi.advanceTimersByTime(10_000);
    setVisibility('visible');

    vi.advanceTimersByTime(1999);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledOnce();
  });

  it('starts counting when a page opened in the background is shown', () => {
    visibility = 'hidden';
    const callback = vi.fn();
    whenVisibleFor(5000, callback);

    vi.advanceTimersByTime(60_000);
    expect(callback).not.toHaveBeenCalled();

    setVisibility('visible');
    vi.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledOnce();
  });

  it('runs only once', () => {
    const callback = vi.fn();
    whenVisibleFor(5000, callback);

    vi.advanceTimersByTime(5000);
    setVisibility('hidden');
    setVisibility('visible');
    vi.advanceTimersByTime(60_000);

    expect(callback).toHaveBeenCalledOnce();
  });
});
