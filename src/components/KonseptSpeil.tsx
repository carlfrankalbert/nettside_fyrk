import { useState, useRef, useEffect, useCallback } from 'react';
import { speileKonseptStreaming, ERROR_MESSAGES, isValidOutput } from '../services/konseptspeil-service';
import KonseptSpeilResultDisplayV2 from './KonseptSpeilResultDisplayV2';
import { SpinnerIcon, ChevronRightIcon } from './ui/Icon';
import { cn } from '../utils/classes';
import { INPUT_VALIDATION } from '../utils/constants';
import { trackClick, logEvent } from '../utils/tracking';

// ============================================================================
// Constants
// ============================================================================

const EXAMPLE_KONSEPT = `Jeg vurderer å bygge et lite verktøy for team som sliter med prioritering. Vi har mange initiativer samtidig, og det er uklart hva som faktisk er viktig. Jeg tror det finnes et reelt problem, men vi har ikke testet det ordentlig. Målet er å få mer klarhet før vi bestemmer oss.`;

/** Minimum characters required for button to be enabled (higher than MIN_LENGTH for UX) */
const SUBMIT_THRESHOLD = 50;

/** Timeout threshold in milliseconds */
const HARD_TIMEOUT_MS = 45000;  // 45 seconds - aborts request (higher than server's 30s timeout)

/** Error types for logging */
type ErrorType = 'timeout' | 'network' | 'invalid_output' | 'validation' | null;

// ============================================================================
// Input Helpers
// ============================================================================

/** Check if text appears to be URL-encoded */
function isUrlEncoded(text: string): boolean {
  const urlEncodedPattern = /%[0-9A-Fa-f]{2}/;
  if (!urlEncodedPattern.test(text)) return false;
  const commonEncodings = ['%20', '%0A', '%0D', '%C3'];
  return commonEncodings.some((enc) => text.includes(enc));
}

