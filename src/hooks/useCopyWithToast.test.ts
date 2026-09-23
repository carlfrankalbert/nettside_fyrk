import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCopyWithToast } from './useCopyWithToast';

function stubClipboard(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  stubClipboard(vi.fn().mockResolvedValue(undefined));
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useCopyWithToast', () => {
  it('starts with no toast', () => {
    const { result } = renderHook(() => useCopyWithToast());

    expect(result.current.showToast).toBe(false);
    expect(result.current.toastMessage).toBe('');
  });

  it('shows the default success message after copying', async () => {
    const { result } = renderHook(() => useCopyWithToast());

    await act(async () => {
      await result.current.copyWithToast('tekst');
    });

    expect(result.current.showToast).toBe(true);
    expect(result.current.toastMessage).toBe('Kopiert!');
  });

  it('prefers a per-call message over the default', async () => {
    const { result } = renderHook(() => useCopyWithToast());

    await act(async () => {
      await result.current.copyWithToast('tekst', 'Lenke kopiert');
    });

    expect(result.current.toastMessage).toBe('Lenke kopiert');
  });

  it('shows the error message when the copy fails', async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    Object.defineProperty(document, 'execCommand', {
      value: vi.fn().mockReturnValue(false),
      configurable: true,
    });
    const { result } = renderHook(() => useCopyWithToast());

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.copyWithToast('tekst', 'Lenke kopiert');
    });

    expect(returned).toBe(false);
    expect(result.current.toastMessage).toBe('Kunne ikke kopiere');
  });

  it('uses custom messages and duration from options', async () => {
    const { result } = renderHook(() =>
      useCopyWithToast({ successMessage: 'Ferdig', toastDuration: 5000 })
    );

    await act(async () => {
      await result.current.copyWithToast('tekst');
    });
    expect(result.current.toastMessage).toBe('Ferdig');

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.showToast).toBe(true);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.showToast).toBe(false);
  });

  it('hides the toast after the duration', async () => {
    const { result } = renderHook(() => useCopyWithToast({ toastDuration: 1000 }));

    await act(async () => {
      await result.current.copyWithToast('tekst');
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.showToast).toBe(false);
  });

  it('restarts the timer when copying again, so the toast does not vanish early', async () => {
    const { result } = renderHook(() => useCopyWithToast({ toastDuration: 1000 }));

    await act(async () => {
      await result.current.copyWithToast('først');
    });
    act(() => {
      vi.advanceTimersByTime(800);
    });
    await act(async () => {
      await result.current.copyWithToast('igjen');
    });

    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(result.current.showToast).toBe(true);

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.showToast).toBe(false);
  });

  it('clears its pending timer on unmount', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const { result, unmount } = renderHook(() => useCopyWithToast());

    await act(async () => {
      await result.current.copyWithToast('tekst');
    });
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
