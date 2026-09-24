import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type React from 'react';
import { useFormInputHandlers } from './useFormInputHandlers';
import { trackClick } from '../utils/tracking';

vi.mock('../utils/tracking', () => ({ trackClick: vi.fn() }));

type Options = Parameters<typeof useFormInputHandlers>[0];

function setup(overrides: Partial<Options> = {}) {
  const textarea = document.createElement('textarea');
  const options: Options = {
    toolName: 'konseptspeil',
    input: '',
    setInput: vi.fn(),
    error: null,
    clearError: vi.fn(),
    isButtonEnabled: true,
    handleSubmit: vi.fn(),
    textareaRef: { current: textarea },
    loading: false,
    result: null,
    trimmedLength: 0,
    ...overrides,
  };
  const hook = renderHook((props: Options) => useFormInputHandlers(props), { initialProps: options });
  return { ...hook, options, textarea };
}

function keyDown(key: string, modifiers: { metaKey?: boolean; ctrlKey?: boolean } = {}) {
  return {
    key,
    metaKey: false,
    ctrlKey: false,
    ...modifiers,
    preventDefault: vi.fn(),
  } as unknown as React.KeyboardEvent<HTMLTextAreaElement>;
}

function change(value: string) {
  return { target: { value } } as unknown as React.ChangeEvent<HTMLTextAreaElement>;
}

function paste(text: string, textarea: HTMLTextAreaElement, selection: [number, number]) {
  textarea.setSelectionRange(...selection);
  return {
    clipboardData: { getData: () => text },
    currentTarget: textarea,
    preventDefault: vi.fn(),
  } as unknown as React.ClipboardEvent<HTMLTextAreaElement>;
}

beforeEach(() => {
  vi.mocked(trackClick).mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useFormInputHandlers — mobile CTA sync', () => {
  it('announces input state on mount and when it changes', () => {
    const listener = vi.fn();
    window.addEventListener('konseptspeil:inputChange', listener);

    const { rerender, options } = setup({ trimmedLength: 0 });
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({
      length: 0,
      isLoading: false,
      hasResult: false,
    });

    rerender({ ...options, trimmedLength: 42, loading: true, result: 'svar' });
    expect((listener.mock.lastCall![0] as CustomEvent).detail).toEqual({
      length: 42,
      isLoading: true,
      hasResult: true,
    });

    window.removeEventListener('konseptspeil:inputChange', listener);
  });

  it('submits when the mobile CTA fires, and stops listening on unmount', () => {
    const { options, unmount } = setup();

    window.dispatchEvent(new CustomEvent('konseptspeil:submit'));
    expect(options.handleSubmit).toHaveBeenCalledTimes(1);

    unmount();
    window.dispatchEvent(new CustomEvent('konseptspeil:submit'));
    expect(options.handleSubmit).toHaveBeenCalledTimes(1);
  });
});

describe('useFormInputHandlers — handleKeyDown', () => {
  it('submits on Cmd+Enter and Ctrl+Enter when the button is enabled', () => {
    const { result, options } = setup();

    const cmd = keyDown('Enter', { metaKey: true });
    result.current.handleKeyDown(cmd);
    result.current.handleKeyDown(keyDown('Enter', { ctrlKey: true }));

    expect(cmd.preventDefault).toHaveBeenCalled();
    expect(options.handleSubmit).toHaveBeenCalledTimes(2);
  });

  it('swallows Cmd+Enter without submitting when the button is disabled', () => {
    const { result, options } = setup({ isButtonEnabled: false });

    const event = keyDown('Enter', { metaKey: true });
    result.current.handleKeyDown(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(options.handleSubmit).not.toHaveBeenCalled();
  });

  it('leaves plain Enter alone so it inserts a newline', () => {
    const { result, options } = setup();

    const event = keyDown('Enter');
    result.current.handleKeyDown(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(options.handleSubmit).not.toHaveBeenCalled();
  });
});

describe('useFormInputHandlers — handleInputChange', () => {
  it('passes plain text through', () => {
    const { result, options } = setup();
    result.current.handleInputChange(change('En idé'));
    expect(options.setInput).toHaveBeenCalledWith('En idé');
  });

  it('decodes URL-encoded text', () => {
    const { result, options } = setup();
    result.current.handleInputChange(change('En%20id%C3%A9'));
    expect(options.setInput).toHaveBeenCalledWith('En idé');
  });

  it('tracks input_started once, on the first character typed into an empty field', () => {
    const { result, rerender, options } = setup();

    result.current.handleInputChange(change('E'));
    rerender({ ...options, input: 'E' });
    result.current.handleInputChange(change('En'));

    expect(trackClick).toHaveBeenCalledExactlyOnceWith('konseptspeil_input_started');
  });

  it('clears a shown error on input, and leaves clearError alone otherwise', () => {
    const withError = setup({ error: 'For kort' });
    withError.result.current.handleInputChange(change('mer tekst'));
    expect(withError.options.clearError).toHaveBeenCalledTimes(1);

    const withoutError = setup();
    withoutError.result.current.handleInputChange(change('mer tekst'));
    expect(withoutError.options.clearError).not.toHaveBeenCalled();
  });
});

describe('useFormInputHandlers — handlePaste', () => {
  it('lets a plain paste through untouched', () => {
    const { result, options, textarea } = setup({ input: 'abc' });
    textarea.value = 'abc';

    const event = paste('vanlig tekst', textarea, [3, 3]);
    result.current.handlePaste(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(options.setInput).not.toHaveBeenCalled();
  });

  it('decodes a URL-encoded paste into the selection and moves the caret after it', () => {
    vi.useFakeTimers();
    const { result, options, textarea } = setup({ input: 'før  etter', error: 'feil' });
    textarea.value = 'før  etter';

    const event = paste('ny%20tekst', textarea, [4, 4]);
    result.current.handlePaste(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(options.setInput).toHaveBeenCalledWith('før ny tekst etter');
    expect(options.clearError).toHaveBeenCalled();

    textarea.value = 'før ny tekst etter';
    vi.runAllTimers();
    expect(textarea.selectionStart).toBe(4 + 'ny tekst'.length);
  });

  it('tracks input_started when pasting into an empty field', () => {
    const { result, textarea } = setup();
    result.current.handlePaste(paste('lim inn', textarea, [0, 0]));
    expect(trackClick).toHaveBeenCalledExactlyOnceWith('konseptspeil_input_started');
  });
});

describe('useFormInputHandlers — autoResizeTextarea', () => {
  it('sizes the textarea to its content after the debounce', () => {
    vi.useFakeTimers();
    const { result, textarea } = setup();
    Object.defineProperty(textarea, 'scrollHeight', { value: 180, configurable: true });

    act(() => {
      result.current.autoResizeTextarea();
      vi.advanceTimersByTime(16);
    });

    expect(textarea.style.height).toBe('180px');
  });
});
