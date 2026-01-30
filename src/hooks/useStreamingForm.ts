import { useState, useRef, useCallback } from 'react';
import { STREAMING_CONSTANTS, ERROR_MESSAGES, type StreamingErrorType } from '../utils/constants';
import { trackClick, logEvent } from '../utils/tracking';

/**
 * Patterns that indicate a network-related error
 */
const NETWORK_ERROR_PATTERNS = [
  /koble til/i,           // Norwegian: "couldn't connect"
  /network/i,             // English: network error
  /fetch/i,               // Fetch API errors
  /failed to fetch/i,     // Common fetch error
  /connection/i,          // Connection errors
  /offline/i,             // Offline errors
  /ECONNREFUSED/i,        // Node.js connection refused
  /ETIMEDOUT/i,           // Node.js timeout
];

/**
 * Check if an error message indicates a network error
 */
function isNetworkError(errorMsg: string): boolean {
  return NETWORK_ERROR_PATTERNS.some(pattern => pattern.test(errorMsg));
}

const { SUBMIT_THRESHOLD, HARD_TIMEOUT_MS } = STREAMING_CONSTANTS;

// ============================================================================
// Types
// ============================================================================

export interface StreamingServiceCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: () => void;
  onError: (error: string) => void;
  signal: AbortSignal;
}

export type StreamingServiceFn = (
  input: string,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: string) => void,
  signal: AbortSignal
) => Promise<void>;

export interface UseStreamingFormConfig {
  /** Tool name for tracking events (e.g., 'konseptspeil', 'antakelseskart') */
  toolName: string;
  /** Input validation function - returns error message or null if valid */
  validateInput: (input: string) => string | null;
  /** Streaming service function */
  streamingService: StreamingServiceFn;
  /** Output validation function */
  isValidOutput: (result: string) => boolean;
  /** Error messages */
  errorMessages: {
    TIMEOUT: string;
    INVALID_OUTPUT: string;
  };
}

export interface UseStreamingFormReturn {
  // State
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  error: string | null;
  errorType: StreamingErrorType;
  result: string | null;
  isStreaming: boolean;
  submittedInput: string | null;

  // Derived values
  trimmedLength: number;
  isButtonEnabled: boolean;

  // Actions
  handleSubmit: () => Promise<void>;
  setError: (error: string | null) => void;
  setErrorWithType: (message: string, type: StreamingErrorType) => void;
  clearError: () => void;
  reset: () => void;

  // Refs (exposed for components that need them)
  abortControllerRef: React.MutableRefObject<AbortController | null>;
}

// ============================================================================
// Hook
// ============================================================================

export function useStreamingForm(config: UseStreamingFormConfig): UseStreamingFormReturn {
  const { toolName, validateInput, streamingService, isValidOutput, errorMessages } = config;

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<StreamingErrorType>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [submittedInput, setSubmittedInput] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------
  const abortControllerRef = useRef<AbortController | null>(null);
  const hardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSubmittingRef = useRef(false);
  const checkStartTimeRef = useRef<number>(0);

  // ---------------------------------------------------------------------------
  // Derived Values
  // ---------------------------------------------------------------------------
  const trimmedLength = input.trim().length;
  const isButtonEnabled = trimmedLength >= SUBMIT_THRESHOLD && !loading;

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  const clearTimeouts = useCallback(() => {
    if (hardTimeoutRef.current) {
      clearTimeout(hardTimeoutRef.current);
      hardTimeoutRef.current = null;
    }
  }, []);

  const setErrorWithType = useCallback((message: string, type: StreamingErrorType) => {
    setError(message);
    setErrorType(type);
    if (type) {
      console.warn(`[${toolName}] Error: ${type}`);
    }
  }, [toolName]);

  const clearError = useCallback(() => {
    setError(null);
    setErrorType(null);
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setSubmittedInput(null);
    setError(null);
    setErrorType(null);
    setInput('');
  }, []);

  const handleSubmit = useCallback(async () => {
    // Prevent concurrent submissions
    if (isSubmittingRef.current || loading) return;
    isSubmittingRef.current = true;

    // Validate input
    const validationError = validateInput(input);
    if (validationError) {
      setErrorWithType(validationError, 'validation');
      isSubmittingRef.current = false;
      return;
    }

    // Track submission
    trackClick(`${toolName}_submit_attempted`);
    trackClick(`${toolName}_submit`);

    // Record start time
    checkStartTimeRef.current = Date.now();

    // Save submitted input
    setSubmittedInput(input.trim());

    // Reset state
    setLoading(true);
    setIsStreaming(true);
    setError(null);
    setErrorType(null);
    setResult(null);
    clearTimeouts();

    // Abort previous request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    // Set up hard timeout
    hardTimeoutRef.current = setTimeout(() => {
      clearTimeouts();
      abortControllerRef.current?.abort();
      setErrorWithType(errorMessages.TIMEOUT, 'timeout');
      setLoading(false);
      setIsStreaming(false);
      setResult(null);
      abortControllerRef.current = null;
      isSubmittingRef.current = false;
      logEvent(`${toolName}_error`, {
        charCount: input.trim().length,
        processingTimeMs: Date.now() - checkStartTimeRef.current,
      });
    }, HARD_TIMEOUT_MS);

    let finalResult = '';

    await streamingService(
      input.trim(),
      // onChunk
      (chunk) => {
        finalResult += chunk;
        setResult((prev) => (prev ?? '') + chunk);
      },
      // onComplete
      () => {
        clearTimeouts();
        isSubmittingRef.current = false;

        // Validate output
        if (!isValidOutput(finalResult)) {
          setErrorWithType(errorMessages.INVALID_OUTPUT, 'invalid_output');
          setLoading(false);
          setIsStreaming(false);
          setResult(null);
          abortControllerRef.current = null;
          logEvent(`${toolName}_error`, {
            charCount: input.trim().length,
            processingTimeMs: Date.now() - checkStartTimeRef.current,
          });
          return;
        }

        // Track success
        const processingTimeMs = Date.now() - checkStartTimeRef.current;
        logEvent(`${toolName}_success`, {
          charCount: input.trim().length,
          processingTimeMs,
        });

        setLoading(false);
        setIsStreaming(false);
        abortControllerRef.current = null;
      },
      // onError
      (errorMsg) => {
        clearTimeouts();
        isSubmittingRef.current = false;
        const type: StreamingErrorType = isNetworkError(errorMsg) ? 'network' : 'unknown';
        // Use standardized network error message if it's a network error
        const displayMessage = type === 'network' ? ERROR_MESSAGES.NETWORK_ERROR : errorMsg;
        setErrorWithType(displayMessage, type);
        setLoading(false);
        setIsStreaming(false);
        logEvent(`${toolName}_error`, {
          charCount: input.trim().length,
          processingTimeMs: Date.now() - checkStartTimeRef.current,
        });
        setResult(null);
        abortControllerRef.current = null;
      },
      abortControllerRef.current.signal
    );
  }, [input, loading, toolName, validateInput, streamingService, isValidOutput, errorMessages, clearTimeouts, setErrorWithType]);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  return {
    // State
    input,
    setInput,
    loading,
    error,
    errorType,
    result,
    isStreaming,
    submittedInput,

    // Derived
    trimmedLength,
    isButtonEnabled,

    // Actions
    handleSubmit,
    setError,
    setErrorWithType,
    clearError,
    reset,

    // Refs
    abortControllerRef,
  };
}
