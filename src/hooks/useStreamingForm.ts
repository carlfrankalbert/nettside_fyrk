import { useState, useRef, useEffect, useCallback } from 'react';

interface StreamingFormState {
  /** Current input value */
  input: string;
  /** Whether a request is in progress */
  loading: boolean;
  /** Current error message, if any */
  error: string | null;
  /** Current result from streaming */
  result: string | null;
  /** Whether streaming is currently active */
  isStreaming: boolean;
  /** Whether the privacy section is expanded */
  isPrivacyOpen: boolean;
  /** Whether the example animation is playing */
  isExampleAnimating: boolean;
}

interface UseStreamingFormOptions {
  /** Validation function that returns error message or null if valid */
  validateInput: (input: string) => string | null;
  /** Function to perform the streaming request */
  streamRequest: (
    input: string,
    onChunk: (text: string) => void,
    onComplete: () => void,
    onError: (error: string) => void,
    signal: AbortSignal
  ) => Promise<void>;
  /** Tracking event name for submit action */
  trackingSubmitEvent: string;
  /** Tracking event name for example action */
  trackingExampleEvent: string;
  /** Tracking event name for reset action */
  trackingResetEvent: string;
  /** Tracking event name for privacy toggle */
  trackingPrivacyEvent: string;
  /** Example text to fill in the input */
  exampleText: string;
  /** Optional callback after successful completion */
  onSuccess?: (charCount: number, processingTimeMs: number) => void;
}

/**
 * Custom hook for managing streaming form state and behavior
 * Provides unified state management for AI-powered form components
 */
export function useStreamingForm({
  validateInput,
  streamRequest,
  trackingSubmitEvent,
  trackingExampleEvent,
  trackingResetEvent,
  trackingPrivacyEvent,
  exampleText,
  onSuccess,
}: UseStreamingFormOptions) {
  const [state, setState] = useState<StreamingFormState>({
    input: '',
    loading: false,
    error: null,
    result: null,
    isStreaming: false,
    isPrivacyOpen: false,
    isExampleAnimating: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const startTimeRef = useRef<number>(0);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Import tracking dynamically to avoid SSR issues
  const trackClick = useCallback(async (eventName: string) => {
    const { trackClick: track } = await import('../utils/tracking');
    track(eventName);
  }, []);

  const setInput = useCallback((value: string) => {
    setState((prev) => ({ ...prev, input: value }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => (prev.error ? { ...prev, error: null } : prev));
  }, []);

  const handleFillExample = useCallback(() => {
    trackClick(trackingExampleEvent);

    setState((prev) => ({
      ...prev,
      isExampleAnimating: true,
      input: exampleText,
      error: null,
    }));

    // Focus textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);

    // Reset animation state after animation completes
    setTimeout(() => {
      setState((prev) => ({ ...prev, isExampleAnimating: false }));
    }, 600);
  }, [exampleText, trackClick, trackingExampleEvent]);

  const handleClearResult = useCallback(() => {
    trackClick(trackingResetEvent);
    setState((prev) => ({
      ...prev,
      result: null,
      error: null,
      input: '',
    }));
  }, [trackClick, trackingResetEvent]);

  const handleTogglePrivacy = useCallback(() => {
    setState((prev) => {
      if (!prev.isPrivacyOpen) {
        // Only track when opening
        trackClick(trackingPrivacyEvent);
      }
      return { ...prev, isPrivacyOpen: !prev.isPrivacyOpen };
    });
  }, [trackClick, trackingPrivacyEvent]);

  const handleSubmit = useCallback(async () => {
    // Prevent duplicate submissions
    if (state.loading) return;

    // Validate input
    const validationError = validateInput(state.input);
    if (validationError) {
      setState((prev) => ({ ...prev, error: validationError }));
      return;
    }

    // Track button click
    trackClick(trackingSubmitEvent);

    // Record start time
    startTimeRef.current = Date.now();

    setState((prev) => ({
      ...prev,
      loading: true,
      isStreaming: true,
      error: null,
      result: '',
    }));

    // Cancel any existing request and create new abort controller
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    await streamRequest(
      state.input.trim(),
      (chunk) => {
        // Append streaming chunk
        setState((prev) => ({ ...prev, result: (prev.result || '') + chunk }));
      },
      () => {
        // Streaming complete
        setState((prev) => ({
          ...prev,
          loading: false,
          isStreaming: false,
        }));
        abortControllerRef.current = null;

        // Track success if callback provided
        if (onSuccess) {
          const processingTimeMs = Date.now() - startTimeRef.current;
          onSuccess(state.input.trim().length, processingTimeMs);
        }

        // Scroll to result
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      },
      (errorMsg) => {
        // Error occurred
        setState((prev) => ({
          ...prev,
          error: errorMsg,
          loading: false,
          isStreaming: false,
          result: null,
        }));
        abortControllerRef.current = null;
      },
      abortControllerRef.current.signal
    );
  }, [
    state.loading,
    state.input,
    validateInput,
    streamRequest,
    trackClick,
    trackingSubmitEvent,
    onSuccess,
  ]);

  return {
    // State
    input: state.input,
    loading: state.loading,
    error: state.error,
    result: state.result,
    isStreaming: state.isStreaming,
    isPrivacyOpen: state.isPrivacyOpen,
    isExampleAnimating: state.isExampleAnimating,

    // Refs
    resultRef,
    textareaRef,

    // Actions
    setInput,
    setError,
    clearError,
    handleFillExample,
    handleClearResult,
    handleTogglePrivacy,
    handleSubmit,
  };
}
