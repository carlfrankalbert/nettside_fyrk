import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollToTopAndFocus, fillExample, scrollToElement } from './form-interactions';
import { trackClick } from './tracking';

// Mock tracking
vi.mock('./tracking', () => ({
  trackClick: vi.fn(),
}));

describe('scrollToTopAndFocus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('scrolls to top and focuses ref after delay', () => {
    const focus = vi.fn();
    const ref = { current: { focus } as unknown as HTMLTextAreaElement };

    scrollToTopAndFocus(ref, 100);

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(focus).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(focus).toHaveBeenCalled();
  });

  it('handles null ref gracefully', () => {
    const ref = { current: null };
    expect(() => {
      scrollToTopAndFocus(ref);
      vi.advanceTimersByTime(200);
    }).not.toThrow();
  });
});

describe('fillExample', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('sets input, clears error, and triggers animation', () => {
    const setInput = vi.fn();
    const clearError = vi.fn();
    const setAnimating = vi.fn();
    const focus = vi.fn();
    const setSelectionRange = vi.fn();
    const ref = { current: { focus, setSelectionRange } as unknown as HTMLTextAreaElement };

    fillExample('example text', setInput, clearError, setAnimating, ref);

    expect(setAnimating).toHaveBeenCalledWith(true);
    expect(setInput).toHaveBeenCalledWith('example text');
    expect(clearError).toHaveBeenCalled();

    // Focus after delay
    vi.advanceTimersByTime(50);
    expect(focus).toHaveBeenCalled();
    expect(setSelectionRange).toHaveBeenCalledWith(12, 12);

    // Animation ends
    vi.advanceTimersByTime(600);
    expect(setAnimating).toHaveBeenCalledWith(false);
  });

  it('tracks click when trackingId provided', () => {
    const ref = { current: null };

    fillExample('text', vi.fn(), vi.fn(), vi.fn(), ref, { trackingId: 'test_example' });

    expect(trackClick).toHaveBeenCalledWith('test_example');
  });
});

describe('scrollToElement', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('scrolls element into view after delay', () => {
    const scrollIntoView = vi.fn();
    const ref = { current: { scrollIntoView } as unknown as HTMLElement };

    scrollToElement(ref, 100, 'start');

    expect(scrollIntoView).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('handles null ref gracefully', () => {
    const ref = { current: null };
    expect(() => {
      scrollToElement(ref);
      vi.advanceTimersByTime(200);
    }).not.toThrow();
  });
});
