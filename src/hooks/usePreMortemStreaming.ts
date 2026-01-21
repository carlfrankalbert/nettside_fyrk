import { useState, useRef, useCallback, useEffect } from 'react';
import { generatePreMortemStreaming, ERROR_MESSAGES } from '../services/pre-mortem-service';
import { STREAMING_CONSTANTS } from '../utils/constants';
import { trackClick, logEvent } from '../utils/tracking';

const { PRE_MORTEM_TIMEOUT_MS } = STREAMING_CONSTANTS;

export interface UsePreMortemStreamingReturn {
  // State
  loading: boolean;
  error: string | null;
  result: string | null;
  isStreaming: boolean;

  // Actions
  submit: (serializedInput: string) => Promise<void>;
  reset: () => void;
  setError: (error: string) => void;
  clearError: () => void;

  // Refs
  resultRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Hook for Pre-Mortem streaming logic
 */
export function usePreMortemStreaming(): UsePreMortemStreamingReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const setErrorMessage = useCallback((message: string) => {
    setError(message);
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const submit = useCallback(async (serializedInput: string) => {
    if (loading) return;

    trackClick('premortem_submit');
    startTimeRef.current = Date.now();

    setLoading(true);
    setIsStreaming(true);
    setError(null);
    setResult('');

    // Cancel any existing request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    // Set up timeout
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
      setError(ERROR_MESSAGES.TIMEOUT);
      setLoading(false);
      setIsStreaming(false);
      logEvent('premortem_error', { errorType: 'timeout' });
    }, PRE_MORTEM_TIMEOUT_MS);

    try {
      await generatePreMortemStreaming(
        serializedInput,
        (chunk) => {
          setResult((prev) => (prev || '') + chunk);
        },
        () => {
          clearTimeout(timeoutId);
          setLoading(false);
          setIsStreaming(false);
          abortControllerRef.current = null;

          const processingTimeMs = Date.now() - startTimeRef.current;
          logEvent('premortem_success', { processingTimeMs });

          // Scroll to result
          setTimeout(() => {
            resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        },
        (errorMsg) => {
          clearTimeout(timeoutId);
          setError(errorMsg);
          setLoading(false);
          setIsStreaming(false);
          setResult(null);
          abortControllerRef.current = null;
          logEvent('premortem_error', { errorType: 'streaming', message: errorMsg });
        },
        abortControllerRef.current.signal
      );
    } catch {
      clearTimeout(timeoutId);
      setError(ERROR_MESSAGES.DEFAULT);
      setLoading(false);
      setIsStreaming(false);
      logEvent('premortem_error', { errorType: 'unknown' });
    }
  }, [loading]);

  return {
    loading,
    error,
    result,
    isStreaming,
    submit,
    reset,
    setError: setErrorMessage,
    clearError,
    resultRef,
  };
}
