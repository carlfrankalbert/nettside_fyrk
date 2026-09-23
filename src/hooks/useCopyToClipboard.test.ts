import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCopyToClipboard } from './useCopyToClipboard';

/** Replace navigator.clipboard, which happy-dom does not provide by default. */
function stubClipboard(writeText: ReturnType<typeof vi.fn> | undefined) {
  Object.defineProperty(navigator, 'clipboard', {
    value: writeText ? { writeText } : undefined,
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  stubClipboard(vi.fn().mockResolvedValue(undefined));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('useCopyToClipboard', () => {
  it('starts out not copied', () => {
    const { result } = renderHook(() => useCopyToClipboard());
    expect(result.current.copied).toBe(false);
  });

  it('writes the text through the clipboard API and reports success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);

    const { result } = renderHook(() => useCopyToClipboard());
    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.copyToClipboard('kopier meg');
    });

    expect(writeText).toHaveBeenCalledExactlyOnceWith('kopier meg');
    expect(returned).toBe(true);
    expect(result.current.copied).toBe(true);
  });

  it('clears the copied flag after the reset delay', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCopyToClipboard(500));

    await act(async () => {
      await result.current.copyToClipboard('tekst');
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.copied).toBe(false);
  });

  it('honours a custom reset delay', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCopyToClipboard(5000));

    await act(async () => {
      await result.current.copyToClipboard('tekst');
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.copied).toBe(true);
  });

  it('reset() clears the flag immediately', async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copyToClipboard('tekst');
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.copied).toBe(false);
  });

  it('falls back to execCommand when the clipboard API rejects', async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error('permission denied')));
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true });

    const { result } = renderHook(() => useCopyToClipboard());
    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.copyToClipboard('tekst');
    });

    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(returned).toBe(true);
    await waitFor(() => expect(result.current.copied).toBe(true));
  });

  it('falls back when the clipboard API is absent entirely', async () => {
    stubClipboard(undefined);
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true });

    const { result } = renderHook(() => useCopyToClipboard());
    await act(async () => {
      await result.current.copyToClipboard('tekst');
    });

    expect(execCommand).toHaveBeenCalledWith('copy');
  });

  it('reports failure and stays not copied when both paths fail', async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    Object.defineProperty(document, 'execCommand', {
      value: vi.fn().mockReturnValue(false),
      configurable: true,
    });

    const { result } = renderHook(() => useCopyToClipboard());
    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.copyToClipboard('tekst');
    });

    expect(returned).toBe(false);
    expect(result.current.copied).toBe(false);
  });

  it('removes the temporary textarea it creates for the fallback', async () => {
    stubClipboard(undefined);
    Object.defineProperty(document, 'execCommand', {
      value: vi.fn().mockReturnValue(true),
      configurable: true,
    });

    const { result } = renderHook(() => useCopyToClipboard());
    await act(async () => {
      await result.current.copyToClipboard('tekst');
    });

    expect(document.querySelectorAll('textarea')).toHaveLength(0);
  });
});