/** Safely decode URL-encoded text */
function safeDecodeURIComponent(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

/** Validates konsept input and returns an error message if invalid */
function validateKonseptInput(input: string): string | null {
  const trimmedInput = input.trim();

  if (trimmedInput.length < INPUT_VALIDATION.MIN_LENGTH) {
    return `Beskriv konseptet med minst ${INPUT_VALIDATION.MIN_LENGTH} tegn for å få en god refleksjon.`;
  }

  if (trimmedInput.length > INPUT_VALIDATION.MAX_LENGTH) {
    return `Konseptbeskrivelsen kan ikke være lengre enn ${INPUT_VALIDATION.MAX_LENGTH} tegn.`;
  }

  return null;
}

// ============================================================================
// Component
// ============================================================================

export default function KonseptSpeil() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isExampleAnimating, setIsExampleAnimating] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [submittedInput, setSubmittedInput] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------
  const abortControllerRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Synchronous guard to prevent race conditions with concurrent submissions
  // (React state updates are async, so we need a ref for immediate check)
  const isSubmittingRef = useRef(false);
  // Track start time for processing duration measurement
  const checkStartTimeRef = useRef<number>(0);
  // Track if input_started has been fired (only fire once per session)
  const hasTrackedInputStartRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Derived Values
  // ---------------------------------------------------------------------------
  const charCountWarning = INPUT_VALIDATION.MAX_LENGTH * 0.9;
  const charCountDanger = INPUT_VALIDATION.MAX_LENGTH * 0.975;
  const trimmedLength = input.trim().length;
  const isButtonEnabled = trimmedLength >= SUBMIT_THRESHOLD && !loading;
  const showMinimumHelper = isFocused && trimmedLength >= 1 && trimmedLength < SUBMIT_THRESHOLD;
  const isNearingMinimum = trimmedLength >= 1 && trimmedLength < SUBMIT_THRESHOLD;

  // ---------------------------------------------------------------------------
  // Callbacks (defined before effects that use them)
  // ---------------------------------------------------------------------------

  /** Auto-resize textarea to fit content */
  const autoResizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  /** Clear pending timeout */
  const clearTimeouts = useCallback(() => {
    if (hardTimeoutRef.current) {
      clearTimeout(hardTimeoutRef.current);
      hardTimeoutRef.current = null;
    }
  }, []);

  /** Set an error with type tracking for logging */
  const setErrorWithType = useCallback((message: string, type: ErrorType) => {
    setError(message);
    setErrorType(type);
    if (type) {
      console.warn(`[Konseptspeil] Error: ${type}`);
    }
  }, []);

  /** Submit the konsept for AI reflection */
  const handleSubmit = useCallback(async () => {
    // Use synchronous ref check to prevent race conditions
    // (React's loading state update is async, so rapid clicks could bypass it)
    if (isSubmittingRef.current || loading) return;
    isSubmittingRef.current = true;

    const validationError = validateKonseptInput(input);
    if (validationError) {
      setErrorWithType(validationError, 'validation');
      isSubmittingRef.current = false;
      return;
    }

    trackClick('konseptspeil_submit');

    // Record start time for processing duration tracking
    checkStartTimeRef.current = Date.now();

    // Save the submitted input for display in results
    setSubmittedInput(input.trim());

    // Clear previous state - reset result to null first to ensure clean state
    setLoading(true);
    setIsStreaming(true);
    setError(null);
    setErrorType(null);
    setResult(null); // Use null instead of '' to ensure clean state detection
    clearTimeouts();

    // Abort any previous request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    // Set up hard timeout
    hardTimeoutRef.current = setTimeout(() => {
      clearTimeouts();
      abortControllerRef.current?.abort();
      setErrorWithType(ERROR_MESSAGES.TIMEOUT, 'timeout');
      setLoading(false);
      setIsStreaming(false);
      setResult(null);
      abortControllerRef.current = null;
      isSubmittingRef.current = false;
      // Track timeout error
      logEvent('konseptspeil_error', {
        charCount: input.trim().length,
        processingTimeMs: Date.now() - checkStartTimeRef.current,
      });
    }, HARD_TIMEOUT_MS);

    let finalResult = '';

    await speileKonseptStreaming(
      input.trim(),
      (chunk) => {
        finalResult += chunk;
        // Use functional update to safely append chunks to previous state
        setResult((prev) => (prev ?? '') + chunk);
      },
      () => {
        clearTimeouts();
        isSubmittingRef.current = false;

        // Validate output format
        if (!isValidOutput(finalResult)) {
          setErrorWithType(ERROR_MESSAGES.INVALID_OUTPUT, 'invalid_output');
          setLoading(false);
          setIsStreaming(false);
          setResult(null);
          abortControllerRef.current = null;
          // Track invalid output as error
          logEvent('konseptspeil_error', {
            charCount: input.trim().length,
            processingTimeMs: Date.now() - checkStartTimeRef.current,
          });
          return;
        }

        // Track successful completion
        const processingTimeMs = Date.now() - checkStartTimeRef.current;
        logEvent('check_success', {
          charCount: input.trim().length,
          processingTimeMs,
        });

        setLoading(false);
        setIsStreaming(false);
        abortControllerRef.current = null;
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      },
      (errorMsg) => {
        clearTimeouts();
        isSubmittingRef.current = false;
        // Determine error type based on message
        const type: ErrorType = errorMsg.includes('koble til') ? 'network' : 'network';
        setErrorWithType(errorMsg, type);
        setLoading(false);
        setIsStreaming(false);
        // Track error
        logEvent('konseptspeil_error', {
          charCount: input.trim().length,
          processingTimeMs: Date.now() - checkStartTimeRef.current,
        });
        setResult(null);
        abortControllerRef.current = null;
      },
      abortControllerRef.current.signal
    );
  }, [input, loading, clearTimeouts, setErrorWithType]);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Dispatch events for mobile CTA sync
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('konseptspeil:inputChange', {
      detail: {
        length: trimmedLength,
        isLoading: loading,
        hasResult: !!result,
      }
    }));
  }, [trimmedLength, loading, result]);

  // Listen for mobile submit trigger
  useEffect(() => {
    const handleMobileSubmit = () => {
      handleSubmit();
    };
    window.addEventListener('konseptspeil:submit', handleMobileSubmit);
    return () => window.removeEventListener('konseptspeil:submit', handleMobileSubmit);
  }, [handleSubmit]);

  // Auto-resize textarea when input changes
  useEffect(() => {
    autoResizeTextarea();
  }, [input, autoResizeTextarea]);

  // Cleanup abort controller and timeouts on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      clearTimeouts();
    };
  }, [clearTimeouts]);

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  /** Handle paste events to decode URL-encoded text */
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text/plain');

    if (isUrlEncoded(pastedText)) {
      e.preventDefault();
      const decodedText = safeDecodeURIComponent(pastedText);

      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newValue = input.substring(0, start) + decodedText + input.substring(end);
      setInput(newValue);
      if (error) setError(null);

      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = start + decodedText.length;
          textareaRef.current.setSelectionRange(newPosition, newPosition);
        }
      }, 0);
    }
  };

  /** Fill in example text */
  const handleFillExample = () => {
    trackClick('konseptspeil_example');
    setIsExampleAnimating(true);
    setInput(EXAMPLE_KONSEPT);
    setError(null);

    setTimeout(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(EXAMPLE_KONSEPT.length, EXAMPLE_KONSEPT.length);
      }
    }, 50);

    setTimeout(() => {
      setIsExampleAnimating(false);
    }, 600);
  };

  /** Edit input while keeping results visible (Juster tekst) */
  const handleEditInput = () => {
    trackClick('konseptspeil_edit');
    // Scroll to input area
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Focus the textarea after scroll
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 300);
  };

  /** Full reset - clear everything (Nullstill) */
  const handleFullReset = () => {
    trackClick('konseptspeil_reset');
    setResult(null);
    setSubmittedInput(null);
    setError(null);
    setInput('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  /** Handle keyboard shortcuts (Cmd/Ctrl+Enter to submit) */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (isButtonEnabled) {
        handleSubmit();
      }
    }
  };

  /** Handle input change with URL decoding */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value;
    if (isUrlEncoded(newValue)) {
      newValue = safeDecodeURIComponent(newValue);
    }

    // Track first input (funnel start) - only fire once per session
    if (!hasTrackedInputStartRef.current && newValue.length > 0 && input.length === 0) {
      hasTrackedInputStartRef.current = true;
      trackClick('konseptspeil_input_started');
    }

    setInput(newValue);
    if (error) setError(null);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6" aria-busy={loading}>
      {/* Input section */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="konsept-input" className="block text-base font-medium text-neutral-700">
            Beskriv konseptet ditt
          </label>
          {!input && !loading && (
            <button
              type="button"
              onClick={handleFillExample}
              className="text-sm text-brand-navy hover:text-brand-cyan-darker underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 rounded transition-colors"
            >
              Prøv med eksempel
            </button>
          )}
        </div>

        <textarea
          ref={textareaRef}
          id="konsept-input"
          value={input}
          onChange={handleInputChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Jeg vurderer å bygge... Problemet jeg vil løse er..."
          maxLength={INPUT_VALIDATION.MAX_LENGTH}
          aria-describedby={error ? 'konsept-error konsept-help konsept-helper' : 'konsept-help konsept-helper'}
          aria-invalid={error ? 'true' : undefined}
          className={cn(
            'w-full px-4 py-3 text-base text-neutral-700 bg-white border-2 rounded-lg',
            'resize-none min-h-[160px] overflow-hidden',
            'placeholder:text-neutral-500',
            'focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:border-brand-cyan-darker',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            'aria-[invalid=true]:border-feedback-error transition-all duration-300',
            isExampleAnimating
              ? 'border-brand-cyan bg-brand-cyan-lightest/50 ring-2 ring-brand-cyan scale-[1.01]'
              : 'border-neutral-300'
          )}
          disabled={loading}
        />

        {/* Character count and helper */}
        <div id="konsept-help" className="mt-3 flex items-center justify-between gap-4">
          {/* Contextual helper message */}
          <div
            id="konsept-helper"
            aria-live="polite"
            aria-atomic="true"
            className="min-h-[1.25rem]"
          >
            {showMinimumHelper && (
              <span className="text-xs text-neutral-500 italic">
                Skriv litt mer for å få en refleksjon.
              </span>
            )}
          </div>

          {/* Character counter */}
          <span className={cn(
            'text-xs transition-colors',
            isNearingMinimum ? 'text-neutral-600 font-medium' : 'text-neutral-500'
          )}>
            <span className={cn(
              input.length > charCountDanger && 'text-feedback-error',
              input.length > charCountWarning && input.length <= charCountDanger && 'text-feedback-warning'
            )}>
              {input.length}
            </span>
            <span> / {INPUT_VALIDATION.MAX_LENGTH}</span>
          </span>
        </div>
      </section>


      {/* Action buttons - desktop only (mobile uses sticky bar) */}
      <div className="hidden md:block space-y-3">
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isButtonEnabled}
            aria-busy={loading}
            className={cn(
              'inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2',
              loading
                ? 'bg-brand-navy/80 text-white cursor-wait'
                : isButtonEnabled
                  ? 'bg-brand-navy text-white hover:bg-brand-navy/90 hover:scale-[1.02] active:scale-100 shadow-lg hover:shadow-xl'
                  : 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
            )}
          >
            {loading ? (
              <>
                <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                <span>Speiler tankene dine…</span>
              </>
            ) : (
              <>
                <span>Avdekk antagelser</span>
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>

        </div>

        {/* Validation errors (input length) shown inline near button */}
        {error && errorType === 'validation' && (
          <div id="konsept-error" role="alert" className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 text-neutral-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-neutral-700">{error}</p>
          </div>
        )}
      </div>

      {/* Mobile: Show validation error inline */}
      <div className="md:hidden">
        {error && errorType === 'validation' && (
          <div id="konsept-error" role="alert" className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 text-neutral-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-neutral-700">{error}</p>
          </div>
        )}
      </div>

      {/* Result area */}
      <div
        ref={resultRef}
        aria-live="polite"
        aria-atomic="false"
        role="region"
        aria-label="Refleksjonsresultat"
      >
        {/* Error display in results area */}
        {error && !loading && !result && errorType !== 'validation' && (
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-[15px] text-neutral-700 leading-[1.5] mb-4">{error}</p>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-brand-navy bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2"
                >
                  Prøv igjen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Result display - also handles loading state with NarrativeLoader */}
        {(result || isStreaming) && (
          <div className="p-6 bg-white border-2 border-neutral-200 rounded-xl shadow-sm">
            <KonseptSpeilResultDisplayV2
              result={result || ''}
              isStreaming={isStreaming}
              originalInput={submittedInput || undefined}
              onRetry={handleSubmit}
              onEdit={handleEditInput}
              onReset={handleFullReset}
            />
          </div>
        )}
      </div>

      {/* AI og personvern - matching OKR-sjekken style */}
      <div className="border-t border-neutral-200 pt-6">
        <p className="text-sm text-neutral-500 mb-3">
          Teksten du skriver brukes kun til å generere refleksjonen. Unngå å lime inn konfidensiell eller sensitiv informasjon.
        </p>
        <button
          type="button"
          onClick={() => {
            if (!isPrivacyOpen) {
              trackClick('konseptspeil_privacy_toggle');
            }
            setIsPrivacyOpen(!isPrivacyOpen);
          }}
          aria-expanded={isPrivacyOpen}
          aria-controls="privacy-content"
          className="flex items-center gap-2 text-sm text-brand-navy hover:text-brand-cyan-darker focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 rounded py-2"
        >
          <ChevronRightIcon className={cn('w-4 h-4 transition-transform', isPrivacyOpen && 'rotate-90')} />
          Les mer om AI og personvern
        </button>
        {isPrivacyOpen && (
          <div
            id="privacy-content"
            className="mt-3 p-4 bg-neutral-100 rounded-lg text-sm text-neutral-700 space-y-3"
          >
            <p>
              <strong>Hvordan fungerer det?</strong><br />
              Refleksjonen genereres av Claude (Anthropic), strukturert rundt de fire produktrisikoene (verdi, brukbarhet, gjennomførbarhet, levedyktighet). AI-output kan være unøyaktig eller ufullstendig – bruk din egen vurdering.
            </p>
            <p>
              <strong>Hva skjer med dataene?</strong><br />
              Teksten sendes til Claude API for å generere refleksjonen. Vi lagrer ikke innholdet, og det brukes ikke til å trene AI-modeller. Vi bruker anonymisert bruksstatistikk (f.eks. antall tegn, responstid) for å forbedre tjenesten.
            </p>
            <p>
              <strong>Er det trygt?</strong><br />
              Du trenger ikke logge inn. Ikke del personopplysninger, forretningshemmeligheter eller annen sensitiv informasjon i teksten du sender inn.
            </p>
            <p className="pt-2 border-t border-neutral-200">
              <a
                href="https://fyrk.no/personvern"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-navy hover:text-brand-cyan-darker underline underline-offset-2"
              >
                Les FYRKs personvernerklæring
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
