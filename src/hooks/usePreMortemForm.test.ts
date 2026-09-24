import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePreMortemForm, useMobileSync } from './usePreMortemForm';
import { trackClick } from '../utils/tracking';
import { PRE_MORTEM_VALIDATION } from '../utils/constants';

vi.mock('../utils/tracking', () => ({ trackClick: vi.fn() }));

const VALID = {
  beslutning: 'x'.repeat(PRE_MORTEM_VALIDATION.MIN_DECISION_LENGTH),
  bransje: 'offentlig',
  kontekst: 'y'.repeat(PRE_MORTEM_VALIDATION.MIN_CONTEXT_LENGTH),
  risikoniva: 'hoy',
  kundetype: 'b2b',
  beslutningsfrist: 'uker',
  effekthorisont: 'ar',
} as const;

function fillValid(updateField: ReturnType<typeof usePreMortemForm>['updateField']) {
  for (const [field, value] of Object.entries(VALID)) {
    updateField(field as keyof typeof VALID, value);
  }
}

beforeEach(() => {
  vi.mocked(trackClick).mockClear();
});

describe('usePreMortemForm', () => {
  it('starts empty, with confidentiality defaulting to internal', () => {
    const { result } = renderHook(() => usePreMortemForm(vi.fn()));
    expect(result.current.formData.beslutning).toBe('');
    expect(result.current.formData.konfidensialitet).toBe('intern');
    expect(result.current.hasRequiredFields).toBe(false);
  });

  it('updates a field and clears any shown error', () => {
    const clearError = vi.fn();
    const { result } = renderHook(() => usePreMortemForm(clearError));

    act(() => result.current.updateField('bransje', 'helse'));

    expect(result.current.formData.bransje).toBe('helse');
    expect(clearError).toHaveBeenCalledTimes(1);
  });

  it('tracks input_started once, on the first non-empty value', () => {
    const { result } = renderHook(() => usePreMortemForm(vi.fn()));

    act(() => result.current.updateField('beslutning', ''));
    expect(trackClick).not.toHaveBeenCalled();

    act(() => result.current.updateField('beslutning', 'a'));
    act(() => result.current.updateField('kontekst', 'b'));
    expect(trackClick).toHaveBeenCalledExactlyOnceWith('premortem_input_started');
  });

  it('reports required fields only when every one is filled to its minimum', () => {
    const { result } = renderHook(() => usePreMortemForm(vi.fn()));

    act(() => fillValid(result.current.updateField));
    expect(result.current.hasRequiredFields).toBe(true);

    act(() => result.current.updateField('beslutning', 'x'.repeat(PRE_MORTEM_VALIDATION.MIN_DECISION_LENGTH - 1)));
    expect(result.current.hasRequiredFields).toBe(false);
  });

  it('ignores surrounding whitespace when checking minimum lengths', () => {
    const { result } = renderHook(() => usePreMortemForm(vi.fn()));

    act(() => fillValid(result.current.updateField));
    act(() =>
      result.current.updateField('kontekst', `   ${'y'.repeat(PRE_MORTEM_VALIDATION.MIN_CONTEXT_LENGTH - 1)}   `)
    );

    expect(result.current.hasRequiredFields).toBe(false);
  });

  it('validates against the current form data', () => {
    const { result } = renderHook(() => usePreMortemForm(vi.fn()));
    expect(result.current.validateForm()).toMatch(/minst/);

    act(() => fillValid(result.current.updateField));
    expect(result.current.validateForm()).toBeNull();
  });

  it('serializes the current form data as JSON', () => {
    const { result } = renderHook(() => usePreMortemForm(vi.fn()));
    act(() => result.current.updateField('bransje', 'helse'));

    expect(JSON.parse(result.current.serializeForm())).toMatchObject({
      bransje: 'helse',
      konfidensialitet: 'intern',
    });
  });

  it('resets to the initial state and tracks the reset', () => {
    const { result } = renderHook(() => usePreMortemForm(vi.fn()));
    act(() => fillValid(result.current.updateField));

    act(() => result.current.resetForm());

    expect(result.current.formData.beslutning).toBe('');
    expect(result.current.hasRequiredFields).toBe(false);
    expect(trackClick).toHaveBeenCalledWith('premortem_reset');
  });
});

describe('useMobileSync', () => {
  const base = {
    toolName: 'premortem',
    hasRequiredFields: false,
    loading: false,
    hasResult: false,
    isStreaming: false,
    onSubmit: vi.fn(),
  };

  it('announces form state to the mobile CTA bar', () => {
    const listener = vi.fn();
    window.addEventListener('premortem:inputChange', listener);

    const { rerender } = renderHook((props: typeof base) => useMobileSync(props), { initialProps: base });
    rerender({ ...base, hasRequiredFields: true, loading: true });

    expect((listener.mock.lastCall![0] as CustomEvent).detail).toEqual({
      isValid: true,
      isLoading: true,
      hasResult: false,
    });
    window.removeEventListener('premortem:inputChange', listener);
  });

  it('does not report a result while it is still streaming', () => {
    const listener = vi.fn();
    window.addEventListener('premortem:inputChange', listener);

    const { rerender } = renderHook((props: typeof base) => useMobileSync(props), {
      initialProps: { ...base, hasResult: true, isStreaming: true },
    });
    expect((listener.mock.lastCall![0] as CustomEvent).detail.hasResult).toBe(false);

    rerender({ ...base, hasResult: true, isStreaming: false });
    expect((listener.mock.lastCall![0] as CustomEvent).detail.hasResult).toBe(true);
    window.removeEventListener('premortem:inputChange', listener);
  });

  it('submits when the mobile CTA fires, and stops listening on unmount', () => {
    const onSubmit = vi.fn();
    const { unmount } = renderHook(() => useMobileSync({ ...base, onSubmit }));

    window.dispatchEvent(new CustomEvent('premortem:submit'));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    unmount();
    window.dispatchEvent(new CustomEvent('premortem:submit'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
